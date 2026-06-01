using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using NAudio.CoreAudioApi;
using NAudio.Wave;

namespace GateKPT.MusicOS.Services;

public sealed class LayerRecordingService : IDisposable
{
    private readonly object _gate = new();
    private readonly List<ActiveCapture> _captures = [];
    private Stopwatch? _clock;
    private string _activePath = "";
    private string _candidateDirectory = "";
    private float _peak;

    public bool IsRecording => _captures.Count > 0;

    public LayerRecordingStartResult Start(
        string preferredInput,
        string stemDirectory,
        string layerName,
        Action<double>? onPeakPercent = null)
    {
        Stop();

        try
        {
            Directory.CreateDirectory(stemDirectory);
            _activePath = AutoSaveFileNamer.CreatePath(stemDirectory, layerName, ".wav");
            _candidateDirectory = Path.Combine(
                Path.GetDirectoryName(stemDirectory) ?? stemDirectory,
                "capture-candidates",
                DateTime.Now.ToString("yyyyMMdd-HHmmss"));
            Directory.CreateDirectory(_candidateDirectory);
            _peak = 0;

            foreach (var candidate in CreateCaptureCandidates(preferredInput))
            {
                TryStartCandidate(candidate, layerName, onPeakPercent);
            }

            if (_captures.Count == 0)
            {
                ResetState();
                return new LayerRecordingStartResult(false, "", "No capture backend started. GateKPT did not record.");
            }

            _clock = Stopwatch.StartNew();
            return new LayerRecordingStartResult(
                true,
                _activePath,
                $"Recording {layerName} with {_captures.Count} capture path(s): {string.Join(", ", _captures.Select(capture => capture.Backend))}");
        }
        catch (Exception ex)
        {
            Stop();
            return new LayerRecordingStartResult(false, "", $"Could not start recording: {ex.Message}");
        }
    }

    public LayerRecordingStopResult Stop()
    {
        if (_captures.Count == 0)
        {
            return new LayerRecordingStopResult(false, "", "00:00", 0, 0, "No active recording.");
        }

        var elapsed = _clock?.Elapsed ?? TimeSpan.Zero;
        var path = _activePath;
        var captures = _captures.ToList();

        foreach (var capture in captures)
        {
            try
            {
                capture.Input.StopRecording();
            }
            catch
            {
                // Keep whatever was written; this is a defensive recorder.
            }
        }

        lock (_gate)
        {
            foreach (var capture in captures)
            {
                capture.Writer.Dispose();
                capture.Input.Dispose();
            }

            _captures.Clear();
        }

        _clock = null;
        _activePath = "";
        _candidateDirectory = "";
        _peak = 0;

        var best = captures
            .Where(capture => File.Exists(capture.Path))
            .Select(capture => capture with { RmsPercent = CalculateRmsPercent(capture.SumSquares, capture.SampleCount) })
            .OrderByDescending(capture => capture.RmsPercent)
            .ThenByDescending(capture => capture.Peak * 100)
            .ThenByDescending(capture => capture.BytesWritten)
            .FirstOrDefault();

        if (best is null || !File.Exists(best.Path))
        {
            return new LayerRecordingStopResult(false, "", FormatElapsed(elapsed), 0, 0, "No recording file was written.");
        }

        var peakPercent = Math.Round(best.Peak * 100, 1);
        var rmsPercent = Math.Round(best.RmsPercent, 2);

        if (elapsed.TotalSeconds < 0.75 || best.BytesWritten < 4096 || peakPercent < 0.05 || rmsPercent < 0.05)
        {
            MoveCandidatesToArchive(captures, "rejected-captures");
            return new LayerRecordingStopResult(
                false,
                best.Path,
                FormatElapsed(elapsed),
                peakPercent,
                rmsPercent,
                $"Rejected: no usable audio. Best path was {best.Backend}, peak {peakPercent:0.0}%, RMS {rmsPercent:0.00}%.");
        }

        Directory.CreateDirectory(Path.GetDirectoryName(path) ?? ".");
        if (File.Exists(path))
        {
            File.Delete(path);
        }

        File.Move(best.Path, path);
        MoveCandidatesToArchive(captures.Where(capture => capture.Path != best.Path), "rejected-captures");

        return new LayerRecordingStopResult(
            true,
            path,
            FormatElapsed(elapsed),
            peakPercent,
            rmsPercent,
            $"Saved from {best.Backend}. Peak {peakPercent:0.0}%, RMS {rmsPercent:0.00}%.");
    }

    public void Dispose() => Stop();

