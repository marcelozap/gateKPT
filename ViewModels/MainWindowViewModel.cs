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
    private readonly MediaMetadataService _metadata = new();
    private readonly ProductionBriefService _briefs = new();
    private readonly HardwareDeviceService _hardware = new();

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
    private AudioProcessingPreset _selectedAudioPreset = null!;

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
    private string _videoDuration = "-";

    [ObservableProperty]
    private string _vocalDuration = "-";

    [ObservableProperty]
    private string _videoTechnicalSummary = "Choose media to inspect.";

    [ObservableProperty]
    private string _vocalTechnicalSummary = "Choose media to inspect.";

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

    [ObservableProperty]
    private string _markerTimecode = "00:00.000";

    [ObservableProperty]
    private string _markerLabel = "Hook consonant";

    [ObservableProperty]
    private string _markerNotes = "";

    [ObservableProperty]
    private string _lastBriefPath = "";

    [ObservableProperty]
    private string _takeName = "Take 01";

    [ObservableProperty]
    private int _takeRating = 4;

    [ObservableProperty]
    private string _takeNotes = "Check lip sync, emotion, and consonants.";

    [ObservableProperty]
    private string _hardwareStatus = "Hardware not scanned yet.";

    [ObservableProperty]
    private string _preferredAudioInput = "";

    [ObservableProperty]
    private string _preferredAudioOutput = "";

    [ObservableProperty]
    private string _preferredMidiInput = "";

    [ObservableProperty]
    private string _preferredMidiOutput = "";

    [ObservableProperty]
    private string _routingNotes = "";

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
        AudioPresets = AudioProcessingPresetCatalog.Defaults;
        _selectedAudioPreset = AudioPresets[0];

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

        ExportQueue = new ObservableCollection<ExportQueueItem>(_store.LoadExportQueue());
        ExportHistory = new ObservableCollection<ExportHistoryItem>(_store.LoadExportHistory());
        TimelineMarkers = new ObservableCollection<TimelineMarker>(
            _store.LoadTimelineMarkers().Count > 0
                ? _store.LoadTimelineMarkers()
                :
                [
                    new("00:00.000", "Start", "Project opens on first usable visual frame", "Timeline"),
                    new("00:08.000", "Hook", "Check mouth shape against lead vocal", "Sync"),
                ]);
        TakeReviews = new ObservableCollection<TakeReviewItem>(
            _store.LoadTakeReviews().Count > 0
                ? _store.LoadTakeReviews()
                :
                [
                    new("Take 01", 4, "Promising; verify hook consonants before export.", DateTime.Now.ToString("yyyy-MM-dd")),
                ]);

        HardwareDevices = new ObservableCollection<HardwareDevice>();
        var hardwareRouting = _store.LoadHardwareRouting();
        PreferredAudioInput = hardwareRouting.PreferredAudioInput;
        PreferredAudioOutput = hardwareRouting.PreferredAudioOutput;
        PreferredMidiInput = hardwareRouting.PreferredMidiInput;
        PreferredMidiOutput = hardwareRouting.PreferredMidiOutput;
        RoutingNotes = hardwareRouting.RoutingNotes;
        ScanHardware();
    }

    public IReadOnlyList<OsRoom> Rooms { get; }

    public IReadOnlyList<ExportPreset> ExportPresets { get; }

    public IReadOnlyList<AudioProcessingPreset> AudioPresets { get; }

    public ObservableCollection<CaptureItem> RecentCaptures { get; }

    public ObservableCollection<ExportQueueItem> ExportQueue { get; }

    public ObservableCollection<ExportHistoryItem> ExportHistory { get; }

    public ObservableCollection<TimelineMarker> TimelineMarkers { get; }

    public ObservableCollection<TakeReviewItem> TakeReviews { get; }

    public ObservableCollection<HardwareDevice> HardwareDevices { get; }

    public string ExportQueueLabel => $"{ExportQueue.Count} queued";

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

    public string SelectedAudioPresetDescription => SelectedAudioPreset?.Description ?? "";

    partial void OnSelectedExportPresetChanged(ExportPreset value)
    {
        PlatformProfile = value.Name;
        OnPropertyChanged(nameof(SelectedExportDescription));
    }

    partial void OnSelectedAudioPresetChanged(AudioProcessingPreset value)
    {
        OnPropertyChanged(nameof(SelectedAudioPresetDescription));
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
        _store.SaveExportQueue(ExportQueue);
        _store.SaveExportHistory(ExportHistory);
        _store.SaveTimelineMarkers(TimelineMarkers);
        _store.SaveTakeReviews(TakeReviews);
        _store.SaveHardwareRouting(CurrentHardwareRouting());
        Status = $"Library saved to {LibraryPath}";
    }

    [RelayCommand]
    private void WriteProductionBrief()
    {
        SaveLibrary();
        LastBriefPath = _briefs.WriteBrief(
            LibraryPath,
            CurrentProjectSettings(),
            RecentCaptures,
            TimelineMarkers,
            TakeReviews,
            ExportQueue,
            ExportHistory);
        Status = $"Production brief written: {LastBriefPath}";
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
        InspectMedia();
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
    private void InspectMedia()
    {
        var video = _metadata.Inspect(VideoPath);
        var vocal = _metadata.Inspect(VocalPath);
        VideoFileName = video.FileName;
        VocalFileName = vocal.FileName;
        VideoSize = video.SizeLabel;
        VocalSize = vocal.SizeLabel;
        VideoDuration = video.Duration;
        VocalDuration = vocal.Duration;
        VideoTechnicalSummary = video.Summary;
        VocalTechnicalSummary = vocal.Summary;
        Status = "Media inspection complete";
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
        var result = _renderer.RenderReviewClip(VideoPath, VocalPath, SyncOffsetMs, OutputDirectory, SelectedExportPreset, SelectedAudioPreset);
        if (result.Success)
        {
            LastExportPath = result.OutputPath ?? "";
            AddExportHistory(SelectedExportPreset.Name, SelectedAudioPreset.Name, SyncOffsetMs, LastExportPath);
            RecentCaptures.Insert(0, new CaptureItem(
                "Rendered review clip",
                $"{SelectedExportPreset.Name}: {LastExportPath}",
                DateTime.Now.ToString("h:mm tt"),
                "Export"));
            _store.SaveCaptures(RecentCaptures);
            _store.SaveExportHistory(ExportHistory);
        }

        Status = result.Message;
    }

    [RelayCommand]
    private void QueueCurrentExport()
    {
        var missing = ValidateMediaSelection();
        if (missing is not null)
        {
            Status = missing;
            return;
        }

        ExportQueue.Insert(0, new ExportQueueItem(
            Guid.NewGuid().ToString("N"),
            DateTime.Now.ToString("yyyy-MM-dd h:mm tt"),
            VideoPath,
            VocalPath,
            SyncOffsetMs,
            SelectedExportPreset.Slug,
            SelectedExportPreset.Name,
            SelectedAudioPreset.Slug,
            SelectedAudioPreset.Name,
            "Queued",
            ""));
        _store.SaveExportQueue(ExportQueue);
        OnPropertyChanged(nameof(ExportQueueLabel));
        Status = $"Queued {SelectedExportPreset.Name} export.";
    }

    [RelayCommand]
    private void RenderNextQueuedExport()
    {
        var next = ExportQueue.FirstOrDefault(item => item.Status != "Rendered");
        if (next is null)
        {
            Status = "Export queue is empty.";
            return;
        }

        var preset = ExportPresets.FirstOrDefault(item => item.Slug == next.PresetSlug) ?? SelectedExportPreset;
        var audioPreset = AudioPresets.FirstOrDefault(item => item.Slug == next.AudioPresetSlug) ?? SelectedAudioPreset;
        var result = _renderer.RenderReviewClip(next.VideoPath, next.VocalPath, next.OffsetMs, OutputDirectory, preset, audioPreset);
        var index = ExportQueue.IndexOf(next);
        if (result.Success)
        {
            var output = result.OutputPath ?? "";
            ExportQueue[index] = next with { Status = "Rendered", OutputPath = output };
            LastExportPath = output;
            AddExportHistory(next.PresetName, next.AudioPresetName, next.OffsetMs, output);
            Status = result.Message;
        }
        else
        {
            ExportQueue[index] = next with { Status = "Blocked" };
            Status = result.Message;
        }

        _store.SaveExportQueue(ExportQueue);
        _store.SaveExportHistory(ExportHistory);
        OnPropertyChanged(nameof(ExportQueueLabel));
    }

    [RelayCommand]
    private void AddTimelineMarker()
    {
        var label = string.IsNullOrWhiteSpace(MarkerLabel) ? $"{SelectedRoom.Name} marker" : MarkerLabel.Trim();
        TimelineMarkers.Insert(0, new TimelineMarker(
            string.IsNullOrWhiteSpace(MarkerTimecode) ? "00:00.000" : MarkerTimecode.Trim(),
            label,
            MarkerNotes.Trim(),
            SelectedRoom.Name));
        while (TimelineMarkers.Count > 12)
        {
            TimelineMarkers.RemoveAt(TimelineMarkers.Count - 1);
        }

        _store.SaveTimelineMarkers(TimelineMarkers);
        MarkerNotes = "";
        Status = $"Added marker: {label}";
    }

    [RelayCommand]
    private void SaveTakeReview()
    {
        var name = string.IsNullOrWhiteSpace(TakeName) ? $"Take {TakeReviews.Count + 1:00}" : TakeName.Trim();
        var rating = Math.Clamp(TakeRating, 1, 5);
        TakeReviews.Insert(0, new TakeReviewItem(
            name,
            rating,
            string.IsNullOrWhiteSpace(TakeNotes) ? "No notes yet." : TakeNotes.Trim(),
            DateTime.Now.ToString("yyyy-MM-dd")));
        while (TakeReviews.Count > 20)
        {
            TakeReviews.RemoveAt(TakeReviews.Count - 1);
        }

        _store.SaveTakeReviews(TakeReviews);
        TakeName = $"Take {TakeReviews.Count + 1:00}";
        TakeNotes = "";
        Status = $"Saved take review: {name}";
    }

    [RelayCommand]
    private void ScanHardware()
    {
        var result = _hardware.Scan();
        HardwareDevices.Clear();
        foreach (var device in result.AudioInputs
                     .Concat(result.AudioOutputs)
                     .Concat(result.MidiInputs)
                     .Concat(result.MidiOutputs))
        {
            HardwareDevices.Add(device);
        }

        HardwareStatus = $"{result.Summary} {HardwareDevices.Count} active device path(s) found.";
        Status = HardwareStatus;
    }

    [RelayCommand]
    private void SaveHardwareRouting()
    {
        _store.SaveHardwareRouting(CurrentHardwareRouting());
        Status = "Saved Focusrite / RC-505 routing preferences.";
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

    private string? ValidateMediaSelection()
    {
        if (string.IsNullOrWhiteSpace(VideoPath))
        {
            return "Choose a camera video first.";
        }

        if (string.IsNullOrWhiteSpace(VocalPath))
        {
            return "Choose a final vocal/audio file first.";
        }

        return null;
    }

    private void AddExportHistory(string presetName, string audioPresetName, int offsetMs, string outputPath)
    {
        ExportHistory.Insert(0, new ExportHistoryItem(
            DateTime.Now.ToString("yyyy-MM-dd h:mm tt"),
            presetName,
            audioPresetName,
            $"{offsetMs:+#;-#;0} ms",
            outputPath));
        while (ExportHistory.Count > 20)
        {
            ExportHistory.RemoveAt(ExportHistory.Count - 1);
        }
    }

    private HardwareRoutingSettings CurrentHardwareRouting() => new(
        PreferredAudioInput,
        PreferredAudioOutput,
        PreferredMidiInput,
        PreferredMidiOutput,
        RoutingNotes);
}

public sealed record OsRoom(string Name, string Description, string Number, string Accent);

public sealed record CaptureItem(string Title, string Detail, string Status, string Room);

public sealed record WaveformBar(int Index, int Height);

public sealed record ExportQueueItem(
    string Id,
    string CreatedAt,
    string VideoPath,
    string VocalPath,
    int OffsetMs,
    string PresetSlug,
    string PresetName,
    string AudioPresetSlug,
    string AudioPresetName,
    string Status,
    string OutputPath);

public sealed record ExportHistoryItem(string RenderedAt, string PresetName, string AudioPresetName, string OffsetLabel, string OutputPath);

public sealed record TimelineMarker(string Timecode, string Label, string Notes, string Room);

public sealed record TakeReviewItem(string Name, int Rating, string Notes, string ReviewedAt);
