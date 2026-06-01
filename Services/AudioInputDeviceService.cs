using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using NAudio.CoreAudioApi;
using NAudio.Wave;

namespace GateKPT.MusicOS.Services;

public sealed class AudioInputDeviceService
{
    public IReadOnlyList<AudioInputDeviceItem> ListInputs()
    {
        var inputs = new List<AudioInputDeviceItem>();
        try
        {
            using var enumerator = new MMDeviceEnumerator();
            inputs.AddRange(enumerator
                .EnumerateAudioEndPoints(DataFlow.Capture, DeviceState.Active)
                .Select(device => new AudioInputDeviceItem(
                    device.FriendlyName,
                    device.ID,
                    IsPreferred(device.FriendlyName))));
        }
        catch
        {
            return [];
        }

        return inputs
            .OrderByDescending(input => input.IsPreferred)
            .ThenBy(input => input.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public async Task<IReadOnlyList<AudioInputProbeResult>> ProbeAllAsync(string outputDirectory, int seconds = 2)
    {
        var results = new List<AudioInputProbeResult>();
        Directory.CreateDirectory(outputDirectory);

        using var enumerator = new MMDeviceEnumerator();
        var devices = enumerator.EnumerateAudioEndPoints(DataFlow.Capture, DeviceState.Active).ToList();
        foreach (var device in devices)
        {
            WasapiCapture? capture = null;
            WaveFileWriter? writer = null;
            var peak = 0f;
            var bytesWritten = 0L;
            var path = AutoSaveFileNamer.CreatePath(outputDirectory, $"probe-{SanitizeShort(device.FriendlyName)}", ".wav");

            try
            {
                PrepareInputVolume(device);
                capture = new WasapiCapture(device);
                writer = new WaveFileWriter(path, capture.WaveFormat);
                capture.DataAvailable += (_, args) =>
                {
                    writer.Write(args.Buffer, 0, args.BytesRecorded);
                    writer.Flush();
                    bytesWritten += args.BytesRecorded;
                    peak = Math.Max(peak, CalculatePeak(args.Buffer, args.BytesRecorded, capture.WaveFormat));
                };

                capture.StartRecording();
                await Task.Delay(TimeSpan.FromSeconds(Math.Clamp(seconds, 1, 5)));
                capture.StopRecording();

                results.Add(new AudioInputProbeResult(
                    device.FriendlyName,
                    device.ID,
                    path,
                    Math.Round(peak * 100, 1),
                    bytesWritten,
                    true,
                    ""));
            }
            catch (Exception ex)
            {
                results.Add(new AudioInputProbeResult(device.FriendlyName, device.ID, path, Math.Round(peak * 100, 1), bytesWritten, false, ex.Message));
            }
            finally
            {
                writer?.Dispose();
                capture?.Dispose();
            }
        }

        return results
            .OrderByDescending(result => result.PeakPercent)
            .ThenByDescending(result => result.BytesWritten)
            .ToList();
    }

    private static bool IsPreferred(string name) =>
        name.Contains("focusrite", StringComparison.OrdinalIgnoreCase)
        || name.Contains("scarlett", StringComparison.OrdinalIgnoreCase)
        || name.Contains("rc-505", StringComparison.OrdinalIgnoreCase)
        || name.Contains("boss", StringComparison.OrdinalIgnoreCase)
        || name.Contains("usb audio", StringComparison.OrdinalIgnoreCase);

    private static void PrepareInputVolume(MMDevice device)
    {
        try
        {
            device.AudioEndpointVolume.Mute = false;
            device.AudioEndpointVolume.MasterVolumeLevelScalar = 1.0f;
        }
        catch
        {
            // Hardware/driver may block software gain.
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
                peak = Math.Max(peak, Math.Abs(BitConverter.ToInt16(buffer, index) / 32768f));
            }
        }

        return Math.Clamp(peak, 0, 1);
    }

    private static string SanitizeShort(string value)
    {
        var safe = new string(value.Select(character =>
            char.IsLetterOrDigit(character) ? character : '-').ToArray());
        return safe.Length <= 32 ? safe : safe[..32];
    }
}

public sealed record AudioInputDeviceItem(string Name, string Id, bool IsPreferred)
{
    public override string ToString() => Name;
}

public sealed record AudioInputProbeResult(
    string Name,
    string Id,
    string Path,
    double PeakPercent,
    long BytesWritten,
    bool Success,
    string Error);
