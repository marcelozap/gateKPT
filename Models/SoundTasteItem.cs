namespace GateKPT.MusicOS.Models;

public sealed record SoundTasteItem(
    string Id,
    string Name,
    string ReferenceSongs,
    string BeatFeel,
    string TempoRange,
    string KeyRange,
    string VocalEnergy,
    string LyricThemes,
    string VisualEnergy,
    string BestUse,
    string Avoid,
    int FitScore,
    int MemorabilityScore,
    string Status,
    string CreatedAt,
    string UpdatedAt);
