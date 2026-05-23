using System;
using System.Linq;
using NAudio.CoreAudioApi;
using NAudio.Wave;

namespace GateKPT.MusicOS.Services;

public sealed class LiveInputMeterService : IDisposable
{
    private WasapiCapture? _capture;

    public bool IsRunning => _capture is not null;

    public MeterStartResult Start(string preferredInput, Action<float> onLevel)
    {
        Stop();

        try
        {
            using var enumerator = new MMDeviceEnumerator();
            var device = FindInputDevice(enumerator, preferredInput);
            if (device is null)
            {
                return new MeterStartResult(false, "No active audio input matched the preferred routing.");
            }

            _capture = new WasapiCapture(device);
            _capture.DataAvailable += (_, args) => onLevel(CalculatePeak(args.Buffer, args.BytesRecorded));
            _capture.RecordingStopped += (_, _) => Stop();
            _capture.StartRecording();
            return new MeterStartResult(true, $"Metering {device.FriendlyName}");
        }
        catch (Exception ex)
        {
            Stop();
            return new MeterStartResult(false, $"Could not start live input meter: {ex.Message}");
        }
    }

    public void Stop()
    {
        if (_capture is null)
        {
            return;
        }

        var capture = _capture;
        _capture = null;
        try
        {
            capture.StopRecording();
        }
        catch
        {
            // Device may already be gone; disposal still cleans up the capture handle.
        }

        capture.Dispose();
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

    private static float CalculatePeak(byte[] buffer, int bytesRecorded)
    {
        if (bytesRecorded <= 0)
        {
            return 0;
        }

        var peak = 0f;
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
}

public sealed record MeterStartResult(bool Success, string Message);
