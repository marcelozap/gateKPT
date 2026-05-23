using System.Collections.Generic;

namespace GateKPT.MusicOS.Services;

public static class AudioProcessingPresetCatalog
{
    public static IReadOnlyList<AudioProcessingPreset> Defaults { get; } =
    [
        new("Clean vocal", "clean-vocal", 80, -14, "High-pass rumble cleanup plus platform loudness."),
        new("Spoken clarity", "spoken-clarity", 95, -16, "Lean voiceover chain for lessons, demos, and explanations."),
        new("Music performance", "music-performance", 65, -13, "Keeps more low body while still normalizing the final clip."),
        new("No processing", "dry", 0, 0, "Sync only. Leave tonal and loudness processing untouched."),
    ];
}

public sealed record AudioProcessingPreset(
    string Name,
    string Slug,
    int HighPassHz,
    int TargetLufs,
    string Description);