    private void TryStartCandidate(CaptureCandidate candidate, string layerName, Action<double>? onPeakPercent)
    {
        try
        {
            var path = AutoSaveFileNamer.CreatePath(
                _candidateDirectory,
                $"{layerName}-{SanitizeShort(candidate.Backend)}",
                ".wav");
            var writer = new WaveFileWriter(path, candidate.Input.WaveFormat);
            var active = new ActiveCapture(
                candidate.Input,
                writer,
                path,
                candidate.DeviceName,
                candidate.Backend,
                0,
                0,
                0,
                0);

            candidate.Input.DataAvailable += (_, args) =>
            {
                lock (_gate)
                {
                    var index = _captures.IndexOf(active);
                    if (index < 0)
                    {
                        return;
                    }

                    writer.Write(args.Buffer, 0, args.BytesRecorded);
                    writer.Flush();
                    var stats = CalculateStats(args.Buffer, args.BytesRecorded, candidate.Input.WaveFormat);
                    var updated = _captures[index] with
                    {
                        Peak = Math.Max(_captures[index].Peak, stats.Peak),
                        SumSquares = _captures[index].SumSquares + stats.SumSquares,
                        SampleCount = _captures[index].SampleCount + stats.SampleCount,
                        BytesWritten = _captures[index].BytesWritten + args.BytesRecorded
                    };
                    _captures[index] = updated;
                    _peak = Math.Max(_peak, updated.Peak);
                    onPeakPercent?.Invoke(Math.Round(_peak * 100, 1));
                }
            };

            candidate.Input.StartRecording();
            _captures.Add(active);
        }
        catch
        {
            candidate.Input.Dispose();
        }
    }

    private static IReadOnlyList<CaptureCandidate> CreateCaptureCandidates(string preferredInput)
    {
        var candidates = new List<CaptureCandidate>();
        var waveIn = CreateWaveInCapture(preferredInput, out var waveName);
        if (waveIn is not null)
        {
            candidates.Add(new CaptureCandidate(waveIn, waveName, "WaveIn stereo"));
        }

        try
        {
            using var enumerator = new MMDeviceEnumerator();
            var device = FindInputDevice(enumerator, preferredInput);
            if (device is not null)
            {
                PrepareInputVolume(device);
                candidates.Add(new CaptureCandidate(new WasapiCapture(device), device.FriendlyName, "WASAPI raw"));
            }
        }
        catch
        {
            // WaveIn is usually enough; WASAPI is a fallback candidate.
        }

        return candidates;
    }

    private static IWaveIn? CreateWaveInCapture(string preferredInput, out string deviceName)
    {
        deviceName = "";
        if (WaveInEvent.DeviceCount <= 0)
        {
            return null;
        }

        var selectedIndex = -1;
        for (var index = 0; index < WaveInEvent.DeviceCount; index++)
        {
            var name = WaveInEvent.GetCapabilities(index).ProductName;
            if (MatchesPreferredInput(name, preferredInput))
            {
                selectedIndex = index;
                deviceName = name;
                break;
            }
        }

        if (selectedIndex < 0)
        {
            for (var index = 0; index < WaveInEvent.DeviceCount; index++)
            {
                var name = WaveInEvent.GetCapabilities(index).ProductName;
                if (IsLikelyMusicInput(name))
                {
                    selectedIndex = index;
                    deviceName = name;
                    break;
                }
            }
        }

        if (selectedIndex < 0)
        {
            selectedIndex = 0;
            deviceName = WaveInEvent.GetCapabilities(selectedIndex).ProductName;
        }

        return new WaveInEvent
        {
            DeviceNumber = selectedIndex,
            WaveFormat = new WaveFormat(44100, 16, 2),
            BufferMilliseconds = 35
        };
    }

    private static MMDevice? FindInputDevice(MMDeviceEnumerator enumerator, string preferredInput)
    {
        var devices = enumerator.EnumerateAudioEndPoints(DataFlow.Capture, DeviceState.Active);
        if (devices.Count == 0)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(preferredInput))
        {
            var preferred = devices.FirstOrDefault(device => MatchesPreferredInput(device.FriendlyName, preferredInput));
            if (preferred is not null)
            {
                return preferred;
            }

            preferred = devices.FirstOrDefault(device =>
                preferredInput.Contains(device.ID, StringComparison.OrdinalIgnoreCase)
                || device.ID.Contains(preferredInput, StringComparison.OrdinalIgnoreCase));
            if (preferred is not null)
            {
                return preferred;
            }
        }

