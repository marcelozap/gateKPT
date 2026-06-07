namespace GateKPT.MusicOS.Models;

public sealed record SongStudyItem(
    string Id,
    string SongTitle,
    string Artist,
    string ChartSource,
    int ChartRank,
    string GenreLane,
    string LyricThemes,
    string HookMechanics,
    string RepetitionPattern,
    string Imagery,
    string SpanishOpportunity,
    string CoverFit,
    string ContentUse,
    string Status,
    string Notes,
    string CreatedAt,
    string UpdatedAt);
