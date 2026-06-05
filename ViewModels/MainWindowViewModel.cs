using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Input.Platform;
using Avalonia.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using GateKPT.MusicOS.Models;
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
    private readonly LiveInputMeterService _meter = new();
    private readonly MixIntentService _mixIntent = new();
    private readonly CaptionDraftService _captionDrafts = new();
    private readonly CommandIntentService _commands = new();
    private readonly VisualPaintingExportService _visualPaintingExport = new();
    private readonly VisualRendererControlService _visualRendererControl = new();
    private readonly LayerRecordingService _layerRecorder = new();
    private readonly LayerMixdownService _layerMixdown = new();
    private readonly BuiltInLooperPlaybackService _looperPlayback = new();
    private readonly ClickTrackService _clickTrack = new();
    private readonly FocusriteDiagnosticService _focusrite = new();

    public string OperatorName { get; } = "Marcelo";
    public string TodayState { get; } = "Private Music OS";

    public string LibraryPath => _store.LibraryDirectory;

    public string ProjectFilePath => _store.ProjectFileLocation;

    public string ProjectMemoryTitle => ProjectName;

    public string ProjectMemoryArtist => OperatorName;

    public string ProjectMemoryBpm => Tempo;

    public string ProjectMemoryKey => KeyCenter;

    public string ProjectMemoryStatusLabel => BusinessMode;

    public string ProjectMemoryPlatform => PlatformProfile;

    public string ProjectMemoryLoudness => LoudnessTarget;

    public string ProjectMemoryModifiedAt => System.IO.File.Exists(ProjectFilePath)
        ? System.IO.File.GetLastWriteTime(ProjectFilePath).ToString("yyyy-MM-dd h:mm tt")
        : "Not saved yet";

    public int ProjectMemoryCaptureCount => RecentCaptures.Count;

    public int ProjectMemoryLyricCount => LyricIdeas.Count;

    public int ProjectMemoryTakeCount => TakeReviews.Count;

    public int ProjectMemoryCaptionCount => Captions.Count;

    public int ProjectMemoryVisualPresetCount => 1;

    public int ProjectMemoryRoutingNoteCount => string.IsNullOrWhiteSpace(RoutingNotes) ? 0 : 1;

    public int ProjectMemoryExportTaskCount => ExportQueue.Count;

    public string ProjectMemoryFilePreview => ProjectFilePath;

    public IReadOnlyList<string> ProjectMemoryTimelineFilters { get; } =
    [
        "All",
        "Captures",
        "Lyrics",
        "Takes",
        "Captions",
        "Rig",
        "Exports",
        "Done",
    ];

    public IReadOnlyList<ProjectMemoryTimelineItem> ProjectMemoryTimeline =>
        BuildProjectMemoryTimeline()
            .Where(item => SelectedProjectMemoryTimelineFilter == "All" || item.Filter == SelectedProjectMemoryTimelineFilter)
            .Take(8)
            .ToList();

    [ObservableProperty]
    private string _projectName = "Night Session";

    [ObservableProperty]
    private string _platformProfile = "LinkedIn / 16:9";

    [ObservableProperty]
    private int _syncOffsetMs = 42;

    [ObservableProperty]
    private double _frameRate = 29.97;

    [ObservableProperty]
    private string _loudnessTarget = "-14 LUFS";

    [ObservableProperty]
    private string _businessMode = "Covers, field notes, visuals, and pressure takes";

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
    private string _takeDecision = "Fix";

    [ObservableProperty]
    private string _takeNextAction = "Tighten timing, then review again.";

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

    [ObservableProperty]
    private double _inputMeterLevel = 0;

    [ObservableProperty]
    private string _inputMeterLabel = "Meter idle";

    [ObservableProperty]
    private SongStage _selectedSongStage = null!;

    [ObservableProperty]
    private string _songStageNotes = "";

    [ObservableProperty]
    private string _tempo = "120 BPM";

    [ObservableProperty]
    private string _keyCenter = "TBD";

    [ObservableProperty]
    private string _mixPrompt = "make it tighter and warmer";

    [ObservableProperty]
    private string _mixRecommendation = "";

    [ObservableProperty]
    private string _mixChain = "";

    [ObservableProperty]
    private InstrumentChannelItem? _selectedInstrumentChannel;

    [ObservableProperty]
    private string _instrumentTonePrompt = "make drums warmer and punchier";

    [ObservableProperty]
    private string _instrumentInputNote = "RC-505 mixed output / Focusrite input";

    [ObservableProperty]
    private double _instrumentWarmth = 55;

    [ObservableProperty]
    private double _instrumentSpace = 34;

    [ObservableProperty]
    private double _instrumentEnergy = 55;

    [ObservableProperty]
    private string _instrumentChannelResult = "Select an instrument lane, describe the sound, then apply it to the current layer.";

    [ObservableProperty]
    private LooperTrackItem? _selectedLooperTrack;

    [ObservableProperty]
    private double _selectedLooperTrackVolume = 80;

    [ObservableProperty]
    private string _selectedLooperMode = "Record";

    [ObservableProperty]
    private string _looperEngineStatus = "Built-in looper alpha ready. Arm a track, record from Focusrite/RC-505, then play it as a loop.";

    [ObservableProperty]
    private int _looperBpm = 120;

    [ObservableProperty]
    private int _looperCountInBeats = 4;

    [ObservableProperty]
    private int _looperBars = 4;

    [ObservableProperty]
    private string _looperTransportStatus = "Transport idle.";

    [ObservableProperty]
    private string _worldMemoryType = "Phrase";

    [ObservableProperty]
    private string _worldMemoryLanguage = "";

    [ObservableProperty]
    private string _worldMemoryPhrase = "";

    [ObservableProperty]
    private string _worldMemoryMeaning = "";

    [ObservableProperty]
    private string _worldMemoryPlace = "";

    [ObservableProperty]
    private string _worldMemoryPerson = "";

    [ObservableProperty]
    private string _worldMemoryFood = "";

    [ObservableProperty]
    private string _worldMemoryRhythm = "";

    [ObservableProperty]
    private string _worldMemorySongIdea = "";

    [ObservableProperty]
    private string _worldMemoryNotes = "";

    [ObservableProperty]
    private string _contentFormat = "After Work Hook #001";

    [ObservableProperty]
    private string _contentPlatform = "Snapchat / TikTok / Reels / YouTube Shorts";

    [ObservableProperty]
    private string _contentSetting = "orange glow / night road";

    [ObservableProperty]
    private string _contentSong = "hook";

    [ObservableProperty]
    private string _contentHook = "building Florida night pop after work";

    [ObservableProperty]
    private string _contentCaption = "Building Florida night pop after work.";

    [ObservableProperty]
    private string _contentVisualDirection = "Face visible, orange glow, black shirt, guitar/voice close, waveform terrain.";

    [ObservableProperty]
    private string _contentNextAction = "Record rough, keep the charm, use light preset, export clip, post/archive.";

    [ObservableProperty]
    private string _contentSeries = "Florida Night Pop/R&B";

    [ObservableProperty]
    private string _contentPlanStatus = "Start with one hook, one field sound, one visual, one post.";

    [ObservableProperty]
    private string _contentMission = "After Work Hook";

    [ObservableProperty]
    private string _contentTone = "playful, romantic, humble, smart, noble";

    [ObservableProperty]
    private string _contentPreset = "Raw Clean first, polish only if it helps";

    [ObservableProperty]
    private string _contentReviewNote = "What felt natural? What got a real response?";

    [ObservableProperty]
    private string _contentLanguage = "English with Spanish color";

    [ObservableProperty]
    private string _contentTerrain = "room / car / night road";

    [ObservableProperty]
    private string _contentPillar = "Process / Original Hook";

    [ObservableProperty]
    private string _contentHashtags = "#FloridaNightPop #FloridaNightRNB #LateNightFlorida #AfterWorkHook #GateKPT #BedroomPop #IndieRNB";

    [ObservableProperty]
    private string _contentCta = "Raw or polished?";

    [ObservableProperty]
    private string _contentPostStatus = "Staged";

    [ObservableProperty]
    private string _focusriteTestStatus = "Focusrite test not run yet.";

    [ObservableProperty]
    private string _lastFocusriteTestPath = "";

    [ObservableProperty]
    private double _focusritePeakPercent = 0;

    [ObservableProperty]
    private string _focusriteCalibrationSignal = "Run the 3-second input test. Target peak: 35-75%.";

    [ObservableProperty]
    private bool _focusriteReadyForRecording = false;

    [ObservableProperty]
    private bool _simpleRecordingActive = false;

    [ObservableProperty]
    private string _simpleRecordingStatus = "Not recording. First prove Scarlett signal, then record one short pass.";

    [ObservableProperty]
    private string _lyricTitle = "Untitled hook";

    [ObservableProperty]
    private string _lyricMood = "raw";

    [ObservableProperty]
    private string _lyricTags = "hook, idea";

    [ObservableProperty]
    private string _lyricText = "";

    [ObservableProperty]
    private string _visualizerMode = "Lyric Pulse";

    [ObservableProperty]
    private string _visualizerPalette = "Amber / seafoam";

    [ObservableProperty]
    private string _visualizerMotion = "Breathing waveform";

    [ObservableProperty]
    private string _visualizerLyricSource = "Latest lyric";

    [ObservableProperty]
    private double _visualizerIntensity = 64;

    [ObservableProperty]
    private string _visualizerNotes = "Use live input energy, song stage color, and lyric fragments.";

    [ObservableProperty]
    private string _visualizerQualityMode = "Balanced";

    [ObservableProperty]
    private string _visualizerOutputTarget = "Projector";

    [ObservableProperty]
    private string _visualizerRendererPath = "2D Avalonia preview";

    [ObservableProperty]
    private bool _projectorBlackout = false;

    [ObservableProperty]
    private bool _dawSafeMode = true;

    [ObservableProperty]
    private bool _visualizerAlwaysOn = true;

    [ObservableProperty]
    private bool _visualizerRevealMode = false;

    [ObservableProperty]
    private double _visualPulseSize = 144;

    [ObservableProperty]
    private double _visualBloomSize = 220;

    [ObservableProperty]
    private double _visualStrokeLevel = 34;

    [ObservableProperty]
    private string _visualPaintingStatus = "Visualizer is ready. Start art feed to let the RC-505/Focusrite signal paint.";

    [ObservableProperty]
    private string _visualPaintingSignature = "No section stamped yet.";

    [ObservableProperty]
    private int _visualPaintingStamps = 0;

    [ObservableProperty]
    private int _captionBeats = 3;

    [ObservableProperty]
    private string _captionSource = "Latest lyric";

    [ObservableProperty]
    private string _captionStatus = "No captions drafted yet.";

    [ObservableProperty]
    private string _commandText = "add captions but only if timing is safe";

    [ObservableProperty]
    private string _commandResponse = "Command chat ready. Safe actions draft or queue instead of destructive changes.";

    [ObservableProperty]
    private string _layerInstrument = "Drums";

    [ObservableProperty]
    private string _layerBeatTarget = "Beat 1 / downbeat";

    [ObservableProperty]
    private string _layerEffectIntent = "Tight drums";

    [ObservableProperty]
    private string _layerNotes = "Lock the groove before adding harmony.";

    [ObservableProperty]
    private int _layerCountInBeats = 4;

    [ObservableProperty]
    private string _layerRecordingStatus = "Recorder idle. Prime a layer, then arm recording.";

    [ObservableProperty]
    private string _looperTestIssue = "Not tested yet";

    [ObservableProperty]
    private string _looperTestNotes = "After the first drum test, write what happened: signal, timing, playback, volume, latency.";

    [ObservableProperty]
    private string _activeStemPath = "";

    [ObservableProperty]
    private string _lastStemDuration = "00:00";

    [ObservableProperty]
    private string _lastAutosavePath = "";

    [ObservableProperty]
    private AutosaveFileItem? _selectedAutosaveFile;

    [ObservableProperty]
    private string _songSection = "Intro";

    [ObservableProperty]
    private string _rc505MemorySlot = "Memory 01";

    [ObservableProperty]
    private string _performanceCueNotes = "RC-505: lay drums first, overdub guitar/piano pockets, then sing the hook.";

    [ObservableProperty]
    private int _performancePassCount = 1;

    [ObservableProperty]
    private string _projectMemoryStatus = "Project memory ready.";

    [ObservableProperty]
    private MusicOsModule? _selectedProjectModule;

    [ObservableProperty]
    private ProjectMemoryTimelineItem? _selectedProjectMemoryTimelineItem;

    [ObservableProperty]
    private string _selectedProjectMemoryTimelineFilter = "All";

    [ObservableProperty]
    private ProjectMemoryTimelineItem? _pinnedProjectMemoryItem;

    public MainWindowViewModel()
    {
        Rooms =
        [
            new("Performance / Reveal", "Turn the take into night terrain", "00", "#E8E1D2"),
            new("Song Builder", "Drums -> guitar -> vocal, one layer at a time", "01", "#D08A56"),
            new("Lyric Vault", "Hooks, Spanglish lines, and pressure notes", "02", "#EABF7A"),
            new("Caption Engine", "Short captions for covers and field clips", "03", "#6FB6A6"),
            new("Visual Room", "Moon, roads, lakes, storms, and waveform terrain", "04", "#D9C5A5"),
            new("Rig Routing", "Focusrite, RC-505, controller, and live input memory", "05", "#F2EADC"),
            new("Export Memory", "Clips, demos, archives, and drops coming soon", "06", "#9DBFB3"),
            new("World Memory", "Field recordings, places, phrases, and song seeds", "07", "#8DB7AD"),
            new("Content Lab", "Turn one take into the next audience touch", "08", "#C6A96D"),
        ];

        _selectedRoom = Rooms.First(room => room.Name == "Song Builder");
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
        ProjectName = project.ProjectName == "GateKPT clip system"
            || project.ProjectName == "GateKPT MusicOS"
            || project.ProjectName.Contains("Late Night", StringComparison.OrdinalIgnoreCase)
            ? "Night Session"
            : project.ProjectName;
        PlatformProfile = project.PlatformProfile;
        SyncOffsetMs = project.SyncOffsetMs;
        FrameRate = project.FrameRate;
        LoudnessTarget = project.LoudnessTarget;
        BusinessMode = project.BusinessMode == "Build video catalog"
            || project.BusinessMode == "Creative audio workspace"
            || project.BusinessMode.Contains("Central", StringComparison.OrdinalIgnoreCase)
            || project.BusinessMode.Contains("training", StringComparison.OrdinalIgnoreCase)
            ? "Covers, field notes, visuals, and pressure takes"
            : project.BusinessMode;
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
        CompletionHistory = new ObservableCollection<ProjectCompletionRecord>(_store.LoadCompletionHistory());
        var storedWorldMemories = _store.LoadWorldMemory();
        WorldMemories = new ObservableCollection<WorldMemoryItem>(
            storedWorldMemories.Count > 0
                ? storedWorldMemories
                :
                [
                    new(
                        DateTime.Now.ToString("yyyy-MM-dd"),
                        "Field note",
                        "",
                        "",
                        "",
                        "Night road",
                        "",
                        "Motel neon",
                        "Rain / insects / guitar",
                        "Turn a real place into a hook.",
                        "The night starts here.")
                ]);

        ContentPlanItems =
        [
            new("01", "The Cover", "20-60 seconds of singing. Main discovery content.", "Strongest line first."),
            new("02", "The Process", "Warmup, mistakes, GateKPT screen, raw vs preset.", "Let people see it being built."),
            new("03", "The World", "Night roads, orange glow, trails, rain, car notes, gym recovery.", "Sound needs a place."),
            new("04", "The Look", "Black/orange/chrome palette, face visible, clean frame.", "No messy background."),
            new("05", "The Build", "XIV/GateKPT as the personal music OS.", "Use lightly, not too nerdy."),
        ];

        ArtistSessions = new ObservableCollection<ArtistSessionItem>(_store.LoadArtistSessions());

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

        SongStages = SongWorkflowCatalog.DefaultStages;
        var songWorkflow = _store.LoadSongWorkflow();
        _selectedSongStage = SongStages.FirstOrDefault(stage => stage.Name == songWorkflow.ActiveStageName) ?? SongStages[0];
        SongStageNotes = songWorkflow.StageNotes;
        Tempo = songWorkflow.Tempo;
        KeyCenter = songWorkflow.KeyCenter;
        MixPrompt = songWorkflow.MixPrompt;
        MixRecommendation = songWorkflow.MixRecommendation;
        MixChain = songWorkflow.MixChain;

        LyricIdeas = new ObservableCollection<LyricIdeaItem>(
            _store.LoadLyricIdeas().Count > 0
                ? _store.LoadLyricIdeas()
                :
                [
                    new("First hook", "Vocals", "raw", "hook, draft", "Write the first line before judging it.", DateTime.Now.ToString("yyyy-MM-dd")),
                ]);

        var visualizer = _store.LoadVisualizer();
        VisualizerMode = visualizer.Mode;
        VisualizerPalette = visualizer.Palette;
        VisualizerMotion = visualizer.Motion;
        VisualizerLyricSource = visualizer.LyricSource;
        VisualizerIntensity = visualizer.Intensity;
        VisualizerNotes = visualizer.Notes;
        VisualizerQualityMode = visualizer.QualityMode;
        VisualizerOutputTarget = visualizer.OutputTarget;
        VisualizerRendererPath = visualizer.RendererPath;
        ProjectorBlackout = visualizer.ProjectorBlackout;
        DawSafeMode = visualizer.DawSafeMode;

        Captions = new ObservableCollection<CaptionLine>(_store.LoadCaptions());
        PerformanceLayers = new ObservableCollection<PerformanceLayerItem>(_store.LoadPerformanceLayers());
        InstrumentChannels = new ObservableCollection<InstrumentChannelItem>(
            _store.LoadInstrumentChannels().Count > 0
                ? _store.LoadInstrumentChannels()
                : DefaultInstrumentChannels());
        SelectedInstrumentChannel = InstrumentChannels.FirstOrDefault();
        LooperTracks = new ObservableCollection<LooperTrackItem>(
            _store.LoadLooperTracks().Count > 0
                ? _store.LoadLooperTracks()
                : DefaultLooperTracks());
        SelectedLooperTrack = LooperTracks.FirstOrDefault();
        ProjectModules = [];
        var pinnedMemory = _store.LoadPinnedProjectMemory();
        if (pinnedMemory is not null)
        {
            PinnedProjectMemoryItem = new ProjectMemoryTimelineItem(
                pinnedMemory.When,
                pinnedMemory.Room,
                pinnedMemory.TargetRoom,
                pinnedMemory.Filter,
                pinnedMemory.Title,
                pinnedMemory.Detail,
                pinnedMemory.Accent);
        }
        UpdateCaptionStatus();
        RefreshProjectModules();
        RefreshAutosaveFiles();
    }

    public IReadOnlyList<OsRoom> Rooms { get; }

    public IReadOnlyList<ExportPreset> ExportPresets { get; }

    public IReadOnlyList<AudioProcessingPreset> AudioPresets { get; }

    public ObservableCollection<CaptureItem> RecentCaptures { get; }

    public ObservableCollection<ProjectCompletionRecord> CompletionHistory { get; }

    public ObservableCollection<WorldMemoryItem> WorldMemories { get; }

    public ObservableCollection<ArtistSessionItem> ArtistSessions { get; }

    public ObservableCollection<ExportQueueItem> ExportQueue { get; }

    public ObservableCollection<ExportHistoryItem> ExportHistory { get; }

    public ObservableCollection<TimelineMarker> TimelineMarkers { get; }

    public ObservableCollection<TakeReviewItem> TakeReviews { get; }

    public ObservableCollection<HardwareDevice> HardwareDevices { get; }

    public IReadOnlyList<SongStage> SongStages { get; }

    public ObservableCollection<LyricIdeaItem> LyricIdeas { get; }

    public ObservableCollection<CaptionLine> Captions { get; }

    public ObservableCollection<PerformanceLayerItem> PerformanceLayers { get; }

    public ObservableCollection<InstrumentChannelItem> InstrumentChannels { get; }

    public ObservableCollection<LooperTrackItem> LooperTracks { get; }

    public ObservableCollection<AutosaveFileItem> AutosaveFiles { get; } = [];

    public ObservableCollection<MusicOsModule> ProjectModules { get; }

    public IReadOnlyList<string> LooperModes { get; } =
    [
        "Record",
        "Overdub",
        "Replace",
    ];

    public IReadOnlyList<string> VisualizerModes { get; } =
    [
        "Lyric Pulse",
        "Waveform Tunnel",
        "Stage Aura",
        "Camera Overlay",
        "Minimal Performance",
    ];

    public IReadOnlyList<string> VisualizerPalettes { get; } =
    [
        "Amber / seafoam",
        "Black / ivory",
        "Neon rehearsal",
        "Blue hour",
        "Red room",
    ];

    public IReadOnlyList<string> VisualizerMotions { get; } =
    [
        "Breathing waveform",
        "Kick pulse",
        "Lyric type-on",
        "Slow orbit",
        "Hard cuts",
    ];

    public IReadOnlyList<string> VisualizerQualityModes { get; } =
    [
        "Eco",
        "Balanced",
        "Ultra",
    ];

    public IReadOnlyList<string> VisualizerOutputTargets { get; } =
    [
        "Projector",
        "OBS",
        "NDI future",
        "Recording preview",
    ];

    public IReadOnlyList<string> VisualizerRendererPaths { get; } =
    [
        "2D Avalonia preview",
        "2D Skia performance",
        "3D standalone engine",
        "Hybrid projector pipeline",
    ];

    public IReadOnlyList<string> LayerInstruments { get; } =
    [
        "Drums",
        "Guitar",
        "Piano",
        "Vocal",
        "Harmony",
        "Texture",
    ];

    public IReadOnlyList<string> LayerBeatTargets { get; } =
    [
        "Beat 1 / downbeat",
        "Beat 2 pocket",
        "Beat 3 answer",
        "Beat 4 pickup",
        "Off-beat push",
        "Chorus pickup",
        "Free time",
    ];

    public IReadOnlyList<string> LayerEffectIntents { get; } =
    [
        "Tight drums",
        "Warm guitar",
        "Soft piano",
        "Lead vocal",
        "Harmony lift",
        "Space / reverb",
        "Delay throw",
        "Lo-fi texture",
    ];

    public IReadOnlyList<string> LooperTestIssues { get; } =
    [
        "Not tested yet",
        "Worked",
        "No input signal",
        "Too quiet",
        "Clipping",
        "Recording failed",
        "Playback failed",
        "Timing late",
        "Timing early",
        "Count-in confusing",
        "Volume wrong",
    ];

    public IReadOnlyList<string> SongSections { get; } =
    [
        "Intro",
        "Verse",
        "Pre",
        "Hook",
        "Bridge",
        "Outro",
    ];

    public string ExportQueueLabel => $"{ExportQueue.Count} queued";

    public string ActiveRoom => $"{SelectedRoom.Name} Room";

    public string DashboardSignal =>
        PinnedProjectMemoryItem is not null
            ? $"Pinned: {PinnedProjectMemoryItem.TargetRoom} / {PinnedProjectMemoryItem.Title}"
            : $"{ProjectName} / {SelectedSongStage?.Name ?? "Stage"} / {LyricIdeas.Count} lyric idea(s) / {ExportQueue.Count} export task(s)";

    public string NextCreativeAction
    {
        get
        {
            if (PinnedProjectMemoryItem is not null)
            {
                return $"Finish pinned memory: {PinnedProjectMemoryItem.Title} - {PinnedProjectMemoryItem.Detail}";
            }

            if (LyricIdeas.Count == 0)
            {
                return "Capture one hook before opening the studio maze.";
            }

            if (Captions.Count == 0)
            {
                return "Draft captions from the latest lyric before the next video pass.";
            }

            if (ExportQueue.Any(item => item.Status != "Rendered"))
            {
                return "Render or resolve the next queued export.";
            }

            return $"Advance {SelectedSongStage?.Name ?? "the song"}: write the next note, take, or visual cue.";
        }
    }

    public string ProjectHealthSignal
    {
        get
        {
            var ready = 0;
            ready += LyricIdeas.Count > 0 ? 1 : 0;
            ready += TakeReviews.Count > 0 ? 1 : 0;
            ready += Captions.Count > 0 ? 1 : 0;
            ready += !string.IsNullOrWhiteSpace(VisualizerMode) ? 1 : 0;
            ready += !string.IsNullOrWhiteSpace(RoutingNotes) ? 1 : 0;
            ready += ExportQueue.Count > 0 || ExportHistory.Count > 0 ? 1 : 0;

            var label = ready switch
            {
                <= 2 => "Sketch",
                <= 4 => "Session",
                _ => "Export-ready"
            };

            return $"{label} / {ready}/6 modules carrying memory";
        }
    }

    public string ProjectHealthDetail =>
        $"Loops {RecordedLooperTrackCount}/5 / Layers {PerformanceLayers.Count} / Lyrics {LyricIdeas.Count} / Takes {TakeReviews.Count} / Captions {Captions.Count} / Exports {ExportQueue.Count + ExportHistory.Count}";

    public string ProjectMemorySummary =>
        $"{OperatorName} / {Tempo} / {KeyCenter} / {BusinessMode} / {PlatformProfile} / {LoudnessTarget}";

    public string ProjectMemoryCounts =>
        $"Captures {RecentCaptures.Count} / Loops {RecordedLooperTrackCount}/5 / Layers {PerformanceLayers.Count} / Lyrics {LyricIdeas.Count} / Takes {TakeReviews.Count} / Captions {Captions.Count} / Visuals 1 / Routing 1 / Exports {ExportQueue.Count + ExportHistory.Count}";

    public string ProjectMemoryModified => $"Modified {DateTime.Now:yyyy-MM-dd h:mm tt}";

    public int ProjectMemoryFinishedTodayCount =>
        CompletionHistory.Count(item => IsSameLocalDate(item.CompletedAt, DateTime.Today));

    public int ProjectMemoryFinishedWeekCount =>
        CompletionHistory.Count(item => IsOnOrAfterLocalDate(item.CompletedAt, DateTime.Today.AddDays(-6)));

    public string ProjectMemoryCompletionStreak
    {
        get
        {
            var streak = 0;
            for (var day = DateTime.Today; ; day = day.AddDays(-1))
            {
                if (!CompletionHistory.Any(item => IsSameLocalDate(item.CompletedAt, day)))
                {
                    break;
                }

                streak++;
            }

            return streak == 0 ? "No active completion streak" : $"{streak} day completion streak";
        }
    }

    public string ProjectMemoryMomentum =>
        ProjectMemoryFinishedTodayCount == 0
            ? "No completed pinned actions yet. Pin one memory item and finish it."
            : $"{ProjectMemoryFinishedTodayCount} finished today / {ProjectMemoryFinishedWeekCount} this week / {ProjectMemoryCompletionStreak}.";

    public int SessionScore
    {
        get
        {
            var score = 0;
            score += ProjectMemoryFinishedTodayCount * 34;
            score += TodayCaptureCount * 13;
            score += TodayLyricCount * 21;
            score += TodayCaptionCount * 13;
            score += TodayRenderedExportCount * 34;
            return Math.Min(score, 100);
        }
    }

    public string SessionScoreLabel => SessionScore switch
    {
        >= 89 => "Release energy",
        >= 55 => "Strong session",
        >= 34 => "Momentum building",
        >= 13 => "Spark caught",
        _ => "Warm up",
    };

    public string SessionScoreDetail =>
        $"Done {ProjectMemoryFinishedTodayCount} / Captures {TodayCaptureCount} / Lyrics {TodayLyricCount} / Captions {TodayCaptionCount} / Renders {TodayRenderedExportCount}";

    public string TodaysCreativeBrief
    {
        get
        {
            var latestCapture = RecentCaptures.FirstOrDefault();
            var captureLine = latestCapture is null
                ? "No capture in memory yet."
                : $"Latest capture: {latestCapture.Title} ({latestCapture.Room}).";
            var priority = PinnedProjectMemoryItem is null
                ? NextCreativeAction
                : $"Pinned priority: {PinnedProjectMemoryItem.TargetRoom} - {PinnedProjectMemoryItem.Title}.";
            return $"{SessionScoreLabel}: {priority} {captureLine} Work inside {SelectedRoom.Name}.";
        }
    }

    public string SessionRailPinnedPriority =>
        PinnedProjectMemoryItem is null
            ? "No pin set. Start a room pass or prime the next gap."
            : $"{PinnedProjectMemoryItem.TargetRoom}: {PinnedProjectMemoryItem.Title}";

    public string SessionRailPinnedDetail =>
        PinnedProjectMemoryItem is null
            ? "A pin is the creative rail: one active promise, no maze."
            : PinnedProjectMemoryItem.Detail;

    public string SessionRailLatestCapture
    {
        get
        {
            var latest = RecentCaptures.FirstOrDefault();
            return latest is null
                ? "Latest capture: nothing saved yet today."
                : $"Latest capture: {latest.Title} / {latest.Room} / {latest.Status}";
        }
    }

    public string SessionRailGap
    {
        get
        {
            var gap = MissingProjectPieces().FirstOrDefault();
            return gap is null
                ? "Export gate: no obvious missing module. Render, review, archive, or start the next version."
                : $"Next gap before export: {gap.Label} in {gap.ModuleName}.";
        }
    }

    public string SessionRailRoomStatus =>
        $"{SelectedRoom.Name} pass / {ProjectMemoryFinishedTodayCount} completed today / {SessionScoreLabel}";

    public string SessionRailEnergy =>
        $"{SessionScoreLabel.ToUpperInvariant()} / score {SessionScore} / {ProjectMemoryMomentum}";

    public IReadOnlyList<string> ExportReadinessChecklist
    {
        get
        {
            var gaps = MissingProjectPieces().Select(item => item.Label).ToHashSet();
            return
            [
                gaps.Contains("drums") ? "Drum loop missing" : "Drum foundation captured",
                gaps.Contains("harmony") ? "Guitar/piano bed missing" : "Harmony bed captured",
                gaps.Contains("vocal") ? "Vocal lane missing" : "Vocal lane captured",
                gaps.Contains("lyric") ? "Lyric missing" : "Lyric captured",
                gaps.Contains("take") ? "Take decision missing" : "Take reviewed",
                gaps.Contains("captions") ? "Captions missing" : "Captions drafted",
                gaps.Contains("routing") ? "Rig routing note missing" : "Rig routing saved",
                gaps.Contains("export") ? "Export task missing" : "Export path active",
            ];
        }
    }

    public IReadOnlyList<string> SessionLaunchChecklist
    {
        get
        {
            var priority = PinnedProjectMemoryItem is null
                ? NextCreativeAction
                : $"Finish pinned priority: {PinnedProjectMemoryItem.Title}";
            var roomStep = SelectedRoom.Name switch
            {
                "Song Builder" => $"Set BPM/key: {Tempo} / {KeyCenter}. Capture drums first, then harmony, then vocal.",
                "Lyric Vault" => "Open lyric vault. Pick one hook/title and write the next eight usable lines.",
                "Caption Engine" => "Choose the clip. Sync captions to mouth movement and leave space on beat three.",
                "Visual Room" => "Pick projector mood, palette, and blackout key before recording a live pass.",
                "Rig Routing" => "Confirm Focusrite input, RC-505 loop path, monitor level, and recording destination.",
                _ => $"Confirm export target: {PlatformProfile}, {LoudnessTarget}. Render one review file before polish.",
            };

            return
            [
                priority,
                roomStep,
                "Record or save one concrete artifact before switching rooms.",
                "If the take feels messy, capture the note instead of restarting the whole session.",
            ];
        }
    }

    private int TodayCaptureCount => RecentCaptures.Count(item => IsTodayStatus(item.Status));

    private int TodayLyricCount => LyricIdeas.Count(item => IsSameLocalDate(item.CreatedAt, DateTime.Today));

    private int TodayCaptionCount => Captions.Count > 0 ? 1 : 0;

    private int TodayRenderedExportCount => ExportHistory.Count(item => IsSameLocalDate(item.RenderedAt, DateTime.Today));

    private int RecordedLooperTrackCount => LooperTracks.Count(track => !string.IsNullOrWhiteSpace(track.StemPath));

    public string ProjectHealthBlockers
    {
        get
        {
            var missing = MissingProjectPieces().Select(item => item.Label).ToList();

            return missing.Count == 0
                ? "No obvious gaps. Render, post, archive, or start the next version."
                : $"Missing next: {string.Join(", ", missing.Take(3))}";
        }
    }

    public string PrimeGapLabel
    {
        get
        {
            var gap = MissingProjectPieces().FirstOrDefault();
            return gap is null ? "Prime next version" : $"Prime {gap.Label}";
        }
    }

    public string CaptureHint => SelectedRoom.Name switch
    {
        "Song Builder" => "Tempo, groove, harmony, vocal target, section, next take...",
        "Lyric Vault" => "Hook, title, theme, phrase, rhyme bank, line that keeps returning...",
        "Caption Engine" => "Caption timing, beat spacing, dense line warning, clip association...",
        "Visual Room" => "Mode, palette, motion, projector target, live visual cue...",
        "Rig Routing" => "Focusrite, RC-505, mic, monitoring, MIDI, OBS/projector notes...",
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

    public IReadOnlyList<string> TakeDecisions { get; } =
    [
        "Keep",
        "Fix",
        "Re-record",
        "Export",
    ];

    public string TakeDecisionSignal
    {
        get
        {
            if (TakeReviews.Count == 0)
            {
                return "No takes judged yet. Save the first decision after recording.";
            }

            var keep = TakeReviews.Count(item => item.Decision == "Keep");
            var fix = TakeReviews.Count(item => item.Decision == "Fix");
            var redo = TakeReviews.Count(item => item.Decision == "Re-record");
            var export = TakeReviews.Count(item => item.Decision == "Export");
            return $"Decisions: {keep} keep / {fix} fix / {redo} re-record / {export} export.";
        }
    }

    public string TakeDecisionGuidance => TakeDecision switch
    {
        "Keep" => "Keep means the take has usable emotion. Save the reason so future you trusts it.",
        "Fix" => "Fix means the take is close. Write the exact repair: timing, pitch, caption, mix, or sync.",
        "Re-record" => "Re-record means no polishing spiral. Name what failed and capture the next attempt.",
        "Export" => "Export means ready for output. If media files are selected, GateKPT will queue the export.",
        _ => "Choose the next concrete move for this take.",
    };

    public IReadOnlyList<string> Ritual { get; } =
    [
        "Import camera video and reference audio",
        "Detect clap/transient or mouth-open sync point",
        "Nudge final vocal until consonants match lips",
        "Export one clean review clip before moving on",
    ];

    public IReadOnlyList<string> NextBuild { get; } =
    [
        "Song Builder",
        "Lyric Vault",
        "Caption Engine",
        "Visual Room",
        "Rig Routing",
        "Export Memory",
    ];

    public ObservableCollection<WaveformBar> Waveform { get; } =
        new(Enumerable.Range(0, 40).Select(i => new WaveformBar(i, 20 + (i % 7) * 8)));

    public string SelectedExportDescription => SelectedExportPreset?.Description ?? "";

    public string SelectedAudioPresetDescription => SelectedAudioPreset?.Description ?? "";

    public string SelectedSongStageGoal => SelectedSongStage?.Goal ?? "";

    public string SelectedSongStageRouting => SelectedSongStage?.Routing ?? "";

    public string VisualizerPreviewTitle => $"{VisualizerMode} - {SelectedSongStage?.Name ?? "Stage"}";

    public string VisualizerPreviewDetail =>
        ProjectorBlackout
            ? "Projector blackout is armed. Visual output should go black immediately."
            : $"{VisualizerPalette} / {VisualizerMotion} / {VisualizerQualityMode} / {VisualizerOutputTarget} / {VisualizerRendererPath} / intensity {VisualizerIntensity:0}% / live meter {InputMeterLevel:0.0}%";

    public string VisualizerRendererGuidance => VisualizerRendererPath switch
    {
        "2D Avalonia preview" => "Safe in-app preview. Good for planning and screenshots; not the final projector engine.",
        "2D Skia performance" => "Next upgrade path for richer 2D particles, trails, and exported visual paintings.",
        "3D standalone engine" => "Future show renderer. Separate process, GPU-backed, restartable, and never in the audio path.",
        "Hybrid projector pipeline" => "Long-term live setup: MusicOS controls scenes while a dedicated renderer owns projector/OBS output.",
        _ => "Choose a renderer path before rehearsal so visual load and output expectations are clear.",
    };

    public string VisualRendererControlSignal
    {
        get
        {
            var packet = CurrentVisualRendererPacket();
            return $"{packet.Protocol} / {packet.RendererPath} / energy {packet.Energy:P0} / transient {packet.TransientStrength:P0} / {packet.Section} / {packet.Instrument}";
        }
    }

    public string VisualPaintingTitle =>
        VisualizerRevealMode ? "Reveal the painting" : "Painting in the background";

    public string VisualPaintingSignal =>
        VisualizerAlwaysOn
            ? $"Always-on feed / {PreferredAudioInput} / level {InputMeterLevel:0.0}% / {VisualizerPalette}"
            : "Visualizer feed parked. Turn on the art feed when the RC-505 is playing.";

    public string VisualPaintingMood =>
        InputMeterLevel switch
        {
            >= 82 => "Blooming hard",
            >= 55 => "Song is moving",
            >= 21 => "Color is waking up",
            > 0 => "Quiet texture",
            _ => "Waiting for sound",
        };

    public string VisualPaintingComposition =>
        $"Stamps {VisualPaintingStamps} / {SongSection} / {LayerInstrument} / {VisualizerMotion} / {VisualPaintingSignature}";

    public string LoopStackSignal =>
        PerformanceLayers.Count == 0
            ? "No live layers logged yet. Prime drums, record the pocket, then build up."
            : $"{PerformanceLayers.Count} layer(s): {string.Join(" -> ", PerformanceLayers.OrderBy(item => item.Order).Take(5).Select(item => item.Instrument))}";

    public string NextLayerTarget
    {
        get
        {
            var hasDrums = PerformanceLayers.Any(item => item.Instrument == "Drums");
            var hasGuitar = PerformanceLayers.Any(item => item.Instrument == "Guitar");
            var hasPiano = PerformanceLayers.Any(item => item.Instrument == "Piano");
            var hasVocal = PerformanceLayers.Any(item => item.Instrument == "Vocal");

            if (!hasDrums)
            {
                return "Next: drums first. Make the groove undeniable before harmony.";
            }

            if (!hasGuitar)
            {
                return "Next: guitar pocket. Answer the drums, do not crowd them.";
            }

            if (!hasPiano)
            {
                return "Next: piano color. Add only the beats that lift the song.";
            }

            if (!hasVocal)
            {
                return "Next: lead vocal. Record the message, not perfection.";
            }

            return "Next: harmony, texture, or delete one weak layer before stacking more.";
        }
    }

    public string StemDirectory => System.IO.Path.Combine(LibraryPath, "stems");

    public string AutosaveSignal =>
        string.IsNullOrWhiteSpace(LastAutosavePath)
            ? "Autosave ready: new generated files will use XIV + timestamp."
            : $"Latest autosave: {System.IO.Path.GetFileName(LastAutosavePath)}";

    public string AutosaveBrowserSignal =>
        AutosaveFiles.Count == 0
            ? "No XIV autosaves found yet."
            : $"{AutosaveFiles.Count} recent XIV autosave file(s).";

    public string SelectedAutosaveTakeSignal =>
        SelectedAutosaveFile is null
            ? "No autosave attached to take review."
            : $"Attached: {SelectedAutosaveFile.Name}";

    public string SelectedAutosaveLaneSignal =>
        SelectedAutosaveFile is null
            ? "Select an audio autosave to load into a looper lane."
            : SelectedLooperTrack is null
                ? "Select a looper lane before loading the autosave."
                : SelectedAutosaveFile.IsAudio
                    ? $"Ready: load {SelectedAutosaveFile.Name} into {SelectedLooperTrack.Instrument}."
                    : "Selected autosave is not audio. Pick a WAV file.";

    public string LayerRecordingPlan =>
        $"{LayerCountInBeats}-beat count-in / {LayerInstrument} / {LayerBeatTarget} / {LayerEffectIntent}";

    public string InstrumentChannelSignal =>
        SelectedInstrumentChannel is null
            ? "No instrument lane selected."
            : $"{SelectedInstrumentChannel.Name} lane / {SelectedInstrumentChannel.InputNote} / W{SelectedInstrumentChannel.Warmth:0} S{SelectedInstrumentChannel.Space:0} E{SelectedInstrumentChannel.Energy:0}";

    public string InstrumentChannelVisualSignal =>
        SelectedInstrumentChannel is null
            ? "Select a lane to bind sound to color."
            : $"{SelectedInstrumentChannel.VisualPalette} / {SelectedInstrumentChannel.VisualMotion} / {SelectedInstrumentChannel.EffectIntent}";

    public string BuiltInLooperSignal =>
        SelectedLooperTrack is null
            ? "No looper track selected."
            : $"Track {SelectedLooperTrack.Number}: {SelectedLooperTrack.Instrument} / {SelectedLooperTrack.Status} / {SelectedLooperTrack.Mode} / take {SelectedLooperTrack.TakeCount} / volume {SelectedLooperTrack.Volume:0}%";

    public string SelectedLooperRoutingSignal
    {
        get
        {
            if (SelectedLooperTrack is null)
            {
                return "Select a looper lane to see routing.";
            }

            var channel = InstrumentChannels.FirstOrDefault(item => item.Name == SelectedLooperTrack.Instrument);
            if (channel is null)
            {
                return $"{SelectedLooperTrack.Instrument}: {SelectedLooperTrack.InputNote}";
            }

            return $"{SelectedLooperTrack.Instrument} route: {channel.InputNote} / {channel.EffectIntent} / {channel.VisualPalette} + {channel.VisualMotion}";
        }
    }

    public string LooperModeGuidance
    {
        get
        {
            var mode = NormalizeLooperMode(SelectedLooperMode);
            return mode switch
            {
                "Record" => "Record protects finished loops. Use it for an empty lane.",
                "Overdub" => "Overdub captures another pass/take over the current loop for comping later.",
                "Replace" => "Replace intentionally overwrites this lane with a fresh performance.",
                _ => "Choose how this lane should capture the next pass.",
            };
        }
    }

    public string LooperNextMove
    {
        get
        {
            var next = LooperTracks.FirstOrDefault(track => string.IsNullOrWhiteSpace(track.StemPath));
            if (next is not null)
            {
                return $"Next lane: {next.Instrument}. Prime it, count in, then capture the part.";
            }

            var overdub = SelectedLooperTrack?.Instrument ?? "Vocal";
            return $"All core lanes have audio. Next move: overdub or replace {overdub}.";
        }
    }

    public string LooperArrangementSignal
    {
        get
        {
            var ready = LooperTracks.Count(track =>
                !string.IsNullOrWhiteSpace(track.StemPath)
                && !track.Muted
                && (!LooperTracks.Any(item => item.Solo) || track.Solo));
            var total = LooperTracks.Count(track => !string.IsNullOrWhiteSpace(track.StemPath));
            return total == 0
                ? "No recorded lanes yet. Build the first drum loop."
                : $"{ready}/{total} recorded lane(s) ready for arrangement playback.";
        }
    }

    public string LooperExportSignal =>
        string.IsNullOrWhiteSpace(LastAutosavePath)
            ? "No bounced arrangement yet."
            : $"Latest output: {System.IO.Path.GetFileName(LastAutosavePath)}";

    public IEnumerable<LooperLaneReadinessItem> LooperLaneReadiness =>
        LooperTracks.Select(track =>
        {
            var hasStem = !string.IsNullOrWhiteSpace(track.StemPath);
            var role = track.Instrument switch
            {
                "Drums" => "foundation",
                "Guitar" => "pocket",
                "Piano" => "color",
                "Vocal" => "hook",
                "Harmony" => "lift",
                _ => "layer",
            };
            var state = hasStem
                ? $"{track.Status} / {track.TakeArchiveSummary}"
                : "missing";
            return new LooperLaneReadinessItem(track.Instrument, role, state, hasStem ? track.Color : "#8D7D68");
        });

    public IReadOnlyList<string> RecordingTestChecklist
    {
        get
        {
            var hasInput = PreferredAudioInput.Contains("Scarlett", StringComparison.OrdinalIgnoreCase)
                || PreferredAudioInput.Contains("Focusrite", StringComparison.OrdinalIgnoreCase);
            return
            [
                hasInput ? $"Input locked: {PreferredAudioInput}" : "Press Auto Focusrite before recording.",
                FocusriteReadyForRecording ? $"Input level ready: {FocusritePeakPercent:0.0}% peak" : $"Run 3s input test. {FocusriteCalibrationSignal}",
                RecordedLooperTrackCount > 0 ? $"{RecordedLooperTrackCount} loop lane(s) saved." : "Record the first drum loop.",
                string.IsNullOrWhiteSpace(LastAutosavePath) ? "No autosave file yet." : $"Autosave active: {System.IO.Path.GetFileName(LastAutosavePath)}",
                "After recording: Play arrangement, then Save arrangement take.",
            ];
        }
    }

    public string SignalCheckHeadline =>
        FocusritePeakPercent <= 0
            ? "First job: prove sound is entering the Scarlett."
            : FocusriteReadyForRecording
                ? $"Signal works: {FocusritePeakPercent:0.0}% peak."
                : $"Signal detected: {FocusritePeakPercent:0.0}% peak needs adjustment.";

    public string SignalCheckDetail
    {
        get
        {
            if (!PreferredAudioInput.Contains("Scarlett", StringComparison.OrdinalIgnoreCase)
                && !PreferredAudioInput.Contains("Focusrite", StringComparison.OrdinalIgnoreCase))
            {
                return "Click Find Scarlett. Nothing else matters until the input is selected.";
            }

            if (FocusritePeakPercent <= 0)
            {
                return "Click Record 3 sec test, then play the RC-505. If peak stays 0%, check cables/gain/input mode.";
            }

            return FocusriteReadyForRecording
                ? "Good. You can record a drum lane now."
                : FocusriteCalibrationSignal;
        }
    }

    public string SignalCheckInputLabel =>
        string.IsNullOrWhiteSpace(PreferredAudioInput)
            ? "Input: not selected"
            : $"Input: {PreferredAudioInput}";

    public string SignalCheckPeakLabel => $"{FocusritePeakPercent:0}%";

    public string SignalCheckTestFile =>
        string.IsNullOrWhiteSpace(LastFocusriteTestPath)
            ? "No test file yet."
            : $"Test file: {System.IO.Path.GetFileName(LastFocusriteTestPath)}";

    public string SimpleRecorderHeadline =>
        SimpleRecordingActive
            ? "Recording now. Play the RC-505."
            : FocusriteReadyForRecording
                ? "Ready to record one clean test."
                : "Not ready: prove signal first.";

    public string SimpleRecorderDetail =>
        SimpleRecordingActive
            ? "When you are done, press Stop & save. The WAV will autosave with XIV + timestamp."
            : FocusriteReadyForRecording
                ? "Press Start recording. Do not worry about looper lanes yet."
                : "Use Find Scarlett and Record 3 sec test. Target: 35-75% peak.";

    public string SimpleRecorderFileLabel =>
        string.IsNullOrWhiteSpace(ActiveStemPath)
            ? "No recording saved yet."
            : $"Saved: {System.IO.Path.GetFileName(ActiveStemPath)}";

    public string SessionWorkflowSignal
    {
        get
        {
            var next = LooperTracks.FirstOrDefault(track => string.IsNullOrWhiteSpace(track.StemPath));
            var lane = next is null
                ? "All core lanes have audio. Play arrangement and save a take."
                : $"Next capture: {next.Instrument} lane.";
            return $"{RecordedLooperTrackCount}/5 lanes saved / {PerformanceLayers.Count} layer log(s). {lane}";
        }
    }

    public string NextRecordingMoveHeadline
    {
        get
        {
            var next = LooperTracks.FirstOrDefault(track => string.IsNullOrWhiteSpace(track.StemPath));
            return next is null
                ? "Play the arrangement. Save the session."
                : $"Next: {next.Instrument}";
        }
    }

    public string NextRecordingMoveDetail
    {
        get
        {
            var next = LooperTracks.FirstOrDefault(track => string.IsNullOrWhiteSpace(track.StemPath));
            if (next is null)
            {
                return "All core lanes have audio. Listen once, stop cleanly, then save a session package.";
            }

            var role = next.Instrument switch
            {
                "Drums" => "Build the groove first. No harmony yet.",
                "Guitar" => "Answer the drums. Leave air for the vocal.",
                "Piano" => "Add color only where the groove needs lift.",
                "Vocal" => "Record the message, not perfection.",
                "Harmony" => "Add lift or skip it if the lead already works.",
                _ => "Capture one clear part before adding more.",
            };
            return $"{role} The app will select the lane and send you to Song Builder.";
        }
    }

    public string SessionPackageSignal =>
        string.IsNullOrWhiteSpace(LastAutosavePath)
            ? $"Session package ready. Files will land in {System.IO.Path.Combine(LibraryPath, "session-packages")}."
            : $"Latest file: {System.IO.Path.GetFileName(LastAutosavePath)}";

    public string SessionActionResult => Status;

    public string SessionRecorderLocation =>
        SelectedRoom.Name == "Song Builder"
            ? "Recorder controls are in this Song Builder page. Scroll down to Built-in Looper."
            : "Press Prep next lane to switch into Song Builder recording mode.";

    public string SessionSelectedLaneSignal =>
        SelectedLooperTrack is null
            ? "No lane selected yet."
            : $"Selected lane: Track {SelectedLooperTrack.Number} / {SelectedLooperTrack.Instrument} / {SelectedLooperTrack.Status}.";

    public IReadOnlyList<string> SessionWorkflowChecklist
    {
        get
        {
            var next = LooperTracks.FirstOrDefault(track => string.IsNullOrWhiteSpace(track.StemPath));
            return
            [
                FocusriteReadyForRecording ? "Input checked" : "Run 3s Focusrite test before recording.",
                next is null ? "Core lanes captured" : $"Capture {next.Instrument} next.",
                RecordedLooperTrackCount > 0 ? "Play arrangement after recording." : "Start with drums, not polish.",
                "Export session package before walking away.",
            ];
        }
    }

    public string LooperTimingSignal
    {
        get
        {
            var safeBpm = Math.Clamp(LooperBpm, 40, 240);
            var beats = Math.Max(1, LooperBars * 4);
            var seconds = beats * 60.0 / safeBpm;
            return $"{safeBpm} BPM / {LooperCountInBeats} beat count-in / {LooperBars} bars / target {seconds:0.0}s loop";
        }
    }

    public TimeSpan TargetLoopDuration
    {
        get
        {
            var safeBpm = Math.Clamp(LooperBpm, 40, 240);
            var beats = Math.Max(1, LooperBars * 4);
            return TimeSpan.FromSeconds(beats * 60.0 / safeBpm);
        }
    }

    public string LooperTestNextStep
    {
        get
        {
            if (SelectedLooperTrack is null)
            {
                return "1. Select a looper track.";
            }

            if (!PreferredAudioInput.Contains("Scarlett", StringComparison.OrdinalIgnoreCase)
                && !PreferredAudioInput.Contains("Focusrite", StringComparison.OrdinalIgnoreCase))
            {
                return "1. Press Auto Focusrite.";
            }

            if (FocusritePeakPercent <= 0)
            {
                return "2. Press 3s input test and play/tap the instrument.";
            }

            if (!FocusriteReadyForRecording)
            {
                return $"3. Fix input level: {FocusriteCalibrationSignal}";
            }

            if (SelectedLooperTrack.Status is "Empty" or "Armed")
            {
                return "4. Press Timed record for auto-stop, or Record for manual stop.";
            }

            if (SelectedLooperTrack.Status is "Recorded" or "Overdub saved")
            {
                return "5. Press Play loop, then adjust Track volume.";
            }

            if (SelectedLooperTrack.Status == "Looping")
            {
                return "6. Listen, adjust volume, then add the next instrument lane.";
            }

            return "Check transport status, then continue the loop test.";
        }
    }

    public string LoopStackReadiness
    {
        get
        {
            var missing = new List<string>();
            if (!PerformanceLayers.Any(item => item.Instrument == "Drums"))
            {
                missing.Add("drums");
            }

            if (!PerformanceLayers.Any(item => item.Instrument is "Guitar" or "Piano"))
            {
                missing.Add("harmony");
            }

            if (!PerformanceLayers.Any(item => item.Instrument == "Vocal"))
            {
                missing.Add("vocal");
            }

            return missing.Count == 0
                ? "Loop stack has groove, harmony, and vocal. Review the weakest layer before adding more."
                : $"Missing before full song pass: {string.Join(", ", missing)}.";
        }
    }

    public string PerformancePlanSignal =>
        $"{SongSection} / {Rc505MemorySlot} / next layer: {LayerInstrument} on {LayerBeatTarget}";

    public string Rc505CueSheet
    {
        get
        {
            var layers = PerformanceLayers.Count == 0
                ? "No layers logged yet."
                : string.Join(" | ", PerformanceLayers.OrderBy(item => item.Order).Select(item => $"{item.Order}. {item.Instrument}:{item.BeatTarget}"));

            return $"{Rc505MemorySlot} - {SongSection}. {layers}";
        }
    }

    public string LiveCueTitle => SongSection switch
    {
        "Intro" => "Start clean",
        "Verse" => "Hold the pocket",
        "Pre" => "Build tension",
        "Hook" => "Make the hook obvious",
        "Bridge" => "Change the weather",
        _ => "Land the ending",
    };

    public string LiveCuePrimary =>
        $"{LayerInstrument}: {LayerBeatTarget}";

    public string LiveCueSecondary =>
        $"{LayerEffectIntent}. {PerformanceCueNotes}";

    public string LiveCueNextMove
    {
        get
        {
            if (!PerformanceLayers.Any(item => item.Instrument == "Drums"))
            {
                return "Record drums on the RC-505. Do not add harmony yet.";
            }

            if (!PerformanceLayers.Any(item => item.Instrument is "Guitar" or "Piano"))
            {
                return "Add one harmony pocket. Guitar or piano, not both unless it breathes.";
            }

            if (!PerformanceLayers.Any(item => item.Instrument == "Vocal"))
            {
                return "Sing the lead hook. Capture the emotion before fixing details.";
            }

            return "Review: mute one weak layer or save the section before stacking more.";
        }
    }

    public string PerformanceModeStatus =>
        $"PASS {PerformancePassCount:00} / {Rc505MemorySlot} / {SongSection} / {PerformanceLayers.Count} layer(s)";

    public bool IsPerformanceRevealRoom => SelectedRoom.Name == "Performance / Reveal";

    public bool IsWorldMemoryRoom => SelectedRoom.Name == "World Memory";

    public bool IsContentLabRoom => SelectedRoom.Name == "Content Lab";

    public bool IsEditorRoom => !IsPerformanceRevealRoom && !IsWorldMemoryRoom && !IsContentLabRoom;

    public string WorldMemorySignal =>
        "Night roads, trails, lakes, storms, phrases, and loops become the artist archive.";

    public string WorldMemoryPrompt =>
        "Save the place, sound, phrase, cover idea, rhythm, or feeling. GateKPT can turn it into a hook later.";

    public ObservableCollection<ContentPlanItem> ContentPlanItems { get; }

    public string ContentPlanSummary =>
        $"{ContentMission} / {ContentSeries} / {ContentPlatform}";

    public string ContentAudiencePromise =>
        "Come watch me build Florida night songs from guitar, voice, humor, pressure, Spanish color, and field sounds.";

    public string ContentEngineFormula =>
        "one hook / one field sound / one visual / one post";

    public string ContentTonightSequence =>
        "record rough -> keep the charm -> light preset -> export clip -> post/archive";

    public string ContentMissionGuide =>
        ContentMission.ToLowerInvariant() switch
        {
            var mission when mission.Contains("guitar") => "Raw guitar cover: capture the charming imperfect take. Raw Clean first.",
            var mission when mission.Contains("field") => "Field note: save the place before the song. Use the sound as intro texture.",
            var mission when mission.Contains("goofy") => "Goofy hook seed: do not over-polish. Keep the face/personality alive.",
            var mission when mission.Contains("spanish") => "Spanish color line: one phrase, smooth rhythm, Luna Pop if it helps.",
            var mission when mission.Contains("noble") => "Noble note: emotionally direct, self-respecting, not fake luxury.",
            var mission when mission.Contains("phone") => "Phone video cover: clean audio in GateKPT, phone video for the feeling.",
            var mission when mission.Contains("chrome") => "Raw to Chrome: raw first, polished second, compare the feeling.",
            _ => "After Work Hook: build the hook fast, keep the charm, post before perfect."
        };

    public string ContentPostPackPreview =>
        $"Hook: {ContentHook} | Caption: {ContentCaption} | CTA: {ContentCta} | Tags: {ContentHashtags} | Preset: {ContentPreset}";

    public string ContentArchiveReviewSummary
    {
        get
        {
            var latest = ArtistSessions.FirstOrDefault();
            if (latest is null)
            {
                return $"Archive: {RecentCaptures.Count} captures / {LyricIdeas.Count} hooks / no artist session saved yet.";
            }

            return $"Archive: {ArtistSessions.Count} sessions / latest: {latest.Title} / {latest.MissionType} / {latest.PostStatus}.";
        }
    }

    public string ContentEpPlanSignal =>
        "EP seed: Late Night Florida / 5 songs / Orange County Glow / playful-romantic-smart core.";

    public string ContentPlatformChecklist =>
        "Snapchat | TikTok | Instagram Reels | YouTube Shorts | Website/archive";

    public string BestArtistSessionSignal
    {
        get
        {
            var postReady = ArtistSessions.FirstOrDefault(item =>
                item.PostStatus.Contains("ready", StringComparison.OrdinalIgnoreCase)
                || item.PostStatus.Contains("posted", StringComparison.OrdinalIgnoreCase));
            var seed = postReady ?? ArtistSessions.FirstOrDefault();
            return seed is null
                ? "No session yet. Save the first After Work Hook."
                : $"Closest seed: {seed.Title} / {seed.MissionType} / {seed.PersonalityTone}";
        }
    }

    public string ContentRecordingPlan
    {
        get
        {
            var format = ContentFormat.ToLowerInvariant();
            if (format.Contains("drum"))
            {
                return "Record: 8-16 sec drum groove. Use it as the hook bed or visualizer pulse.";
            }

            if (format.Contains("guitar") || format.Contains("keys"))
            {
                return "Record: 10-20 sec guitar/keys phrase. Leave space for vocal or caption.";
            }

            if (format.Contains("vocal") || format.Contains("cover"))
            {
                return "Record: chorus or strongest line first. Raw take stays safe, then style the vocal.";
            }

            if (format.Contains("dance") || format.Contains("visual"))
            {
                return "Record: audio bed first, then make the visual/dance clip follow the waveform.";
            }

            return "Record: one short usable moment, not a full production.";
        }
    }

    public string ContentPlatformPlan
    {
        get
        {
            var platform = ContentPlatform.ToLowerInvariant();
            if (platform.Contains("snap"))
            {
                return "Snapchat: fast, casual, low-pressure. Show the moment, not the explanation.";
            }

            if (platform.Contains("youtube"))
            {
                return platform.Contains("short")
                    ? "YouTube Shorts: clear hook in first second, clean vocal, simple title."
                    : "YouTube: longer cover or process video. Save stronger audio and context.";
            }

            if (platform.Contains("insta") || platform.Contains("reel"))
            {
                return "Instagram/Reels: visual first. Strong frame, subtitles, polished clip.";
            }

            if (platform.Contains("tiktok"))
            {
                return "TikTok: one feeling, one hook, one visual idea. Keep it easy to replay.";
            }

            return "Platform: choose Snapchat, TikTok, Instagram/Reels, or YouTube before recording.";
        }
    }

    public string ContentShotPlan
    {
        get
        {
            var setting = ContentSetting.ToLowerInvariant();
            if (setting.Contains("motel") || setting.Contains("neon") || setting.Contains("road"))
            {
                return "Shot: low light, warm sign glow, face or instrument close, waveform visual after.";
            }

            if (setting.Contains("trail") || setting.Contains("lake") || setting.Contains("storm"))
            {
                return "Shot: field texture first, then instrument/vocal. Let the place be the intro.";
            }

            if (setting.Contains("room") || setting.Contains("studio"))
            {
                return "Shot: clean room frame, visible instrument, one strong light source.";
            }

            return "Shot: pick one place, one light, one sound. Keep the clip readable.";
        }
    }

    partial void OnSelectedExportPresetChanged(ExportPreset value)
    {
        PlatformProfile = value.Name;
        OnPropertyChanged(nameof(SelectedExportDescription));
    }

    partial void OnSelectedAudioPresetChanged(AudioProcessingPreset value)
    {
        OnPropertyChanged(nameof(SelectedAudioPresetDescription));
    }

    partial void OnLayerInstrumentChanged(string value)
    {
        OnPropertyChanged(nameof(LayerRecordingPlan));
        ApplyVisualDefaultsForInstrument(value);
        RefreshLiveCue();
    }

    partial void OnLayerBeatTargetChanged(string value)
    {
        OnPropertyChanged(nameof(LayerRecordingPlan));
        RefreshLiveCue();
    }

    partial void OnLayerEffectIntentChanged(string value)
    {
        OnPropertyChanged(nameof(LayerRecordingPlan));
        RefreshLiveCue();
    }

    partial void OnLayerCountInBeatsChanged(int value) => OnPropertyChanged(nameof(LayerRecordingPlan));

    partial void OnContentFormatChanged(string value)
    {
        OnPropertyChanged(nameof(ContentPlanSummary));
        OnPropertyChanged(nameof(ContentRecordingPlan));
    }

    partial void OnContentSeriesChanged(string value)
    {
        OnPropertyChanged(nameof(ContentPlanSummary));
    }

    partial void OnContentMissionChanged(string value)
    {
        OnPropertyChanged(nameof(ContentPlanSummary));
        OnPropertyChanged(nameof(ContentMissionGuide));
        OnPropertyChanged(nameof(ContentPostPackPreview));
    }

    partial void OnContentToneChanged(string value)
    {
        OnPropertyChanged(nameof(ContentPostPackPreview));
    }

    partial void OnContentPresetChanged(string value)
    {
        OnPropertyChanged(nameof(ContentPostPackPreview));
    }

    partial void OnContentLanguageChanged(string value) => OnPropertyChanged(nameof(ContentPostPackPreview));

    partial void OnContentTerrainChanged(string value)
    {
        ContentSetting = value;
        OnPropertyChanged(nameof(ContentPostPackPreview));
    }

    partial void OnContentPillarChanged(string value) => OnPropertyChanged(nameof(ContentPostPackPreview));

    partial void OnContentHashtagsChanged(string value) => OnPropertyChanged(nameof(ContentPostPackPreview));

    partial void OnContentCtaChanged(string value) => OnPropertyChanged(nameof(ContentPostPackPreview));

    partial void OnContentPostStatusChanged(string value)
    {
        OnPropertyChanged(nameof(ContentArchiveReviewSummary));
        OnPropertyChanged(nameof(BestArtistSessionSignal));
    }

    partial void OnContentPlatformChanged(string value)
    {
        OnPropertyChanged(nameof(ContentPlanSummary));
        OnPropertyChanged(nameof(ContentPlatformPlan));
    }

    partial void OnContentSettingChanged(string value)
    {
        OnPropertyChanged(nameof(ContentPlanSummary));
        OnPropertyChanged(nameof(ContentShotPlan));
    }

    partial void OnContentHookChanged(string value) => OnPropertyChanged(nameof(ContentPostPackPreview));

    partial void OnContentCaptionChanged(string value) => OnPropertyChanged(nameof(ContentPostPackPreview));

    partial void OnContentVisualDirectionChanged(string value) => OnPropertyChanged(nameof(ContentPostPackPreview));

    partial void OnLastAutosavePathChanged(string value)
    {
        OnPropertyChanged(nameof(AutosaveSignal));
        OnPropertyChanged(nameof(SessionPackageSignal));
    }

    partial void OnStatusChanged(string value)
    {
        OnPropertyChanged(nameof(SessionActionResult));
    }

    partial void OnPreferredAudioInputChanged(string value)
    {
        OnPropertyChanged(nameof(SignalCheckInputLabel));
        OnPropertyChanged(nameof(SignalCheckDetail));
    }

    partial void OnFocusritePeakPercentChanged(double value)
    {
        OnPropertyChanged(nameof(SignalCheckHeadline));
        OnPropertyChanged(nameof(SignalCheckDetail));
        OnPropertyChanged(nameof(SignalCheckPeakLabel));
    }

    partial void OnFocusriteReadyForRecordingChanged(bool value)
    {
        OnPropertyChanged(nameof(SignalCheckHeadline));
        OnPropertyChanged(nameof(SignalCheckDetail));
    }

    partial void OnLastFocusriteTestPathChanged(string value)
    {
        OnPropertyChanged(nameof(SignalCheckTestFile));
    }

    partial void OnSimpleRecordingActiveChanged(bool value)
    {
        OnPropertyChanged(nameof(SimpleRecorderHeadline));
        OnPropertyChanged(nameof(SimpleRecorderDetail));
    }

    partial void OnActiveStemPathChanged(string value)
    {
        OnPropertyChanged(nameof(SimpleRecorderFileLabel));
    }

    partial void OnSelectedAutosaveFileChanged(AutosaveFileItem? value)
    {
        if (value is null)
        {
            OnPropertyChanged(nameof(SelectedAutosaveLaneSignal));
            return;
        }

        LastAutosavePath = value.Path;
        OnPropertyChanged(nameof(SelectedAutosaveTakeSignal));
        OnPropertyChanged(nameof(SelectedAutosaveLaneSignal));
    }

    partial void OnLooperBpmChanged(int value) => OnPropertyChanged(nameof(LooperTimingSignal));

    partial void OnLooperCountInBeatsChanged(int value) => OnPropertyChanged(nameof(LooperTimingSignal));

    partial void OnLooperBarsChanged(int value) => OnPropertyChanged(nameof(LooperTimingSignal));

    partial void OnSelectedLooperModeChanged(string value)
    {
        OnPropertyChanged(nameof(LooperModeGuidance));
        OnPropertyChanged(nameof(BuiltInLooperSignal));
    }

    partial void OnSelectedInstrumentChannelChanged(InstrumentChannelItem? value)
    {
        if (value is null)
        {
            return;
        }

        LayerInstrument = value.Name;
        LayerEffectIntent = value.EffectIntent;
        InstrumentTonePrompt = value.TonePrompt;
        InstrumentInputNote = value.InputNote;
        InstrumentWarmth = value.Warmth;
        InstrumentSpace = value.Space;
        InstrumentEnergy = value.Energy;
        VisualizerPalette = value.VisualPalette;
        VisualizerMotion = value.VisualMotion;
        OnPropertyChanged(nameof(InstrumentChannelSignal));
        OnPropertyChanged(nameof(InstrumentChannelVisualSignal));
    }

    partial void OnSelectedLooperTrackChanged(LooperTrackItem? value)
    {
        if (value is null)
        {
            return;
        }

        LayerInstrument = value.Instrument;
        InstrumentInputNote = value.InputNote;
        SelectedLooperTrackVolume = value.Volume;
        SelectedLooperMode = NormalizeLooperMode(value.Mode);
        SelectedInstrumentChannel = InstrumentChannels.FirstOrDefault(item => item.Name == value.Instrument) ?? SelectedInstrumentChannel;
        OnPropertyChanged(nameof(BuiltInLooperSignal));
        OnPropertyChanged(nameof(SelectedLooperRoutingSignal));
        OnPropertyChanged(nameof(SelectedAutosaveLaneSignal));
    }

    partial void OnSelectedLooperTrackVolumeChanged(double value)
    {
        if (SelectedLooperTrack is null)
        {
            return;
        }

        var updated = SelectedLooperTrack with { Volume = Math.Clamp(value, 0, 100) };
        ReplaceLooperTrack(updated);
        _looperPlayback.SetVolume(updated.Number, updated.Volume);
        OnPropertyChanged(nameof(BuiltInLooperSignal));
    }

    partial void OnVisualizerPaletteChanged(string value)
    {
        OnPropertyChanged(nameof(VisualizerPreviewDetail));
        OnPropertyChanged(nameof(VisualPaintingSignal));
        OnPropertyChanged(nameof(VisualRendererControlSignal));
    }

    partial void OnVisualizerMotionChanged(string value)
    {
        OnPropertyChanged(nameof(VisualizerPreviewDetail));
        OnPropertyChanged(nameof(VisualRendererControlSignal));
    }

    partial void OnVisualizerModeChanged(string value)
    {
        OnPropertyChanged(nameof(VisualizerPreviewTitle));
        OnPropertyChanged(nameof(VisualPaintingTitle));
        OnPropertyChanged(nameof(VisualRendererControlSignal));
    }

    partial void OnVisualizerQualityModeChanged(string value)
    {
        OnPropertyChanged(nameof(VisualizerPreviewDetail));
        OnPropertyChanged(nameof(VisualRendererControlSignal));
    }

    partial void OnVisualizerOutputTargetChanged(string value)
    {
        OnPropertyChanged(nameof(VisualizerPreviewDetail));
        OnPropertyChanged(nameof(VisualRendererControlSignal));
    }

    partial void OnVisualizerIntensityChanged(double value)
    {
        OnPropertyChanged(nameof(VisualizerPreviewDetail));
        OnPropertyChanged(nameof(VisualRendererControlSignal));
    }

    partial void OnSongSectionChanged(string value)
    {
        OnPropertyChanged(nameof(PerformancePlanSignal));
        OnPropertyChanged(nameof(Rc505CueSheet));
        OnPropertyChanged(nameof(VisualRendererControlSignal));
        RefreshLiveCue();
    }

    partial void OnRc505MemorySlotChanged(string value)
    {
        OnPropertyChanged(nameof(PerformancePlanSignal));
        OnPropertyChanged(nameof(Rc505CueSheet));
        OnPropertyChanged(nameof(PerformanceModeStatus));
    }

    partial void OnSelectedSongStageChanged(SongStage value)
    {
        OnPropertyChanged(nameof(SelectedSongStageGoal));
        OnPropertyChanged(nameof(SelectedSongStageRouting));
        OnPropertyChanged(nameof(VisualizerPreviewTitle));
        OnPropertyChanged(nameof(VisualizerPreviewDetail));
        RefreshProjectModules();
        OnPropertyChanged(nameof(DashboardSignal));
        OnPropertyChanged(nameof(NextCreativeAction));
        OnPropertyChanged(nameof(ProjectHealthSignal));
        OnPropertyChanged(nameof(ProjectHealthDetail));
        OnPropertyChanged(nameof(ProjectHealthBlockers));
        OnPropertyChanged(nameof(PrimeGapLabel));
        OnPropertyChanged(nameof(ProjectMemorySummary));
        OnPropertyChanged(nameof(ProjectMemoryCounts));
        OnPropertyChanged(nameof(ProjectMemoryModified));
        CaptureTitle = $"{value.Name} pass";
        CaptureNotes = value.Goal;
        Status = $"Song workflow moved to {value.Name}.";
    }

    partial void OnSelectedRoomChanged(OsRoom value)
    {
        OnPropertyChanged(nameof(ActiveRoom));
        OnPropertyChanged(nameof(IsPerformanceRevealRoom));
        OnPropertyChanged(nameof(IsEditorRoom));
        OnPropertyChanged(nameof(CaptureHint));
        OnPropertyChanged(nameof(TodaysCreativeBrief));
        OnPropertyChanged(nameof(SessionLaunchChecklist));
        RefreshSessionRail();
        Status = $"Switched to {value.Name}";
        if (string.IsNullOrWhiteSpace(CaptureTitle))
        {
            CaptureTitle = $"{value.Name} capture";
        }
    }

    partial void OnTakeDecisionChanged(string value)
    {
        OnPropertyChanged(nameof(TakeDecisionGuidance));
        if (string.IsNullOrWhiteSpace(TakeNextAction) ||
            TakeNextAction == "Tighten timing, then review again." ||
            TakeNextAction == "No next action written.")
        {
            TakeNextAction = DefaultNextActionForDecision(value);
        }
    }

    partial void OnSelectedProjectModuleChanged(MusicOsModule? value)
    {
        if (value is null)
        {
            return;
        }

        var room = Rooms.FirstOrDefault(item => item.Name == value.Name);
        if (room is not null)
        {
            SelectedRoom = room;
        }

        CaptureTitle = $"{value.Name} action";
        CaptureNotes = value.StarterAction;
        Status = $"Primed {value.Name}: {value.StarterAction}";
    }

    partial void OnSelectedProjectMemoryTimelineItemChanged(ProjectMemoryTimelineItem? value)
    {
        if (value is null)
        {
            return;
        }

        var room = Rooms.FirstOrDefault(item => item.Name == value.TargetRoom);
        if (room is not null)
        {
            SelectedRoom = room;
            CaptureTitle = $"{value.TargetRoom} follow-up";
            CaptureNotes = $"Follow up from {value.Room}: {value.Title}. {value.Detail}";
            Status = $"Opened {value.TargetRoom} from project memory: {value.Title}";
        }
    }

    partial void OnSelectedProjectMemoryTimelineFilterChanged(string value)
    {
        SelectedProjectMemoryTimelineItem = null;
        OnPropertyChanged(nameof(ProjectMemoryTimeline));
        Status = $"Project memory timeline filter: {value}";
    }

    partial void OnPinnedProjectMemoryItemChanged(ProjectMemoryTimelineItem? value)
    {
        if (value is null)
        {
            _store.ClearPinnedProjectMemory();
        }
        else
        {
            _store.SavePinnedProjectMemory(new PinnedProjectMemory(
                value.When,
                value.Room,
                value.TargetRoom,
                value.Filter,
                value.Title,
                value.Detail,
                value.Accent));
        }

        OnPropertyChanged(nameof(DashboardSignal));
        OnPropertyChanged(nameof(NextCreativeAction));
        OnPropertyChanged(nameof(TodaysCreativeBrief));
        OnPropertyChanged(nameof(SessionLaunchChecklist));
        OnPropertyChanged(nameof(LoopStackSignal));
        OnPropertyChanged(nameof(NextLayerTarget));
        OnPropertyChanged(nameof(LoopStackReadiness));
        OnPropertyChanged(nameof(PerformancePlanSignal));
        OnPropertyChanged(nameof(Rc505CueSheet));
        RefreshLiveCue();
        RefreshSessionRail();
    }

    partial void OnProjectNameChanged(string value) => RefreshProjectMemoryInspector();

    partial void OnPlatformProfileChanged(string value) => RefreshProjectMemoryInspector();

    partial void OnLoudnessTargetChanged(string value) => RefreshProjectMemoryInspector();

    partial void OnBusinessModeChanged(string value) => RefreshProjectMemoryInspector();

    partial void OnTempoChanged(string value) => RefreshProjectMemoryInspector();

    partial void OnKeyCenterChanged(string value) => RefreshProjectMemoryInspector();

    partial void OnRoutingNotesChanged(string value) => RefreshProjectMemoryInspector();

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
        SaveProjectSnapshot("Capture saved");
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
    private void PrimeWorldPhrase()
    {
        SelectedRoom = Rooms.FirstOrDefault(room => room.Name == "World Memory") ?? SelectedRoom;
        WorldMemoryType = "Spanglish phrase";
        WorldMemoryLanguage = "";
        WorldMemoryPhrase = "";
        WorldMemoryMeaning = "";
        WorldMemoryRhythm = "";
        WorldMemorySongIdea = "";
        WorldMemoryNotes = "How it sounds / who would feel this line:";
        Status = "Primed Spanglish phrase capture.";
    }

    [RelayCommand]
    private void PrimeWorldPersonPlace()
    {
        SelectedRoom = Rooms.FirstOrDefault(room => room.Name == "World Memory") ?? SelectedRoom;
        WorldMemoryType = "Place / field sound";
        WorldMemoryPlace = "Night road / motel neon";
        WorldMemoryPerson = "";
        WorldMemoryRhythm = "";
        WorldMemorySongIdea = "";
        WorldMemoryNotes = "Trail, lake, car, gym, storm, parking lot, or room. What did it sound like?";
        Status = "Primed field note.";
    }

    [RelayCommand]
    private void PrimeWorldFood()
    {
        SelectedRoom = Rooms.FirstOrDefault(room => room.Name == "World Memory") ?? SelectedRoom;
        WorldMemoryType = "Ritual";
        WorldMemoryFood = "";
        WorldMemoryPlace = "Night road";
        WorldMemoryPhrase = "";
        WorldMemorySongIdea = "";
        WorldMemoryNotes = "Food, gym recovery, night drive, shower melody, walk, or after-work reset:";
        Status = "Primed ritual capture.";
    }

    [RelayCommand]
    private void PrimeWorldSongSeed()
    {
        SelectedRoom = Rooms.FirstOrDefault(room => room.Name == "World Memory") ?? SelectedRoom;
        WorldMemoryType = "Cover / song seed";
        WorldMemoryRhythm = "Late Night Chrome vocal";
        WorldMemoryLanguage = "";
        WorldMemorySongIdea = "";
        WorldMemoryNotes = "Cover, hook, visual setting, and where this lives: trail, lake, car, room, storm.";
        Status = "Primed song seed.";
    }

    [RelayCommand]
    private void SaveWorldMemory()
    {
        var item = new WorldMemoryItem(
            DateTime.Now.ToString("yyyy-MM-dd h:mm tt"),
            WorldMemoryType,
            WorldMemoryLanguage.Trim(),
            WorldMemoryPhrase.Trim(),
            WorldMemoryMeaning.Trim(),
            WorldMemoryPlace.Trim(),
            WorldMemoryPerson.Trim(),
            WorldMemoryFood.Trim(),
            WorldMemoryRhythm.Trim(),
            WorldMemorySongIdea.Trim(),
            WorldMemoryNotes.Trim());

        WorldMemories.Insert(0, item);
        while (WorldMemories.Count > 50)
        {
            WorldMemories.RemoveAt(WorldMemories.Count - 1);
        }

        _store.SaveWorldMemory(WorldMemories);
        RecentCaptures.Insert(0, new CaptureItem(
            $"World Memory / {item.Type}",
            item.Summary,
            DateTime.Now.ToString("h:mm tt"),
            "World Memory"));
        while (RecentCaptures.Count > 8)
        {
            RecentCaptures.RemoveAt(RecentCaptures.Count - 1);
        }

        _store.SaveCaptures(RecentCaptures);
        SaveProjectSnapshot("World memory saved");
        Status = $"Saved World Memory: {item.Type}";
    }

    [RelayCommand]
    private void ClearWorldMemory()
    {
        WorldMemoryLanguage = "";
        WorldMemoryPhrase = "";
        WorldMemoryMeaning = "";
        WorldMemoryPlace = "";
        WorldMemoryPerson = "";
        WorldMemoryFood = "";
        WorldMemoryRhythm = "";
        WorldMemorySongIdea = "";
        WorldMemoryNotes = "";
        Status = "World Memory fields cleared.";
    }

    [RelayCommand]
    private void PrimeContentFromWorldMemory()
    {
        SelectedRoom = Rooms.FirstOrDefault(room => room.Name == "Content Lab") ?? SelectedRoom;
        var memory = WorldMemories.FirstOrDefault();
        if (memory is null)
        {
            ContentPlanStatus = "No World Memory saved yet. Use the default night-session template.";
            GenerateContentPlan();
            return;
        }

        ContentSetting = string.IsNullOrWhiteSpace(memory.Place) ? "motel neon night road" : memory.Place;
        ContentSong = memory.SongIdea;
        ContentHook = string.IsNullOrWhiteSpace(memory.Phrase)
            ? string.IsNullOrWhiteSpace(memory.SongIdea) ? "The night starts here." : memory.SongIdea
            : memory.Phrase;
        ContentVisualDirection = $"Build around {memory.Summary}. Moon-white vocal, amber/green terrain, slow waveform motion.";
        ContentCaption = $"{ContentHook} A cover, a field note, a visual.";
        ContentNextAction = "Record a short take, apply Late Night Chrome, then make one vertical post clip.";
        ContentPlanStatus = $"Primed from World Memory: {memory.Title}";
        Status = ContentPlanStatus;
    }

    [RelayCommand]
    private void GenerateContentPlan()
    {
        var setting = string.IsNullOrWhiteSpace(ContentSetting) ? "motel neon night road" : ContentSetting.Trim();
        var song = string.IsNullOrWhiteSpace(ContentSong) ? "one cover or hook" : ContentSong.Trim();
        var format = string.IsNullOrWhiteSpace(ContentFormat) ? "Cover clip" : ContentFormat.Trim();
        var platform = string.IsNullOrWhiteSpace(ContentPlatform) ? "short-form video" : ContentPlatform.Trim();

        ContentHook = format.Contains("field", StringComparison.OrdinalIgnoreCase)
            ? $"This is what {setting} sounds like."
            : format.Contains("drum", StringComparison.OrdinalIgnoreCase)
                ? "Start with the groove."
                : format.Contains("dance", StringComparison.OrdinalIgnoreCase) || format.Contains("visual", StringComparison.OrdinalIgnoreCase)
                    ? "Sound becomes the background."
                    : "The night starts here.";
        ContentCaption = PlatformCaption(platform, ContentHook, song);
        ContentVisualDirection = setting.Contains("storm", StringComparison.OrdinalIgnoreCase)
            ? "Dark blue storm light, amber vocal glow, slow rain-like waveform trails."
            : setting.Contains("trail", StringComparison.OrdinalIgnoreCase) || setting.Contains("lake", StringComparison.OrdinalIgnoreCase)
                ? "Forest-black base, moon-white contour lines, teal lake/trail signal, warm vocal glow."
                : "Humid night road, amber parking-lot light, dark green terrain lines, slow waveform painting.";
        ContentNextAction = PlatformNextAction(platform, format, song);
        ContentPlanStatus = $"Generated {ContentMission} post pack: {format} / {ContentTone}.";
        Status = ContentPlanStatus;
        OnPropertyChanged(nameof(ContentPlanSummary));
        OnPropertyChanged(nameof(ContentRecordingPlan));
        OnPropertyChanged(nameof(ContentPlatformPlan));
        OnPropertyChanged(nameof(ContentShotPlan));
        OnPropertyChanged(nameof(ContentPostPackPreview));
    }

    [RelayCommand]
    private void PrimeRawToChrome()
    {
        ContentMission = "Raw to Chrome";
        ContentSeries = "Raw to Chrome";
        ContentFormat = "Raw to Chrome #001";
        ContentPlatform = "Snapchat / TikTok / Reels / YouTube Shorts";
        ContentSetting = "orange glow / night road";
        ContentSong = string.IsNullOrWhiteSpace(ContentSong) ? "cover" : ContentSong;
        ContentHook = "building Florida Night R&B after work";
        ContentCaption = "Raw vocal -> Late Night Chrome. Building Florida Night R&B after work.";
        ContentVisualDirection = "First 3 sec raw vocal, quick GateKPT screen cut, processed vocal enters, warm orange light.";
        ContentNextAction = "Record raw vocal, render Late Night Chrome, compare both, export vertical clip.";
        ContentTone = "playful, romantic, humble, smart, noble";
        ContentPreset = "Raw Clean first, Late Night Chrome only if the hook needs shine";
        ContentLanguage = "English with Spanish color";
        ContentTerrain = "orange glow / night road";
        ContentPillar = "Process / Cover";
        ContentCta = "Raw or polished?";
        ContentPostStatus = "Staged";
        ContentPlanStatus = "Primed Raw to Chrome: raw vocal first, polished vocal second.";
        Status = ContentPlanStatus;
        RefreshContentPlanSignals();
    }

    [RelayCommand]
    private void PrimeAfterWorkContent()
    {
        ContentMission = "After Work Hook";
        ContentSeries = "After Work Covers";
        ContentFormat = "Cover clip";
        ContentPlatform = "Snapchat first / TikTok + Reels + YouTube Shorts if usable";
        ContentSetting = "room light / car light / orange glow";
        ContentHook = "recorded this after work";
        ContentCaption = "Recorded this after work. One cover, one take, one sound.";
        ContentVisualDirection = "Face visible, simple frame, black shirt, clean vocal, lyric caption.";
        ContentNextAction = ContentTonightSequence;
        ContentTone = "humble, charming, direct, a little funny";
        ContentPreset = "Raw Clean for verse, Late Night Chrome only on chorus";
        ContentLanguage = "English with optional Spanish color";
        ContentTerrain = "room light / car light / orange glow";
        ContentPillar = "Cover / Process";
        ContentCta = "Should I finish this?";
        ContentPostStatus = "Staged";
        ContentPlanStatus = "Primed after-work plan: keep it simple and post before perfect.";
        Status = ContentPlanStatus;
        RefreshContentPlanSignals();
    }

    [RelayCommand]
    private void PrimeRawGuitarCover()
    {
        ContentMission = "Raw Guitar Cover";
        ContentSeries = "After Work Covers";
        ContentFormat = "Guitar + vocal cover";
        ContentPlatform = "TikTok / Reels / YouTube Shorts";
        ContentSetting = "room light / night road";
        ContentHook = "one guitar, one voice, one feeling";
        ContentCaption = "One guitar, one voice, one feeling. Florida Night Pop.";
        ContentVisualDirection = "Close guitar frame, face visible, warm orange side light, lyric caption.";
        ContentNextAction = "Record guitar/vocal pass, keep the imperfect charm, use Raw Clean, export vertical.";
        ContentTone = "dreamy, humble, playful, romantic";
        ContentPreset = "Raw Clean";
        ContentLanguage = "English";
        ContentTerrain = "room light / night road";
        ContentPillar = "Cover";
        ContentCta = "Does this hook work?";
        ContentPostStatus = "Staged";
        ContentPlanStatus = "Primed raw guitar cover.";
        Status = ContentPlanStatus;
        RefreshContentPlanSignals();
    }

    [RelayCommand]
    private void PrimeGoofyHookSeed()
    {
        ContentMission = "Goofy Hook Seed";
        ContentSeries = "Hook Seeds";
        ContentFormat = "Goofy hook / melody idea";
        ContentPlatform = "Snapchat / TikTok";
        ContentSetting = "room / car / after-work reset";
        ContentHook = "this hook might be stupid but it works";
        ContentCaption = "This hook might be stupid but it works. Keeping the charm.";
        ContentVisualDirection = "Phone-camera energy, visible smile, quick lyric text, no over-polish.";
        ContentNextAction = "Record the silly first idea, save the hook, do not judge it too early.";
        ContentTone = "goofy, youthful, smart, charming";
        ContentPreset = "Raw Clean or Silk Synth if the hook wants to feel synthetic";
        ContentLanguage = "English";
        ContentTerrain = "room / car / after-work reset";
        ContentPillar = "Process / Build";
        ContentCta = "Too goofy or just right?";
        ContentPostStatus = "Seed";
        ContentPlanStatus = "Primed goofy hook seed.";
        Status = ContentPlanStatus;
        RefreshContentPlanSignals();
    }

    [RelayCommand]
    private void PrimeSpanishColorLine()
    {
        ContentMission = "Spanish Color Line";
        ContentSeries = "Spanish Color";
        ContentFormat = "Spanish / Spanglish line";
        ContentPlatform = "Reels / TikTok / YouTube Shorts";
        ContentSetting = "orange glow / night road";
        ContentHook = "una linea, un feeling";
        ContentCaption = "Una linea, un feeling. Spanish color without forcing it.";
        ContentVisualDirection = "Smooth close vocal, warm light, simple translation caption, teal waveform line.";
        ContentNextAction = "Write one Spanish phrase, sing it naturally, try Luna Pop, save the line.";
        ContentTone = "smooth, romantic, humble, playful";
        ContentPreset = "Luna Pop";
        ContentLanguage = "Spanish / Spanglish";
        ContentTerrain = "orange glow / night road";
        ContentPillar = "Cover / World";
        ContentCta = "Does the Spanish line feel natural?";
        ContentPostStatus = "Seed";
        ContentPlanStatus = "Primed Spanish color line.";
        Status = ContentPlanStatus;
        RefreshContentPlanSignals();
    }

    [RelayCommand]
    private void PrimeFloridaFieldNote()
    {
        ContentMission = "Florida Field Note";
        ContentSeries = "World Captures";
        ContentFormat = "Field sound / voice note";
        ContentPlatform = "Snapchat / Website archive / TikTok texture";
        ContentSetting = "night road / parking lot / lake / storm";
        ContentSong = "field sound";
        ContentHook = "capture the world before it disappears";
        ContentCaption = "Captured the world before it disappeared. This might become a song.";
        ContentVisualDirection = "Short field shot, no over-editing, waveform terrain, place first.";
        ContentNextAction = "Record rain, insects, car ambience, room tone, or a gym recovery voice note. Link it to one hook.";
        ContentTone = "curious, humble, late-night, cinematic";
        ContentPreset = "No polish unless it becomes a song intro";
        ContentLanguage = "Field sound / voice note";
        ContentTerrain = "night road / parking lot / lake / storm";
        ContentPillar = "World";
        ContentCta = "Does this feel like Florida at night?";
        ContentPostStatus = "Field seed";
        ContentPlanStatus = "Primed Florida field note.";
        Status = ContentPlanStatus;
        RefreshContentPlanSignals();
    }

    [RelayCommand]
    private void PrimePhoneVideoCover()
    {
        ContentMission = "Phone Video Cover";
        ContentSeries = "After Work Covers";
        ContentFormat = "Phone video + GateKPT audio";
        ContentPlatform = "TikTok / Reels / YouTube Shorts";
        ContentSetting = "room light / car light / orange glow";
        ContentSong = string.IsNullOrWhiteSpace(ContentSong) ? "cover" : ContentSong;
        ContentHook = "phone video feeling, GateKPT audio";
        ContentCaption = "Phone video feeling, GateKPT audio. Building Florida Night Pop.";
        ContentVisualDirection = "Phone camera for feeling, GateKPT audio for quality, lyric caption, visualizer optional.";
        ContentNextAction = "Record phone video, record clean GateKPT audio, sync, export vertical.";
        ContentTone = "human, charming, romantic, direct";
        ContentPreset = "Raw Clean first, Late Night Chrome only if chorus needs shine";
        ContentLanguage = "English with Spanish color";
        ContentTerrain = "room / car / night road";
        ContentPillar = "Cover / Process";
        ContentCta = "Would this work as a full cover?";
        ContentPostStatus = "Staged";
        ContentPlanStatus = "Primed phone video cover.";
        Status = ContentPlanStatus;
        RefreshContentPlanSignals();
    }

    [RelayCommand]
    private void PrimeNobleNote()
    {
        ContentMission = "Noble Note";
        ContentSeries = "Noble Notes";
        ContentFormat = "spoken/sung note";
        ContentPlatform = "Snapchat / Instagram Story / TikTok";
        ContentSetting = "car light / trail / quiet room";
        ContentHook = "I can build this alone";
        ContentCaption = "I can build this alone. One song, one sound, one visual, one post.";
        ContentVisualDirection = "Still frame, low light, clean caption, no fake flex.";
        ContentNextAction = "Record one honest sentence, add soft guitar or field sound, save as a hook seed.";
        ContentTone = "noble, direct, intelligent, self-respecting";
        ContentPreset = "Raw Clean";
        ContentLanguage = "English";
        ContentTerrain = "car light / trail / quiet room";
        ContentPillar = "World / Build";
        ContentCta = "Does this feel honest?";
        ContentPostStatus = "Journal seed";
        ContentPlanStatus = "Primed noble note.";
        Status = ContentPlanStatus;
        RefreshContentPlanSignals();
    }

    private void RefreshContentPlanSignals()
    {
        OnPropertyChanged(nameof(ContentPlanSummary));
        OnPropertyChanged(nameof(ContentRecordingPlan));
        OnPropertyChanged(nameof(ContentPlatformPlan));
        OnPropertyChanged(nameof(ContentShotPlan));
        OnPropertyChanged(nameof(ContentAudiencePromise));
        OnPropertyChanged(nameof(ContentEngineFormula));
        OnPropertyChanged(nameof(ContentTonightSequence));
        OnPropertyChanged(nameof(ContentMissionGuide));
        OnPropertyChanged(nameof(ContentPostPackPreview));
        OnPropertyChanged(nameof(ContentArchiveReviewSummary));
        OnPropertyChanged(nameof(ContentEpPlanSignal));
        OnPropertyChanged(nameof(ContentPlatformChecklist));
        OnPropertyChanged(nameof(BestArtistSessionSignal));
    }

    private static string PlatformCaption(string platform, string hook, string song)
    {
        var lower = platform.ToLowerInvariant();
        if (lower.Contains("snap"))
        {
            return $"{hook} {song}. quick sound test.";
        }

        if (lower.Contains("tiktok"))
        {
            return $"{hook} {song}. if this hits, I’ll build the full version.";
        }

        if (lower.Contains("insta") || lower.Contains("reel"))
        {
            return $"{hook} {song}. recorded, shaped, and saved as a visual.";
        }

        if (lower.Contains("youtube") && !lower.Contains("short"))
        {
            return $"{hook} {song}. Full take/process note for the archive.";
        }

        return $"{hook} {song}.";
    }

    private static string PlatformNextAction(string platform, string format, string song)
    {
        var lower = platform.ToLowerInvariant();
        var source = format.Contains("drum", StringComparison.OrdinalIgnoreCase)
            ? "record drum groove"
            : format.Contains("guitar", StringComparison.OrdinalIgnoreCase) || format.Contains("keys", StringComparison.OrdinalIgnoreCase)
                ? "record guitar/keys phrase"
                : format.Contains("dance", StringComparison.OrdinalIgnoreCase) || format.Contains("visual", StringComparison.OrdinalIgnoreCase)
                    ? "record audio bed"
                    : $"record {song}";

        if (lower.Contains("snap"))
        {
            return $"{source}, post the raw moment, keep it casual.";
        }

        if (lower.Contains("tiktok"))
        {
            return $"{source}, add visualizer motion, keep the first second obvious.";
        }

        if (lower.Contains("insta") || lower.Contains("reel"))
        {
            return $"{source}, choose strongest frame, add caption/subtitle, export vertical.";
        }

        if (lower.Contains("youtube") && !lower.Contains("short"))
        {
            return $"{source}, save clean audio, pair with phone video, archive a longer version.";
        }

        return $"{source}, style the take, export one vertical clip.";
    }

    [RelayCommand]
    private void SaveContentPlan()
    {
        var title = string.IsNullOrWhiteSpace(ContentSong)
            ? $"{ContentFormat} / {ContentSetting}"
            : ContentSong.Trim();
        var lyricText =
            $"{ContentHook}{Environment.NewLine}{ContentCaption}{Environment.NewLine}{Environment.NewLine}Mission: {ContentMission}{Environment.NewLine}Tone: {ContentTone}{Environment.NewLine}Preset: {ContentPreset}{Environment.NewLine}Next: {ContentNextAction}";

        LyricIdeas.Insert(0, new LyricIdeaItem(
            title,
            "Content",
            ContentMission,
            $"{ContentFormat}, {ContentPlatform}, {ContentSetting}, {ContentTone}",
            lyricText,
            DateTime.Now.ToString("yyyy-MM-dd")));
        while (LyricIdeas.Count > 50)
        {
            LyricIdeas.RemoveAt(LyricIdeas.Count - 1);
        }

        Captions.Insert(0, new CaptionLine(
            "00:00.000",
            "00:03.000",
            ContentCaption,
            "Safe draft",
            $"Mission: {ContentMission}. Tone: {ContentTone}. Preset: {ContentPreset}. Visual: {ContentVisualDirection}"));
        while (Captions.Count > 24)
        {
            Captions.RemoveAt(Captions.Count - 1);
        }

        RecentCaptures.Insert(0, new CaptureItem(
            $"Post pack / {ContentMission}",
            $"{ContentFormat}. {ContentSetting}. {ContentTone}. {ContentNextAction}",
            DateTime.Now.ToString("h:mm tt"),
            "Content Lab"));
        while (RecentCaptures.Count > 8)
        {
            RecentCaptures.RemoveAt(RecentCaptures.Count - 1);
        }

        var session = CurrentArtistSession(title);
        ArtistSessions.Insert(0, session);
        while (ArtistSessions.Count > 24)
        {
            ArtistSessions.RemoveAt(ArtistSessions.Count - 1);
        }

        VisualizerLyricSource = title;
        _store.SaveLyricIdeas(LyricIdeas);
        _store.SaveCaptions(Captions);
        _store.SaveCaptures(RecentCaptures);
        _store.SaveArtistSessions(ArtistSessions);
        UpdateCaptionStatus();
        RefreshProjectModules();
        SaveProjectSnapshot("Content plan saved");
        ContentPlanStatus = $"Saved content plan: {title}";
        ContentReviewNote = $"Review later: {ContentMission} / {ContentPlatform}. Did the charm come through?";
        Status = ContentPlanStatus;
        OnPropertyChanged(nameof(ContentArchiveReviewSummary));
        OnPropertyChanged(nameof(BestArtistSessionSignal));
    }

    private ArtistSessionItem CurrentArtistSession(string title)
    {
        var now = DateTime.Now;
        var coverOrOriginal =
            ContentMission.Contains("cover", StringComparison.OrdinalIgnoreCase)
            || ContentFormat.Contains("cover", StringComparison.OrdinalIgnoreCase)
                ? "Cover"
                : "Original / seed";
        var lane =
            ContentPreset.Contains("Chrome", StringComparison.OrdinalIgnoreCase)
                ? "Glossy Hook"
                : ContentPreset.Contains("Luna", StringComparison.OrdinalIgnoreCase)
                    ? "Spanish Smooth"
                    : ContentMission.Contains("field", StringComparison.OrdinalIgnoreCase)
                        ? "Field Note"
                        : ContentMission.Contains("guitar", StringComparison.OrdinalIgnoreCase)
                            ? "Raw Guitar Pop"
                            : "Florida Night Pop/R&B";

        return new ArtistSessionItem(
            Guid.NewGuid().ToString("N"),
            title,
            ContentMission,
            coverOrOriginal,
            ContentLanguage,
            ContentHook,
            lane,
            ContentTone,
            ContentTerrain,
            ContentPillar,
            ContentPreset,
            "",
            ContentMission.Contains("field", StringComparison.OrdinalIgnoreCase) ? ContentSetting : "",
            "",
            "",
            "",
            ContentCaption,
            ContentHashtags,
            ContentPlatformChecklist,
            ContentPostStatus,
            $"{ContentPostPackPreview}{Environment.NewLine}{ContentNextAction}{Environment.NewLine}Review: {ContentReviewNote}",
            now.ToString("yyyy-MM-dd HH:mm:ss"),
            now.ToString("yyyy-MM-dd HH:mm:ss"));
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
        _store.SaveSongWorkflow(CurrentSongWorkflow());
        _store.SaveLyricIdeas(LyricIdeas);
        _store.SaveVisualizer(CurrentVisualizerSettings());
        _store.SaveCaptions(Captions);
        _store.SavePerformanceLayers(PerformanceLayers);
        _store.SaveInstrumentChannels(InstrumentChannels);
        _store.SaveLooperTracks(LooperTracks);
        _store.SaveWorldMemory(WorldMemories);
        _store.SaveArtistSessions(ArtistSessions);
        SaveProjectSnapshot("Library saved");
        Status = $"Library saved to {LibraryPath}";
    }

    [RelayCommand]
    private void SaveProjectSnapshot()
    {
        SaveProjectSnapshot("Project memory saved");
        Status = ProjectMemoryStatus;
    }

    [RelayCommand]
    private void RefreshProjectMemory()
    {
        SaveProjectSnapshot("Project memory refreshed");
        Status = "Project Memory inspector refreshed and saved.";
    }

    [RelayCommand]
    private async Task CopyCreativeBrief()
    {
        try
        {
            if (Application.Current?.ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop &&
                desktop.MainWindow?.Clipboard is { } clipboard)
            {
                await clipboard.SetTextAsync(TodaysCreativeBrief);
                Status = "Creative brief copied to clipboard.";
                return;
            }

            Status = "Clipboard unavailable. Creative brief is visible in Project Memory.";
        }
        catch (Exception ex)
        {
            Status = $"Could not copy creative brief: {ex.Message}";
        }
    }

    [RelayCommand]
    private void PrimeSessionLaunchChecklist()
    {
        CaptureTitle = $"{SelectedRoom.Name} launch checklist";
        CaptureNotes = string.Join(Environment.NewLine, SessionLaunchChecklist.Select((item, index) => $"{index + 1}. {item}"));
        Status = "Session launch checklist primed in capture notes.";
    }

    [RelayCommand]
    private void PrimeRecordingSession()
    {
        SelectedRoom = Rooms.FirstOrDefault(room => room.Name == "Song Builder") ?? SelectedRoom;
        PrimeNextLooperLane();
        CaptureTitle = $"{ProjectName} recording session";
        CaptureNotes = string.Join(Environment.NewLine, SessionWorkflowChecklist.Select((item, index) => $"{index + 1}. {item}"));
        Status = $"Step 1 complete: {SessionSelectedLaneSignal} Scroll down to Built-in Looper, then use Timed record.";
    }

    [RelayCommand]
    private void OpenRecorderControls()
    {
        SelectedRoom = Rooms.FirstOrDefault(room => room.Name == "Song Builder") ?? SelectedRoom;
        Status = "Step 2: use the Built-in Looper controls below. Recommended order: Auto Focusrite, 3s input test, Timed record, Play arrangement.";
    }

    [RelayCommand]
    private void ExportSessionPackage()
    {
        try
        {
            SaveLibrary();
            var packageDirectory = CreateSessionPackage();
            LastAutosavePath = packageDirectory;
            RefreshAutosaveFiles();
            Status = $"Step 3 complete: session package saved at {packageDirectory}";
        }
        catch (Exception ex)
        {
            Status = $"Could not export session package: {ex.Message}";
        }
    }

    [RelayCommand]
    private void OpenSessionPackagesFolder()
    {
        try
        {
            var packageRoot = System.IO.Path.Combine(LibraryPath, "session-packages");
            System.IO.Directory.CreateDirectory(packageRoot);
            Process.Start(new ProcessStartInfo
            {
                FileName = packageRoot,
                UseShellExecute = true
            });
            Status = $"Opened session packages folder: {packageRoot}";
        }
        catch (Exception ex)
        {
            Status = $"Could not open session packages folder: {ex.Message}";
        }
    }

    [RelayCommand]
    private void StartRoomPass()
    {
        var title = $"{SelectedRoom.Name} 60-minute pass";
        var detail = string.Join(" ", SessionLaunchChecklist.Select((item, index) => $"{index + 1}. {item}"));

        RecentCaptures.Insert(0, new CaptureItem(title, detail, DateTime.Now.ToString("h:mm tt"), SelectedRoom.Name));
        while (RecentCaptures.Count > 8)
        {
            RecentCaptures.RemoveAt(RecentCaptures.Count - 1);
        }

        PinnedProjectMemoryItem = new ProjectMemoryTimelineItem(
            DateTime.Now.ToString("h:mm tt"),
            SelectedRoom.Name,
            SelectedRoom.Name,
            "Captures",
            title,
            detail,
            SelectedRoom.Accent);
        CaptureTitle = title;
        CaptureNotes = detail;
        _store.SaveCaptures(RecentCaptures);
        SaveProjectSnapshot("Room pass started");
        Status = $"Started and pinned {SelectedRoom.Name} room pass.";
    }

    [RelayCommand]
    private void PinSelectedProjectMemory()
    {
        if (SelectedProjectMemoryTimelineItem is null)
        {
            Status = "Select a project memory item to pin.";
            return;
        }

        PinnedProjectMemoryItem = SelectedProjectMemoryTimelineItem;
        SelectedRoom = Rooms.FirstOrDefault(room => room.Name == PinnedProjectMemoryItem.TargetRoom) ?? SelectedRoom;
        CaptureTitle = $"{PinnedProjectMemoryItem.TargetRoom} priority";
        CaptureNotes = $"Pinned memory: {PinnedProjectMemoryItem.Title}. {PinnedProjectMemoryItem.Detail}";
        Status = $"Pinned next action: {PinnedProjectMemoryItem.Title}";
    }

    [RelayCommand]
    private void PinCurrentCapture()
    {
        var title = string.IsNullOrWhiteSpace(CaptureTitle)
            ? $"{SelectedRoom.Name} action"
            : CaptureTitle.Trim();
        var detail = string.IsNullOrWhiteSpace(CaptureNotes)
            ? CaptureHint
            : CaptureNotes.Trim();

        PinnedProjectMemoryItem = new ProjectMemoryTimelineItem(
            DateTime.Now.ToString("h:mm tt"),
            SelectedRoom.Name,
            SelectedRoom.Name,
            "Captures",
            title,
            detail,
            SelectedRoom.Accent);
        CaptureTitle = $"{SelectedRoom.Name} priority";
        CaptureNotes = $"Pinned current draft: {title}. {detail}";
        Status = $"Pinned current draft: {title}";
    }

    [RelayCommand]
    private void OpenPinnedProjectMemory()
    {
        if (PinnedProjectMemoryItem is null)
        {
            Status = "No pinned project memory action to resume.";
            return;
        }

        SelectedRoom = Rooms.FirstOrDefault(room => room.Name == PinnedProjectMemoryItem.TargetRoom) ?? SelectedRoom;
        CaptureTitle = $"{PinnedProjectMemoryItem.TargetRoom} priority";
        CaptureNotes = $"Resume pinned memory: {PinnedProjectMemoryItem.Title}. {PinnedProjectMemoryItem.Detail}";
        Status = $"Resumed pinned memory: {PinnedProjectMemoryItem.Title}";
    }

    [RelayCommand]
    private void ClearPinnedProjectMemory()
    {
        PinnedProjectMemoryItem = null;
        Status = "Cleared pinned project memory action.";
    }

    [RelayCommand]
    private void CompletePinnedProjectMemory()
    {
        if (PinnedProjectMemoryItem is null)
        {
            Status = "No pinned project memory action to complete.";
            return;
        }

        var completed = PinnedProjectMemoryItem;
        var room = Rooms.FirstOrDefault(item => item.Name == completed.TargetRoom);
        if (room is not null)
        {
            SelectedRoom = room;
        }

        RecentCaptures.Insert(0, new CaptureItem(
            $"Completed: {completed.Title}",
            $"Closed pinned memory from {completed.Room}: {completed.Detail}",
            DateTime.Now.ToString("h:mm tt"),
            completed.TargetRoom));
        CompletionHistory.Insert(0, new ProjectCompletionRecord(
            DateTime.Now.ToString("O"),
            completed.TargetRoom,
            completed.Title,
            completed.Detail));
        while (CompletionHistory.Count > 89)
        {
            CompletionHistory.RemoveAt(CompletionHistory.Count - 1);
        }

        while (RecentCaptures.Count > 8)
        {
            RecentCaptures.RemoveAt(RecentCaptures.Count - 1);
        }

        _store.SaveCaptures(RecentCaptures);
        _store.SaveCompletionHistory(CompletionHistory);
        PinnedProjectMemoryItem = null;
        CaptureTitle = $"{completed.TargetRoom} capture";
        CaptureNotes = "";
        SaveProjectSnapshot("Pinned memory completed");
        Status = $"Completed pinned memory: {completed.Title}";
    }

    [RelayCommand]
    private void UndoLatestCompletion()
    {
        var latest = CompletionHistory.FirstOrDefault();
        if (latest is null)
        {
            Status = "No completed pinned action to undo.";
            return;
        }

        CompletionHistory.Remove(latest);
        _store.SaveCompletionHistory(CompletionHistory);
        RefreshProjectMemoryInspector();
        SaveProjectSnapshot("Latest completion undone");
        Status = $"Undid completed memory: {latest.Title}";
    }

    [RelayCommand]
    private void OpenProjectFolder()
    {
        try
        {
            SaveProjectSnapshot("Project memory saved before opening folder");
            Process.Start(new ProcessStartInfo
            {
                FileName = LibraryPath,
                UseShellExecute = true
            });
            Status = $"Opened project memory folder: {LibraryPath}";
        }
        catch (Exception ex)
        {
            Status = $"Could not open project folder: {ex.Message}";
        }
    }

    [RelayCommand]
    private void PrimeNextProjectGap()
    {
        var gap = MissingProjectPieces().FirstOrDefault();
        if (gap is null)
        {
            SelectedProjectModule = ProjectModules.FirstOrDefault(item => item.Name == "Song Builder");
            CaptureTitle = "Next version action";
            CaptureNotes = "Choose the next version: new hook, stronger take, caption polish, visual pass, routing recall, or export.";
            Status = "No obvious project gaps. Primed next version.";
            return;
        }

        SelectedProjectModule = ProjectModules.FirstOrDefault(item => item.Name == gap.ModuleName);
        if (gap.Label is "drums" or "harmony" or "vocal")
        {
            SelectedRoom = Rooms.FirstOrDefault(room => room.Name == "Song Builder") ?? SelectedRoom;
            PrimeNextLooperLane();
        }

        Status = $"Primed missing piece: {gap.Label}";
    }

    [RelayCommand]
    private void WriteProductionBrief()
    {
        SaveLibrary();
        LastBriefPath = _briefs.WriteBrief(
            LibraryPath,
            CurrentProjectSettings(),
            CurrentSongWorkflow(),
            CurrentVisualizerSettings(),
            RecentCaptures,
            TimelineMarkers,
            TakeReviews,
            LyricIdeas,
            Captions,
            ExportQueue,
            ExportHistory);
        LastAutosavePath = LastBriefPath;
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
        SaveProjectSnapshot("Media analysis saved");
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
            LastAutosavePath = LastExportPath;
            AddExportHistory(SelectedExportPreset.Name, SelectedAudioPreset.Name, SyncOffsetMs, LastExportPath);
            RecentCaptures.Insert(0, new CaptureItem(
                "Rendered review clip",
                $"{SelectedExportPreset.Name}: {LastExportPath}",
                DateTime.Now.ToString("h:mm tt"),
                "Export"));
            _store.SaveCaptures(RecentCaptures);
            _store.SaveExportHistory(ExportHistory);
            SaveProjectSnapshot("Review render saved");
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
        SaveProjectSnapshot("Export queued");
        Status = $"Queued {SelectedExportPreset.Name} export.";
    }

    private bool TryQueueExportFromTake(string takeName)
    {
        if (ValidateMediaSelection() is not null)
        {
            CaptureNotes = string.IsNullOrWhiteSpace(CaptureNotes)
                ? $"Export decision for {takeName}: select video and vocal files, then queue export."
                : $"{CaptureNotes}{Environment.NewLine}Export decision for {takeName}: select video and vocal files, then queue export.";
            return false;
        }

        ExportQueue.Insert(0, new ExportQueueItem(
            Guid.NewGuid().ToString("N"),
            DateTime.Now.ToString("yyyy-MM-dd h:mm tt"),
            VideoPath,
            VocalPath,
            SyncOffsetMs,
            SelectedExportPreset.Slug,
            $"{SelectedExportPreset.Name} / {takeName}",
            SelectedAudioPreset.Slug,
            SelectedAudioPreset.Name,
            "Queued",
            ""));
        _store.SaveExportQueue(ExportQueue);
        OnPropertyChanged(nameof(ExportQueueLabel));
        SaveProjectSnapshot("Export queued from take decision");
        return true;
    }

    private static string DefaultNextActionForDecision(string decision) => decision switch
    {
        "Keep" => "Mark the strongest section and reuse that energy in the next layer.",
        "Fix" => "Tighten timing, lip sync, pitch, or mix issue, then review again.",
        "Re-record" => "Record a new pass with one correction target, not five.",
        "Export" => "Queue export, render review clip, then check captions before posting.",
        _ => "Write the next concrete move before leaving the take.",
    };

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
            LastAutosavePath = output;
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
        SaveProjectSnapshot("Export memory updated");
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
        SaveProjectSnapshot("Timeline marker saved");
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
            DateTime.Now.ToString("yyyy-MM-dd"),
            string.IsNullOrWhiteSpace(TakeDecision) ? "Fix" : TakeDecision.Trim(),
            string.IsNullOrWhiteSpace(TakeNextAction) ? "No next action written." : TakeNextAction.Trim(),
            SelectedAutosaveFile?.Path ?? LastAutosavePath));
        while (TakeReviews.Count > 20)
        {
            TakeReviews.RemoveAt(TakeReviews.Count - 1);
        }

        _store.SaveTakeReviews(TakeReviews);
        SaveProjectSnapshot("Take review saved");
        OnPropertyChanged(nameof(TakeDecisionSignal));
        var queuedExport = TakeDecision == "Export" && TryQueueExportFromTake(name);
        TakeName = $"Take {TakeReviews.Count + 1:00}";
        TakeDecision = "Fix";
        TakeNextAction = "Tighten timing, then review again.";
        TakeNotes = "";
        Status = queuedExport
            ? $"Saved take review and queued export: {name}"
            : $"Saved take review: {name}";
    }

    [RelayCommand]
    private void PrimeTakeDecision()
    {
        var attached = SelectedAutosaveFile;
        TakeName = attached is null ? $"Take {TakeReviews.Count + 1:00}" : System.IO.Path.GetFileNameWithoutExtension(attached.Name);
        TakeNotes = attached is null
            ? $"Room: {SelectedRoom.Name}. Listen for timing, emotion, consonants, and whether this supports {ProjectName}."
            : $"Review attached autosave: {attached.Name}. {attached.Summary}. Listen for timing, emotion, signal level, and whether this supports {ProjectName}.";
        TakeNextAction = DefaultNextActionForDecision(TakeDecision);
        Status = "Take decision primed.";
    }

    [RelayCommand]
    private void SaveLooperArrangementTake()
    {
        var recorded = LooperTracks
            .Where(track => !string.IsNullOrWhiteSpace(track.StemPath))
            .OrderBy(track => track.Number)
            .ToList();

        if (recorded.Count == 0)
        {
            Status = "Record at least one looper lane before saving an arrangement take.";
            return;
        }

        var name = $"Loop Arrangement {TakeReviews.Count + 1:00}";
        var laneSummary = string.Join("; ", recorded.Select(track =>
            $"{track.Instrument}: {track.DurationLabel}, {track.TakeArchiveSummary}, {track.Mode}, vol {track.Volume:0}%"));
        var missing = LooperTracks
            .Where(track => string.IsNullOrWhiteSpace(track.StemPath))
            .Select(track => track.Instrument)
            .ToList();
        var notes = missing.Count == 0
            ? $"Full loop arrangement captured. {laneSummary}"
            : $"Partial loop arrangement captured. Missing: {string.Join(", ", missing)}. {laneSummary}";
        var decision = missing.Count == 0 ? "Keep" : "Fix";
        var nextAction = missing.Count == 0
            ? "Play arrangement, reveal the visual painting, then decide whether to export or overdub one support layer."
            : $"Record missing lane: {missing.First()}.";

        TakeReviews.Insert(0, new TakeReviewItem(
            name,
            Math.Clamp(recorded.Count, 1, 5),
            notes,
            DateTime.Now.ToString("yyyy-MM-dd"),
            decision,
            nextAction,
            recorded.FirstOrDefault()?.StemPath ?? LastAutosavePath));
        while (TakeReviews.Count > 20)
        {
            TakeReviews.RemoveAt(TakeReviews.Count - 1);
        }

        _store.SaveTakeReviews(TakeReviews);
        SaveProjectSnapshot("Looper arrangement take saved");
        OnPropertyChanged(nameof(TakeDecisionSignal));
        Status = $"Saved looper arrangement take: {name}";
    }

    [RelayCommand]
    private void ExportLooperArrangementMix()
    {
        var soloActive = LooperTracks.Any(track => track.Solo);
        var playable = LooperTracks
            .Where(track =>
                !string.IsNullOrWhiteSpace(track.StemPath)
                && System.IO.File.Exists(track.StemPath)
                && !track.Muted
                && (!soloActive || track.Solo))
            .OrderBy(track => track.Number)
            .ToList();

        if (playable.Count == 0)
        {
            LooperEngineStatus = "No playable recorded lanes to export.";
            LooperTransportStatus = "Export blocked.";
            Status = LooperEngineStatus;
            return;
        }

        _looperPlayback.StopAll();
        System.IO.Directory.CreateDirectory(StemDirectory);
        var targetPath = AutoSaveFileNamer.CreatePath(StemDirectory, "looper-arrangement-mix", ".wav");
        var result = _layerMixdown.CreateMixdown(playable.Select(track => track.StemPath), targetPath);
        if (!result.Success)
        {
            LooperEngineStatus = result.Message;
            LooperTransportStatus = "Export failed.";
            Status = result.Message;
            return;
        }

        LastAutosavePath = result.Path;
        ActiveStemPath = result.Path;
        RefreshAutosaveFiles();
        var included = string.Join(", ", playable.Select(track => track.Instrument));
        LooperEngineStatus = $"{result.Message} Included: {included}.";
        LooperTransportStatus = $"Exported arrangement WAV: {System.IO.Path.GetFileName(result.Path)}";
        Status = LooperEngineStatus;
        OnPropertyChanged(nameof(LooperExportSignal));
        SaveProjectSnapshot("Looper arrangement mix exported");
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
        SaveProjectSnapshot("Routing saved");
        Status = "Saved Focusrite / RC-505 routing preferences.";
    }

    [RelayCommand]
    private void AutoConfigureFocusrite()
    {
        var selection = _focusrite.Detect();
        if (selection.HasInput)
        {
            PreferredAudioInput = selection.InputName;
            InstrumentInputNote = selection.InputName;
        }

        if (selection.HasOutput)
        {
            PreferredAudioOutput = selection.OutputName;
        }

        FocusriteTestStatus = selection.Summary;
        _store.SaveHardwareRouting(CurrentHardwareRouting());
        SaveProjectSnapshot("Focusrite auto configured");
        OnPropertyChanged(nameof(LooperTestNextStep));
        Status = FocusriteTestStatus;
    }

    [RelayCommand]
    private async Task RunFocusriteInputTest()
    {
        AutoConfigureFocusrite();
        FocusriteTestStatus = "Recording 3-second Focusrite input test. Play or tap an instrument now.";
        var result = await _focusrite.RunInputTestAsync(
            PreferredAudioInput,
            System.IO.Path.Combine(LibraryPath, "diagnostics"),
            3);
        LastFocusriteTestPath = result.Path;
        FocusritePeakPercent = result.PeakPercent;
        UpdateFocusriteCalibration(result.PeakPercent);
        OnPropertyChanged(nameof(LooperTestNextStep));
        FocusriteTestStatus = result.Message;
        Status = result.Message;

        if (result.Success)
        {
            ActiveStemPath = result.Path;
            LastAutosavePath = result.Path;
            RecentCaptures.Insert(0, new CaptureItem(
                "Focusrite input test",
                $"{result.Message} File: {result.Path}",
                DateTime.Now.ToString("h:mm tt"),
                "Rig Routing"));
            while (RecentCaptures.Count > 8)
            {
                RecentCaptures.RemoveAt(RecentCaptures.Count - 1);
            }

            _store.SaveCaptures(RecentCaptures);
            SaveProjectSnapshot("Focusrite input test saved");
        }
    }

    [RelayCommand]
    private void PlayFocusriteTest()
    {
        try
        {
            if (string.IsNullOrWhiteSpace(LastFocusriteTestPath) || !System.IO.File.Exists(LastFocusriteTestPath))
            {
                FocusriteTestStatus = "No Focusrite test file to play yet.";
                Status = FocusriteTestStatus;
                return;
            }

            var result = _looperPlayback.PlayLoop(99, LastFocusriteTestPath, 70);
            FocusriteTestStatus = result.Message;
            Status = result.Message;
        }
        catch (Exception ex)
        {
            FocusriteTestStatus = $"Could not play Focusrite test: {ex.Message}";
            Status = FocusriteTestStatus;
        }
    }

    [RelayCommand]
    private void StopFocusriteTestPlayback()
    {
        _looperPlayback.Stop(99);
        FocusriteTestStatus = "Stopped Focusrite test playback.";
        Status = FocusriteTestStatus;
    }

    [RelayCommand]
    private void StartSimpleRecording()
    {
        if (SimpleRecordingActive)
        {
            Status = "Already recording. Press Stop & save first.";
            return;
        }

        AutoConfigureFocusrite();
        if (!PreferredAudioInput.Contains("Scarlett", StringComparison.OrdinalIgnoreCase)
            && !PreferredAudioInput.Contains("Focusrite", StringComparison.OrdinalIgnoreCase))
        {
            SimpleRecordingStatus = "No Scarlett input selected. Click Find Scarlett first.";
            Status = SimpleRecordingStatus;
            return;
        }

        var result = _layerRecorder.Start(PreferredAudioInput, StemDirectory, "simple-rc505-recording-test");
        SimpleRecordingActive = result.Success;
        SimpleRecordingStatus = result.Success
            ? $"Recording from {PreferredAudioInput}. Play the RC-505 now."
            : result.Message;
        ActiveStemPath = result.Success ? result.Path : ActiveStemPath;
        LastAutosavePath = result.Success ? result.Path : LastAutosavePath;
        Status = SimpleRecordingStatus;
    }

    [RelayCommand]
    private void StopSimpleRecording()
    {
        var result = _layerRecorder.Stop();
        SimpleRecordingActive = false;
        SimpleRecordingStatus = result.Success
            ? $"Saved recording: {result.Path}"
            : result.Message;
        Status = SimpleRecordingStatus;

        if (!result.Success)
        {
            return;
        }

        ActiveStemPath = result.Path;
        LastAutosavePath = result.Path;
        LayerInstrument = "Drums";
        AddPerformanceLayer(result.Path, result.DurationLabel);
        RefreshAutosaveFiles();
        SaveProjectSnapshot("Simple RC-505 recording saved");
    }

    [RelayCommand]
    private void StartInputMeter()
    {
        var result = _meter.Start(PreferredAudioInput, level =>
            Dispatcher.UIThread.Post(() =>
            {
                InputMeterLevel = Math.Round(level * 100, 1);
                InputMeterLabel = $"{InputMeterLevel:0.0}% input peak";
                UpdateVisualPaintingFromAudio();
                OnPropertyChanged(nameof(VisualizerPreviewDetail));
            }));

        Status = result.Message;
        InputMeterLabel = result.Success ? result.Message : "Meter idle";
        VisualPaintingStatus = result.Success
            ? "Art feed live. Play the RC-505 and let the visual painting build."
            : result.Message;
        VisualizerAlwaysOn = result.Success;
    }

    [RelayCommand]
    private void StopInputMeter()
    {
        _meter.Stop();
        InputMeterLevel = 0;
        InputMeterLabel = "Meter stopped";
        UpdateVisualPaintingFromAudio();
        VisualPaintingStatus = "Art feed stopped. The last painting state remains visible.";
        Status = "Live input meter stopped.";
    }

    [RelayCommand]
    private void StartVisualizerFeed()
    {
        VisualizerAlwaysOn = true;
        StartInputMeter();
    }

    [RelayCommand]
    private void RevealVisualizerPainting()
    {
        VisualizerRevealMode = true;
        ProjectorBlackout = false;
        SelectedRoom = Rooms.FirstOrDefault(room => room.Name == "Performance / Reveal") ?? SelectedRoom;
        VisualPaintingStatus = "Reveal mode armed: the song has become the backdrop.";
        Status = "Visualizer painting revealed.";
    }

    [RelayCommand]
    private void ExportVisualPainting()
    {
        var path = _visualPaintingExport.ExportSvg(
            LibraryPath,
            new VisualPaintingExport(
                VisualPaintingTitle,
                VisualPaintingMood,
                VisualPaintingComposition,
                VisualizerPalette,
                VisualizerMotion,
                SongSection,
                LayerInstrument,
                VisualPaintingSignature,
                VisualPulseSize,
                VisualBloomSize,
                VisualStrokeLevel,
                VisualizerIntensity,
                InputMeterLevel));
        LastAutosavePath = path;
        RecentCaptures.Insert(0, new CaptureItem(
            "Visual painting exported",
            path,
            DateTime.Now.ToString("h:mm tt"),
            "Visual"));
        while (RecentCaptures.Count > 8)
        {
            RecentCaptures.RemoveAt(RecentCaptures.Count - 1);
        }

        _store.SaveCaptures(RecentCaptures);
        SaveProjectSnapshot("Visual painting exported");
        RefreshAutosaveFiles();
        Status = $"Exported visual painting: {path}";
    }

    [RelayCommand]
    private void ExportRendererControlSnapshot()
    {
        var packet = CurrentVisualRendererPacket();
        var path = _visualRendererControl.ExportSnapshot(LibraryPath, packet);
        LastAutosavePath = path;
        RecentCaptures.Insert(0, new CaptureItem(
            "Renderer control snapshot",
            $"{packet.RendererPath}: {packet.Section} / {packet.Instrument} / energy {packet.Energy:P0}",
            DateTime.Now.ToString("h:mm tt"),
            "Visual"));
        while (RecentCaptures.Count > 8)
        {
            RecentCaptures.RemoveAt(RecentCaptures.Count - 1);
        }

        _store.SaveCaptures(RecentCaptures);
        SaveProjectSnapshot("Renderer control snapshot exported");
        RefreshAutosaveFiles();
        Status = $"Exported renderer control packet: {path}";
    }

    [RelayCommand]
    private void OpenPerformanceReveal()
    {
        SelectedRoom = Rooms.FirstOrDefault(room => room.Name == "Performance / Reveal") ?? SelectedRoom;
        VisualizerAlwaysOn = true;
        ProjectorBlackout = false;
        Status = "Performance / Reveal cockpit opened.";
    }

    [RelayCommand]
    private void ResetVisualizerPainting()
    {
        VisualizerRevealMode = false;
        VisualPulseSize = 144;
        VisualBloomSize = 220;
        VisualStrokeLevel = 34;
        VisualPaintingStatus = "Painting reset. Start art feed when the looper is playing.";
        VisualPaintingSignature = "No section stamped yet.";
        VisualPaintingStamps = 0;
        Status = "Visualizer painting reset.";
    }

    [RelayCommand]
    private void SaveSongStage()
    {
        _store.SaveSongWorkflow(CurrentSongWorkflow());
        RecentCaptures.Insert(0, new CaptureItem(
            $"{SelectedSongStage.Name} stage",
            $"{Tempo} / {KeyCenter}. {SongStageNotes}",
            DateTime.Now.ToString("h:mm tt"),
            "Song"));
        _store.SaveCaptures(RecentCaptures);
        RefreshProjectModules();
        OnPropertyChanged(nameof(NextCreativeAction));
        SaveProjectSnapshot("Song stage saved");
        Status = $"Saved {SelectedSongStage.Name} song stage.";
    }

    [RelayCommand]
    private void PrimeNextLayer()
    {
        var next = RecommendedNextLayer();
        LayerInstrument = next.Instrument;
        LayerBeatTarget = next.BeatTarget;
        LayerEffectIntent = next.EffectIntent;
        LayerNotes = next.Notes;
        SelectedRoom = Rooms.FirstOrDefault(room => room.Name == "Song Builder") ?? SelectedRoom;
        Status = $"Primed next layer: {LayerInstrument} on {LayerBeatTarget}.";
    }

    [RelayCommand]
    private void StartLayerRecording()
    {
        var layerName = $"{PerformanceLayers.Count + 1:00}-{LayerInstrument}-{LayerBeatTarget}";
        var result = _layerRecorder.Start(PreferredAudioInput, StemDirectory, layerName);
        ActiveStemPath = result.Path;
        LastAutosavePath = result.Success ? result.Path : LastAutosavePath;
        LayerRecordingStatus = result.Success
            ? $"{LayerCountInBeats}-beat count-in set. {result.Message}"
            : result.Message;
        Status = LayerRecordingStatus;
    }

    [RelayCommand]
    private void StopLayerRecording()
    {
        var result = _layerRecorder.Stop();
        ActiveStemPath = result.Path;
        LastStemDuration = result.DurationLabel;
        LastAutosavePath = result.Success ? result.Path : LastAutosavePath;
        LayerRecordingStatus = result.Message;
        Status = result.Message;

        if (result.Success)
        {
            AddPerformanceLayer(result.Path, result.DurationLabel);
        }
    }

    [RelayCommand]
    private void AddPerformanceLayer()
    {
        AddPerformanceLayer("", "");
    }

    private void AddPerformanceLayer(string stemPath, string durationLabel)
    {
        var instrument = string.IsNullOrWhiteSpace(LayerInstrument) ? "Layer" : LayerInstrument.Trim();
        var beatTarget = string.IsNullOrWhiteSpace(LayerBeatTarget) ? "Free time" : LayerBeatTarget.Trim();
        var effectIntent = string.IsNullOrWhiteSpace(LayerEffectIntent) ? "Clean" : LayerEffectIntent.Trim();
        var notes = string.IsNullOrWhiteSpace(LayerNotes)
            ? "Record the layer, listen once, then decide keep/fix/re-record."
            : LayerNotes.Trim();

        PerformanceLayers.Add(new PerformanceLayerItem(
            PerformanceLayers.Count + 1,
            DateTime.Now.ToString("h:mm tt"),
            instrument,
            beatTarget,
            effectIntent,
            notes,
            SelectedSongStage.Name,
            stemPath,
            durationLabel));

        _store.SavePerformanceLayers(PerformanceLayers);
        RecentCaptures.Insert(0, new CaptureItem(
            $"Layer {PerformanceLayers.Count}: {instrument}",
            $"{beatTarget} / {effectIntent}. {notes} {(string.IsNullOrWhiteSpace(stemPath) ? "" : $"Stem: {stemPath}")}".Trim(),
            DateTime.Now.ToString("h:mm tt"),
            "Song Builder"));
        while (RecentCaptures.Count > 8)
        {
            RecentCaptures.RemoveAt(RecentCaptures.Count - 1);
        }

        _store.SaveCaptures(RecentCaptures);
        SaveProjectSnapshot("Loop stack saved");
        PrimeNextLayer();
    }

    [RelayCommand]
    private void ClearPerformanceLayers()
    {
        _layerRecorder.Stop();
        PerformanceLayers.Clear();
        _store.SavePerformanceLayers(PerformanceLayers);
        SaveProjectSnapshot("Loop stack cleared");
        PrimeNextLayer();
        Status = "Cleared loop stack for a fresh live build.";
    }

    [RelayCommand]
    private void RemoveLatestPerformanceLayer()
    {
        var latest = PerformanceLayers.OrderByDescending(item => item.Order).FirstOrDefault();
        if (latest is null)
        {
            Status = "No loop layer to remove.";
            return;
        }

        PerformanceLayers.Remove(latest);
        _store.SavePerformanceLayers(PerformanceLayers);
        SaveProjectSnapshot($"Removed loop layer {latest.Order}");
        Status = $"Removed layer {latest.Order}: {latest.Instrument}";
    }

    [RelayCommand]
    private void OpenLatestStem()
    {
        var path = !string.IsNullOrWhiteSpace(ActiveStemPath)
            ? ActiveStemPath
            : PerformanceLayers.LastOrDefault(item => !string.IsNullOrWhiteSpace(item.StemPath))?.StemPath ?? "";

        try
        {
            if (string.IsNullOrWhiteSpace(path) || !System.IO.File.Exists(path))
            {
                OpenStemsFolder();
                return;
            }

            Process.Start(new ProcessStartInfo
            {
                FileName = path,
                UseShellExecute = true
            });
            Status = $"Opened stem: {path}";
        }
        catch (Exception ex)
        {
            Status = $"Could not open latest stem: {ex.Message}";
        }
    }

    [RelayCommand]
    private void OpenLatestAutosave()
    {
        var path = ResolveLatestAutosavePath();

        try
        {
            if (string.IsNullOrWhiteSpace(path) || !System.IO.File.Exists(path))
            {
                OpenStemsFolder();
                return;
            }

            Process.Start(new ProcessStartInfo
            {
                FileName = path,
                UseShellExecute = true
            });
            Status = $"Opened latest autosave: {path}";
        }
        catch (Exception ex)
        {
            Status = $"Could not open latest autosave: {ex.Message}";
        }
    }

    [RelayCommand]
    private void RefreshAutosaveFiles()
    {
        AutosaveFiles.Clear();
        foreach (var item in FindRecentAutosaveFiles())
        {
            AutosaveFiles.Add(item);
        }

        SelectedAutosaveFile = AutosaveFiles.FirstOrDefault(item => item.Path == LastAutosavePath)
            ?? AutosaveFiles.FirstOrDefault();
        OnPropertyChanged(nameof(AutosaveBrowserSignal));
        Status = AutosaveFiles.Count == 0
            ? "No XIV autosaves found yet."
            : $"Refreshed {AutosaveFiles.Count} autosave file(s).";
    }

    [RelayCommand]
    private void OpenSelectedAutosave()
    {
        if (SelectedAutosaveFile is null)
        {
            Status = "Select an autosave file first.";
            return;
        }

        LastAutosavePath = SelectedAutosaveFile.Path;
        OpenLatestAutosave();
    }

    [RelayCommand]
    private void PlaySelectedAutosave()
    {
        if (SelectedAutosaveFile is null)
        {
            Status = "Select an autosave file first.";
            return;
        }

        if (!SelectedAutosaveFile.IsAudio)
        {
            Status = "Selected autosave is not an audio file. Open it instead.";
            return;
        }

        LastAutosavePath = SelectedAutosaveFile.Path;
        var result = _looperPlayback.PlayLoop(98, SelectedAutosaveFile.Path, 75);
        Status = result.Message;
        LooperEngineStatus = result.Message;
    }

    [RelayCommand]
    private void StopSelectedAutosavePreview()
    {
        _looperPlayback.Stop(98);
        Status = "Stopped selected autosave preview.";
        LooperEngineStatus = Status;
    }

    [RelayCommand]
    private void AssignSelectedAutosaveToLooperLane()
    {
        if (SelectedAutosaveFile is null)
        {
            Status = "Select an autosave file first.";
            return;
        }

        if (SelectedLooperTrack is null)
        {
            Status = "Select a looper lane first.";
            return;
        }

        if (!SelectedAutosaveFile.IsAudio)
        {
            Status = "Selected autosave is not an audio file. Pick a WAV take.";
            return;
        }

        if (!System.IO.File.Exists(SelectedAutosaveFile.Path))
        {
            Status = "Selected autosave file no longer exists.";
            RefreshAutosaveFiles();
            return;
        }

        _looperPlayback.Stop(SelectedLooperTrack.Number);
        var updated = SelectedLooperTrack with
        {
            Status = "Loaded",
            StemPath = SelectedAutosaveFile.Path,
            DurationLabel = string.IsNullOrWhiteSpace(SelectedAutosaveFile.Duration) ? SelectedLooperTrack.DurationLabel : SelectedAutosaveFile.Duration,
            TakeCount = Math.Max(SelectedLooperTrack.TakeCount, 1),
            TakeArchive = NextLooperTakeArchive(SelectedLooperTrack, "Record", SelectedAutosaveFile.Path),
            LastAction = $"Loaded autosave at {DateTime.Now:h:mm tt}"
        };

        ReplaceLooperTrack(updated);
        ActiveStemPath = updated.StemPath;
        LastAutosavePath = updated.StemPath;
        LooperEngineStatus = $"Loaded {SelectedAutosaveFile.Name} into track {updated.Number}: {updated.Instrument}.";
        LooperTransportStatus = $"Ready to play {updated.Instrument}, or export the arrangement.";
        Status = LooperEngineStatus;
        OnPropertyChanged(nameof(SelectedAutosaveLaneSignal));
        SaveProjectSnapshot($"Loaded autosave into {updated.Instrument} lane");
    }

    [RelayCommand]
    private void DeleteSelectedAutosave()
    {
        if (SelectedAutosaveFile is null)
        {
            Status = "Select an autosave file first.";
            return;
        }

        var selected = SelectedAutosaveFile;
        try
        {
            if (!System.IO.File.Exists(selected.Path))
            {
                Status = "Selected autosave file no longer exists.";
                RefreshAutosaveFiles();
                return;
            }

            var trashDirectory = System.IO.Path.Combine(LibraryPath, "trash");
            System.IO.Directory.CreateDirectory(trashDirectory);
            var targetPath = System.IO.Path.Combine(trashDirectory, selected.Name);
            if (System.IO.File.Exists(targetPath))
            {
                targetPath = System.IO.Path.Combine(
                    trashDirectory,
                    $"{System.IO.Path.GetFileNameWithoutExtension(selected.Name)}-{DateTime.Now:yyyyMMdd-HHmmss}{System.IO.Path.GetExtension(selected.Name)}");
            }

            _looperPlayback.Stop(98);
            System.IO.File.Move(selected.Path, targetPath);
            if (LastAutosavePath.Equals(selected.Path, StringComparison.OrdinalIgnoreCase))
            {
                LastAutosavePath = "";
            }

            RefreshAutosaveFiles();
            Status = $"Moved autosave to trash: {selected.Name}";
            OnPropertyChanged(nameof(AutosaveSignal));
            OnPropertyChanged(nameof(SelectedAutosaveTakeSignal));
        }
        catch (Exception ex)
        {
            Status = $"Could not trash autosave: {ex.Message}";
        }
    }

    [RelayCommand]
    private void AttachSelectedAutosaveToTake()
    {
        if (SelectedAutosaveFile is null)
        {
            Status = "Select an autosave file first.";
            return;
        }

        TakeName = System.IO.Path.GetFileNameWithoutExtension(SelectedAutosaveFile.Name);
        TakeNotes = $"Attached autosave: {SelectedAutosaveFile.Name}. {SelectedAutosaveFile.Summary}.";
        TakeNextAction = "Listen once, decide Keep/Fix/Re-record/Export, then save the take review.";
        LastAutosavePath = SelectedAutosaveFile.Path;
        Status = $"Attached autosave to take review: {SelectedAutosaveFile.Name}";
        OnPropertyChanged(nameof(SelectedAutosaveTakeSignal));
    }

    [RelayCommand]
    private void SavePerformancePlan()
    {
        var detail = $"{Rc505CueSheet}. Notes: {PerformanceCueNotes}";
        RecentCaptures.Insert(0, new CaptureItem(
            $"{SongSection} performance plan",
            detail,
            DateTime.Now.ToString("h:mm tt"),
            "Song Builder"));
        while (RecentCaptures.Count > 8)
        {
            RecentCaptures.RemoveAt(RecentCaptures.Count - 1);
        }

        _store.SaveCaptures(RecentCaptures);
        SaveProjectSnapshot("Performance plan saved");
        Status = $"Saved {SongSection} RC-505 plan.";
    }

    [RelayCommand]
    private void CompleteCurrentSection()
    {
        var detail = $"{Rc505CueSheet}. Completed pass {PerformancePassCount:00}. Notes: {PerformanceCueNotes}";
        StampVisualPainting($"{SongSection} / pass {PerformancePassCount:00}");
        CompletionHistory.Insert(0, new ProjectCompletionRecord(
            DateTime.Now.ToString("O"),
            "Song Builder",
            $"{SongSection} section",
            detail));
        while (CompletionHistory.Count > 89)
        {
            CompletionHistory.RemoveAt(CompletionHistory.Count - 1);
        }

        RecentCaptures.Insert(0, new CaptureItem(
            $"Completed {SongSection}",
            detail,
            DateTime.Now.ToString("h:mm tt"),
            "Song Builder"));
        while (RecentCaptures.Count > 8)
        {
            RecentCaptures.RemoveAt(RecentCaptures.Count - 1);
        }

        PerformancePassCount++;
        _store.SaveCompletionHistory(CompletionHistory);
        _store.SaveCaptures(RecentCaptures);
        SaveProjectSnapshot($"{SongSection} section completed");
        PrimeNextSection();
    }

    [RelayCommand]
    private void StampCurrentVisual()
    {
        StampVisualPainting($"{SongSection} / {LayerInstrument}");
        SaveVisualizer();
        Status = $"Stamped visual painting: {VisualPaintingSignature}";
    }

    [RelayCommand]
    private void PrimeNextSection()
    {
        var currentIndex = SongSections.ToList().IndexOf(SongSection);
        var nextIndex = currentIndex < 0 || currentIndex + 1 >= SongSections.Count ? 0 : currentIndex + 1;
        SongSection = SongSections[nextIndex];
        PrimeNextLayer();
        PerformanceCueNotes = SongSection switch
        {
            "Intro" => "RC-505: establish the drum texture only. Leave room.",
            "Verse" => "RC-505: keep drums and one pocket instrument. Vocal should stay clear.",
            "Pre" => "RC-505: add tension with piano/guitar answer. Do not overfill.",
            "Hook" => "RC-505: commit the main vocal/harmony lift. Make the hook obvious.",
            "Bridge" => "RC-505: remove or thin one layer, then add contrast.",
            _ => "RC-505: decide what drops out, then land the ending cleanly.",
        };
        Status = $"Primed {SongSection} section plan.";
    }

    [RelayCommand]
    private void OpenStemsFolder()
    {
        try
        {
            System.IO.Directory.CreateDirectory(StemDirectory);
            Process.Start(new ProcessStartInfo
            {
                FileName = StemDirectory,
                UseShellExecute = true
            });
            Status = $"Opened stems folder: {StemDirectory}";
        }
        catch (Exception ex)
        {
            Status = $"Could not open stems folder: {ex.Message}";
        }
    }

    [RelayCommand]
    private void ApplyMixIntent()
    {
        var result = _mixIntent.Interpret(SelectedSongStage.Name, MixPrompt);
        MixRecommendation = result.Recommendation;
        MixChain = result.Chain;
        SongStageNotes = $"{SongStageNotes.Trim()} Mix: {result.Prompt}".Trim();
        _store.SaveSongWorkflow(CurrentSongWorkflow());
        RecentCaptures.Insert(0, new CaptureItem(
            $"{SelectedSongStage.Name} mix intent",
            $"{result.Prompt}: {result.Chain}",
            DateTime.Now.ToString("h:mm tt"),
            "Mix"));
        _store.SaveCaptures(RecentCaptures);
        Status = $"Applied mix intent for {SelectedSongStage.Name}.";
    }

    [RelayCommand]
    private void ApplyInstrumentChannel()
    {
        if (SelectedInstrumentChannel is null)
        {
            Status = "Select an instrument lane first.";
            return;
        }

        var result = _mixIntent.Interpret(SelectedInstrumentChannel.Name, InstrumentTonePrompt);
        var updated = SelectedInstrumentChannel with
        {
            TonePrompt = string.IsNullOrWhiteSpace(InstrumentTonePrompt) ? SelectedInstrumentChannel.TonePrompt : InstrumentTonePrompt.Trim(),
            InputNote = string.IsNullOrWhiteSpace(InstrumentInputNote) ? SelectedInstrumentChannel.InputNote : InstrumentInputNote.Trim(),
            EffectIntent = result.Recommendation,
            Warmth = Math.Clamp(InstrumentWarmth, 0, 100),
            Space = Math.Clamp(InstrumentSpace, 0, 100),
            Energy = Math.Clamp(InstrumentEnergy, 0, 100),
            VisualPalette = VisualizerPalette,
            VisualMotion = VisualizerMotion,
        };

        var index = InstrumentChannels.IndexOf(SelectedInstrumentChannel);
        if (index >= 0)
        {
            InstrumentChannels[index] = updated;
        }

        SelectedInstrumentChannel = updated;
        LayerInstrument = updated.Name;
        LayerEffectIntent = updated.EffectIntent;
        LayerNotes = $"{updated.Name} lane: {updated.TonePrompt}. Input: {updated.InputNote}.";
        MixPrompt = $"{updated.Name}: {updated.TonePrompt}";
        MixRecommendation = result.Recommendation;
        MixChain = result.Chain;
        _store.SaveInstrumentChannels(InstrumentChannels);
        SaveProjectSnapshot($"{updated.Name} instrument lane saved");
        InstrumentChannelResult = $"{updated.Name}: {result.Recommendation} Chain: {result.Chain}";
        Status = $"Applied independent {updated.Name} lane.";
    }

    [RelayCommand]
    private void ResetInstrumentChannels()
    {
        InstrumentChannels.Clear();
        foreach (var channel in DefaultInstrumentChannels())
        {
            InstrumentChannels.Add(channel);
        }

        SelectedInstrumentChannel = InstrumentChannels.FirstOrDefault();
        _store.SaveInstrumentChannels(InstrumentChannels);
        SaveProjectSnapshot("Instrument lanes reset");
        Status = "Reset independent instrument lanes.";
    }

    [RelayCommand]
    private void ArmLooperTrack()
    {
        if (SelectedLooperTrack is null)
        {
            Status = "Select a looper track first.";
            return;
        }

        var mode = NormalizeLooperMode(SelectedLooperMode);
        var updated = SelectedLooperTrack with { Status = "Armed", InputNote = InstrumentInputNote, Mode = mode };
        ReplaceLooperTrack(updated);
        LayerInstrument = updated.Instrument;
        LayerNotes = $"Built-in looper track {updated.Number}: {updated.Instrument}. Mode: {mode}. Input: {updated.InputNote}.";
        LooperEngineStatus = $"Armed track {updated.Number}: {updated.Instrument} in {mode} mode.";
        Status = LooperEngineStatus;
    }

    [RelayCommand]
    private async Task RecordLooperTrack()
    {
        if (SelectedLooperTrack is null)
        {
            Status = "Select a looper track first.";
            return;
        }

        ArmLooperTrack();
        var track = SelectedLooperTrack;
        if (!FocusriteReadyForRecording)
        {
            LooperEngineStatus = $"Focusrite not calibrated yet. {FocusriteCalibrationSignal}";
            Status = LooperEngineStatus;
            return;
        }

        var mode = NormalizeLooperMode(SelectedLooperMode);
        if (!PrepareLooperCapture(track, mode))
        {
            return;
        }

        LooperTransportStatus = $"Count-in for track {track.Number}: {track.Instrument} / {mode}.";
        await _clickTrack.PlayCountInAsync(LooperBpm, LooperCountInBeats, beat =>
        {
            LooperTransportStatus = $"Count-in {beat}/{Math.Clamp(LooperCountInBeats, 1, 16)}";
            Status = LooperTransportStatus;
        });

        var result = _layerRecorder.Start(PreferredAudioInput, StemDirectory, BuildLooperCapturePrefix(track, mode));
        var updated = track with
        {
            Status = result.Success ? "Recording" : "Blocked",
            StemPath = result.Success ? result.Path : track.StemPath,
            InputNote = InstrumentInputNote,
            Mode = mode,
            LastAction = result.Success ? $"{mode} started at {DateTime.Now:h:mm tt}" : track.LastAction
        };
        ReplaceLooperTrack(updated);
        ActiveStemPath = result.Success ? result.Path : ActiveStemPath;
        LastAutosavePath = result.Success ? result.Path : LastAutosavePath;
        LooperEngineStatus = result.Message;
        LooperTransportStatus = result.Success
            ? $"Recording {track.Instrument} in {mode} mode. Target: {LooperBars} bars at {LooperBpm} BPM."
            : "Recording blocked.";
        Status = result.Message;
    }

    [RelayCommand]
    private async Task RecordTimedLooperTrack()
    {
        if (SelectedLooperTrack is null)
        {
            Status = "Select a looper track first.";
            return;
        }

        ArmLooperTrack();
        var track = SelectedLooperTrack;
        if (!FocusriteReadyForRecording)
        {
            LooperEngineStatus = $"Focusrite not calibrated yet. {FocusriteCalibrationSignal}";
            Status = LooperEngineStatus;
            return;
        }

        var mode = NormalizeLooperMode(SelectedLooperMode);
        if (!PrepareLooperCapture(track, mode))
        {
            return;
        }

        var target = TargetLoopDuration;
        LooperTransportStatus = $"Timed loop count-in for {track.Instrument} / {mode}. Target {target.TotalSeconds:0.0}s.";
        await _clickTrack.PlayCountInAsync(LooperBpm, LooperCountInBeats, beat =>
        {
            LooperTransportStatus = $"Count-in {beat}/{Math.Clamp(LooperCountInBeats, 1, 16)}";
            Status = LooperTransportStatus;
        });

        var start = _layerRecorder.Start(PreferredAudioInput, StemDirectory, BuildLooperCapturePrefix(track, mode));
        var recording = track with
        {
            Status = start.Success ? "Recording" : "Blocked",
            StemPath = start.Success ? start.Path : track.StemPath,
            InputNote = InstrumentInputNote,
            Mode = mode,
            LastAction = start.Success ? $"{mode} timed pass started at {DateTime.Now:h:mm tt}" : track.LastAction
        };
        ReplaceLooperTrack(recording);
        ActiveStemPath = start.Success ? start.Path : ActiveStemPath;
        LastAutosavePath = start.Success ? start.Path : LastAutosavePath;
        LooperEngineStatus = start.Message;
        if (!start.Success)
        {
            LooperTransportStatus = "Timed recording blocked.";
            Status = start.Message;
            return;
        }

        LooperTransportStatus = $"Recording timed {track.Instrument} loop for {target.TotalSeconds:0.0}s.";
        await Task.Delay(target);

        var stop = _layerRecorder.Stop();
        var saved = recording with
        {
            Status = stop.Success ? SavedLooperStatus(mode) : "Empty",
            StemPath = stop.Success ? stop.Path : recording.StemPath,
            DurationLabel = stop.Success ? stop.DurationLabel : recording.DurationLabel,
            TakeCount = stop.Success ? NextLooperTakeCount(recording, mode) : recording.TakeCount,
            TakeArchive = stop.Success ? NextLooperTakeArchive(recording, mode, stop.Path) : recording.TakeArchive,
            LastAction = stop.Success ? $"{mode} saved at {DateTime.Now:h:mm tt}" : recording.LastAction
        };
        ReplaceLooperTrack(saved);
        ActiveStemPath = saved.StemPath;
        LastStemDuration = saved.DurationLabel;
        LastAutosavePath = stop.Success ? saved.StemPath : LastAutosavePath;
        LooperEngineStatus = stop.Message;
        LooperTransportStatus = stop.Success
            ? $"Timed {mode.ToLowerInvariant()} saved: {saved.Instrument} / {saved.DurationLabel}."
            : "Timed recording stopped without a saved loop.";

        if (stop.Success)
        {
            AddPerformanceLayer(stop.Path, stop.DurationLabel);
        }
        else
        {
            Status = stop.Message;
        }
    }

    [RelayCommand]
    private void StopLooperTrackRecording()
    {
        if (SelectedLooperTrack is null)
        {
            Status = "Select a looper track first.";
            return;
        }

        var result = _layerRecorder.Stop();
        var mode = NormalizeLooperMode(SelectedLooperTrack.Mode);
        var updated = SelectedLooperTrack with
        {
            Status = result.Success ? SavedLooperStatus(mode) : "Empty",
            StemPath = result.Success ? result.Path : SelectedLooperTrack.StemPath,
            DurationLabel = result.Success ? result.DurationLabel : SelectedLooperTrack.DurationLabel,
            TakeCount = result.Success ? NextLooperTakeCount(SelectedLooperTrack, mode) : SelectedLooperTrack.TakeCount,
            TakeArchive = result.Success ? NextLooperTakeArchive(SelectedLooperTrack, mode, result.Path) : SelectedLooperTrack.TakeArchive,
            LastAction = result.Success ? $"{mode} saved at {DateTime.Now:h:mm tt}" : SelectedLooperTrack.LastAction
        };
        ReplaceLooperTrack(updated);
        ActiveStemPath = updated.StemPath;
        LastStemDuration = updated.DurationLabel;
        LastAutosavePath = result.Success ? updated.StemPath : LastAutosavePath;
        LooperEngineStatus = result.Message;
        LooperTransportStatus = result.Success
            ? $"Saved {updated.Instrument} loop: {updated.DurationLabel}."
            : "Transport idle.";

        if (result.Success)
        {
            AddPerformanceLayer(result.Path, result.DurationLabel);
        }
        else
        {
            Status = result.Message;
        }
    }

    [RelayCommand]
    private void PlayLooperTrack()
    {
        if (SelectedLooperTrack is null)
        {
            Status = "Select a looper track first.";
            return;
        }

        if (SelectedLooperTrack.Muted)
        {
            LooperEngineStatus = $"{SelectedLooperTrack.Instrument} is muted. Unmute before playback.";
            Status = LooperEngineStatus;
            return;
        }

        if (LooperTracks.Any(track => track.Solo) && !SelectedLooperTrack.Solo)
        {
            LooperEngineStatus = $"{SelectedLooperTrack.Instrument} is blocked by another solo lane.";
            Status = LooperEngineStatus;
            return;
        }

        var result = _looperPlayback.PlayLoop(SelectedLooperTrack.Number, SelectedLooperTrack.StemPath, SelectedLooperTrack.Volume);
        var updated = SelectedLooperTrack with { Status = result.Success ? "Looping" : SelectedLooperTrack.Status };
        ReplaceLooperTrack(updated);
        LooperEngineStatus = result.Message;
        LooperTransportStatus = result.Success ? $"Looping {updated.Instrument}." : "Transport idle.";
        Status = result.Message;
    }

    [RelayCommand]
    private void PlayLooperArrangement()
    {
        var soloActive = LooperTracks.Any(track => track.Solo);
        var playable = LooperTracks
            .Where(track =>
                !string.IsNullOrWhiteSpace(track.StemPath)
                && !track.Muted
                && (!soloActive || track.Solo))
            .ToList();

        if (playable.Count == 0)
        {
            LooperEngineStatus = "No playable loops yet. Record a lane first, or unmute/unsolo tracks.";
            LooperTransportStatus = "Arrangement playback blocked.";
            Status = LooperEngineStatus;
            return;
        }

        var started = new List<string>();
        var blocked = new List<string>();
        foreach (var track in playable)
        {
            var result = _looperPlayback.PlayLoop(track.Number, track.StemPath, track.Volume);
            if (result.Success)
            {
                started.Add(track.Instrument);
                ReplaceLooperTrack(track with { Status = "Looping" });
            }
            else
            {
                blocked.Add(track.Instrument);
            }
        }

        var startedText = string.Join(", ", started);
        LooperEngineStatus = blocked.Count == 0
            ? $"Arrangement playing: {startedText}."
            : $"Arrangement partially playing: {startedText}. Blocked: {string.Join(", ", blocked)}.";
        LooperTransportStatus = $"Playing {started.Count} lane(s). Use Stop all before a clean new pass.";
        VisualizerAlwaysOn = true;
        UpdateVisualPaintingFromAudio();
        Status = LooperEngineStatus;
        OnPropertyChanged(nameof(LooperArrangementSignal));
    }

    [RelayCommand]
    private void StopLooperTrack()
    {
        if (SelectedLooperTrack is null)
        {
            Status = "Select a looper track first.";
            return;
        }

        _looperPlayback.Stop(SelectedLooperTrack.Number);
        ReplaceLooperTrack(SelectedLooperTrack with { Status = string.IsNullOrWhiteSpace(SelectedLooperTrack.StemPath) ? "Empty" : "Recorded" });
        LooperEngineStatus = $"Stopped track {SelectedLooperTrack.Number}.";
        LooperTransportStatus = "Transport idle.";
        Status = LooperEngineStatus;
    }

    [RelayCommand]
    private void StopAllLooperTracks()
    {
        _looperPlayback.StopAll();
        for (var index = 0; index < LooperTracks.Count; index++)
        {
            var track = LooperTracks[index];
            LooperTracks[index] = track with { Status = string.IsNullOrWhiteSpace(track.StemPath) ? "Empty" : "Recorded" };
        }

        _store.SaveLooperTracks(LooperTracks);
        LooperEngineStatus = "Stopped all built-in looper tracks.";
        LooperTransportStatus = "Transport idle.";
        Status = LooperEngineStatus;
        OnPropertyChanged(nameof(LooperArrangementSignal));
    }

    [RelayCommand]
    private void PrimeNextLooperLane()
    {
        var next = LooperTracks.FirstOrDefault(track => string.IsNullOrWhiteSpace(track.StemPath))
            ?? SelectedLooperTrack
            ?? LooperTracks.FirstOrDefault();

        if (next is null)
        {
            Status = "No looper tracks available.";
            return;
        }

        PrimeLooperLane(next);
    }

    private void PrimeLooperLane(LooperTrackItem next)
    {
        SelectedLooperTrack = next;
        SelectedLooperMode = string.IsNullOrWhiteSpace(next.StemPath) ? "Record" : "Overdub";

        var channel = InstrumentChannels.FirstOrDefault(item => item.Name == next.Instrument);
        if (channel is not null)
        {
            SelectedInstrumentChannel = channel;
        }

        LayerInstrument = next.Instrument;
        LayerBeatTarget = next.Instrument switch
        {
            "Drums" => "Beat 1 / downbeat",
            "Guitar" => "Beat 2 pocket",
            "Piano" => "Beat 3 answer",
            "Vocal" => "Chorus pickup",
            "Harmony" => "Off-beat push",
            _ => LayerBeatTarget,
        };
        LayerEffectIntent = channel?.EffectIntent ?? LayerEffectIntent;
        LayerNotes = $"Prime {next.Instrument}: {LayerBeatTarget}. {InstrumentTonePrompt}";
        ApplyVisualDefaultsForInstrument(next.Instrument);

        LooperEngineStatus = $"Primed next lane: track {next.Number} / {next.Instrument} / {SelectedLooperMode}.";
        LooperTransportStatus = $"Ready for {next.Instrument}. Run Focusrite check if needed, then timed record.";
        Status = LooperEngineStatus;
        OnPropertyChanged(nameof(LooperNextMove));
    }

    [RelayCommand]
    private void ToggleLooperMute()
    {
        if (SelectedLooperTrack is null)
        {
            return;
        }

        var updated = SelectedLooperTrack with { Muted = !SelectedLooperTrack.Muted };
        if (updated.Muted)
        {
            _looperPlayback.Stop(updated.Number);
            updated = updated with { Status = string.IsNullOrWhiteSpace(updated.StemPath) ? "Empty" : "Muted" };
        }
        else if (updated.Status == "Muted")
        {
            updated = updated with { Status = string.IsNullOrWhiteSpace(updated.StemPath) ? "Empty" : "Recorded" };
        }

        ReplaceLooperTrack(updated);
        LooperEngineStatus = $"{updated.Instrument} mute {(updated.Muted ? "on" : "off")}.";
    }

    [RelayCommand]
    private void ToggleLooperSolo()
    {
        if (SelectedLooperTrack is null)
        {
            return;
        }

        for (var index = 0; index < LooperTracks.Count; index++)
        {
            var track = LooperTracks[index];
            var solo = track.Number == SelectedLooperTrack.Number && !SelectedLooperTrack.Solo;
            if (!solo)
            {
                _looperPlayback.Stop(track.Number);
            }

            LooperTracks[index] = track with
            {
                Solo = solo,
                Status = solo
                    ? track.Status
                    : string.IsNullOrWhiteSpace(track.StemPath) ? "Empty" : "Recorded"
            };
        }

        _store.SaveLooperTracks(LooperTracks);
        OnPropertyChanged(nameof(BuiltInLooperSignal));
        LooperEngineStatus = $"{SelectedLooperTrack.Instrument} solo toggled.";
    }

    [RelayCommand]
    private void ResetLooperTracks()
    {
        _layerRecorder.Stop();
        _looperPlayback.StopAll();
        LooperTracks.Clear();
        foreach (var track in DefaultLooperTracks())
        {
            LooperTracks.Add(track);
        }

        SelectedLooperTrack = LooperTracks.FirstOrDefault();
        _store.SaveLooperTracks(LooperTracks);
        LooperEngineStatus = "Built-in looper reset to empty tracks.";
        Status = LooperEngineStatus;
    }

    [RelayCommand]
    private void PrimeFirstDrumLoopTest()
    {
        AutoConfigureFocusrite();
        SelectedLooperTrack = LooperTracks.FirstOrDefault(track => track.Instrument == "Drums") ?? LooperTracks.FirstOrDefault();
        SelectedInstrumentChannel = InstrumentChannels.FirstOrDefault(channel => channel.Name == "Drums") ?? SelectedInstrumentChannel;
        LayerInstrument = "Drums";
        LayerBeatTarget = "Beat 1 / downbeat";
        LayerEffectIntent = "Tight drums";
        LayerNotes = "First built-in looper test: record a simple four-bar drum groove through the Scarlett.";
        LooperBpm = int.TryParse(Tempo.Replace("BPM", "", StringComparison.OrdinalIgnoreCase).Trim(), out var bpm) ? Math.Clamp(bpm, 40, 240) : 120;
        LooperCountInBeats = 4;
        LooperBars = 4;
        PerformanceCueNotes = "First test: record only drums. Keep it simple, stop cleanly, then play loop.";
        LooperEngineStatus = "First drum loop test primed. Run Focusrite input test, then press Record.";
        LooperTransportStatus = "Ready for Focusrite calibration.";
        LooperTestIssue = "Not tested yet";
        LooperTestNotes = "Test drums: describe signal, count-in timing, recording, playback, and volume.";
        Status = LooperEngineStatus;
        OnPropertyChanged(nameof(RecordingTestChecklist));
    }

    [RelayCommand]
    private void PrimeFullRecordingTest()
    {
        PrimeFirstDrumLoopTest();
        LooperTestIssue = "Not tested yet";
        LooperTestNotes = "Full test: Auto Focusrite -> 3s input test -> Timed record drums -> Prime next lane -> record harmony/vocal -> Play arrangement -> Save arrangement take -> Open latest autosave.";
        LooperEngineStatus = "Full recording test primed. Start with 3s input test, then timed record the drum lane.";
        LooperTransportStatus = "Test mode ready. Files will autosave as XIV + timestamp.";
        Status = LooperEngineStatus;
        OnPropertyChanged(nameof(RecordingTestChecklist));
    }

    [RelayCommand]
    private void SaveLooperTestReport()
    {
        var track = SelectedLooperTrack is null
            ? "No selected track"
            : $"Track {SelectedLooperTrack.Number}: {SelectedLooperTrack.Instrument} / {SelectedLooperTrack.Status} / {SelectedLooperTrack.DurationLabel}";
        var detail =
            $"{track}. Issue: {LooperTestIssue}. Focusrite peak {FocusritePeakPercent:0.0}%. {FocusriteCalibrationSignal} Notes: {LooperTestNotes}";

        RecentCaptures.Insert(0, new CaptureItem(
            "Built-in looper test report",
            detail,
            DateTime.Now.ToString("h:mm tt"),
            "Song Builder"));
        while (RecentCaptures.Count > 8)
        {
            RecentCaptures.RemoveAt(RecentCaptures.Count - 1);
        }

        _store.SaveCaptures(RecentCaptures);
        SaveProjectSnapshot("Looper test report saved");
        Status = $"Saved looper test report: {LooperTestIssue}";
    }

    [RelayCommand]
    private void SaveLyricIdea()
    {
        var title = string.IsNullOrWhiteSpace(LyricTitle) ? "Untitled lyric" : LyricTitle.Trim();
        var text = string.IsNullOrWhiteSpace(LyricText) ? "No lyric text yet." : LyricText.Trim();
        LyricIdeas.Insert(0, new LyricIdeaItem(
            title,
            SelectedSongStage.Name,
            string.IsNullOrWhiteSpace(LyricMood) ? Mood : LyricMood.Trim(),
            LyricTags.Trim(),
            text,
            DateTime.Now.ToString("yyyy-MM-dd")));
        while (LyricIdeas.Count > 50)
        {
            LyricIdeas.RemoveAt(LyricIdeas.Count - 1);
        }

        _store.SaveLyricIdeas(LyricIdeas);
        RefreshProjectModules();
        OnPropertyChanged(nameof(DashboardSignal));
        OnPropertyChanged(nameof(NextCreativeAction));
        SaveProjectSnapshot("Lyric vault saved");
        LyricTitle = "Untitled hook";
        LyricText = "";
        Status = $"Saved lyric idea: {title}";
    }

    [RelayCommand]
    private void UseLatestLyric()
    {
        var latest = LyricIdeas.FirstOrDefault();
        if (latest is null)
        {
            Status = "No lyric ideas saved yet.";
            return;
        }

        CaptureTitle = $"Lyric: {latest.Title}";
        CaptureNotes = latest.Text;
        SelectedRoom = Rooms.FirstOrDefault(room => room.Name == "Song Builder") ?? SelectedRoom;
        Status = $"Loaded lyric idea into capture: {latest.Title}";
    }

    [RelayCommand]
    private void SaveVisualizer()
    {
        _store.SaveVisualizer(CurrentVisualizerSettings());
        RecentCaptures.Insert(0, new CaptureItem(
            "Visualizer preset",
            $"{VisualizerMode}: {VisualizerPalette}, {VisualizerMotion}, {VisualizerLyricSource}",
            DateTime.Now.ToString("h:mm tt"),
            "Visual"));
        _store.SaveCaptures(RecentCaptures);
        OnPropertyChanged(nameof(VisualizerPreviewTitle));
        OnPropertyChanged(nameof(VisualizerPreviewDetail));
        SaveProjectSnapshot("Visual preset saved");
        Status = $"Saved visualizer preset: {VisualizerMode}";
    }

    [RelayCommand]
    private void DraftCaptions()
    {
        var source = CaptionSource.Contains("latest", StringComparison.OrdinalIgnoreCase)
            ? LyricIdeas.FirstOrDefault()?.Text ?? LyricText
            : LyricText;
        if (string.IsNullOrWhiteSpace(source))
        {
            CaptionStatus = "No lyrics available. Captions not drafted.";
            Status = CaptionStatus;
            return;
        }

        Captions.Clear();
        foreach (var caption in _captionDrafts.DraftFromLyrics(source, Tempo, CaptionBeats))
        {
            Captions.Add(caption);
        }

        _store.SaveCaptions(Captions);
        UpdateCaptionStatus();
        RefreshProjectModules();
        OnPropertyChanged(nameof(NextCreativeAction));
        SaveProjectSnapshot("Captions drafted");
        Status = CaptionStatus;
    }

    [RelayCommand]
    private void ClearCaptions()
    {
        Captions.Clear();
        _store.SaveCaptions(Captions);
        UpdateCaptionStatus();
        RefreshProjectModules();
        OnPropertyChanged(nameof(NextCreativeAction));
        SaveProjectSnapshot("Captions cleared");
        Status = "Caption drafts cleared.";
    }

    [RelayCommand]
    private void RunCommand()
    {
        var intent = _commands.Parse(CommandText);
        CommandResponse = intent.SafetyNote;
        switch (intent.Action)
        {
            case CommandAction.DraftCaptions:
                DraftCaptions();
                CommandResponse = $"{intent.SafetyNote} {CaptionStatus}";
                break;
            case CommandAction.SyncMedia:
                AnalyzeMedia();
                CommandResponse = $"{intent.SafetyNote} {SyncRecommendation}";
                break;
            case CommandAction.ApplyMixIntent:
                MixPrompt = intent.Payload;
                ApplyMixIntent();
                CommandResponse = $"{intent.SafetyNote} {MixChain}";
                break;
            case CommandAction.SaveVisualizer:
                VisualizerNotes = intent.Payload;
                if (intent.Payload.Contains("blackout", StringComparison.OrdinalIgnoreCase))
                {
                    ProjectorBlackout = true;
                }

                SaveVisualizer();
                CommandResponse = intent.SafetyNote;
                break;
            case CommandAction.SaveLyric:
                LyricText = intent.Payload;
                SaveLyricIdea();
                CommandResponse = intent.SafetyNote;
                break;
            case CommandAction.QueueExport:
                QueueCurrentExport();
                CommandResponse = intent.SafetyNote;
                break;
            case CommandAction.PrimeLooperLane:
                PrimeLooperLaneFromCommand(intent.Payload);
                CommandResponse = $"{intent.SafetyNote} {LooperEngineStatus}";
                break;
            case CommandAction.PlayLooperArrangement:
                PlayLooperArrangement();
                CommandResponse = $"{intent.SafetyNote} {LooperArrangementSignal}";
                break;
            case CommandAction.StopLooperArrangement:
                StopAllLooperTracks();
                CommandResponse = $"{intent.SafetyNote} {LooperTransportStatus}";
                break;
            case CommandAction.ExportLooperArrangement:
                ExportLooperArrangementMix();
                CommandResponse = $"{intent.SafetyNote} {LooperExportSignal}";
                break;
            case CommandAction.DeleteSelectedAutosave:
                DeleteSelectedAutosave();
                CommandResponse = intent.SafetyNote;
                break;
            case CommandAction.AssignSelectedAutosaveToLooperLane:
                AssignSelectedAutosaveToLooperLane();
                CommandResponse = $"{intent.SafetyNote} {LooperEngineStatus}";
                break;
            case CommandAction.StopSelectedAutosavePreview:
                StopSelectedAutosavePreview();
                CommandResponse = intent.SafetyNote;
                break;
            case CommandAction.SetLooperMode:
                SetLooperModeFromCommand(intent.Payload);
                CommandResponse = $"{intent.SafetyNote} {LooperModeGuidance}";
                break;
            case CommandAction.CaptureNote:
                CaptureTitle = "Command note";
                CaptureNotes = intent.Payload;
                SaveCapture();
                CommandResponse = intent.SafetyNote;
                break;
            default:
                CommandResponse = intent.SafetyNote;
                Status = intent.SafetyNote;
                break;
        }
    }

    private void PrimeLooperLaneFromCommand(string text)
    {
        var requested = ResolveInstrumentFromText(text);
        if (!string.IsNullOrWhiteSpace(requested))
        {
            var track = LooperTracks.FirstOrDefault(item => item.Instrument == requested);
            if (track is not null)
            {
                PrimeLooperLane(track);
                return;
            }
        }

        PrimeNextLooperLane();
    }

    private void SetLooperModeFromCommand(string text)
    {
        SelectedLooperMode = text.Contains("replace", StringComparison.OrdinalIgnoreCase)
            ? "Replace"
            : text.Contains("overdub", StringComparison.OrdinalIgnoreCase)
                ? "Overdub"
                : "Record";
        LooperEngineStatus = $"Looper mode set to {SelectedLooperMode}.";
        Status = LooperEngineStatus;
    }

    private static string ResolveInstrumentFromText(string text)
    {
        if (text.Contains("drum", StringComparison.OrdinalIgnoreCase))
        {
            return "Drums";
        }

        if (text.Contains("guitar", StringComparison.OrdinalIgnoreCase))
        {
            return "Guitar";
        }

        if (text.Contains("piano", StringComparison.OrdinalIgnoreCase))
        {
            return "Piano";
        }

        if (text.Contains("harmony", StringComparison.OrdinalIgnoreCase))
        {
            return "Harmony";
        }

        return text.Contains("vocal", StringComparison.OrdinalIgnoreCase) ? "Vocal" : "";
    }

    private void RefreshProjectModules()
    {
        ProjectModules.Clear();
        ProjectModules.Add(new MusicOsModule(
            "Song Builder",
            $"{SelectedSongStage?.Name ?? "Stage"} / {Tempo} / {KeyCenter}",
            "Move drums -> harmony -> vocals. Pick the next recordable action.",
            "Write the next recordable step: drum groove, harmony pocket, vocal hook, or section change.",
            "#E37B45"));
        ProjectModules.Add(new MusicOsModule(
            "Lyric Vault",
            $"{LyricIdeas.Count} idea(s)",
            LyricIdeas.FirstOrDefault()?.Title ?? "Capture the first hook.",
            "Capture one hook, title, phrase, or theme before judging whether it is good.",
            "#EABF7A"));
        ProjectModules.Add(new MusicOsModule(
            "Caption Engine",
            $"{Captions.Count} line(s)",
            Captions.Count == 0 ? "Draft captions from the latest lyric." : CaptionStatus,
            "Check caption density, beat spacing, and whether this lyric is safe to put on video.",
            "#6FB6A6"));
        ProjectModules.Add(new MusicOsModule(
            "Visual Room",
            VisualizerPreviewTitle,
            $"{VisualizerPalette} / {VisualizerOutputTarget}",
            "Name the visual mood, motion, lyric source, and projector behavior for this song.",
            "#D9C5A5"));
        ProjectModules.Add(new MusicOsModule(
            "Rig Routing",
            HardwareDevices.Count == 0 ? "Not scanned" : $"{HardwareDevices.Count} path(s)",
            "Recall Focusrite / RC-505 / monitor routing before recording.",
            "Write the exact mic, Focusrite, RC-505, monitor, MIDI, and projector setup to recall.",
            "#F2EADC"));
        ProjectModules.Add(new MusicOsModule(
            "Export Memory",
            ExportQueueLabel,
            ExportQueue.Any(item => item.Status != "Rendered") ? "Render or clear the next queued task." : "Queue the next platform export.",
            "Define the next export target, caption status, visual preset, and posting/archive step.",
            "#9DBFB3"));
    }

    private void SaveProjectSnapshot(string reason)
    {
        _store.SaveProjectFile(CurrentMusicProjectFile());
        RefreshProjectModules();
        ProjectMemoryStatus = $"{reason}: {ProjectFilePath}";
        RefreshProjectMemoryInspector();
        OnPropertyChanged(nameof(DashboardSignal));
        OnPropertyChanged(nameof(NextCreativeAction));
        OnPropertyChanged(nameof(ProjectHealthSignal));
        OnPropertyChanged(nameof(ProjectHealthDetail));
        OnPropertyChanged(nameof(ProjectHealthBlockers));
        OnPropertyChanged(nameof(PrimeGapLabel));
        OnPropertyChanged(nameof(ProjectMemorySummary));
        OnPropertyChanged(nameof(ProjectMemoryCounts));
        OnPropertyChanged(nameof(ProjectMemoryModified));
        OnPropertyChanged(nameof(ProjectMemoryFinishedTodayCount));
        OnPropertyChanged(nameof(ProjectMemoryFinishedWeekCount));
        OnPropertyChanged(nameof(ProjectMemoryCompletionStreak));
        OnPropertyChanged(nameof(ProjectMemoryMomentum));
        OnPropertyChanged(nameof(SessionScore));
        OnPropertyChanged(nameof(SessionScoreLabel));
        OnPropertyChanged(nameof(SessionScoreDetail));
        OnPropertyChanged(nameof(TodaysCreativeBrief));
        OnPropertyChanged(nameof(SessionLaunchChecklist));
        OnPropertyChanged(nameof(LoopStackSignal));
        OnPropertyChanged(nameof(NextLayerTarget));
        OnPropertyChanged(nameof(LoopStackReadiness));
        OnPropertyChanged(nameof(PerformancePlanSignal));
        OnPropertyChanged(nameof(Rc505CueSheet));
        RefreshLiveCue();
        RefreshSessionRail();
    }

    private string CreateSessionPackage()
    {
        var packageRoot = System.IO.Path.Combine(LibraryPath, "session-packages");
        var packageDirectory = System.IO.Path.Combine(
            packageRoot,
            $"{AutoSaveFileNamer.Prefix}-{DateTime.Now:yyyyMMdd-HHmmss}-{AutoSaveFileNamer.Sanitize(ProjectName)}");
        System.IO.Directory.CreateDirectory(packageDirectory);

        var projectJsonPath = System.IO.Path.Combine(packageDirectory, "music-project-file.json");
        var manifestPath = System.IO.Path.Combine(packageDirectory, "session-manifest.md");
        var stemIndexPath = System.IO.Path.Combine(packageDirectory, "stem-index.md");

        _store.SaveProjectFile(CurrentMusicProjectFile());
        if (System.IO.File.Exists(ProjectFilePath))
        {
            System.IO.File.Copy(ProjectFilePath, projectJsonPath, true);
        }

        var manifest = new List<string>
        {
            $"# {ProjectName} Session Package",
            "",
            $"Created: {DateTime.Now:yyyy-MM-dd h:mm tt}",
            $"Operator: {OperatorName}",
            $"Tempo: {Tempo}",
            $"Key: {KeyCenter}",
            $"Status: {BusinessMode}",
            $"Platform: {PlatformProfile}",
            $"Loudness: {LoudnessTarget}",
            "",
            "## Session State",
            SessionWorkflowSignal,
            "",
            "## Next Actions",
        };
        manifest.AddRange(SessionWorkflowChecklist.Select((item, index) => $"{index + 1}. {item}"));
        manifest.Add("");
        manifest.Add("## Latest Capture");
        manifest.Add(RecentCaptures.FirstOrDefault() is { } capture
            ? $"{capture.Title} / {capture.Room} / {capture.Status} / {capture.Detail}"
            : "No capture saved yet.");
        manifest.Add("");
        manifest.Add("## Visual Direction");
        manifest.Add($"{VisualizerMode} / {VisualizerPalette} / {VisualizerMotion} / {VisualizerOutputTarget}");
        manifest.Add("");
        manifest.Add("## Routing");
        manifest.Add($"{PreferredAudioInput} -> {PreferredAudioOutput}");
        manifest.Add(RoutingNotes);
        System.IO.File.WriteAllText(manifestPath, string.Join(Environment.NewLine, manifest));

        var stemIndex = new List<string>
        {
            $"# {ProjectName} Stem Index",
            "",
            "## Looper Tracks",
        };
        var recordedTracks = LooperTracks
            .Where(track => !string.IsNullOrWhiteSpace(track.StemPath))
            .Select(track => $"- Track {track.Number}: {track.Instrument} / {track.Status} / {track.DurationLabel} / {track.StemPath}")
            .ToList();
        stemIndex.AddRange(recordedTracks.Count > 0 ? recordedTracks : ["- No recorded looper tracks yet."]);
        stemIndex.Add("");
        stemIndex.Add("## Performance Layers");
        var layers = PerformanceLayers
            .OrderBy(layer => layer.Order)
            .Select(layer => $"- {layer.Order}. {layer.Instrument} / {layer.BeatTarget} / {layer.EffectIntent} / {layer.DurationLabel} / {layer.StemPath}")
            .ToList();
        stemIndex.AddRange(layers.Count > 0 ? layers : ["- No performance layers logged yet."]);
        System.IO.File.WriteAllText(stemIndexPath, string.Join(Environment.NewLine, stemIndex));

        return manifestPath;
    }

    private void RefreshLiveCue()
    {
        OnPropertyChanged(nameof(LiveCueTitle));
        OnPropertyChanged(nameof(LiveCuePrimary));
        OnPropertyChanged(nameof(LiveCueSecondary));
        OnPropertyChanged(nameof(LiveCueNextMove));
        OnPropertyChanged(nameof(PerformanceModeStatus));
    }

    private void UpdateVisualPaintingFromAudio()
    {
        var level = Math.Clamp(InputMeterLevel, 0, 100);
        VisualPulseSize = 120 + level * 2.1;
        VisualBloomSize = 190 + level * 3.4;
        VisualStrokeLevel = Math.Clamp(21 + level * 0.72, 21, 96);
        OnPropertyChanged(nameof(VisualPaintingSignal));
        OnPropertyChanged(nameof(VisualPaintingMood));
        OnPropertyChanged(nameof(VisualPaintingComposition));
        OnPropertyChanged(nameof(VisualRendererControlSignal));
    }

    private void UpdateFocusriteCalibration(double peakPercent)
    {
        FocusriteReadyForRecording = peakPercent is >= 8 and <= 88;
        FocusriteCalibrationSignal = peakPercent switch
        {
            <= 0 => "No signal detected. Check Scarlett gain, cable, phantom power, and selected input.",
            < 8 => "Signal is very quiet. Turn up Scarlett gain or move closer before recording loops.",
            < 35 => "Usable but quiet. Good for testing, but raise gain for a stronger loop.",
            <= 75 => "Healthy level. Ready to record loops.",
            <= 88 => "Hot but usable. Watch clipping on loud strums or vocals.",
            _ => "Too hot. Turn Scarlett gain down before recording."
        };
        OnPropertyChanged(nameof(FocusriteCalibrationSignal));
        OnPropertyChanged(nameof(FocusriteReadyForRecording));
        OnPropertyChanged(nameof(LooperTestNextStep));
    }

    private void StampVisualPainting(string label)
    {
        VisualPaintingStamps++;
        VisualPaintingSignature = $"{label} stamped at {DateTime.Now:h:mm tt}";
        VisualPaintingStatus = $"Painting stamped: {VisualPaintingSignature}";
        VisualizerNotes = $"{VisualizerNotes.Trim()} Stamp {VisualPaintingStamps}: {VisualPaintingSignature}.".Trim();
        VisualPulseSize = Math.Min(420, VisualPulseSize + 21);
        VisualBloomSize = Math.Min(620, VisualBloomSize + 34);
        VisualStrokeLevel = Math.Min(100, VisualStrokeLevel + 13);
        OnPropertyChanged(nameof(VisualPaintingComposition));
    }

    private void ApplyVisualDefaultsForInstrument(string instrument)
    {
        switch (instrument)
        {
            case "Drums":
                VisualizerMotion = "Kick pulse";
                VisualizerPalette = "Amber / seafoam";
                break;
            case "Guitar":
                VisualizerMotion = "Slow orbit";
                VisualizerPalette = "Red room";
                break;
            case "Piano":
                VisualizerMotion = "Breathing waveform";
                VisualizerPalette = "Blue hour";
                break;
            case "Vocal":
                VisualizerMotion = "Lyric type-on";
                VisualizerPalette = "Black / ivory";
                break;
            case "Harmony":
                VisualizerMotion = "Slow orbit";
                VisualizerPalette = "Neon rehearsal";
                break;
        }

        OnPropertyChanged(nameof(VisualizerPreviewTitle));
        OnPropertyChanged(nameof(VisualizerPreviewDetail));
        OnPropertyChanged(nameof(VisualPaintingSignal));
        OnPropertyChanged(nameof(VisualPaintingComposition));
    }

    private void ReplaceLooperTrack(LooperTrackItem updated)
    {
        var index = LooperTracks.IndexOf(LooperTracks.First(track => track.Number == updated.Number));
        LooperTracks[index] = updated;
        SelectedLooperTrack = updated;
        _store.SaveLooperTracks(LooperTracks);
        OnPropertyChanged(nameof(BuiltInLooperSignal));
        OnPropertyChanged(nameof(SelectedLooperRoutingSignal));
        OnPropertyChanged(nameof(LooperModeGuidance));
        OnPropertyChanged(nameof(LooperNextMove));
        OnPropertyChanged(nameof(LooperArrangementSignal));
        OnPropertyChanged(nameof(LooperLaneReadiness));
        OnPropertyChanged(nameof(RecordingTestChecklist));
        OnPropertyChanged(nameof(ProjectHealthDetail));
        OnPropertyChanged(nameof(ProjectMemoryCounts));
        OnPropertyChanged(nameof(ExportReadinessChecklist));
        OnPropertyChanged(nameof(LooperTestNextStep));
    }

    private bool PrepareLooperCapture(LooperTrackItem track, string mode)
    {
        if (mode == "Record" && !string.IsNullOrWhiteSpace(track.StemPath))
        {
            LooperEngineStatus = $"{track.Instrument} already has a loop. Choose Overdub to add a take, or Replace to overwrite it.";
            LooperTransportStatus = "Capture blocked to protect the existing loop.";
            Status = LooperEngineStatus;
            return false;
        }

        if (mode == "Replace")
        {
            _looperPlayback.Stop(track.Number);
        }

        return true;
    }

    private static string BuildLooperCapturePrefix(LooperTrackItem track, string mode)
    {
        var nextTake = mode == "Replace" ? 1 : track.TakeCount + 1;
        return $"looper-{mode.ToLowerInvariant()}-track-{track.Number:00}-{track.Instrument}-take-{nextTake:00}";
    }

    private static string NormalizeLooperMode(string value) =>
        value switch
        {
            "Overdub" => "Overdub",
            "Replace" => "Replace",
            _ => "Record",
        };

    private static int NextLooperTakeCount(LooperTrackItem track, string mode) =>
        mode == "Replace" ? 1 : Math.Max(0, track.TakeCount) + 1;

    private static string NextLooperTakeArchive(LooperTrackItem track, string mode, string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return track.TakeArchive;
        }

        if (mode == "Replace")
        {
            return path;
        }

        return string.IsNullOrWhiteSpace(track.TakeArchive)
            ? path
            : $"{track.TakeArchive}|{path}";
    }

    private static string SavedLooperStatus(string mode) =>
        mode == "Overdub" ? "Overdub saved" : "Recorded";

    private string ResolveLatestAutosavePath()
    {
        if (!string.IsNullOrWhiteSpace(LastAutosavePath))
        {
            return LastAutosavePath;
        }

        if (!string.IsNullOrWhiteSpace(ActiveStemPath))
        {
            return ActiveStemPath;
        }

        if (!string.IsNullOrWhiteSpace(LastExportPath))
        {
            return LastExportPath;
        }

        if (!string.IsNullOrWhiteSpace(LastBriefPath))
        {
            return LastBriefPath;
        }

        return !string.IsNullOrWhiteSpace(LastFocusriteTestPath)
            ? LastFocusriteTestPath
            : PerformanceLayers.LastOrDefault(item => !string.IsNullOrWhiteSpace(item.StemPath))?.StemPath ?? "";
    }

    private IReadOnlyList<AutosaveFileItem> FindRecentAutosaveFiles()
    {
        var folders = new[]
            {
                LibraryPath,
                StemDirectory,
                System.IO.Path.Combine(LibraryPath, "diagnostics"),
                OutputDirectory,
            }
            .Where(path => !string.IsNullOrWhiteSpace(path) && System.IO.Directory.Exists(path))
            .Distinct(StringComparer.OrdinalIgnoreCase);

        return folders
            .SelectMany(folder => System.IO.Directory.EnumerateFiles(folder, "XIV-*", System.IO.SearchOption.TopDirectoryOnly))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Select(path =>
            {
                var info = new System.IO.FileInfo(path);
                var kind = DescribeAutosaveKind(info.Extension);
                var audio = kind.Contains("Audio", StringComparison.OrdinalIgnoreCase)
                    ? AudioPreviewService.Inspect(path)
                    : AudioPreview.Empty;
                return new AutosaveFileItem(
                    info.Name,
                    path,
                    kind,
                    info.LastWriteTime.ToString("yyyy-MM-dd h:mm tt"),
                    FormatFileSize(info.Length),
                    info.LastWriteTime,
                    audio.Duration,
                    audio.Peak,
                    audio.Waveform);
            })
            .OrderByDescending(item => item.ModifiedAt)
            .Take(24)
            .ToList();
    }

    private static string DescribeAutosaveKind(string extension) =>
        extension.ToLowerInvariant() switch
        {
            ".wav" => "Audio WAV",
            ".mp4" => "Video MP4",
            ".svg" => "Visual SVG",
            ".md" => "Brief",
            ".json" => "Manifest",
            _ => extension.Trim('.').ToUpperInvariant(),
        };

    private static string FormatFileSize(long bytes)
    {
        if (bytes >= 1024 * 1024)
        {
            return $"{bytes / 1024.0 / 1024.0:0.0} MB";
        }

        return bytes >= 1024 ? $"{bytes / 1024.0:0.0} KB" : $"{bytes} B";
    }

    private static IReadOnlyList<InstrumentChannelItem> DefaultInstrumentChannels() =>
    [
        new("Drums", "RC-505 track 1 / mixed input", "make drums warmer and punchier", "Tight drums", 62, 21, 78, "Amber / seafoam", "Kick pulse"),
        new("Guitar", "RC-505 track 2 / mixed input", "make guitar warm but not muddy", "Warm guitar", 68, 34, 55, "Red room", "Slow orbit"),
        new("Piano", "RC-505 track 3 / mixed input", "make piano soft and wide", "Soft piano", 48, 62, 42, "Blue hour", "Breathing waveform"),
        new("Vocal", "Focusrite mic / RC-505 vocal send", "make vocal intimate and clear", "Lead vocal", 55, 28, 64, "Black / ivory", "Lyric type-on"),
        new("Harmony", "RC-505 overdub / backing vocal", "make harmony lift without covering lead", "Harmony lift", 52, 55, 48, "Neon rehearsal", "Slow orbit"),
    ];

    private static IReadOnlyList<LooperTrackItem> DefaultLooperTracks() =>
    [
        new(1, "Drums", "Focusrite / RC-505 input", "Empty", "", "00:00", 82, false, false, "#E37B45"),
        new(2, "Guitar", "Focusrite / RC-505 input", "Empty", "", "00:00", 76, false, false, "#EABF7A"),
        new(3, "Piano", "Focusrite / RC-505 input", "Empty", "", "00:00", 72, false, false, "#6FB6A6"),
        new(4, "Vocal", "Focusrite mic input", "Empty", "", "00:00", 88, false, false, "#F2EADC"),
        new(5, "Harmony", "Focusrite mic input", "Empty", "", "00:00", 65, false, false, "#9DBFB3"),
    ];

    private void RefreshProjectMemoryInspector()
    {
        OnPropertyChanged(nameof(ProjectMemoryTitle));
        OnPropertyChanged(nameof(ProjectMemoryArtist));
        OnPropertyChanged(nameof(ProjectMemoryBpm));
        OnPropertyChanged(nameof(ProjectMemoryKey));
        OnPropertyChanged(nameof(ProjectMemoryStatusLabel));
        OnPropertyChanged(nameof(ProjectMemoryPlatform));
        OnPropertyChanged(nameof(ProjectMemoryLoudness));
        OnPropertyChanged(nameof(ProjectMemoryModifiedAt));
        OnPropertyChanged(nameof(ProjectMemoryCaptureCount));
        OnPropertyChanged(nameof(ProjectMemoryLyricCount));
        OnPropertyChanged(nameof(ProjectMemoryTakeCount));
        OnPropertyChanged(nameof(ProjectMemoryCaptionCount));
        OnPropertyChanged(nameof(ProjectMemoryVisualPresetCount));
        OnPropertyChanged(nameof(ProjectMemoryRoutingNoteCount));
        OnPropertyChanged(nameof(ProjectMemoryExportTaskCount));
        OnPropertyChanged(nameof(ProjectMemoryFilePreview));
        OnPropertyChanged(nameof(ProjectMemoryTimelineFilters));
        OnPropertyChanged(nameof(ProjectMemoryTimeline));
        OnPropertyChanged(nameof(ProjectMemoryFinishedTodayCount));
        OnPropertyChanged(nameof(ProjectMemoryFinishedWeekCount));
        OnPropertyChanged(nameof(ProjectMemoryCompletionStreak));
        OnPropertyChanged(nameof(ProjectMemoryMomentum));
        OnPropertyChanged(nameof(SessionScore));
        OnPropertyChanged(nameof(SessionScoreLabel));
        OnPropertyChanged(nameof(SessionScoreDetail));
        OnPropertyChanged(nameof(TodaysCreativeBrief));
        OnPropertyChanged(nameof(SessionLaunchChecklist));
        RefreshSessionRail();
    }

    private void RefreshSessionRail()
    {
        OnPropertyChanged(nameof(SessionRailPinnedPriority));
        OnPropertyChanged(nameof(SessionRailPinnedDetail));
        OnPropertyChanged(nameof(SessionRailLatestCapture));
        OnPropertyChanged(nameof(SessionRailGap));
        OnPropertyChanged(nameof(SessionRailRoomStatus));
        OnPropertyChanged(nameof(SessionRailEnergy));
        OnPropertyChanged(nameof(ExportReadinessChecklist));
        OnPropertyChanged(nameof(SessionWorkflowSignal));
        OnPropertyChanged(nameof(SessionPackageSignal));
        OnPropertyChanged(nameof(SessionWorkflowChecklist));
        OnPropertyChanged(nameof(SessionActionResult));
        OnPropertyChanged(nameof(SessionRecorderLocation));
        OnPropertyChanged(nameof(SessionSelectedLaneSignal));
        OnPropertyChanged(nameof(NextRecordingMoveHeadline));
        OnPropertyChanged(nameof(NextRecordingMoveDetail));
        OnPropertyChanged(nameof(SignalCheckHeadline));
        OnPropertyChanged(nameof(SignalCheckDetail));
        OnPropertyChanged(nameof(SignalCheckInputLabel));
        OnPropertyChanged(nameof(SignalCheckPeakLabel));
        OnPropertyChanged(nameof(SignalCheckTestFile));
    }

    private IEnumerable<ProjectMemoryTimelineItem> BuildProjectMemoryTimeline()
    {
        foreach (var item in RecentCaptures.Take(4))
        {
            yield return new ProjectMemoryTimelineItem(
                item.Status,
                item.Room,
                item.Room,
                "Captures",
                item.Title,
                item.Detail,
                "#E37B45");
        }

        foreach (var item in LyricIdeas.Take(4))
        {
            yield return new ProjectMemoryTimelineItem(
                item.CreatedAt,
                "Lyric",
                "Lyric Vault",
                "Lyrics",
                item.Title,
                $"{item.Stage} / {item.Mood} / {item.Tags}",
                "#EABF7A");
        }

        foreach (var item in TakeReviews.Take(3))
        {
            yield return new ProjectMemoryTimelineItem(
                item.ReviewedAt,
                "Take",
                "Song Builder",
                "Takes",
                item.Name,
                $"{item.Decision} / {item.Rating}/5 - {item.Notes} Next: {item.NextAction}",
                "#6FB6A6");
        }

        foreach (var item in PerformanceLayers.TakeLast(4).Reverse())
        {
            yield return new ProjectMemoryTimelineItem(
                item.CreatedAt,
                "Layer",
                "Song Builder",
                "Takes",
                $"{item.Order}. {item.Instrument}",
                $"{item.BeatTarget} / {item.EffectIntent}. {item.Notes}",
                "#E37B45");
        }

        foreach (var item in Captions.Take(3))
        {
            yield return new ProjectMemoryTimelineItem(
                $"{item.Start}-{item.End}",
                "Caption",
                "Caption Engine",
                "Captions",
                item.Text,
                $"{item.Status} / {item.Note}",
                "#D9C5A5");
        }

        if (!string.IsNullOrWhiteSpace(RoutingNotes))
        {
            yield return new ProjectMemoryTimelineItem(
                "Rig",
                "Routing",
                "Rig Routing",
                "Rig",
                PreferredAudioInput.Length > 0 ? PreferredAudioInput : "Routing note",
                RoutingNotes,
                "#9DBFB3");
        }

        foreach (var item in ExportQueue.Take(3))
        {
            yield return new ProjectMemoryTimelineItem(
                item.CreatedAt,
                "Export",
                "Export Memory",
                "Exports",
                item.PresetName,
                $"{item.Status} / {item.OutputPath}",
                "#F2EADC");
        }

        foreach (var item in CompletionHistory.Take(4))
        {
            yield return new ProjectMemoryTimelineItem(
                DateTime.TryParse(item.CompletedAt, out var completedAt)
                    ? completedAt.ToString("M/d h:mm tt")
                    : item.CompletedAt,
                "Done",
                item.TargetRoom,
                "Done",
                item.Title,
                item.Detail,
                "#6FB6A6");
        }
    }

    private static bool IsSameLocalDate(string value, DateTime date)
    {
        return DateTime.TryParse(value, out var parsed) && parsed.ToLocalTime().Date == date.Date;
    }

    private static bool IsTodayStatus(string value)
    {
        return value.Equals("Today", StringComparison.OrdinalIgnoreCase)
            || DateTime.TryParse(value, out var parsed) && parsed.ToLocalTime().Date == DateTime.Today;
    }

    private static bool IsOnOrAfterLocalDate(string value, DateTime date)
    {
        return DateTime.TryParse(value, out var parsed) && parsed.ToLocalTime().Date >= date.Date;
    }

    private IReadOnlyList<ProjectGap> MissingProjectPieces()
    {
        var missing = new List<ProjectGap>();
        if (LyricIdeas.Count == 0)
        {
            missing.Add(new("lyric", "Lyric Vault"));
        }

        if (!LooperTracks.Any(track => track.Instrument == "Drums" && !string.IsNullOrWhiteSpace(track.StemPath)))
        {
            missing.Add(new("drums", "Song Builder"));
        }

        if (!LooperTracks.Any(track => track.Instrument is "Guitar" or "Piano" && !string.IsNullOrWhiteSpace(track.StemPath)))
        {
            missing.Add(new("harmony", "Song Builder"));
        }

        if (!LooperTracks.Any(track => track.Instrument is "Vocal" or "Harmony" && !string.IsNullOrWhiteSpace(track.StemPath)))
        {
            missing.Add(new("vocal", "Song Builder"));
        }

        if (TakeReviews.Count == 0)
        {
            missing.Add(new("take", "Song Builder"));
        }

        if (Captions.Count == 0)
        {
            missing.Add(new("captions", "Caption Engine"));
        }

        if (string.IsNullOrWhiteSpace(VisualizerMode))
        {
            missing.Add(new("visual", "Visual Room"));
        }

        if (string.IsNullOrWhiteSpace(RoutingNotes))
        {
            missing.Add(new("routing", "Rig Routing"));
        }

        if (ExportQueue.Count == 0 && ExportHistory.Count == 0)
        {
            missing.Add(new("export", "Export Memory"));
        }

        return missing;
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

    private SongWorkflowSettings CurrentSongWorkflow() => new(
        SelectedSongStage.Name,
        SongStageNotes,
        Tempo,
        KeyCenter,
        MixPrompt,
        MixRecommendation,
        MixChain);

    private VisualizerSettings CurrentVisualizerSettings() => new(
        VisualizerMode,
        VisualizerPalette,
        VisualizerMotion,
        VisualizerLyricSource,
        VisualizerIntensity,
        VisualizerNotes,
        VisualizerQualityMode,
        VisualizerOutputTarget,
        ProjectorBlackout,
        DawSafeMode,
        VisualizerRendererPath);

    partial void OnVisualizerRendererPathChanged(string value)
    {
        OnPropertyChanged(nameof(VisualizerPreviewDetail));
        OnPropertyChanged(nameof(VisualizerRendererGuidance));
        OnPropertyChanged(nameof(VisualRendererControlSignal));
    }

    private VisualRendererControlPacket CurrentVisualRendererPacket() =>
        _visualRendererControl.BuildPacket(new VisualRendererControlInput(
            VisualizerRendererPath,
            VisualizerMode,
            VisualizerPalette,
            VisualizerMotion,
            SongSection,
            LayerInstrument,
            VisualizerOutputTarget,
            VisualizerQualityMode,
            DawSafeMode,
            ProjectorBlackout,
            InputMeterLevel,
            VisualizerIntensity,
            VisualizerLyricSource,
            VisualPaintingSignature,
            VisualizerNotes));

    private PerformanceLayerItem RecommendedNextLayer()
    {
        if (!PerformanceLayers.Any(item => item.Instrument == "Drums"))
        {
            return new PerformanceLayerItem(0, "", "Drums", "Beat 1 / downbeat", "Tight drums", "Start with kick/snare pocket. Keep it simple enough to sing over.", "Drums");
        }

        if (!PerformanceLayers.Any(item => item.Instrument == "Guitar"))
        {
            return new PerformanceLayerItem(0, "", "Guitar", "Beat 2 pocket", "Warm guitar", "Answer the drums on the pocket. Leave air for voice.", "Guitar");
        }

        if (!PerformanceLayers.Any(item => item.Instrument == "Piano"))
        {
            return new PerformanceLayerItem(0, "", "Piano", "Beat 3 answer", "Soft piano", "Add color only where the groove needs lift.", "Piano");
        }

        if (!PerformanceLayers.Any(item => item.Instrument == "Vocal"))
        {
            return new PerformanceLayerItem(0, "", "Vocal", "Chorus pickup", "Lead vocal", "Sing the real hook. Capture emotion before tuning decisions.", "Vocals");
        }

        return new PerformanceLayerItem(0, "", "Harmony", "Off-beat push", "Harmony lift", "Add one support layer or remove the weakest layer before more stacking.", "Vocals");
    }

    private MusicProjectFile CurrentMusicProjectFile() => new(
        ProjectName.ToLowerInvariant().Replace(' ', '-'),
        ProjectName,
        OperatorName,
        Tempo,
        KeyCenter,
        BusinessMode,
        PlatformProfile,
        LoudnessTarget,
        RecentCaptures.Select(item => new MusicProjectCapture(item.Title, item.Detail, item.Status, item.Room)).ToList(),
        LyricIdeas.Select(item => new MusicProjectLyric(item.Title, item.Stage, item.Mood, item.Tags, item.Text, item.CreatedAt)).ToList(),
        TakeReviews.Select(item => new MusicProjectTake(
            item.Name,
            item.Rating,
            item.Notes,
            item.ReviewedAt,
            item.Decision,
            item.NextAction,
            item.AttachedPath)).ToList(),
        PerformanceLayers.Select(item => new MusicProjectLayer(
            item.Order,
            item.CreatedAt,
            item.Instrument,
            item.BeatTarget,
            item.EffectIntent,
            item.Notes,
            item.Stage,
            item.StemPath,
            item.DurationLabel)).ToList(),
        Captions.Select(item => new MusicProjectCaption(item.Start, item.End, item.Text, item.Status, item.Note)).ToList(),
        [new MusicProjectVisualPreset(
            VisualizerMode,
            VisualizerPalette,
            VisualizerMotion,
            VisualizerLyricSource,
            VisualizerIntensity,
            VisualizerNotes,
            VisualizerQualityMode,
            VisualizerOutputTarget,
            ProjectorBlackout,
            DawSafeMode,
            VisualizerRendererPath)],
        [new MusicProjectRoutingNote(
            PreferredAudioInput,
            PreferredAudioOutput,
            PreferredMidiInput,
            PreferredMidiOutput,
            RoutingNotes)],
        ExportQueue.Select(item => new MusicProjectExportTask(
            item.Id,
            item.CreatedAt,
            item.PresetName,
            item.AudioPresetName,
            item.Status,
            item.OutputPath)).ToList(),
        DateTime.Now.ToString("O"),
        LooperTracks.Select(item => new MusicProjectLooperTrack(
            item.Number,
            item.Instrument,
            item.InputNote,
            item.Status,
            item.StemPath,
            item.DurationLabel,
            item.Volume,
            item.Muted,
            item.Solo,
            item.Mode,
            item.TakeCount,
            item.LastAction,
            item.TakeArchive)).ToList(),
        WorldMemories.Select(item => new MusicProjectWorldMemory(
            item.CreatedAt,
            item.Type,
            item.Language,
            item.Phrase,
            item.Meaning,
            item.Place,
            item.Person,
            item.Food,
            item.Rhythm,
            item.SongIdea,
            item.Notes)).ToList());

    private void UpdateCaptionStatus()
    {
        var unsafeCount = Captions.Count(caption => caption.Status != "Safe draft");
        CaptionStatus = Captions.Count == 0
            ? "No captions drafted yet."
            : unsafeCount == 0
                ? $"{Captions.Count} safe caption draft(s), spaced by {CaptionBeats} beats."
                : $"{Captions.Count} caption draft(s), {unsafeCount} need review. If it might be wrong, do not burn it in.";
    }
}

