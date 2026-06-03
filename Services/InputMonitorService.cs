using System;
using System.Diagnostics;
using System.Linq;
using NAudio.CoreAudioApi;
using NAudio.Wave;

namespace GateKPT.MusicOS.Services;

public sealed class InputMonitorService : IDisposable
{
    private WasapiCapture? _capture;
    private IWavePlayer? _output;
    private BufferedWaveProvider? _buffer;

    public bool IsMonitoring => _capture is not null || _output is not null;

    public LooperPlaybackResult Start(string inputDeviceId, string outputDeviceId)
    {
        Stop();

        try
        {
            ForceCurrentProcessVolumeToMax();
            using var enumerator = new MMDeviceEnumerator();
            var input = FindDevice(enumerator, DataFlow.Capture, inputDeviceId)
                ?? enumerator.GetDefaultAudioEndpoint(DataFlow.Capture, Role.Multimedia);
            var outputDevice = FindDevice(enumerator, DataFlow.Render, outputDeviceId)
                ?? enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);

            _capture = new WasapiCapture(input);
            _buffer = new BufferedWaveProvider(_capture.WaveFormat)
            {
                BufferDuration = TimeSpan.FromMilliseconds(500),
                DiscardOnBufferOverflow = true
            };
            _output = new WasapiOut(outputDevice, AudioClientShareMode.Shared, true, 80);
            _output.Init(_buffer);
            _capture.DataAvailable += (_, args) => _buffer.AddSamples(args.Buffer, 0, args.BytesRecorded);
            _output.Play();
            _capture.StartRecording();
            return new LooperPlaybackResult(true, $"Monitoring {input.FriendlyName} -> {outputDevice.FriendlyName}.");
        }
        catch (Exception ex)
        {
            Stop();
            return new LooperPlaybackResult(false, $"Monitor failed: {ex.Message}");
        }
    }

    public void Stop()
    {
        try
        {
            _capture?.StopRecording();
        }
        catch
        {
            // Device may already be gone.
        }

        _capture?.Dispose();
        _output?.Stop();
        _output?.Dispose();
        _capture = null;
        _output = null;
        _buffer = null;
    }

    public void Dispose() => Stop();

    private static MMDevice? FindDevice(MMDeviceEnumerator enumerator, DataFlow flow, string deviceId)
    {
        if (string.IsNullOrWhiteSpace(deviceId))
        {
            return null;
        }

        return enumerator
            .EnumerateAudioEndPoints(flow, DeviceState.Active)
            .FirstOrDefault(device => device.ID == deviceId);
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
            // Monitoring can still attempt playback with the current mixer state.
        }
    }
}
