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
    private string _captureTitle = "Lip sync pass";

    [ObservableProperty]
    private string _captureNotes = "";

    [ObservableProperty]
    private string _mood = "Syncing";

    [ObservableProperty]
    private string _status = "Ready to sync";

    public MainWindowViewModel()
    {
        Rooms =
        [
            new("Sync", "Line up lip movement, camera audio, and final vocal", "01", "#E37B45"),
            new("Timeline", "Video, vocal, beat, captions, markers", "02", "#EABF7A"),
            new("Mix", "Levels, EQ, compression, noise cleanup", "03", "#6FB6A6"),
            new("Takes", "Compare performances and choose usable moments", "04", "#D9C5A5"),
            new("Export", "Render clips for LinkedIn, TikTok, YouTube", "05", "#F2EADC"),
        ];

        _selectedRoom = Rooms[0];

        RecentCaptures =
        [
            new("Lip sync pass", "Camera track needs +42 ms offset against final vocal", "Today", "Sync"),
            new("Noise cleanup", "Room hum around 120 Hz; gate before compression", "Mix", "Mix"),
            new("Best phrase", "Take 03 has clean consonants on the hook", "Review", "Takes"),
        ];
    }

    public IReadOnlyList<OsRoom> Rooms { get; }

    public ObservableCollection<CaptureItem> RecentCaptures { get; }

    public string ActiveRoom => $"{SelectedRoom.Name} Room";

    public string CaptureHint => SelectedRoom.Name switch
    {
        "Sync" => "Offset in ms, clap point, lip consonant, drift, camera/audio notes...",
        "Timeline" => "Marker, section, clip start/end, caption, cut idea...",
        "Mix" => "Level, EQ, compressor, gate, noise, reference track...",
        "Takes" => "Take number, timestamp, keeper phrase, problem area...",
        _ => "Format, platform, loudness target, aspect ratio, render notes...",
    };

    public IReadOnlyList<string> Moods { get; } =
    [
        "Syncing",
        "Editing",
        "Mixing",
        "Reviewing",
        "Exporting",
        "Blocked",
    ];

    public IReadOnlyList<string> Ritual { get; } =
    [
        "Import camera video and reference audio",
        "Detect clap/transient or mouth-open sync point",
        "Nudge final vocal until consonants match lips",
        "Export one clean review clip before moving on",
    ];

    public IReadOnlyList<string> NextBuild { get; } =
    [
        "Video/audio import pipeline",
        "Waveform + frame timeline",
        "Auto lip-sync offset detection",
        "Nonlinear clip editor",
        "DAW-style mixer and export queue",
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
