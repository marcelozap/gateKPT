using System;
using System.IO;
using NAudio.Wave;

namespace GateKPT.MusicOS.Services;

public static class AudioPreviewService
{
    public static AudioPreview Inspect(string path, int bins = 16)
    {
        var metrics = InspectMetrics(path, bins);
        return metrics.Success
            ? new AudioPreview(
                $"{(int)metrics.Duration.TotalMinutes:00}:{metrics.Duration.Seconds:00}",
                $"{Math.Clamp(metrics.PeakPercent, 0, 100):0}%",
                metrics.Waveform)
            : AudioPreview.Empty;
    }

    public static AudioPreviewMetrics InspectMetrics(string path, int bins = 16)
    {
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            return AudioPreviewMetrics.Empty;
        }

        try
        {
            using var reader = new AudioFileReader(path);
            var peak = 0f;
            var sumSquares = 0d;
            var sampleCount = 0L;
            var binPeaks = new float[Math.Max(4, bins)];
            var buffer = new float[Math.Max(reader.WaveFormat.SampleRate / 5, 4096)];
            var totalSamples = Math.Max(1, reader.Length / Math.Max(1, sizeof(float)));
            var samplesReadTotal = 0L;
            int read;
            while ((read = reader.Read(buffer, 0, buffer.Length)) > 0)
            {
                for (var index = 0; index < read; index++)
                {
                    var sample = float.IsFinite(buffer[index]) ? buffer[index] : 0;
                    var value = Math.Abs(sample);
                    peak = Math.Max(peak, value);
                    sumSquares += sample * sample;
                    sampleCount++;
                    var bin = (int)Math.Clamp(samplesReadTotal * binPeaks.Length / totalSamples, 0, binPeaks.Length - 1);
                    binPeaks[bin] = Math.Max(binPeaks[bin], value);
                    samplesReadTotal++;
                }
            }

            var rms = sampleCount <= 0 ? 0 : Math.Sqrt(sumSquares / sampleCount);
            return new AudioPreviewMetrics(
                true,
                reader.TotalTime,
                Math.Clamp(peak * 100, 0, 100),
                Math.Clamp(rms * 100, 0, 100),
                BuildWaveform(binPeaks));
        }
        catch
        {
            return AudioPreviewMetrics.Empty;
        }
    }

    private static string BuildWaveform(float[] peaks)
    {
        var chars = new char[peaks.Length];
        for (var index = 0; index < peaks.Length; index++)
        {
            chars[index] = peaks[index] switch
            {
                >= 0.75f => '#',
                >= 0.45f => '=',
                >= 0.18f => '-',
                > 0.02f => '.',
                _ => '_',
            };
        }

        return new string(chars);
    }
}

public sealed record AudioPreview(string Duration, string Peak, string Waveform)
{
    public static AudioPreview Empty { get; } = new("--:--", "-", "________________");
}

public sealed record AudioPreviewMetrics(bool Success, TimeSpan Duration, double PeakPercent, double RmsPercent, string Waveform)
{
    public static AudioPreviewMetrics Empty { get; } = new(false, TimeSpan.Zero, 0, 0, "________________");
}
