using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using NAudio.Wave;
using NAudio.Wave.SampleProviders;

namespace GateKPT.MusicOS.Services;

public sealed class BackendSelfTestService
{
    private readonly AudioTransformService _transforms = new();
    private readonly LayerMixdownService _mixdown = new();
    public int Run(TextWriter output)
    {
        var failures = new List<string>();
        var root = Path.Combine(Path.GetTempPath(), $"GateKPT-self-test-{DateTime.Now:yyyyMMdd-HHmmss}");
        Directory.CreateDirectory(root);
        var versions = new RecorderVersionStore(Path.Combine(root, "recorder-store"));

        output.WriteLine($"GateKPT backend self-test: {root}");

        var stems = new[]
        {
            CreateTone(Path.Combine(root, "01-drums.wav"), 110, 0.55),
            CreateTone(Path.Combine(root, "02-guitar.wav"), 220, 0.35),
            CreateTone(Path.Combine(root, "03-vocal.wav"), 440, 0.28)
        };

        foreach (var stem in stems)
        {
            Require(File.Exists(stem) && new FileInfo(stem).Length > 4096, $"created {Path.GetFileName(stem)}", failures);
        }

        var edited = Path.Combine(root, "drums-warmer.wav");
        var editResult = _transforms.CreatePresetCopy(
            stems[0],
            edited,
            new AudioEditPreset(
                "warmer",
                "Self-test warmer copy.",
                Gain: 1.2,
                LowShelfDb: 2,
                HighShelfDb: -1,
                CompressionAmount: 0.2,
                SaturationAmount: 0.05));
        Require(editResult.Success && File.Exists(edited) && new FileInfo(edited).Length > 4096, "created edited copy", failures);

        var mixPath = Path.Combine(root, "layer-mix.wav");
        var mixResult = _mixdown.CreateMixdown(stems, mixPath);
        Require(
            mixResult.Success && File.Exists(mixPath) && new FileInfo(mixPath).Length > 4096,
            $"created layer mix ({mixResult.Message})",
            failures);

        var exportDirectory = versions.CreateStemExportDirectory();
        var exported = stems
            .Select((path, index) => versions.CopyStemExport(path, exportDirectory, index + 1, Path.GetFileNameWithoutExtension(path)))
            .Where(path => !string.IsNullOrWhiteSpace(path))
            .ToList();
        Require(exported.Count == stems.Length && exported.All(File.Exists), "exported separate stems", failures);

        versions.SaveLayerDeck([
            new StoredLayerSlot(1, "Drums", edited, Path.GetFileName(edited), "Edited", "Self-test warmer copy."),
            new StoredLayerSlot(2, "Guitar", stems[1], Path.GetFileName(stems[1]), "Loaded", "")
        ]);
        var restoredDeck = versions.LoadLayerDeck();
        Require(
            restoredDeck.Count == 2
            && restoredDeck.Any(slot => slot.Name == "Drums" && slot.Path == edited && slot.Status == "Edited"),
            "saved and restored layer deck memory",
            failures);

        if (failures.Count == 0)
        {
            output.WriteLine("PASS: recording file pipeline, edit copies, mix export, stem export, and layer deck memory are functional.");
            output.WriteLine($"Stem export folder: {exportDirectory}");
            return 0;
        }

        output.WriteLine("FAIL:");
        foreach (var failure in failures)
        {
            output.WriteLine($"- {failure}");
        }

        return 1;
    }

    private static string CreateTone(string path, double frequency, double gain)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path) ?? ".");
        var signal = new SignalGenerator(44100, 2)
        {
            Type = SignalGeneratorType.Sin,
            Frequency = frequency,
            Gain = gain
        };

        WaveFileWriter.CreateWaveFile16(path, signal.Take(TimeSpan.FromSeconds(1.5)));
        return path;
    }

    private static void Require(bool condition, string label, ICollection<string> failures)
    {
        if (!condition)
        {
            failures.Add(label);
        }
    }
}
