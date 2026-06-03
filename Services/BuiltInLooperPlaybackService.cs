using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using NAudio.CoreAudioApi;
using NAudio.Wave;
using NAudio.Wave.SampleProviders;

namespace GateKPT.MusicOS.Services;

public sealed class BuiltInLooperPlaybackService : IDisposable
{
    private readonly Dictionary<int, PlaybackHandle> _playing = [];

    public IReadOnlyList<AudioOutputDeviceItem> ListOutputs()
    {
        try
        {
            using var enumerator = new MMDeviceEnumerator();
            var defaultId = enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia).ID;
            return enumerator
                .EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active)
                .Select(device => new AudioOutputDeviceItem(device.FriendlyName, device.ID, device.ID == defaultId))
                .OrderByDescending(device => device.IsDefault)
                .ThenBy(device => device.Name, StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }
        catch
        {
            return [];
        }
    }

    public string GetOutputName(string outputDeviceId)
    {
        try
        {
            using var enumerator = new MMDeviceEnumerator();
            var device = FindOutput(enumerator, outputDeviceId);
            return device?.FriendlyName ?? "Windows default output";
        }
        catch
        {
            return "Windows default output";
        }
    }

    public LooperPlaybackResult PlayLoop(int trackNumber, string path, double volume, string outputDeviceId = "")
    {
        Stop(trackNumber);

        try
        {
            if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
            {
                return new LooperPlaybackResult(false, $"Track {trackNumber} has no recorded stem yet.");
            }

            var reader = new AudioFileReader(path)
            {
                Volume = (float)Math.Clamp(volume / 100.0, 0, 1)
            };
            var loop = new LoopStream(reader);
            var output = CreateOutput(outputDeviceId);
            output.Init(loop);
            output.Play();
            _playing[trackNumber] = new PlaybackHandle(reader, loop, output);
            return new LooperPlaybackResult(true, $"Looping track {trackNumber}: {Path.GetFileName(path)}");
        }
        catch (Exception ex)
        {
            Stop(trackNumber);
            return new LooperPlaybackResult(false, $"Could not play track {trackNumber}: {ex.Message}");
        }
    }

    public LooperPlaybackResult PlayOnce(int trackNumber, string path, double volume, string outputDeviceId = "")
    {
        Stop(trackNumber);

        try
        {
            if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
            {
                return new LooperPlaybackResult(false, "No audio file selected.");
            }

            var reader = new AudioFileReader(path)
            {
                Volume = (float)Math.Clamp(volume / 100.0, 0, 1)
            };
            ForceCurrentProcessVolumeToMax();
            var output = CreateOutput(outputDeviceId);
            output.Init(reader);
            output.Play();
            _playing[trackNumber] = new PlaybackHandle(reader, output);
            return new LooperPlaybackResult(true, $"Playing: {Path.GetFileName(path)}");
        }
        catch (Exception ex)
        {
            Stop(trackNumber);
            return new LooperPlaybackResult(false, $"Could not play audio: {ex.Message}");
        }
    }

    public LooperPlaybackResult PlayTestTone(string outputDeviceId = "")
    {
        Stop(99);

        try
        {
            ForceCurrentProcessVolumeToMax();
            var outputs = new List<IWavePlayer>();
            var labels = new List<string>();
            foreach (var candidate in CreateTestOutputCandidates(outputDeviceId))
            {
                try
                {
                    var output = candidate.Create();
                    var signal = new SignalGenerator(44100, 2)
                    {
                        Type = SignalGeneratorType.Sin,
                        Frequency = 880,
                        Gain = 0.35
                    }.Take(TimeSpan.FromSeconds(1.4));
                    output.Init(signal);
                    output.Play();
                    outputs.Add(output);
                    labels.Add(candidate.Label);
                }
                catch
                {
                    // Try every safe Windows output path; one silent endpoint should not kill the test.
                }
            }

            if (outputs.Count == 0)
            {
                return new LooperPlaybackResult(false, "Speaker test failed: no Windows output path accepted audio.");
            }

            _playing[99] = new PlaybackHandle(outputs);
            return new LooperPlaybackResult(true, $"Speaker test playing through {string.Join(" + ", labels)}.");
        }
        catch (Exception ex)
        {
            Stop(99);
            return new LooperPlaybackResult(false, $"Speaker test failed: {ex.Message}");
        }
    }

    public LooperPlaybackResult OpenTestToneInWindowsPlayer()
    {
        try
        {
            var path = Path.Combine(Path.GetTempPath(), "gatekpt-speaker-test.wav");
            var signal = new SignalGenerator(44100, 2)
            {
                Type = SignalGeneratorType.Sin,
                Frequency = 880,
                Gain = 0.45
            }.Take(TimeSpan.FromSeconds(1.5));
            WaveFileWriter.CreateWaveFile16(path, signal);
            var chrome = StartBrowserAudio(path);
            if (chrome.Success)
            {
                return new LooperPlaybackResult(true, "Opened speaker test WAV in Chrome.");
            }

            var ffplay = StartFfplay(path);
            if (ffplay.Success)
            {
                return new LooperPlaybackResult(true, "Playing speaker test with ffplay.");
            }

            return new LooperPlaybackResult(false, "Could not start Chrome or ffplay for the speaker test.");
        }
        catch (Exception ex)
        {
            return new LooperPlaybackResult(false, $"Windows player test failed: {ex.Message}");
        }
    }

    public LooperPlaybackResult OpenAudioInWindowsPlayer(string path)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
            {
                return new LooperPlaybackResult(false, "No audio file selected.");
            }

            var chrome = StartBrowserAudio(path);
            if (chrome.Success)
            {
                return new LooperPlaybackResult(true, $"Opened WAV in Chrome: {Path.GetFileName(path)}");
            }

            Process.Start(new ProcessStartInfo
            {
                FileName = "explorer.exe",
                Arguments = $"/select,\"{path}\"",
                UseShellExecute = true
            });
            return new LooperPlaybackResult(true, $"Selected WAV in folder: {Path.GetFileName(path)}");
        }
        catch (Exception ex)
        {
            return new LooperPlaybackResult(false, $"Could not open audio in Windows player: {ex.Message}");
        }
    }

    private static LooperPlaybackResult StartBrowserAudio(string path)
    {
        try
        {
            var uri = new Uri(path).AbsoluteUri;
            Process.Start(new ProcessStartInfo
            {
                FileName = "chrome.exe",
                Arguments = $"\"{uri}\"",
                UseShellExecute = true
            });
            return new LooperPlaybackResult(true, "Chrome started.");
        }
        catch
        {
            try
            {
                var uri = new Uri(path).AbsoluteUri;
                Process.Start(new ProcessStartInfo
                {
                    FileName = "msedge.exe",
                    Arguments = $"\"{uri}\"",
                    UseShellExecute = true
                });
                return new LooperPlaybackResult(true, "Edge started.");
            }
            catch (Exception ex)
            {
                return new LooperPlaybackResult(false, ex.Message);
            }
        }
    }

    private static LooperPlaybackResult StartFfplay(string path)
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "ffplay",
                Arguments = $"-nodisp -autoexit -loglevel quiet \"{path}\"",
                CreateNoWindow = true,
                UseShellExecute = false
            });
            return new LooperPlaybackResult(true, "ffplay started.");
        }
        catch (Exception ex)
        {
            return new LooperPlaybackResult(false, ex.Message);
        }
    }

    public void Stop(int trackNumber)
    {
        if (!_playing.Remove(trackNumber, out var handle))
        {
            return;
        }

        handle.Dispose();
    }

    public bool SetVolume(int trackNumber, double volume)
    {
        if (!_playing.TryGetValue(trackNumber, out var handle))
        {
            return false;
        }

        handle.SetVolume(volume);
        return true;
    }

    public void StopAll()
    {
        foreach (var trackNumber in _playing.Keys.ToArray())
        {
            Stop(trackNumber);
        }
    }

    public void Dispose() => StopAll();

    private static IWavePlayer CreateOutput(string outputDeviceId)
    {
        try
        {
            using var enumerator = new MMDeviceEnumerator();
            var device = FindOutput(enumerator, outputDeviceId)
                ?? enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);
            return new WasapiOut(device, AudioClientShareMode.Shared, true, 100);
        }
        catch
        {
            return new WaveOutEvent();
        }
    }

    private static void ForceCurrentProcessVolumeToMax()
    {
        try
        {
            var processId = Process.GetCurrentProcess().Id;
            using var enumerator = new MMDeviceEnumerator();
            foreach (var device in enumerator.EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active))
            {
                var sessions = device.AudioSessionManager.Sessions;
                for (var i = 0; i < sessions.Count; i++)
                {
                    using var session = sessions[i];
                    if (session.GetProcessID == processId)
                    {
                        session.SimpleAudioVolume.Mute = false;
                        session.SimpleAudioVolume.Volume = 1.0f;
                    }
                }
            }
        }
        catch
        {
            // Windows sometimes locks mixer state; playback still continues through normal fallbacks.
        }
    }

    private static IEnumerable<OutputCandidate> CreateTestOutputCandidates(string outputDeviceId)
    {
        var selectedId = outputDeviceId;
        if (!string.IsNullOrWhiteSpace(selectedId))
        {
            yield return new OutputCandidate("selected output", () =>
            {
                using var enumerator = new MMDeviceEnumerator();
                var selected = FindOutput(enumerator, selectedId)
                    ?? enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);
                return new WasapiOut(selected, AudioClientShareMode.Shared, true, 100);
            });
        }

        yield return new OutputCandidate("Windows default", () =>
        {
            using var enumerator = new MMDeviceEnumerator();
            var device = enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);
            return new WasapiOut(device, AudioClientShareMode.Shared, true, 100);
        });

        yield return new OutputCandidate("legacy WaveOut", () => new WaveOutEvent());
    }

    private static MMDevice? FindOutput(MMDeviceEnumerator enumerator, string outputDeviceId)
    {
        if (string.IsNullOrWhiteSpace(outputDeviceId))
        {
            return null;
        }

        return enumerator
            .EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active)
            .FirstOrDefault(device => device.ID == outputDeviceId);
    }

    private sealed record OutputCandidate(string Label, Func<IWavePlayer> Create);

    private sealed class PlaybackHandle : IDisposable
    {
        private readonly AudioFileReader? _reader;
        private readonly IReadOnlyList<IWavePlayer> _outputs;

        public PlaybackHandle(AudioFileReader? reader, IWavePlayer output)
            : this(reader, [output])
        {
        }

        public PlaybackHandle(AudioFileReader reader, LoopStream loop, IWavePlayer output)
            : this(reader, [output])
        {
            Loop = loop;
        }

        public PlaybackHandle(IReadOnlyList<IWavePlayer> outputs)
            : this(null, outputs)
        {
        }

        private PlaybackHandle(AudioFileReader? reader, IReadOnlyList<IWavePlayer> outputs)
        {
            _reader = reader;
            _outputs = outputs;
        }

        private LoopStream? Loop { get; }

        public void SetVolume(double volume)
        {
            if (_reader is not null)
            {
                _reader.Volume = (float)Math.Clamp(volume / 100.0, 0, 1);
            }
        }

        public void Dispose()
        {
            foreach (var output in _outputs)
            {
                output.Stop();
                output.Dispose();
            }

            Loop?.Dispose();
            _reader?.Dispose();
        }
    }
}

public sealed record LooperPlaybackResult(bool Success, string Message);

public sealed record AudioOutputDeviceItem(string Name, string Id, bool IsDefault)
{
    public override string ToString() => IsDefault ? $"{Name} (default)" : Name;
}

internal sealed class LoopStream(WaveStream sourceStream) : WaveStream
{
    public override WaveFormat WaveFormat => sourceStream.WaveFormat;

    public override long Length => sourceStream.Length;

    public override long Position
    {
        get => sourceStream.Position;
        set => sourceStream.Position = value;
    }

    public override int Read(byte[] buffer, int offset, int count)
    {
        var totalBytesRead = 0;

        while (totalBytesRead < count)
        {
            var bytesRead = sourceStream.Read(buffer, offset + totalBytesRead, count - totalBytesRead);
            if (bytesRead == 0)
            {
                if (sourceStream.Position == 0)
                {
                    break;
                }

                sourceStream.Position = 0;
            }

            totalBytesRead += bytesRead;
        }

        return totalBytesRead;
    }
}