        return devices.FirstOrDefault(device => IsLikelyMusicInput(device.FriendlyName)) ?? devices[0];
    }

    private static void MoveCandidatesToArchive(IEnumerable<ActiveCapture> captures, string archiveName)
    {
        foreach (var capture in captures)
        {
            if (!File.Exists(capture.Path))
            {
                continue;
            }

            var root = Path.GetDirectoryName(Path.GetDirectoryName(Path.GetDirectoryName(capture.Path) ?? "") ?? "")
                ?? Path.GetDirectoryName(capture.Path)
                ?? ".";
            var archive = Path.Combine(root, archiveName);
            Directory.CreateDirectory(archive);
            var target = Path.Combine(archive, Path.GetFileName(capture.Path));
            if (File.Exists(target))
            {
                target = Path.Combine(
                    archive,
                    $"{Path.GetFileNameWithoutExtension(capture.Path)}-{DateTime.Now:HHmmss}{Path.GetExtension(capture.Path)}");
            }

            File.Move(capture.Path, target);
        }
    }

    private static bool MatchesPreferredInput(string deviceName, string preferredInput) =>
        !string.IsNullOrWhiteSpace(preferredInput)
        && (deviceName.Contains(preferredInput, StringComparison.OrdinalIgnoreCase)
            || preferredInput.Contains(deviceName, StringComparison.OrdinalIgnoreCase)
            || preferredInput.Contains("focusrite", StringComparison.OrdinalIgnoreCase)
                && deviceName.Contains("focusrite", StringComparison.OrdinalIgnoreCase)
            || preferredInput.Contains("scarlett", StringComparison.OrdinalIgnoreCase)
                && deviceName.Contains("scarlett", StringComparison.OrdinalIgnoreCase)
            || preferredInput.Contains("rc-505", StringComparison.OrdinalIgnoreCase)
                && deviceName.Contains("rc-505", StringComparison.OrdinalIgnoreCase)
            || preferredInput.Contains("boss", StringComparison.OrdinalIgnoreCase)
                && deviceName.Contains("boss", StringComparison.OrdinalIgnoreCase));

    private static bool IsLikelyMusicInput(string deviceName) =>
        deviceName.Contains("focusrite", StringComparison.OrdinalIgnoreCase)
        || deviceName.Contains("scarlett", StringComparison.OrdinalIgnoreCase)
        || deviceName.Contains("rc-505", StringComparison.OrdinalIgnoreCase)
        || deviceName.Contains("boss", StringComparison.OrdinalIgnoreCase)
        || deviceName.Contains("usb audio", StringComparison.OrdinalIgnoreCase);

    private static void PrepareInputVolume(MMDevice device)
    {
        try
        {
            device.AudioEndpointVolume.Mute = false;
            device.AudioEndpointVolume.MasterVolumeLevelScalar = 1.0f;
        }
        catch
        {
            // Some drivers block software gain changes.
        }
    }

    private static AudioSignalStats CalculateStats(byte[] buffer, int bytesRecorded, WaveFormat waveFormat)
    {
        var peak = 0f;
        var sumSquares = 0d;
        var sampleCount = 0L;

        if (waveFormat.Encoding == WaveFormatEncoding.IeeeFloat && waveFormat.BitsPerSample == 32)
        {
            for (var index = 0; index + 3 < bytesRecorded; index += 4)
            {
                var sample = BitConverter.ToSingle(buffer, index);
                if (!float.IsNaN(sample))
                {
                    var absolute = Math.Abs(sample);
                    peak = Math.Max(peak, absolute);
                    sumSquares += sample * sample;
                    sampleCount++;
                }
            }

            return new AudioSignalStats(Math.Clamp(peak, 0, 1), sumSquares, sampleCount);
        }

        if (waveFormat.BitsPerSample == 16)
        {
            for (var index = 0; index + 1 < bytesRecorded; index += 2)
            {
                var sample = BitConverter.ToInt16(buffer, index) / 32768f;
                peak = Math.Max(peak, Math.Abs(sample));
                sumSquares += sample * sample;
                sampleCount++;
            }

            return new AudioSignalStats(Math.Clamp(peak, 0, 1), sumSquares, sampleCount);
        }

        if (waveFormat.BitsPerSample == 24)
        {
            for (var index = 0; index + 2 < bytesRecorded; index += 3)
            {
                var sample = buffer[index] | buffer[index + 1] << 8 | buffer[index + 2] << 16;
                if ((sample & 0x800000) != 0)
                {
                    sample |= unchecked((int)0xff000000);
                }

                var normalized = sample / 8388608f;
                peak = Math.Max(peak, Math.Abs(normalized));
                sumSquares += normalized * normalized;
                sampleCount++;
            }

            return new AudioSignalStats(Math.Clamp(peak, 0, 1), sumSquares, sampleCount);
        }

        return new AudioSignalStats(Math.Clamp(peak, 0, 1), sumSquares, sampleCount);
    }

    private static double CalculateRmsPercent(double sumSquares, long sampleCount) =>
        sampleCount <= 0 ? 0 : Math.Sqrt(sumSquares / sampleCount) * 100;

    private static string FormatElapsed(TimeSpan elapsed) =>
        $"{(int)elapsed.TotalMinutes:00}:{elapsed.Seconds:00}";

    private static string SanitizeShort(string value)
    {
        var safe = new string(value.Select(character => char.IsLetterOrDigit(character) ? character : '-').ToArray());
        return safe.Length <= 32 ? safe : safe[..32];
    }

    private void ResetState()
    {
        _captures.Clear();
        _clock = null;
        _activePath = "";
        _candidateDirectory = "";
        _peak = 0;
    }
}

public sealed record LayerRecordingStartResult(bool Success, string Path, string Message);

public sealed record LayerRecordingStopResult(bool Success, string Path, string DurationLabel, double PeakPercent, double RmsPercent, string Message);

internal sealed record CaptureCandidate(IWaveIn Input, string DeviceName, string Backend);

internal sealed record ActiveCapture(
    IWaveIn Input,
    WaveFileWriter Writer,
    string Path,
    string DeviceName,
    string Backend,
    float Peak,
    double SumSquares,
    long SampleCount,
    long BytesWritten)
{
    public double RmsPercent { get; init; }
}
