using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using NAudio.Wave;

namespace GateKPT.MusicOS.Services;

public sealed class AudioSyncAnalyzer
{
    private const int TargetSampleRate = 16_000;
    private const int WindowMs = 20;
    private const int MaxShiftMs = 1_500;

    public AudioSyncResult? TryAnalyze(string referenceAudioPath, string finalVocalPath)
    {
        if (!File.Exists(referenceAudioPath) || !File.Exists(finalVocalPath))
        {
            return null;
        }

        try
        {
            var reference = ReadMonoSamples(referenceAudioPath, TimeSpan.FromMinutes(8));
            var vocal = ReadMonoSamples(finalVocalPath, TimeSpan.FromMinutes(8));
            if (reference.Length < TargetSampleRate || vocal.Length < TargetSampleRate)
            {
                return null;
            }

            var referenceEnvelope = BuildPeakEnvelope(reference);
            var vocalEnvelope = BuildPeakEnvelope(vocal);
            var offset = EstimateOffset(referenceEnvelope, vocalEnvelope);
            var confidence = EstimateConfidence(referenceEnvelope, vocalEnvelope, offset);
            var waveform = CompressWaveform(vocalEnvelope, 40);

            return new AudioSyncResult(offset, confidence, waveform);
        }
        catch
        {
            return null;
        }
    }

    private static float[] ReadMonoSamples(string path, TimeSpan maxDuration)
    {
        using var reader = new AudioFileReader(path);
        IWaveProvider source = reader;
        MediaFoundationResampler? resampler = null;
        if (reader.WaveFormat.SampleRate != TargetSampleRate)
        {
            resampler = new MediaFoundationResampler(reader, TargetSampleRate)
            {
                ResamplerQuality = 35,
            };
            source = resampler;
        }

        using var disposableSource = resampler;
        var provider = source.ToSampleProvider();
        var channels = provider.WaveFormat.Channels;
        var maxSamples = TargetSampleRate * channels * (int)Math.Ceiling(maxDuration.TotalSeconds);
        var buffer = new float[Math.Min(maxSamples, TargetSampleRate * channels)];
        var samples = new List<float>(TargetSampleRate * 60);

        while (samples.Count * channels < maxSamples)
        {
            var read = provider.Read(buffer, 0, buffer.Length);
            if (read <= 0)
            {
                break;
            }

            for (var i = 0; i < read; i += channels)
            {
                var sum = 0f;
                for (var ch = 0; ch < channels && i + ch < read; ch++)
                {
                    sum += buffer[i + ch];
                }

                samples.Add(sum / channels);
            }
        }

        return samples.ToArray();
    }

    private static double[] BuildPeakEnvelope(float[] samples)
    {
        var window = Math.Max(1, TargetSampleRate * WindowMs / 1000);
        var envelope = new double[(int)Math.Ceiling(samples.Length / (double)window)];
        for (var i = 0; i < envelope.Length; i++)
        {
            var start = i * window;
            var end = Math.Min(samples.Length, start + window);
            var peak = 0.0;
            for (var j = start; j < end; j++)
            {
                peak = Math.Max(peak, Math.Abs(samples[j]));
            }

            envelope[i] = peak;
        }

        NormalizeInPlace(envelope);
        return envelope;
    }

    private static int EstimateOffset(double[] reference, double[] vocal)
    {
        var maxShiftWindows = MaxShiftMs / WindowMs;
        var bestShift = 0;
        var bestScore = double.NegativeInfinity;

        for (var shift = -maxShiftWindows; shift <= maxShiftWindows; shift++)
        {
            var score = Correlate(reference, vocal, shift);
            if (score > bestScore)
            {
                bestScore = score;
                bestShift = shift;
            }
        }

        // Positive means final vocal should move later relative to camera/reference audio.
        return bestShift * WindowMs;
    }

    private static double EstimateConfidence(double[] reference, double[] vocal, int offsetMs)
    {
        var center = offsetMs / WindowMs;
        var primary = Correlate(reference, vocal, center);
        var sideA = Correlate(reference, vocal, center - 8);
        var sideB = Correlate(reference, vocal, center + 8);
        var separation = primary - Math.Max(sideA, sideB);
        return Math.Clamp(0.45 + separation * 0.8, 0.35, 0.96);
    }

    private static double Correlate(double[] reference, double[] vocal, int shift)
    {
        var startReference = Math.Max(0, shift);
        var startVocal = Math.Max(0, -shift);
        var count = Math.Min(reference.Length - startReference, vocal.Length - startVocal);
        if (count <= 8)
        {
            return double.NegativeInfinity;
        }

        var score = 0.0;
        for (var i = 0; i < count; i++)
        {
            score += reference[startReference + i] * vocal[startVocal + i];
        }

        return score / count;
    }

    private static IReadOnlyList<int> CompressWaveform(double[] envelope, int buckets)
    {
        if (envelope.Length == 0)
        {
            return Enumerable.Repeat(12, buckets).ToArray();
        }

        var result = new int[buckets];
        for (var i = 0; i < buckets; i++)
        {
            var start = i * envelope.Length / buckets;
            var end = Math.Max(start + 1, (i + 1) * envelope.Length / buckets);
            var peak = envelope[start..Math.Min(end, envelope.Length)].DefaultIfEmpty(0).Max();
            result[i] = Math.Clamp((int)Math.Round(peak * 92), 8, 92);
        }

        return result;
    }

    private static void NormalizeInPlace(double[] values)
    {
        var max = values.DefaultIfEmpty(0).Max();
        if (max <= 0)
        {
            return;
        }

        for (var i = 0; i < values.Length; i++)
        {
            values[i] /= max;
        }
    }
}

public sealed record AudioSyncResult(int SuggestedOffsetMs, double Confidence, IReadOnlyList<int> Waveform);
