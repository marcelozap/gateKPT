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
                Volume = (float)Math.Clamp(gain, 0.1, 12)
            };

            WaveFileWriter.CreateWaveFile16(targetPath, provider);
            return new AudioTransformResult(true, $"Created boosted copy at {gain:0.0}x.");
        }
        catch (Exception ex)
        {
            return new AudioTransformResult(false, $"Could not create audio edit: {ex.Message}");
        }
    }
}

public sealed record AudioTransformResult(bool Success, string Message);
