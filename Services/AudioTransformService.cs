using System;
using NAudio.Dsp;
using NAudio.Wave;
using NAudio.Wave.SampleProviders;

namespace GateKPT.MusicOS.Services;

public sealed class AudioTransformService
{
    public AudioTransformResult CreateGainCopy(string sourcePath, string targetPath, double gain)
    {
        var preset = AudioEditPreset.Flat("gain-copy", $"Created boosted copy at {gain:0.0}x.")
            with { Gain = gain };
        return CreatePresetCopy(sourcePath, targetPath, preset);
    }

    public AudioTransformResult CreateNormalizedCopy(
        string sourcePath,
        string targetPath,
        double sourcePeakPercent,
        double targetPeakPercent = 55)
    {
        if (sourcePeakPercent <= 0)
        {
            return CreateGainCopy(sourcePath, targetPath, 1);
        }

        var gain = targetPeakPercent / sourcePeakPercent;
        return CreateGainCopy(sourcePath, targetPath, gain);
    }

    public AudioTransformResult CreatePresetCopy(string sourcePath, string targetPath, AudioEditPreset preset)
    {
        try
        {
            using var reader = new AudioFileReader(sourcePath);
            var provider = new TransformSampleProvider(reader, preset);
            WaveFileWriter.CreateWaveFile16(targetPath, provider);
            return new AudioTransformResult(true, preset.Description);
        }
        catch (Exception ex)
        {
            return new AudioTransformResult(false, $"Could not create audio edit: {ex.Message}");
        }
    }

    private sealed class TransformSampleProvider(ISampleProvider source, AudioEditPreset preset) : ISampleProvider
    {
        private readonly int _channels = source.WaveFormat.Channels;
        private readonly float[][] _echoBuffer = BuildDelayBuffer(source.WaveFormat.SampleRate, source.WaveFormat.Channels, preset.EchoMs);
        private readonly float[][] _reverbBuffer = BuildDelayBuffer(source.WaveFormat.SampleRate, source.WaveFormat.Channels, preset.ReverbMs);
        private readonly BiQuadFilter?[] _highPass = BuildFilters(source.WaveFormat, preset.HighPassHz, BiQuadFilter.HighPassFilter);
        private readonly BiQuadFilter?[] _lowPass = BuildFilters(source.WaveFormat, preset.LowPassHz, BiQuadFilter.LowPassFilter);
        private readonly BiQuadFilter?[] _lowShelf = BuildShelfFilters(source.WaveFormat, preset.LowShelfDb, true);
        private readonly BiQuadFilter?[] _highShelf = BuildShelfFilters(source.WaveFormat, preset.HighShelfDb, false);
        private int _echoIndex;
        private int _reverbIndex;

        public WaveFormat WaveFormat => source.WaveFormat;

        public int Read(float[] buffer, int offset, int count)
        {
            var read = source.Read(buffer, offset, count);
            for (var index = offset; index < offset + read; index++)
            {
                var channel = (index - offset) % _channels;
                var sample = buffer[index] * (float)preset.Gain;

                sample = _highPass[channel]?.Transform(sample) ?? sample;
                sample = _lowPass[channel]?.Transform(sample) ?? sample;
                sample = _lowShelf[channel]?.Transform(sample) ?? sample;
                sample = _highShelf[channel]?.Transform(sample) ?? sample;

                if (preset.CompressionAmount > 0)
                {
                    sample = Compress(sample, preset.CompressionAmount);
                }

                if (preset.SaturationAmount > 0)
                {
                    sample = Saturate(sample, preset.SaturationAmount);
                }

                if (_echoBuffer[channel].Length > 0)
                {
                    var delayed = _echoBuffer[channel][_echoIndex] * (float)preset.EchoMix;
                    _echoBuffer[channel][_echoIndex] = sample + delayed * 0.35f;
                    sample += delayed;
                }

                if (_reverbBuffer[channel].Length > 0)
                {
                    var washed = _reverbBuffer[channel][_reverbIndex] * (float)preset.ReverbMix;
                    _reverbBuffer[channel][_reverbIndex] = sample + washed * 0.55f;
                    sample += washed;
                }

                buffer[index] = Math.Clamp(sample, -1f, 1f);

                if (channel == _channels - 1)
                {
                    if (_echoBuffer[channel].Length > 0)
                    {
                        _echoIndex = (_echoIndex + 1) % _echoBuffer[channel].Length;
                    }

                    if (_reverbBuffer[channel].Length > 0)
                    {
                        _reverbIndex = (_reverbIndex + 1) % _reverbBuffer[channel].Length;
                    }
                }
            }

            return read;
        }

        private static float Compress(float sample, double amount)
        {
            var threshold = 0.28f;
            var ratio = 1f + (float)(amount * 5);
            var sign = MathF.Sign(sample);
            var absolute = MathF.Abs(sample);
            if (absolute <= threshold)
            {
                return sample;
            }

            return sign * (threshold + (absolute - threshold) / ratio);
        }

        private static float Saturate(float sample, double amount)
        {
            var drive = 1f + (float)(amount * 5);
            return MathF.Tanh(sample * drive) / MathF.Tanh(drive);
        }

        private static float[][] BuildDelayBuffer(int sampleRate, int channels, double delayMs)
        {
            var samples = delayMs <= 0 ? 0 : Math.Max(1, (int)(sampleRate * delayMs / 1000));
            var buffers = new float[channels][];
            for (var channel = 0; channel < channels; channel++)
            {
                buffers[channel] = samples == 0 ? [] : new float[samples];
            }

            return buffers;
        }

        private static BiQuadFilter?[] BuildFilters(
            WaveFormat format,
            double hz,
            Func<float, float, float, BiQuadFilter> factory)
        {
            var filters = new BiQuadFilter?[format.Channels];
            if (hz <= 0)
            {
                return filters;
            }

            for (var channel = 0; channel < format.Channels; channel++)
            {
                filters[channel] = factory(format.SampleRate, (float)hz, 0.707f);
            }

            return filters;
        }

        private static BiQuadFilter?[] BuildShelfFilters(WaveFormat format, double gainDb, bool lowShelf)
        {
            var filters = new BiQuadFilter?[format.Channels];
            if (Math.Abs(gainDb) < 0.01)
            {
                return filters;
            }

            for (var channel = 0; channel < format.Channels; channel++)
            {
                filters[channel] = lowShelf
                    ? BiQuadFilter.LowShelf(format.SampleRate, 180, 1, (float)gainDb)
                    : BiQuadFilter.HighShelf(format.SampleRate, 4200, 1, (float)gainDb);
            }

            return filters;
        }
    }
}

public sealed record AudioEditPreset(
    string Label,
    string Description,
    double Gain = 1,
    double HighPassHz = 0,
    double LowPassHz = 0,
    double LowShelfDb = 0,
    double HighShelfDb = 0,
    double CompressionAmount = 0,
    double SaturationAmount = 0,
    double EchoMs = 0,
    double EchoMix = 0,
    double ReverbMs = 0,
    double ReverbMix = 0)
{
    public static AudioEditPreset Flat(string label, string description) => new(label, description);
}

public sealed record AudioTransformResult(bool Success, string Message);
