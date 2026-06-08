using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using NAudio.Wave;
using NAudio.Wave.SampleProviders;

namespace GateKPT.MusicOS.Services;

public sealed class LayerMixdownService
{
    public LayerMixdownResult CreateMixdown(IEnumerable<string> sourcePaths, string targetPath)
        => CreateMixdown(sourcePaths, targetPath, smartLevel: false);

    public LayerMixdownResult CreateSmartMixdown(IEnumerable<string> sourcePaths, string targetPath)
        => CreateMixdown(sourcePaths, targetPath, smartLevel: true);

    private static LayerMixdownResult CreateMixdown(IEnumerable<string> sourcePaths, string targetPath, bool smartLevel)
    {
        var paths = sourcePaths
            .Where(path => !string.IsNullOrWhiteSpace(path) && File.Exists(path))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (paths.Count == 0)
        {
            return new LayerMixdownResult(false, "", "No valid layers to export.");
        }

        var readers = new List<AudioFileReader>();
        try
        {
            foreach (var path in paths)
            {
                readers.Add(new AudioFileReader(path));
            }

            var waveFormat = readers[0].WaveFormat;
            var providers = new List<ISampleProvider>();
            for (var index = 0; index < readers.Count; index++)
            {
                var reader = readers[index];
                ISampleProvider provider = reader.WaveFormat.Equals(waveFormat)
                    ? reader
                    : new WdlResamplingSampleProvider(reader, waveFormat.SampleRate);

                if (smartLevel)
                {
                    var metrics = AudioPreviewService.InspectMetrics(paths[index]);
                    var gain = CalculateSmartGain(metrics);
                    provider = new VolumeSampleProvider(provider) { Volume = gain };
                }

                providers.Add(provider);
            }

            ISampleProvider mixer = new MixingSampleProvider(
                providers)
            {
                // False is critical: CreateWaveFile16 writes until Read returns 0.
                // ReadFully=true pads forever with silence and can create runaway WAVs.
                ReadFully = false
            };

            mixer = new VolumeSampleProvider(mixer)
            {
                Volume = smartLevel
                    ? (float)Math.Clamp(0.95 / Math.Sqrt(paths.Count), 0.24, 0.88)
                    : (float)Math.Clamp(1.0 / Math.Sqrt(paths.Count), 0.25, 1)
            };

            WaveFileWriter.CreateWaveFile16(targetPath, mixer);
            var message = smartLevel
                ? $"Mixed {paths.Count} take(s) into one auto-leveled WAV."
                : $"Exported {paths.Count} layer(s) into one WAV.";
            return new LayerMixdownResult(true, targetPath, message);
        }
        catch (Exception ex)
        {
            return new LayerMixdownResult(false, "", $"Could not export mix: {ex.Message}");
        }
        finally
        {
            foreach (var reader in readers)
            {
                reader.Dispose();
            }
        }
    }

    private static float CalculateSmartGain(AudioPreviewMetrics metrics)
    {
        if (!metrics.Success)
        {
            return 1f;
        }

        var rms = Math.Max(0.001, metrics.RmsPercent / 100.0);
        var gain = 0.115 / rms;
        gain = Math.Clamp(gain, 0.35, 2.6);

        if (metrics.PeakPercent > 0)
        {
            var peakLimitedGain = 88.0 / metrics.PeakPercent;
            gain = Math.Min(gain, peakLimitedGain);
        }

        return (float)Math.Clamp(gain, 0.25, 2.6);
    }
}

public sealed record LayerMixdownResult(bool Success, string Path, string Message);
