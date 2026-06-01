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
            var deviceName = device.FriendlyName;
            var deviceId = device.ID;
            WasapiCapture? capture = null;
            WaveFileWriter? writer = null;
            var peak = 0f;
            var sumSquares = 0d;
            var sampleCount = 0L;
            var bytesWritten = 0L;
            var path = AutoSaveFileNamer.CreatePath(outputDirectory, $"probe-{SanitizeShort(deviceName)}", ".wav");

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
                    var stats = CalculateStats(args.Buffer, args.BytesRecorded, capture.WaveFormat);
                    peak = Math.Max(peak, stats.Peak);
                    sumSquares += stats.SumSquares;
                    sampleCount += stats.SampleCount;
                };

                capture.StartRecording();
                await Task.Delay(TimeSpan.FromSeconds(Math.Clamp(seconds, 1, 5)));
                capture.StopRecording();

                results.Add(new AudioInputProbeResult(
                    deviceName,
                    deviceId,
                    path,
                    Math.Round(peak * 100, 1),
                    Math.Round(CalculateRmsPercent(sumSquares, sampleCount), 2),
                    bytesWritten,
                    true,
                    ""));
            }
            catch (Exception ex)
            {
                results.Add(new AudioInputProbeResult(deviceName, deviceId, path, Math.Round(peak * 100, 1), Math.Round(CalculateRmsPercent(sumSquares, sampleCount), 2), bytesWritten, false, ex.Message));
            }
            finally
            {
                writer?.Dispose();
                capture?.Dispose();
            }
        }

        return results
            .OrderByDescending(result => result.RmsPercent)
            .ThenByDescending(result => result.PeakPercent)
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
        }

        return new AudioSignalStats(Math.Clamp(peak, 0, 1), sumSquares, sampleCount);
    }

    private static double CalculateRmsPercent(double sumSquares, long sampleCount) =>
        sampleCount <= 0 ? 0 : Math.Sqrt(sumSquares / sampleCount) * 100;

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
    double RmsPercent,
    long BytesWritten,
    bool Success,
    string Error);

internal sealed record AudioSignalStats(float Peak, double SumSquares, long SampleCount);
