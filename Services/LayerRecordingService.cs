using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using NAudio.CoreAudioApi;
using NAudio.Wave;

namespace GateKPT.MusicOS.Services;

public sealed class LayerRecordingService : IDisposable
{
    private readonly object _gate = new();
    private IWaveIn? _capture;
    private WaveFileWriter? _writer;
    private Stopwatch? _clock;
    private string _activePath = "";
    private float _peak;
    private long _bytesWritten;

    public bool IsRecording => _capture is not null;

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
            var capture = CreateCapture(preferredInput, out var deviceName, out var backend);
            if (capture is null)
            {
                return new LayerRecordingStartResult(false, "", "No active audio input matched the preferred routing.");
            }

            _activePath = AutoSaveFileNamer.CreatePath(stemDirectory, layerName, ".wav");
            _peak = 0;
            _bytesWritten = 0;
            _capture = capture;
            _writer = new WaveFileWriter(_activePath, _capture.WaveFormat);
            _clock = Stopwatch.StartNew();
            _capture.DataAvailable += (_, args) =>
            {
                lock (_gate)
                {
                    _writer?.Write(args.Buffer, 0, args.BytesRecorded);
                    _writer?.Flush();
                    _bytesWritten += args.BytesRecorded;
                    _peak = Math.Max(_peak, CalculatePeak(args.Buffer, args.BytesRecorded, _capture.WaveFormat));
                    onPeakPercent?.Invoke(Math.Round(_peak * 100, 1));
                }
            };
            _capture.StartRecording();

            return new LayerRecordingStartResult(true, _activePath, $"Recording {layerName} from {deviceName} via {backend}");
        }
        catch (Exception ex)
        {
            Stop();
            return new LayerRecordingStartResult(false, "", $"Could not start layer recording: {ex.Message}");
        }
    }

    public LayerRecordingStopResult Stop()
    {
        if (_capture is null && _writer is null)
        {
            return new LayerRecordingStopResult(false, "", "00:00", 0, "No active layer recording.");
        }

        var path = _activePath;
        var elapsed = _clock?.Elapsed ?? TimeSpan.Zero;
        var peakPercent = Math.Round(_peak * 100, 1);
        var bytesWritten = _bytesWritten;

        try
        {
            _capture?.StopRecording();
        }
        catch
        {
            // Device may already be disconnected; keep the partial WAV if it exists.
        }

        lock (_gate)
        {
            _writer?.Dispose();
            _writer = null;
        }

        _capture?.Dispose();
        _capture = null;
        _clock = null;
        _activePath = "";
        _peak = 0;
        _bytesWritten = 0;

        if (File.Exists(path) && (elapsed.TotalSeconds < 0.75 || bytesWritten < 4096 || peakPercent < 0.05))
        {
            return new LayerRecordingStopResult(
                false,
                path,
                $"{(int)elapsed.TotalMinutes:00}:{elapsed.Seconds:00}",
                peakPercent,
                $"Silent take rejected. Peak {peakPercent:0.0}%. Check signal first, then record while sound is playing.");
        }

        return new LayerRecordingStopResult(
            File.Exists(path),
            path,
            $"{(int)elapsed.TotalMinutes:00}:{elapsed.Seconds:00}",
            peakPercent,
            File.Exists(path)
                ? peakPercent < 8
                    ? $"Saved low-signal stem: {path}. Peak {peakPercent:0.0}%. Turn up Scarlett/RC-505 input if playback is quiet."
                    : $"Saved stem: {path}"
                : "Recording stopped before a stem file was written.");
    }

    public void Dispose() => Stop();

    private static IWaveIn? CreateCapture(string preferredInput, out string deviceName, out string backend)
    {
        var waveIn = CreateWaveInCapture(preferredInput, out deviceName);
        if (waveIn is not null)
        {
            backend = "WaveIn";
            return waveIn;
        }

        using var enumerator = new MMDeviceEnumerator();
        var device = FindInputDevice(enumerator, preferredInput);
        if (device is null)
        {
            deviceName = "";
            backend = "";
            return null;
        }

        PrepareInputVolume(device);
        deviceName = device.FriendlyName;
        backend = "WASAPI";
        return new WasapiCapture(device);
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
            var capabilities = WaveInEvent.GetCapabilities(index);
            var name = capabilities.ProductName;
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
                var capabilities = WaveInEvent.GetCapabilities(index);
                var name = capabilities.ProductName;
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
            BufferMilliseconds = 50
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
            var preferred = devices.FirstOrDefault(device =>
                MatchesPreferredInput(device.FriendlyName, preferredInput));
            if (preferred is not null)
            {
                return preferred;
            }
        }

        return devices.FirstOrDefault(device =>
                device.FriendlyName.Contains("focusrite", StringComparison.OrdinalIgnoreCase)
                || device.FriendlyName.Contains("scarlett", StringComparison.OrdinalIgnoreCase)
                || device.FriendlyName.Contains("rc-505", StringComparison.OrdinalIgnoreCase)
                || device.FriendlyName.Contains("boss", StringComparison.OrdinalIgnoreCase))
            ?? devices[0];
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
            // Some drivers block software gain changes; hardware gain still controls the final level.
        }
    }

    private static float CalculatePeak(byte[] buffer, int bytesRecorded, WaveFormat waveFormat)
    {
        var peak = 0f;

        if (waveFormat.Encoding == WaveFormatEncoding.IeeeFloat && waveFormat.BitsPerSample == 32)
        {
            for (var index = 0; index + 3 < bytesRecorded; index += 4)
            {
                var sample = BitConverter.ToSingle(buffer, index);
                if (!float.IsNaN(sample))
                {
                    peak = Math.Max(peak, Math.Abs(sample));
                }
            }

            return Math.Clamp(peak, 0, 1);
        }

        if (waveFormat.BitsPerSample == 16)
        {
            for (var index = 0; index + 1 < bytesRecorded; index += 2)
            {
                var sample = BitConverter.ToInt16(buffer, index) / 32768f;
                peak = Math.Max(peak, Math.Abs(sample));
            }

            return Math.Clamp(peak, 0, 1);
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

                peak = Math.Max(peak, Math.Abs(sample / 8388608f));
            }

            return Math.Clamp(peak, 0, 1);
        }

        return Math.Clamp(peak, 0, 1);
    }
}

public sealed record LayerRecordingStartResult(bool Success, string Path, string Message);

public sealed record LayerRecordingStopResult(bool Success, string Path, string DurationLabel, double PeakPercent, string Message);
