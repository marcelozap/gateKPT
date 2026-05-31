using System;
using NAudio.Wave;
using NAudio.Wave.SampleProviders;

namespace GateKPT.MusicOS.Services;

public sealed class AudioTransformService
{
    public AudioTransformResult CreateGainCopy(string sourcePath, string targetPath, double gain)
    {
        try
        {
            using var reader = new AudioFileReader(sourcePath);
            var provider = new VolumeSampleProvider(reader)
            {
                Volume = (float)Math.Clamp(gain, 0.1, 500)
            };

            WaveFileWriter.CreateWaveFile16(targetPath, provider);
            return new AudioTransformResult(true, $"Created boosted copy at {gain:0.0}x.");
        }
        catch (Exception ex)
        {
            return new AudioTransformResult(false, $"Could not create audio edit: {ex.Message}");
        }
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
}

public sealed record AudioTransformResult(bool Success, string Message);