public sealed record OsRoom(string Name, string Description, string Number, string Accent);

public sealed record CaptureItem(string Title, string Detail, string Status, string Room);

public sealed record ContentPlanItem(string Number, string Title, string Detail, string Action);

public sealed record WorldMemoryItem(
    string CreatedAt,
    string Type,
    string Language,
    string Phrase,
    string Meaning,
    string Place,
    string Person,
    string Food,
    string Rhythm,
    string SongIdea,
    string Notes)
{
    public string Title =>
        string.IsNullOrWhiteSpace(Phrase)
            ? string.IsNullOrWhiteSpace(SongIdea)
                ? Type
                : SongIdea
            : Phrase;

    public string Summary
    {
        get
        {
            var parts = new[]
            {
                string.IsNullOrWhiteSpace(Language) ? "" : Language,
                string.IsNullOrWhiteSpace(Place) ? "" : Place,
                string.IsNullOrWhiteSpace(Person) ? "" : Person,
                string.IsNullOrWhiteSpace(Food) ? "" : Food,
                string.IsNullOrWhiteSpace(Rhythm) ? "" : Rhythm,
                string.IsNullOrWhiteSpace(Meaning) ? "" : Meaning,
                string.IsNullOrWhiteSpace(SongIdea) ? "" : SongIdea,
            }.Where(part => !string.IsNullOrWhiteSpace(part));

            var summary = string.Join(" / ", parts);
            return string.IsNullOrWhiteSpace(summary) ? Notes : summary;
        }
    }
}

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

