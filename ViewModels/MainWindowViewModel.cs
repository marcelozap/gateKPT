using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using GateKPT.MusicOS.Services;

namespace GateKPT.MusicOS.ViewModels;

public sealed partial class MainWindowViewModel : ViewModelBase
{
    private readonly LocalLibraryStore _store = new();
    private readonly MediaAnalysisService _mediaAnalysis = new();
    private readonly ToolchainProbe _toolchainProbe = new();
    private readonly FfmpegRenderService _renderer = new();

    public string OperatorName { get; } = "Marcelo";
    public string TodayState { get; } = "Private Music OS";

    public string LibraryPath => _store.LibraryDirectory;

    [ObservableProperty]
    private string _projectName = "GateKPT clip system";

    [ObservableProperty]
    private string _platformProfile = "LinkedIn / 16:9";

    [ObservableProperty]
    private int _syncOffsetMs = 42;

    [ObservableProperty]
    private double _frameRate = 29.97;

    [ObservableProperty]
    private string _loudnessTarget = "-14 LUFS";

    [ObservableProperty]
    private string _businessMode = "Build video catalog";

    [ObservableProperty]
    private string _outputDirectory = "";

    [ObservableProperty]
    private ExportPreset _selectedExportPreset = null!;

    [ObservableProperty]
    private string _lastExportPath = "";

    [ObservableProperty]
    private string _videoPath = "";

    [ObservableProperty]
    private string _vocalPath = "";

    [ObservableProperty]
    private string _videoFileName = "No video selected";

    [ObservableProperty]
    private string _vocalFileName = "No final vocal selected";

    [ObservableProperty]
    private string _videoSize = "-";

    [ObservableProperty]
    private string _vocalSize = "-";

    [ObservableProperty]
    private string _syncRecommendation = "Paste media paths, then run analysis.";

    [ObservableProperty]
    private double _syncConfidence = 0.0;

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

    [ObservableProperty]
    private string _toolchainStatus = "Checking tools...";

    [ObservableProperty]
    private string _toolchainDetail = "";

    [ObservableProperty]
    private string _toolchainInstallHint = "";

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
        RefreshToolchainState();

        ExportPresets =
        [
            new("LinkedIn 16:9", "linkedin-16x9", 1920, 1080, "Clean landscape portfolio clip"),
            new("TikTok / Reels 9:16", "vertical-9x16", 1080, 1920, "Vertical short-form export"),
            new("YouTube 16:9", "youtube-16x9", 1920, 1080, "Full-quality YouTube upload"),
            new("Original frame", "original", 0, 0, "Keep source frame size"),
        ];
        _selectedExportPreset = ExportPresets[0];

        var project = _store.LoadProject();
        ProjectName = project.ProjectName;
        PlatformProfile = project.PlatformProfile;
        SyncOffsetMs = project.SyncOffsetMs;
        FrameRate = project.FrameRate;
        LoudnessTarget = project.LoudnessTarget;
        BusinessMode = project.BusinessMode;
        OutputDirectory = project.OutputDirectory;

        var storedCaptures = _store.LoadCaptures();
        RecentCaptures = new ObservableCollection<CaptureItem>(
            storedCaptures.Count > 0
                ? storedCaptures
                :
                [
                    new("Lip sync pass", "Camera track needs +42 ms offset against final vocal", "Today", "Sync"),
                    new("Noise cleanup", "Room hum around 120 Hz; gate before compression", "Mix", "Mix"),
                    new("Best phrase", "Take 03 has clean consonants on the hook", "Review", "Takes"),
                ]);
    }

    public IReadOnlyList<OsRoom> Rooms { get; }

    public IReadOnlyList<ExportPreset> ExportPresets { get; }

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

    public ObservableCollection<WaveformBar> Waveform { get; } =
        new(Enumerable.Range(0, 40).Select(i => new WaveformBar(i, 20 + (i % 7) * 8)));

    public string SelectedExportDescription => SelectedExportPreset?.Description ?? "";

    partial void OnSelectedExportPresetChanged(ExportPreset value)
    {
        PlatformProfile = value.Name;
        OnPropertyChanged(nameof(SelectedExportDescription));
    }

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

        _store.SaveCaptures(RecentCaptures);
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

    [RelayCommand]
    private void SaveLibrary()
    {
        _store.SaveCaptures(RecentCaptures);
        _store.SaveProject(CurrentProjectSettings());
        Status = $"Library saved to {LibraryPath}";
    }

    [RelayCommand]
    private void RefreshToolchain()
    {
        RefreshToolchainState();
        Status = ToolchainStatus;
    }

    [RelayCommand]
    private void AnalyzeMedia()
    {
        var result = _mediaAnalysis.Analyze(VideoPath, VocalPath, LibraryPath);
        VideoFileName = result.Video.Name;
        VocalFileName = result.Vocal.Name;
        VideoSize = result.Video.SizeLabel;
        VocalSize = result.Vocal.SizeLabel;
        SyncOffsetMs = result.SuggestedOffsetMs;
        SyncConfidence = result.Confidence;
        SyncRecommendation = result.Recommendation;

        Waveform.Clear();
        for (var i = 0; i < result.Waveform.Count; i++)
        {
            Waveform.Add(new WaveformBar(i, result.Waveform[i]));
        }

        RecentCaptures.Insert(0, new CaptureItem(
            "Media sync analysis",
            $"{result.Video.Name} + {result.Vocal.Name}. {result.Recommendation} Confidence {result.Confidence:P0}.",
            DateTime.Now.ToString("h:mm tt"),
            "Sync"));

        while (RecentCaptures.Count > 8)
        {
            RecentCaptures.RemoveAt(RecentCaptures.Count - 1);
        }

        _store.SaveCaptures(RecentCaptures);
        Status = "Media analysis complete";
    }

    [RelayCommand]
    private void NudgeOffset(int milliseconds)
    {
        SyncOffsetMs = Math.Clamp(SyncOffsetMs + milliseconds, -5_000, 5_000);
        Status = $"Offset nudged to {SyncOffsetMs:+#;-#;0} ms";
    }

    [RelayCommand]
    private void ResetOffset()
    {
        SyncOffsetMs = 0;
        Status = "Offset reset to 0 ms";
    }

    [RelayCommand]
    private void RenderReviewClip()
    {
        SaveLibrary();
        var result = _renderer.RenderReviewClip(VideoPath, VocalPath, SyncOffsetMs, OutputDirectory, SelectedExportPreset);
        if (result.Success)
        {
            LastExportPath = result.OutputPath ?? "";
            RecentCaptures.Insert(0, new CaptureItem(
                "Rendered review clip",
                $"{SelectedExportPreset.Name}: {LastExportPath}",
                DateTime.Now.ToString("h:mm tt"),
                "Export"));
            _store.SaveCaptures(RecentCaptures);
        }

        Status = result.Message;
    }

    private ProjectSettings CurrentProjectSettings() => new(
        ProjectName,
        PlatformProfile,
        SyncOffsetMs,
        FrameRate,
        LoudnessTarget,
        BusinessMode,
        OutputDirectory);

    private void RefreshToolchainState()
    {
        var toolchain = _toolchainProbe.Probe();
        ToolchainStatus = toolchain.Label;
        ToolchainDetail = toolchain.Detail;
        ToolchainInstallHint = toolchain.WindowsInstallHint;
    }
}

public sealed record OsRoom(string Name, string Description, string Number, string Accent);

public sealed record CaptureItem(string Title, string Detail, string Status, string Room);

public sealed record WaveformBar(int Index, int Height);
