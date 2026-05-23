using System.Collections.Generic;

namespace GateKPT.MusicOS.ViewModels;

public sealed partial class MainWindowViewModel : ViewModelBase
{
    public string OperatorName { get; } = "Marcelo";
    public string TodayState { get; } = "Private Music OS foundation";
    public string ActiveRoom { get; } = "Voice Room";

    public IReadOnlyList<OsRoom> Rooms { get; } =
    [
        new("Voice", "Warmups, breath, tone, confidence", "01", "#E37B45"),
        new("Songs", "Lyrics, chords, arrangements, references", "02", "#EABF7A"),
        new("Takes", "Recordings, rough demos, best moments", "03", "#6FB6A6"),
        new("Practice", "Daily discipline, reps, vocal checklists", "04", "#D9C5A5"),
        new("Archive", "Everything searchable by mood, song, date", "05", "#F2EADC"),
    ];

    public IReadOnlyList<string> Ritual { get; } =
    [
        "Open voice with one quiet breath cycle",
        "Capture one honest take before judging it",
        "Write the body state, not just the lyric",
        "Tag the idea so future you can find it",
    ];

    public IReadOnlyList<CaptureItem> RecentCaptures { get; } =
    [
        new("Voice reset", "Two-minute hum, jaw loose, low breath", "Today"),
        new("Song seed", "Hook idea for late-night chorus", "Draft"),
        new("Take note", "Keep the second phrase; first phrase rushed", "Review"),
    ];

    public IReadOnlyList<string> NextBuild { get; } =
    [
        "Local SQLite library",
        "Audio file import",
        "Voice session form",
        "Song/project workspace",
        "Private AI reflection panel",
    ];
}

public sealed record OsRoom(string Name, string Description, string Number, string Accent);

public sealed record CaptureItem(string Title, string Detail, string Status);
