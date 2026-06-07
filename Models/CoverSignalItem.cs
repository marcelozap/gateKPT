namespace GateKPT.MusicOS.Models;

public sealed record CoverSignalItem(
    string Id,
    string SongTitle,
    string Artist,
    string SuggestedBy,
    string FitReason,
    string TestHook,
    string VocalLane,
    string Difficulty,
    int VoiceFitScore,
    int AudienceSignalScore,
    string Status,
    string Notes,
    string CreatedAt,
    string UpdatedAt);
