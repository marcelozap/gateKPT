using System;
using System.IO;
using System.Linq;
using NAudio.Wave;

namespace GateKPT.MusicOS.Services;

public sealed class PlayableTakeRepairService
{
    private const float MinimumUsablePeak = 0.015f;
    private const float MinimumUsableRms = 0.0025f;
    private const float MaximumRepairablePeak = 64f;
    private const float MaximumRepairableRms = 32f;
    private const float TargetRms = 0.14f;
    private const float MaximumCleanGain = 8f;

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

            if (stats.DurationSeconds < 0.75)
            {
                return new PlayableTakeRepairResult(false, sourcePath, $"Recorded fragment was too short ({stats.DurationSeconds:0.00}s). Refused to call it a take.");
            }

            var usableChannels = stats.Channels
                .Where(IsUsableSignal)
                .OrderBy(channel => IsClippedBlock(channel) ? 1 : 0)
                .ThenBy(channel => channel.Index == 0 ? 0 : 1)
                .ThenByDescending(ChannelScore)
                .ToArray();

            if (usableChannels.Length == 0)
            {
                var strongest = stats.Channels.OrderByDescending(channel => channel.Rms).First();
                return new PlayableTakeRepairResult(
                    false,
                    sourcePath,
                    $"No real input signal found. Strongest channel {strongest.Index + 1}: peak {strongest.Peak * 100:0.0}%, RMS {strongest.Rms * 100:0.00}%.");
            }

            var cleanPath = BuildCleanPath(sourcePath);
            var routing = BuildStereoRouting(stats.Channels, usableChannels);
            var leftGain = CalculateChannelGain(routing.Left);
            var rightGain = CalculateChannelGain(routing.Right);
            WriteCleanStereoCopy(sourcePath, cleanPath, routing.Left.Index, routing.Right.Index, leftGain, rightGain);

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

            var leftRms = routing.Left.Rms * 100;
            var rightRms = routing.Right.Rms * 100;
            var peakPercent = Math.Max(routing.Left.Peak, routing.Right.Peak) * 100;
            var inputMode = routing.Left.Index == 0 && routing.Right.Index == 0
                ? "Input 1 locked to stereo"
                : $"Channels {routing.Left.Index + 1}/{routing.Right.Index + 1}";
            return new PlayableTakeRepairResult(
                true,
                sourcePath,
                $"Playable stereo take boosted and verified. {inputMode}. Duration {stats.DurationSeconds:0.0}s. L RMS {leftRms:0.00}%, R RMS {rightRms:0.00}%, peak {peakPercent:0.0}%. Raw capture archived.");
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
            reader.TotalTime.TotalSeconds,
            Enumerable.Range(0, channels)
                .Select(index => new AudioChannelStats(
                    index,
                    peaks[index],
                    counts[index] <= 0 ? 0 : (float)Math.Sqrt(sumSquares[index] / counts[index])))
                .ToArray());
    }

    private static bool IsUsableSignal(AudioChannelStats channel)
    {
        if (!float.IsFinite(channel.Peak)
            || !float.IsFinite(channel.Rms)
            || channel.Peak < MinimumUsablePeak
            || channel.Rms < MinimumUsableRms
            || channel.Peak > MaximumRepairablePeak
            || channel.Rms > MaximumRepairableRms)
        {
            return false;
        }

        return true;
    }

    private static bool IsClippedBlock(AudioChannelStats channel) =>
        channel.Peak >= 0.98f && channel.Rms >= 0.25f;

    private static double ChannelScore(AudioChannelStats channel)
    {
        var normalizedRms = channel.Peak <= 0.001f ? channel.Rms : channel.Rms / channel.Peak;
        var levelScore = Math.Log10(1 + Math.Max(channel.Rms, 0));
        return levelScore + Math.Clamp(normalizedRms, 0, 1);
    }

    private static StereoRouting BuildStereoRouting(AudioChannelStats[] allChannels, AudioChannelStats[] usableChannels)
    {
        var inputOne = usableChannels.FirstOrDefault(channel => channel.Index == 0);
        if (inputOne is not null)
        {
            return new StereoRouting(inputOne, inputOne);
        }

        if (usableChannels.Length >= 2)
        {
            return new StereoRouting(usableChannels[0], usableChannels[1]);
        }

        var strongest = usableChannels[0];
        if (allChannels.Length >= 2)
        {
            var partner = allChannels
                .Where(channel => channel.Index != strongest.Index)
                .Where(IsUsableSignal)
                .OrderByDescending(ChannelScore)
                .FirstOrDefault();

            if (partner is not null)
            {
                return strongest.Index < partner.Index
                    ? new StereoRouting(strongest, partner)
                    : new StereoRouting(partner, strongest);
            }
        }

        return new StereoRouting(strongest, strongest);
    }

    private static float CalculateChannelGain(AudioChannelStats channel)
    {
        if (channel.Rms <= 0.0001f)
        {
            return 1f;
        }

        if (channel.Peak >= 0.96f || channel.Rms >= TargetRms)
        {
            return Math.Min(1f, 0.82f / Math.Max(channel.Peak, 0.82f));
        }

        return Math.Min(MaximumCleanGain, TargetRms / channel.Rms);
    }

    private static void WriteCleanStereoCopy(string sourcePath, string cleanPath, int leftChannel, int rightChannel, float leftGain, float rightGain)
    {
        using var reader = new AudioFileReader(sourcePath);
        var channels = Math.Max(1, reader.WaveFormat.Channels);
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
                var frameStart = frame * channels;
                var left = Limit(ReadSample(readBuffer, frameStart, channels, leftChannel) * leftGain);
                var right = Limit(ReadSample(readBuffer, frameStart, channels, rightChannel) * rightGain);
                var leftPcm = ToPcm16(left);
                var rightPcm = ToPcm16(right);
                writeBuffer[outputIndex++] = (byte)(leftPcm & 0xff);
                writeBuffer[outputIndex++] = (byte)((leftPcm >> 8) & 0xff);
                writeBuffer[outputIndex++] = (byte)(rightPcm & 0xff);
                writeBuffer[outputIndex++] = (byte)((rightPcm >> 8) & 0xff);
            }

            writer.Write(writeBuffer, 0, outputIndex);
        }
    }

    private static float ReadSample(float[] buffer, int frameStart, int channels, int channel)
    {
        var sample = buffer[frameStart + Math.Clamp(channel, 0, channels - 1)];
        return float.IsFinite(sample) ? sample : 0;
    }

    private static short ToPcm16(float sample) =>
        (short)Math.Clamp(sample * short.MaxValue, short.MinValue, short.MaxValue);

    private static float Limit(float sample)
    {
        if (!float.IsFinite(sample))
        {
            return 0;
        }

        return (float)Math.Tanh(sample);
    }

    private static string BuildCleanPath(string sourcePath) =>
        Path.Combine(
            Path.GetDirectoryName(sourcePath) ?? "",
            $"{Path.GetFileNameWithoutExtension(sourcePath)}-clean{Path.GetExtension(sourcePath)}");
}

public sealed record PlayableTakeRepairResult(bool Success, string Path, string Message);

internal sealed record AudioChannelInspection(double DurationSeconds, AudioChannelStats[] Channels);

internal sealed record AudioChannelStats(int Index, float Peak, float Rms);

internal sealed record StereoRouting(AudioChannelStats Left, AudioChannelStats Right);
