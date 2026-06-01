using System;
using System.IO;
using System.Linq;
using NAudio.Wave;

namespace GateKPT.MusicOS.Services;

public sealed class PlayableTakeRepairService
{
    public PlayableTakeRepairResult RepairToPlayableStereo(string sourcePath)
    {
        if (string.IsNullOrWhiteSpace(sourcePath) || !File.Exists(sourcePath))
        {
            return new PlayableTakeRepairResult(false, sourcePath, "No recorded file found.");
        }

        try
        {
            var stats = InspectChannels(sourcePath);
            if (stats.Channels.Length == 0)
            {
                return new PlayableTakeRepairResult(false, sourcePath, "Recorded file had no readable channels.");
            }

            var selected = stats.Channels
                .Where(channel => channel.Rms > 0.0005f && channel.Rms < 0.25f && channel.Peak < 0.98f)
                .OrderByDescending(channel => channel.Rms)
                .FirstOrDefault();

            if (selected is null)
            {
                selected = stats.Channels
                    .Where(channel => channel.Rms > 0.0005f && channel.Rms < 0.35f)
                    .OrderByDescending(channel => channel.Rms)
                    .FirstOrDefault()
                    ?? stats.Channels.OrderByDescending(channel => channel.Rms).First();
            }

            var cleanPath = BuildCleanPath(sourcePath);
            WriteCleanStereoCopy(sourcePath, cleanPath, selected.Index, selected.Peak);

            var rawDirectory = Path.Combine(
                Path.GetDirectoryName(Path.GetDirectoryName(sourcePath)) ?? Path.GetDirectoryName(sourcePath)!,
                "raw-captures");
            Directory.CreateDirectory(rawDirectory);
            var rawPath = Path.Combine(rawDirectory, Path.GetFileName(sourcePath));
            if (File.Exists(rawPath))
            {
                rawPath = Path.Combine(
                    rawDirectory,
                    $"{Path.GetFileNameWithoutExtension(sourcePath)}-{DateTime.Now:HHmmss}{Path.GetExtension(sourcePath)}");
            }

            File.Move(sourcePath, rawPath);
            File.Move(cleanPath, sourcePath);

            var rmsPercent = selected.Rms * 100;
            var peakPercent = selected.Peak * 100;
            return new PlayableTakeRepairResult(
                true,
                sourcePath,
                $"Playable take repaired from channel {selected.Index + 1}. Peak {peakPercent:0.0}%, RMS {rmsPercent:0.00}%. Raw capture archived.");
        }
        catch (Exception ex)
        {
            return new PlayableTakeRepairResult(false, sourcePath, $"Could not repair playable take: {ex.Message}");
        }
    }

    private static AudioChannelInspection InspectChannels(string sourcePath)
    {
        using var reader = new AudioFileReader(sourcePath);
        var channels = Math.Max(1, reader.WaveFormat.Channels);
        var peaks = new float[channels];
        var sumSquares = new double[channels];
        var counts = new long[channels];
        var buffer = new float[Math.Max(4096, reader.WaveFormat.SampleRate * channels / 2)];
        int read;
        while ((read = reader.Read(buffer, 0, buffer.Length)) > 0)
        {
            for (var index = 0; index < read; index++)
            {
                var channel = index % channels;
                var sample = float.IsFinite(buffer[index]) ? buffer[index] : 0;
                var absolute = Math.Abs(sample);
                peaks[channel] = Math.Max(peaks[channel], absolute);
                sumSquares[channel] += sample * sample;
                counts[channel]++;
            }
        }

        return new AudioChannelInspection(
            Enumerable.Range(0, channels)
                .Select(index => new AudioChannelStats(
                    index,
                    peaks[index],
                    counts[index] <= 0 ? 0 : (float)Math.Sqrt(sumSquares[index] / counts[index])))
                .ToArray());
    }

    private static void WriteCleanStereoCopy(string sourcePath, string cleanPath, int sourceChannel, float sourcePeak)
    {
        using var reader = new AudioFileReader(sourcePath);
        var channels = Math.Max(1, reader.WaveFormat.Channels);
        var gain = sourcePeak > 0.001f ? Math.Min(12f, 0.82f / sourcePeak) : 1f;
        var outputFormat = new WaveFormat(reader.WaveFormat.SampleRate, 16, 2);
        using var writer = new WaveFileWriter(cleanPath, outputFormat);
        var readBuffer = new float[Math.Max(4096, reader.WaveFormat.SampleRate * channels / 2)];
        var writeBuffer = new byte[readBuffer.Length / channels * 4];
        int read;
        while ((read = reader.Read(readBuffer, 0, readBuffer.Length)) > 0)
        {
            var frames = read / channels;
            var outputIndex = 0;
            for (var frame = 0; frame < frames; frame++)
            {
                var sampleIndex = frame * channels + Math.Clamp(sourceChannel, 0, channels - 1);
                var sample = float.IsFinite(readBuffer[sampleIndex]) ? readBuffer[sampleIndex] * gain : 0;
                var pcm = (short)Math.Clamp(sample * short.MaxValue, short.MinValue, short.MaxValue);
                writeBuffer[outputIndex++] = (byte)(pcm & 0xff);
                writeBuffer[outputIndex++] = (byte)((pcm >> 8) & 0xff);
                writeBuffer[outputIndex++] = (byte)(pcm & 0xff);
                writeBuffer[outputIndex++] = (byte)((pcm >> 8) & 0xff);
            }

            writer.Write(writeBuffer, 0, outputIndex);
        }
    }

    private static string BuildCleanPath(string sourcePath) =>
        Path.Combine(
            Path.GetDirectoryName(sourcePath) ?? "",
            $"{Path.GetFileNameWithoutExtension(sourcePath)}-clean{Path.GetExtension(sourcePath)}");
}

public sealed record PlayableTakeRepairResult(bool Success, string Path, string Message);

internal sealed record AudioChannelInspection(AudioChannelStats[] Channels);

internal sealed record AudioChannelStats(int Index, float Peak, float Rms);
