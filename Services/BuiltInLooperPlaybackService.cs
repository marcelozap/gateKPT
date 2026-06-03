using System;
using System.Collections.Generic;
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
            var signal = new SignalGenerator(44100, 2)
            {
                Type = SignalGeneratorType.Sin,
                Frequency = 440,
                Gain = 0.22
            }.Take(TimeSpan.FromSeconds(1.2));
            var output = CreateOutput(outputDeviceId);
            output.Init(signal);
            output.Play();
            _playing[99] = new PlaybackHandle(null, output);
            return new LooperPlaybackResult(true, "Speaker test playing. If you hear a beep, playback works.");
        }
        catch (Exception ex)
        {
            Stop(99);
            return new LooperPlaybackResult(false, $"Speaker test failed: {ex.Message}");
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

    private sealed class PlaybackHandle(AudioFileReader? reader, IWavePlayer output) : IDisposable
    {
        public PlaybackHandle(AudioFileReader reader, LoopStream loop, IWavePlayer output)
            : this(reader, output)
        {
            Loop = loop;
        }

        private LoopStream? Loop { get; }

        public void SetVolume(double volume)
        {
            if (reader is not null)
            {
                reader.Volume = (float)Math.Clamp(volume / 100.0, 0, 1);
            }
        }

        public void Dispose()
        {
            output.Stop();
            output.Dispose();
            Loop?.Dispose();
            reader?.Dispose();
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
