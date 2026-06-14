using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.Versioning;
using System.Threading;
using NAudio.CoreAudioApi;
using NAudio.Wave;

namespace GateKPT.MusicOS.Services;

public sealed class LayerRecordingService : IDisposable
{
    private readonly object _gate = new();
    private readonly List<ActiveCapture> _captures = [];
    private Stopwatch? _clock;
    private Process? _ffmpegProcess;
    private string _activePath = "";
    private string _candidateDirectory = "";
    private float _peak;

    public bool IsRecording => _ffmpegProcess is not null || _captures.Count > 0;

    public LayerRecordingStartResult Start(
        string preferredInput,
        string stemDirectory,
        string layerName,
        Action<double>? onPeakPercent = null)
    {
        Stop();
        if (OperatingSystem.IsWindows())
        {
            StopOrphanedGateKptFfmpegRecorders();
        }

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

            if (_captures.Count > 0)
            {
                _clock = Stopwatch.StartNew();
                return new LayerRecordingStartResult(
                    true,
                    _activePath,
                    $"Recording {layerName} with live metering: {string.Join(", ", _captures.Select(capture => capture.Backend))}");
            }

            if (TryStartFfmpegDirectShowCapture(preferredInput, _activePath, out var ffmpegMessage))
            {
                _clock = Stopwatch.StartNew();
                return new LayerRecordingStartResult(true, _activePath, $"{ffmpegMessage}. Meter verifies after save.");
            }

            if (_captures.Count == 0)
            {
                ResetState();
                return new LayerRecordingStartResult(false, "", "No capture backend started. GateKPT did not record.");
            }

            ResetState();
            return new LayerRecordingStartResult(false, "", "Recorder entered an unexpected state and stopped safely.");
        }
        catch (Exception ex)
        {
            Stop();
            return new LayerRecordingStartResult(false, "", $"Could not start recording: {ex.Message}");
        }
    }

    public LayerRecordingStopResult Stop()
    {
        if (_ffmpegProcess is not null)
        {
            return StopFfmpegCapture();
        }

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

        foreach (var capture in captures)
        {
            capture.Stopped.Wait(TimeSpan.FromMilliseconds(1500));
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
            .Where(capture => GetAudioDurationSeconds(capture.Path) >= Math.Max(0.75, elapsed.TotalSeconds * 0.65))
            .Select(capture =>
            {
                capture.RmsPercent = CalculateRmsPercent(capture.SumSquares, capture.SampleCount);
                return capture;
            })
            .OrderBy(capture => IsPreferredBackend(capture.Backend) ? 0 : 1)
            .ThenByDescending(capture => IsSaneCapture(capture) ? 1 : 0)
            .ThenByDescending(capture => capture.RmsPercent)
            .ThenByDescending(capture => capture.Peak * 100)
            .ThenByDescending(capture => capture.BytesWritten)
            .FirstOrDefault();

        if (best is null || !File.Exists(best.Path))
        {
            MoveCandidatesToArchive(captures, "rejected-captures");
            return new LayerRecordingStopResult(false, "", FormatElapsed(elapsed), 0, 0, "No full-length recording file was written. GateKPT refused to save a broken fragment.");
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

    private bool TryStartFfmpegDirectShowCapture(string preferredInput, string outputPath, out string message)
    {
        message = "";
        if (!IsLikelyMusicInput(preferredInput))
        {
            return false;
        }

        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath) ?? ".");
            var deviceName = ResolveDirectShowAudioDeviceName(preferredInput);
            if (string.IsNullOrWhiteSpace(deviceName))
            {
                return false;
            }

            var startInfo = new ProcessStartInfo
            {
                FileName = "ffmpeg",
                Arguments = $"-y -hide_banner -f dshow -i audio=\"{deviceName}\" -ac 2 -ar 44100 \"{outputPath}\"",
                CreateNoWindow = true,
                UseShellExecute = false,
                RedirectStandardInput = true,
                RedirectStandardError = true,
                RedirectStandardOutput = true,
            };

            _ffmpegProcess = Process.Start(startInfo);
            if (_ffmpegProcess is null)
            {
                return false;
            }

            _ = _ffmpegProcess.StandardError.ReadToEndAsync();
            _ = _ffmpegProcess.StandardOutput.ReadToEndAsync();
            message = $"Recording with FFmpeg DirectShow: {deviceName}";
            return true;
        }
        catch
        {
            _ffmpegProcess = null;
            return false;
        }
    }

    private LayerRecordingStopResult StopFfmpegCapture()
    {
        var elapsed = _clock?.Elapsed ?? TimeSpan.Zero;
        var path = _activePath;
        var process = _ffmpegProcess;
        _ffmpegProcess = null;
        _clock = null;
        _activePath = "";
        _candidateDirectory = "";
        _peak = 0;

        if (process is null)
        {
            return new LayerRecordingStopResult(false, path, FormatElapsed(elapsed), 0, 0, "No FFmpeg recording process was active.");
        }

        try
        {
            if (!process.HasExited)
            {
                process.StandardInput.WriteLine("q");
                process.StandardInput.Flush();
            }

            if (!process.WaitForExit(4000) && !process.HasExited)
            {
                process.Kill(true);
                process.WaitForExit(1500);
            }
        }
        catch
        {
            try
            {
                if (!process.HasExited)
                {
                    process.Kill(true);
                }
            }
            catch
            {
            }
        }
        finally
        {
            process.Dispose();
        }

        var metrics = AudioPreviewService.InspectMetrics(path);
        if (!metrics.Success || metrics.Duration.TotalSeconds < 0.75 || metrics.PeakPercent < 0.5 || metrics.RmsPercent < 0.05)
        {
            if (File.Exists(path))
            {
                MoveFileToArchive(path, "rejected-captures");
            }

            return new LayerRecordingStopResult(
                false,
                path,
                FormatElapsed(elapsed),
                metrics.PeakPercent,
                metrics.RmsPercent,
                $"FFmpeg captured no usable Scarlett audio. Peak {metrics.PeakPercent:0.0}%, RMS {metrics.RmsPercent:0.00}%.");
        }

        return new LayerRecordingStopResult(
            true,
            path,
            FormatElapsed(elapsed),
            metrics.PeakPercent,
            metrics.RmsPercent,
            $"Saved from FFmpeg DirectShow Scarlett. Peak {metrics.PeakPercent:0.0}%, RMS {metrics.RmsPercent:0.00}%.");
    }

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
                candidate.Backend);

            candidate.Input.DataAvailable += (_, args) =>
            {
                lock (_gate)
                {
                    if (!_captures.Contains(active))
                    {
                        return;
                    }

                    writer.Write(args.Buffer, 0, args.BytesRecorded);
                    writer.Flush();
                    var stats = CalculateStats(args.Buffer, args.BytesRecorded, candidate.Input.WaveFormat);
                    active.Peak = Math.Max(active.Peak, stats.Peak);
                    active.SumSquares += stats.SumSquares;
                    active.SampleCount += stats.SampleCount;
                    active.BytesWritten += args.BytesRecorded;
                    _peak = Math.Max(_peak, active.Peak);
                    // Drive the stage from the current buffer, not the all-time max.
                    // The saved take still keeps active.Peak for validation.
                    onPeakPercent?.Invoke(Math.Round(stats.Peak * 100, 1));
                }
            };
            candidate.Input.RecordingStopped += (_, _) => active.Stopped.Set();

            _captures.Add(active);
            candidate.Input.StartRecording();
        }
        catch
        {
            candidate.Input.Dispose();
        }
    }

    private static IEnumerable<CaptureCandidate> CreateCaptureCandidates(string preferredInput)
    {
        var waveIn = CreateWaveInCaptureCandidate(preferredInput);
        if (waveIn is not null)
        {
            yield return waveIn;
        }

        var wasapi = CreateWasapiCaptureCandidate(preferredInput);
        if (wasapi is not null)
        {
            yield return wasapi;
        }
    }

    private static CaptureCandidate? CreateWaveInCaptureCandidate(string preferredInput)
    {
        try
        {
            var deviceNumber = FindWaveInDeviceNumber(preferredInput);
            if (deviceNumber < 0)
            {
                return null;
            }

            var info = WaveInEvent.GetCapabilities(deviceNumber);
            return new CaptureCandidate(
                new WaveInEvent
                {
                    DeviceNumber = deviceNumber,
                    WaveFormat = new WaveFormat(44100, 16, 2),
                    BufferMilliseconds = 50,
                    NumberOfBuffers = 4,
                },
                info.ProductName,
                "WaveIn Scarlett stereo");
        }
        catch
        {
            return null;
        }
    }

    private static CaptureCandidate? CreateWasapiCaptureCandidate(string preferredInput)
    {
        try
        {
            using var enumerator = new MMDeviceEnumerator();
            var device = FindInputDevice(enumerator, preferredInput);
            if (device is not null)
            {
                PrepareInputVolume(device);
                return new CaptureCandidate(new WasapiCapture(device), device.FriendlyName, "WASAPI raw");
            }
        }
        catch
        {
        }

        return null;
    }

    private static int FindWaveInDeviceNumber(string preferredInput)
    {
        var fallback = -1;
        for (var index = 0; index < WaveInEvent.DeviceCount; index++)
        {
            var info = WaveInEvent.GetCapabilities(index);
            if (fallback < 0 && IsLikelyMusicInput(info.ProductName))
            {
                fallback = index;
            }

            if (MatchesPreferredInput(info.ProductName, preferredInput))
            {
                return index;
            }
        }

        return fallback;
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

    private static void MoveFileToArchive(string path, string archiveName)
    {
        if (!File.Exists(path))
        {
            return;
        }

        var root = Path.GetDirectoryName(Path.GetDirectoryName(path) ?? "") ?? Path.GetDirectoryName(path) ?? ".";
        var archive = Path.Combine(root, archiveName);
        Directory.CreateDirectory(archive);
        var target = Path.Combine(archive, Path.GetFileName(path));
        if (File.Exists(target))
        {
            target = Path.Combine(
                archive,
                $"{Path.GetFileNameWithoutExtension(path)}-{DateTime.Now:HHmmss}{Path.GetExtension(path)}");
        }

        File.Move(path, target);
    }

    private static string ResolveDirectShowAudioDeviceName(string preferredInput)
    {
        if (preferredInput.Contains("scarlett", StringComparison.OrdinalIgnoreCase)
            || preferredInput.Contains("focusrite", StringComparison.OrdinalIgnoreCase))
        {
            return "Microphone (Scarlett 2i2 4th Gen)";
        }

        return preferredInput;
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

    private static bool IsPreferredBackend(string backend) =>
        backend.Contains("wavein", StringComparison.OrdinalIgnoreCase);

    private static bool IsSaneCapture(ActiveCapture capture) =>
        capture.Peak is >= 0.005f and <= 1.05f
        && capture.RmsPercent is >= 0.05 and <= 60;

    private static double GetAudioDurationSeconds(string path)
    {
        try
        {
            using var reader = new AudioFileReader(path);
            return reader.TotalTime.TotalSeconds;
        }
        catch
        {
            return 0;
        }
    }

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

    [SupportedOSPlatform("windows")]
    private static void StopOrphanedGateKptFfmpegRecorders()
    {
        try
        {
            using var searcher = new System.Management.ManagementObjectSearcher(
                "SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name = 'ffmpeg.exe'");
            foreach (var item in searcher.Get().Cast<System.Management.ManagementObject>())
            {
                var commandLine = item["CommandLine"]?.ToString() ?? "";
                if (!commandLine.Contains("GateKPT Recorder", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var processId = Convert.ToInt32(item["ProcessId"]);
                using var process = Process.GetProcessById(processId);
                process.Kill(true);
            }
        }
        catch
        {
            // This is hygiene only; normal recording should still attempt to start.
        }
    }
}

public sealed record LayerRecordingStartResult(bool Success, string Path, string Message);

public sealed record LayerRecordingStopResult(bool Success, string Path, string DurationLabel, double PeakPercent, double RmsPercent, string Message);

internal sealed record CaptureCandidate(IWaveIn Input, string DeviceName, string Backend);

internal sealed class ActiveCapture(
    IWaveIn input,
    WaveFileWriter writer,
    string path,
    string deviceName,
    string backend)
{
    public IWaveIn Input { get; } = input;

    public WaveFileWriter Writer { get; } = writer;

    public string Path { get; } = path;

    public string DeviceName { get; } = deviceName;

    public string Backend { get; } = backend;

    public float Peak { get; set; }

    public double SumSquares { get; set; }

    public long SampleCount { get; set; }

    public long BytesWritten { get; set; }

    public double RmsPercent { get; set; }

    public ManualResetEventSlim Stopped { get; } = new(false);
}
