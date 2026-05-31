using System;
using System.IO;
using System.Text.Json;

namespace GateKPT.MusicOS.Services;

public sealed class VisualRendererControlService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public VisualRendererControlPacket BuildPacket(VisualRendererControlInput input)
    {
        var energy = Clamp(input.InputLevel / 100d);
        var intensity = Clamp(input.Intensity / 100d);
        var transient = input.Instrument.Equals("Drums", StringComparison.OrdinalIgnoreCase)
            ? Math.Max(energy, 0.72)
            : energy * 0.62;

        return new VisualRendererControlPacket(
            "gatekpt.visual.control.v1",
            DateTimeOffset.Now,
            input.RendererPath,
            input.Mode,
            input.Palette,
            input.Motion,
            input.Section,
            input.Instrument,
            input.OutputTarget,
            input.QualityMode,
            input.DawSafeMode,
            input.ProjectorBlackout,
            energy,
            transient,
            intensity,
            input.LyricSource,
            input.Signature,
            input.Notes);
    }

    public string ExportSnapshot(string libraryDirectory, VisualRendererControlPacket packet)
    {
        var outputDirectory = Path.Combine(libraryDirectory, "visual-control");
        Directory.CreateDirectory(outputDirectory);

        var path = AutoSaveFileNamer.CreatePath(outputDirectory, "visual-renderer-control", ".json");
        File.WriteAllText(path, JsonSerializer.Serialize(packet, JsonOptions));
        return path;
    }

    private static double Clamp(double value) => Math.Clamp(value, 0, 1);
}

public sealed record VisualRendererControlInput(
    string RendererPath,
    string Mode,
    string Palette,
    string Motion,
    string Section,
    string Instrument,
    string OutputTarget,
    string QualityMode,
    bool DawSafeMode,
    bool ProjectorBlackout,
    double InputLevel,
    double Intensity,
    string LyricSource,
    string Signature,
    string Notes);

public sealed record VisualRendererControlPacket(
    string Protocol,
    DateTimeOffset CreatedAt,
    string RendererPath,
    string Mode,
    string Palette,
    string Motion,
    string Section,
    string Instrument,
    string OutputTarget,
    string QualityMode,
    bool DawSafeMode,
    bool ProjectorBlackout,
    double Energy,
    double TransientStrength,
    double Intensity,
    string LyricSource,
    string Signature,
    string Notes);