public sealed record TakeReviewItem(
    string Name,
    int Rating,
    string Notes,
    string ReviewedAt,
    string Decision = "Fix",
    string NextAction = "No next action written.",
    string AttachedPath = "")
{
    public string AttachedFileName => string.IsNullOrWhiteSpace(AttachedPath)
        ? "No attached file"
        : System.IO.Path.GetFileName(AttachedPath);
}

public sealed record PerformanceLayerItem(
    int Order,
    string CreatedAt,
    string Instrument,
    string BeatTarget,
    string EffectIntent,
    string Notes,
    string Stage,
    string StemPath = "",
    string DurationLabel = "");

public sealed record InstrumentChannelItem(
    string Name,
    string InputNote,
    string TonePrompt,
    string EffectIntent,
    double Warmth,
    double Space,
    double Energy,
    string VisualPalette,
    string VisualMotion);

public sealed record LooperTrackItem(
    int Number,
    string Instrument,
    string InputNote,
    string Status,
    string StemPath,
    string DurationLabel,
    double Volume,
    bool Muted,
    bool Solo,
    string Color,
    string Mode = "Record",
    int TakeCount = 0,
    string LastAction = "",
    string TakeArchive = "")
{
    public string TakeArchiveSummary => TakeCount <= 0 ? "no saved passes" : $"{TakeCount} saved pass(es)";
}

public sealed record LooperLaneReadinessItem(string Instrument, string Role, string State, string Color);

public sealed record AutosaveFileItem(
    string Name,
    string Path,
    string Kind,
    string Modified,
    string Size,
    DateTime ModifiedAt,
    string Duration,
    string Peak,
    string Waveform)
{
    public bool IsAudio => Kind.Contains("Audio", StringComparison.OrdinalIgnoreCase);

    public string Summary => IsAudio
        ? $"{Kind} / {Duration} / peak {Peak} / {Size} / {Modified}"
        : $"{Kind} / {Size} / {Modified}";
}

public sealed record LyricIdeaItem(string Title, string Stage, string Mood, string Tags, string Text, string CreatedAt)
{
    public string Preview => Text.Length <= 80 ? Text : $"{Text[..80]}...";
}

public sealed record MusicOsModule(string Name, string Metric, string NextAction, string StarterAction, string Accent);

public sealed record ProjectGap(string Label, string ModuleName);

public sealed record ProjectMemoryTimelineItem(
    string When,
    string Room,
    string TargetRoom,
    string Filter,
    string Title,
    string Detail,
    string Accent);
