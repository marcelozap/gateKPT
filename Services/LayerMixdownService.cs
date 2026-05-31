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
            ISampleProvider mixer = new MixingSampleProvider(
                readers.Select<AudioFileReader, ISampleProvider>(reader =>
                    reader.WaveFormat.Equals(waveFormat)
                        ? reader
                        : new WdlResamplingSampleProvider(reader, waveFormat.SampleRate)))
            {
                ReadFully = true
            };

            mixer = new VolumeSampleProvider(mixer)
            {
                Volume = (float)Math.Clamp(1.0 / Math.Sqrt(paths.Count), 0.25, 1)
            };

            WaveFileWriter.CreateWaveFile16(targetPath, mixer);
            return new LayerMixdownResult(true, targetPath, $"Exported {paths.Count} layer(s) into one WAV.");
        }
        catch (Exception ex)
        {
            return new LayerMixdownResult(false, "", $"Could not export layer mix: {ex.Message}");
        }
        finally
        {
            foreach (var reader in readers)
            {
                reader.Dispose();
            }
        }
    }
}

public sealed record LayerMixdownResult(bool Success, string Path, string Message);
