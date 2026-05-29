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
    private WasapiCapture? _capture;
    private WaveFileWriter? _writer;
    private Stopwatch? _clock;
    private string _activePath = "";

    public bool IsRecording => _capture is not null;

    public LayerRecordingStartResult Start(string preferredInput, string stemDirectory, string layerName)
    {
        Stop();

        try
        {
            Directory.CreateDirectory(stemDirectory);
            using var enumerator = new MMDeviceEnumerator();
            var device = FindInputDevice(enumerator, preferredInput);
            if (device is null)
            {
                return new LayerRecordingStartResult(false, "", "No active audio input matched the preferred routing.");
            }

            _activePath = AutoSaveFileNamer.CreatePath(stemDirectory, layerName, ".wav");
            _capture = new WasapiCapture(device);
            _writer = new WaveFileWriter(_activePath, _capture.WaveFormat);
            _clock = Stopwatch.StartNew();
            _capture.DataAvailable += (_, args) =>
            {
                lock (_gate)
                {
                    _writer?.Write(args.Buffer, 0, args.BytesRecorded);
                    _writer?.Flush();
                }
            };
            _capture.StartRecording();

            return new LayerRecordingStartResult(true, _activePath, $"Recording {layerName} from {device.FriendlyName}");
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
            return new LayerRecordingStopResult(false, "", "00:00", "No active layer recording.");
        }

        var path = _activePath;
        var elapsed = _clock?.Elapsed ?? TimeSpan.Zero;

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

        return new LayerRecordingStopResult(
            File.Exists(path),
            path,
            $"{(int)elapsed.TotalMinutes:00}:{elapsed.Seconds:00}",
            File.Exists(path) ? $"Saved stem: {path}" : "Recording stopped before a stem file was written.");
    }

    public void Dispose() => Stop();

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
                device.FriendlyName.Contains(preferredInput, StringComparison.OrdinalIgnoreCase)
                || preferredInput.Contains(device.FriendlyName, StringComparison.OrdinalIgnoreCase)
                || preferredInput.Contains("focusrite", StringComparison.OrdinalIgnoreCase)
                    && device.FriendlyName.Contains("focusrite", StringComparison.OrdinalIgnoreCase)
                || preferredInput.Contains("scarlett", StringComparison.OrdinalIgnoreCase)
                    && device.FriendlyName.Contains("scarlett", StringComparison.OrdinalIgnoreCase)
                || preferredInput.Contains("rc-505", StringComparison.OrdinalIgnoreCase)
                    && device.FriendlyName.Contains("rc-505", StringComparison.OrdinalIgnoreCase));
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

}

public sealed record LayerRecordingStartResult(bool Success, string Path, string Message);

public sealed record LayerRecordingStopResult(bool Success, string Path, string DurationLabel, string Message);
