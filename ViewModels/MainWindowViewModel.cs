using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace GateKPT.MusicOS.ViewModels;

public sealed partial class MainWindowViewModel : ViewModelBase
{
    public string OperatorName { get; } = "Marcelo";
    public string TodayState { get; } = "Private Music OS";

    [ObservableProperty]
    private OsRoom _selectedRoom;

    [ObservableProperty]
    private string _captureTitle = "Voice reset";

    [ObservableProperty]
    private string _captureNotes = "";

    [ObservableProperty]
    private string _mood = "Grounded";

    [ObservableProperty]
    private string _status = "Ready to capture";

    public MainWindowViewModel()
    {
        Rooms =
        [
            new("Voice", "Warmups, breath, tone, confidence", "01", "#E37B45"),
            new("Songs", "Lyrics, chords, arrangements, references", "02", "#EABF7A"),
            new("Takes", "Recordings, rough demos, best moments", "03", "#6FB6A6"),
            new("Practice", "Daily discipline, reps, vocal checklists", "04", "#D9C5A5"),
            new("Archive", "Everything searchable by mood, song, date", "05", "#F2EADC"),
        ];

        _selectedRoom = Rooms[0];

        RecentCaptures =
        [
            new("Voice reset", "Two-minute hum, jaw loose, low breath", "Today", "Voice"),
            new("Song seed", "Hook idea for late-night chorus", "Draft", "Songs"),
            new("Take note", "Keep the second phrase; first phrase rushed", "Review", "Takes"),
        ];
    }

    public IReadOnlyList<OsRoom> Rooms { get; }

    public ObservableCollection<CaptureItem> RecentCaptures { get; }

    public string ActiveRoom => $"{SelectedRoom.Name} Room";

    public string CaptureHint => SelectedRoom.Name switch
    {
        "Voice" => "Breath, pitch, jaw, throat, confidence, before/after state...",
        "Songs" => "Lyric seed, melody shape, chords, reference, song section...",
        "Takes" => "What worked, what to keep, what rushed, exact timestamp...",
        "Practice" => "Exercise, reps, range, tension, what improved...",
        _ => "Anything you need future you to find...",
    };

    public IReadOnlyList<string> Moods { get; } =
    [
        "Grounded",
        "Tense",
        "Inspired",
        "Locked in",
        "Scattered",
        "Recovering",
    ];

    public IReadOnlyList<string> Ritual { get; } =
    [
        "Open voice with one quiet breath cycle",
        "Capture one honest take before judging it",
        "Write the body state, not just the lyric",
        "Tag the idea so future you can find it",
    ];

    public IReadOnlyList<string> NextBuild { get; } =
    [
        "Local SQLite library",
        "Audio file import",
        "Voice session form",
        "Song/project workspace",
        "Private AI reflection panel",
    ];

    partial void OnSelectedRoomChanged(OsRoom value)
    {
        OnPropertyChanged(nameof(ActiveRoom));
        OnPropertyChanged(nameof(CaptureHint));
        Status = $"Switched to {value.Name}";
        if (string.IsNullOrWhiteSpace(CaptureTitle))
        {
            CaptureTitle = $"{value.Name} capture";
        }
    }

    [RelayCommand]
    private void StartSession()
    {
        CaptureTitle = $"{SelectedRoom.Name} session";
        CaptureNotes = "";
        Status = $"Started {SelectedRoom.Name} session at {DateTime.Now:t}";
    }

    [RelayCommand]
    private void SaveCapture()
    {
        var title = string.IsNullOrWhiteSpace(CaptureTitle)
            ? $"{SelectedRoom.Name} capture"
            : CaptureTitle.Trim();
        var detail = string.IsNullOrWhiteSpace(CaptureNotes)
            ? $"Mood: {Mood}. No notes yet."
            : $"{CaptureNotes.Trim()} | Mood: {Mood}";

        RecentCaptures.Insert(0, new CaptureItem(title, detail, DateTime.Now.ToString("h:mm tt"), SelectedRoom.Name));
        while (RecentCaptures.Count > 8)
        {
            RecentCaptures.RemoveAt(RecentCaptures.Count - 1);
        }

        CaptureTitle = $"{SelectedRoom.Name} capture";
        CaptureNotes = "";
        Status = $"Saved {SelectedRoom.Name} capture";
    }

    [RelayCommand]
    private void ClearCapture()
    {
        CaptureTitle = $"{SelectedRoom.Name} capture";
        CaptureNotes = "";
        Status = "Capture cleared";
    }
}

public sealed record OsRoom(string Name, string Description, string Number, string Accent);

public sealed record CaptureItem(string Title, string Detail, string Status, string Room);
