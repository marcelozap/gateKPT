using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Avalonia.Threading;
using GateKPT.MusicOS.Services;

namespace GateKPT.MusicOS.ViewModels;

public sealed partial class RecorderWindowViewModel : ViewModelBase
{
    private readonly FocusriteDiagnosticService _focusrite = new();
    private readonly LayerRecordingService _recorder = new();
    private readonly BuiltInLooperPlaybackService _playback = new();
    private readonly RecorderVersionStore _versions = new();
    private readonly AudioTransformService _transforms = new();
    private readonly LayerMixdownService _mixdown = new();
    private readonly AudioInputDeviceService _inputDevices = new();
    private readonly PlayableTakeRepairService _takeRepair = new();
    private readonly PhoneVideoWorkflowService _phoneVideo = new();
    private readonly VisualClipRenderService _visualClip = new();
    private readonly ScreenCaptureService _screenCapture = new();
    private readonly LongSessionClipService _longSessionClips = new();
    private readonly VoiceHarvestBridgeService _voiceHarvest = new();
    private readonly InputMonitorService _monitor = new();
    private readonly LiveInputMeterService _liveMeter = new();
    private readonly GateKptBrainService _brain = new();
    private readonly RecorderDiagnosticLog _diagnostics;
    private readonly string _contentPackDirectory = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.MyMusic),
        "GateKPT Recorder",
        "content-packs");
    private readonly string _tasteMemoryDirectory = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.MyMusic),
        "GateKPT Recorder",
        "taste-memory");
    private readonly string _liveAlbumDirectory = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.MyMusic),
        "GateKPT Recorder",
        "live-album");
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };
    private readonly DispatcherTimer _recordingTimer = new() { Interval = TimeSpan.FromSeconds(1) };
    private readonly DispatcherTimer _visualTimer = new() { Interval = TimeSpan.FromMilliseconds(80) };
    private DateTimeOffset _recordingStartedAt = DateTimeOffset.MinValue;
    private bool _recordActionInFlight;
    private DateTimeOffset _screenCaptureStartedAt = DateTimeOffset.MinValue;
    private string _screenCaptureMarkerLogPath = "";
    private readonly List<LongSessionMarker> _screenCaptureMarkers = new();
    private bool _recordingSignalSeen;
    private int? _activeCaptureLayerNumber;
    private string _activeCaptureLabel = "recording";
    private double[] _playbackEnvelope = [];
    private DateTimeOffset _playbackVisualStartedAt = DateTimeOffset.MinValue;
    private TimeSpan _playbackVisualDuration = TimeSpan.Zero;
    private bool _isPlaybackVisualActive;

    [ObservableProperty]
    private string _inputName = "Scarlett not selected";

    [ObservableProperty]
    private AudioInputDeviceItem? _selectedInputDevice;

    [ObservableProperty]
    private AudioOutputDeviceItem? _selectedOutputDevice;

    [ObservableProperty]
    private double _peakPercent = 0;

    [ObservableProperty]
    private bool _signalReady = false;

    [ObservableProperty]
    private bool _isRecording = false;

    [ObservableProperty]
    private bool _isMonitoring = false;

    [ObservableProperty]
    private double _visualEnergy = 0;

    [ObservableProperty]
    private double _visualCoreSize = 96;

    [ObservableProperty]
    private double _visualBloomSize = 260;

    [ObservableProperty]
    private double _visualBloomOpacity = 0.24;

    [ObservableProperty]
    private double _visualRoomScale = 1;

    [ObservableProperty]
    private double _visualBackScale = 1;

    [ObservableProperty]
    private double _visualMidScale = 1;

    [ObservableProperty]
    private double _visualFrontScale = 1;

    [ObservableProperty]
    private double _visualRoomTilt = -8;

    [ObservableProperty]
    private double _visualDriftX = 0;

    [ObservableProperty]
    private double _visualLiftY = 0;

    [ObservableProperty]
    private double _recDotSize = 18;

    [ObservableProperty]
    private double _recGlowSize = 34;

    [ObservableProperty]
    private double _recGlowOpacity = 0.55;

    [ObservableProperty]
    private double _recordSpinAngle = 0;

    [ObservableProperty]
    private double _recordSpinScale = 1;

    [ObservableProperty]
    private double _recordSpinOpacity = 0.22;

    // Stage mode: hide all chrome so the screen is a clean, screen-recordable living stage.
    [ObservableProperty]
    private bool _stageMode = false;

    // Cam layout planning: a guide frame the user matches their webcam/Elgato feed to in OBS.
    private int _camLayoutIndex = 0;

    [ObservableProperty]
    private bool _camGuideVisible = false;

    [ObservableProperty]
    private string _camGuideLabel = "CAM";

    [ObservableProperty]
    private string _camGuideNote = "";

    [ObservableProperty]
    private double _camGuideWidth = 320;

    [ObservableProperty]
    private double _camGuideHeight = 180;

    [ObservableProperty]
    private double _camGuideLeft = 660;

    [ObservableProperty]
    private double _camGuideTop = 470;

    [ObservableProperty]
    private string _activeRecordingName = "Not recording";

    [ObservableProperty]
    private string _recordingElapsedLabel = "00:00";

    [ObservableProperty]
    private string _currentFilePath = "";

    [ObservableProperty]
    private string _chatText = "";

    [ObservableProperty]
    private string _status = "";

    [ObservableProperty]
    private string _commandResult = "";

    [ObservableProperty]
    private bool _isCommandBusy = false;

    [ObservableProperty]
    private bool _isRecorderBusy = false;

    [ObservableProperty]
    private string _assistantBrief = "Shape takes without losing the original.";

    [ObservableProperty]
    private string _commandHistory = "No commands yet.";

    [ObservableProperty]
    private string _signalProbeSummary = "";

    [ObservableProperty]
    private string _lastRecorderDiagnostic = "";

    [ObservableProperty]
    private string _sessionName = "Session 1";

    [ObservableProperty]
    private RecorderVersionFile? _selectedVersion;

    [ObservableProperty]
    private string _lastExportedMixPath = "";

    [ObservableProperty]
    private string _lastStemExportDirectory = "";

    [ObservableProperty]
    private string _phoneVideoPath = "";

    [ObservableProperty]
    private string _lastVideoOutputPath = "";

    [ObservableProperty]
    private string _lastScreenCapturePath = "";

    [ObservableProperty]
    private string _videoWorkflowStatus = "Record screen, mark a moment, cut a clip.";

    [ObservableProperty]
    private string _harvestStatus = "";

    [ObservableProperty]
    private int _videoAudioOffsetMs = 0;

    [ObservableProperty]
    private string _videoExportPreset = "short";

    [ObservableProperty]
    private string _contentPackWorld = "Own Library";

    [ObservableProperty]
    private string _contentPackClipType = "Loop";

    [ObservableProperty]
    private string _contentPackResult = "Record or select a take, then generate a personal listening pack.";

    [ObservableProperty]
    private string _lastContentPackPath = "";

    [ObservableProperty]
    private string _tasteRating = "7";

    [ObservableProperty]
    private string _tasteMood = "Fire";

    [ObservableProperty]
    private string _tasteWorked = "";

    [ObservableProperty]
    private string _tasteOff = "";

    [ObservableProperty]
    private string _tasteMemoryStatus = "No taste saved yet.";

    [ObservableProperty]
    private string _liveAlbumEra = "Own library era";

    [ObservableProperty]
    private string _liveAlbumScene = "Private listening folder";

    [ObservableProperty]
    private string _liveAlbumNote = "Build enough loops, songs, backgrounds, and mixes that I listen to my own work first.";

    [ObservableProperty]
    private string _liveAlbumStatus = "No live album note saved yet.";

    [ObservableProperty]
    private LayerSlotItem? _selectedLayerSlot;

    [ObservableProperty]
    private CaptureLaneItem? _selectedCaptureLane;

    [ObservableProperty]
    private VocalPresetItem? _selectedVocalPreset;

    public ObservableCollection<RecorderVersionFile> Versions { get; } = [];

    public ObservableCollection<AudioInputDeviceItem> InputDevices { get; } = [];

    public ObservableCollection<AudioOutputDeviceItem> OutputDevices { get; } = [];

    public ObservableCollection<double> SignalBars { get; } = [];

    public ObservableCollection<TakeTasteMemoryItem> TasteMemories { get; } = [];

    public ObservableCollection<CaptureLaneItem> CaptureLanes { get; } =
    [
        new("Loop", "loop", "Full RC-505 sound", null, "LOOP"),
        new("Guitar", "guitar", "Guitar pass", 2, "GTR"),
        new("Vocal", "vocal", "Voice or hook", 4, "VOX"),
        new("Drums", "drums", "Groove first", 1, "DRM"),
        new("Keys", "keys", "Piano or synth", 3, "KEY"),
        new("Idea", "idea", "Noise, note, field sound", null, "IDEA")
    ];

    public ObservableCollection<VocalPresetItem> VocalPresets { get; } =
    [
        new(
            "Chrome",
            "late-night-chrome",
            "Warm amber. Glossy lead. Night hook.",
            CreateLateNightChromePreset()),
        new(
            "Silk",
            "silk-synth",
            "Soft blue. Smooth hook. Wider shine.",
            CreateSilkSynthPreset()),
        new(
            "Robot",
            "robot-vocoder",
            "Electric voice. Daft lane. Beat-ready.",
            CreateRobotVocoderPreset()),
        new(
            "Luna",
            "luna-pop",
            "Moon gold. Airy Spanish color.",
            CreateLunaPopPreset()),
        new(
            "Cloud",
            "cloud-doubles",
            "Soft violet. Wide doubles behind lead.",
            CreateCloudDoublesPreset()),
        new(
            "Clean",
            "raw-clean",
            "Bone white. Natural take cleanup.",
            CreateRawCleanPreset())
    ];

    public ObservableCollection<LayerSlotItem> LayerSlots { get; } =
    [
        new(1, "Drums"),
        new(2, "Guitar"),
        new(3, "Piano"),
        new(4, "Vocal"),
        new(5, "Extra")
    ];

    public IReadOnlyList<string> ContentPackWorlds { get; } =
    [
        "Own Library",
        "Fire",
        "Storm",
        "Chrome"
    ];

    public IReadOnlyList<string> ContentPackClipTypes { get; } =
    [
        "Loop",
        "Background",
        "Personal Mix",
        "Cover",
        "Process",
        "Visual",
        "Human",
        "Build"
    ];

    public IReadOnlyList<string> TasteRatings { get; } =
    [
        "10",
        "9",
        "8",
        "7",
        "6",
        "5"
    ];

    public IReadOnlyList<string> LiveAlbumScenes { get; } =
    [
        "Private listening folder",
        "Work focus mix",
        "Gym loop pack",
        "Night drive mix",
        "Night room",
        "Projector session",
        "Guitar cover",
        "Vocal pass",
        "Loop build",
        "Behind the tool"
    ];

    public string PeakLabel => "";

    public string PeakDecibelLabel
    {
        get
        {
            if (PeakPercent <= 0)
            {
                return "";
            }

            var peak = Math.Clamp(PeakPercent, 0.01, 100);
            var db = 20 * Math.Log10(peak / 100.0);
            return db <= -60 ? "-60 dB" : $"{db:0.0} dB";
        }
    }

    public string MeterStateLabel =>
        IsRecording
            ? "LIVE"
            : SignalReady
                ? "ARMED"
                : "";

    public string MeterInputLabel =>
        InputName.Contains("Scarlett", StringComparison.OrdinalIgnoreCase) || InputName.Contains("Focusrite", StringComparison.OrdinalIgnoreCase)
            ? InputName
            : "No input";

    public string RecorderStateLabel =>
        IsRecording
            ? "LIVE"
            : _isPlaybackVisualActive
                ? "WAV"
            : string.IsNullOrWhiteSpace(CurrentFilePath)
                ? ""
                : "TAKE";

    public string AudioDriveLabel =>
        IsRecording
            ? "LIVE"
            : _isPlaybackVisualActive
                ? "WAV"
                : "";

    public string RecordingButtonLabel => IsRecording ? "LIVE" : "";

    public string StopButtonLabel => "SAVE";

    public bool CanStartRecording => !IsRecording && !IsBusy && !_recordActionInFlight;

    public bool CanStopRecording => IsRecording && !IsRecorderBusy && !_recordActionInFlight;

    public string MonitorButtonLabel =>
        IsMonitoring ? "MONITOR ON" : "Monitor";

    public bool IsBusy => IsRecorderBusy || IsCommandBusy;

    public string BusyLabel =>
        IsRecorderBusy
            ? "Saving audio..."
            : IsCommandBusy
                ? "Shaping take..."
                : "";

    public string RecordingGuardLabel =>
        IsRecording
            ? $"LIVE {RecordingElapsedLabel}"
            : "";

    public string SimpleSignalLabel => "";

    public bool HasVisibleSignal => IsRecording || PeakPercent > 0.5;

    public string AudioHealthLabel =>
        SelectedInputDevice is null
            ? ""
            : SignalReady
                ? SelectedInputDevice.Name
                : SelectedInputDevice.Name;

    public string SessionFolderLabel =>
        $"Session: {ActiveSessionLabel}";

    public string ActiveSessionLabel =>
        string.IsNullOrWhiteSpace(SessionName)
            ? "Session 1"
            : SessionName.Trim();

    public string SelectedCaptureLaneLabel =>
        SelectedCaptureLane?.Name ?? "Cover Pass";

    public string SelectedCaptureLaneDetail =>
        SelectedCaptureLane?.Detail ?? "One usable section for a post";

    public string LatestTakeTitle =>
        string.IsNullOrWhiteSpace(CurrentFilePath)
            ? "No take saved yet."
            : "Take";

    public string LatestTakeDetail
    {
        get
        {
            var path = SelectedVersion?.Path ?? CurrentFilePath;
            var preview = AudioPreviewService.Inspect(path);
            if (preview == AudioPreview.Empty)
            {
                return ActiveSessionLabel;
            }

            return preview.Duration;
        }
    }

    public string SelectedTakeMixLabel
    {
        get
        {
            var mixable = Versions.Count(version => IsMixableTake(version.Path));
            var countLabel = mixable <= 1
                ? "One take"
                : $"{mixable} takes";
            return string.IsNullOrWhiteSpace(TakeHealthLabel)
                ? countLabel
                : $"{countLabel} / {TakeHealthLabel}";
        }
    }

    public string TakeHealthLabel
    {
        get
        {
            var path = SelectedVersion?.Path ?? CurrentFilePath;
            var metrics = AudioPreviewService.InspectMetrics(path);
            return BuildTakeHealthLabel(metrics);
        }
    }

    public string PostReadySignal
    {
        get
        {
            var path = SelectedVersion?.Path ?? CurrentFilePath;
            var metrics = AudioPreviewService.InspectMetrics(path);
            return BuildTakeHealthLabel(metrics);
        }
    }

    public string CaptureInstruction => "";

    public string NextActionLabel =>
        IsRecording
            ? "Stop to save."
            : SignalReady
                ? "Record."
                : "Record.";

    public string PrimaryHeadline =>
        IsRecording
            ? "Recording"
            : SignalReady
                ? ""
                : "";

    public string PrimaryDetail =>
        IsRecording
            ? ""
            : SignalReady
                ? ""
                : "";

    public string CurrentFileLabel =>
        string.IsNullOrWhiteSpace(CurrentFilePath)
            ? "No take saved yet."
            : Path.GetFileName(CurrentFilePath);

    public string CurrentFilePreviewLabel
    {
        get
        {
            var path = SelectedVersion?.Path ?? CurrentFilePath;
            var preview = AudioPreviewService.Inspect(path);
            return preview == AudioPreview.Empty
                ? "No readable audio preview yet."
                : $"{preview.Duration} / peak {preview.Peak} / {preview.Waveform}";
        }
    }

    public string VersionListHint =>
        Versions.Count == 0
            ? "No takes."
            : Versions.Count == 1 ? "One take." : $"{Versions.Count} takes.";

    public string LayerDeckSummary
    {
        get
        {
            var loaded = LayerSlots.Count(slot => !string.IsNullOrWhiteSpace(slot.Path));
            return loaded == 0
                ? "No tracks loaded."
                : $"{loaded}/5 tracks";
        }
    }

    public string LastExportedMixLabel =>
        string.IsNullOrWhiteSpace(LastExportedMixPath)
            ? "No exported layer mix yet."
            : Path.GetFileName(LastExportedMixPath);

    public string LastStemExportLabel =>
        string.IsNullOrWhiteSpace(LastStemExportDirectory)
            ? "No stem export yet."
            : Path.GetFileName(LastStemExportDirectory);

    public string PhoneVideoLabel =>
        string.IsNullOrWhiteSpace(PhoneVideoPath)
            ? "No phone video selected."
            : Path.GetFileName(PhoneVideoPath);

    public string LastVideoOutputLabel =>
        string.IsNullOrWhiteSpace(LastVideoOutputPath)
            ? "No video output yet."
            : Path.GetFileName(LastVideoOutputPath);

    public string VideoLayerTitle =>
        string.IsNullOrWhiteSpace(PhoneVideoPath)
            ? "No phone video linked yet."
            : Path.GetFileName(PhoneVideoPath);

    public string VideoLayerDetail =>
        string.IsNullOrWhiteSpace(LastVideoOutputPath)
            ? $"Sync {VideoSyncLabel}. Preset: {VideoExportPresetLabel}."
            : $"Export ready: {Path.GetFileName(LastVideoOutputPath)}";

    public string VideoSyncLabel =>
        VideoAudioOffsetMs == 0
            ? "audio starts at video start"
            : VideoAudioOffsetMs > 0
                ? $"audio later by {VideoAudioOffsetMs} ms"
                : $"audio earlier by {Math.Abs(VideoAudioOffsetMs)} ms";

    public string VideoExportPresetLabel =>
        VideoExportPreset.Equals("short", StringComparison.OrdinalIgnoreCase)
            ? "vertical short"
            : "same shape";

    public bool IsScreenCapturing => _screenCapture.IsRecording;

    public string ScreenCaptureActionLabel => IsScreenCapturing ? "Stop" : "Screen";

    public string VideoLaneTitle =>
        IsScreenCapturing
            ? $"screen {RecordingElapsedLabel}"
            : string.IsNullOrWhiteSpace(LastVideoOutputPath)
                ? "Screen"
                : Path.GetFileName(LastVideoOutputPath);

    public string VideoLaneStatus =>
        IsScreenCapturing
            ? "Pin good moments."
            : string.IsNullOrWhiteSpace(VideoWorkflowStatus)
                ? HarvestStatus
                : VideoWorkflowStatus;

    public string ContentPackTakeLabel
    {
        get
        {
            var path = SelectedVersion?.Path ?? CurrentFilePath;
            if (string.IsNullOrWhiteSpace(path))
            {
                return "No take selected.";
            }

            var preview = AudioPreviewService.Inspect(path);
            return preview == AudioPreview.Empty
                ? Path.GetFileName(path)
                : $"{Path.GetFileName(path)} / {preview.Duration}";
        }
    }

    public string ContentPackSaveLabel =>
        string.IsNullOrWhiteSpace(LastContentPackPath)
            ? "No pack saved yet."
            : $"Saved: {Path.GetFileName(LastContentPackPath)}";

    public string TasteMemorySummary =>
        TasteMemories.Count == 0
            ? "No taste memory yet."
            : $"{TasteMemories.Count} taste note(s). Last: {TasteMemories.First().Rating}/10 / {TasteMemories.First().Mood}";

    public string TasteNextMove
    {
        get
        {
            if (TasteMemories.Count == 0)
            {
                return "Next move: save one honest note after the take.";
            }

            var strongest = TasteMemories
                .OrderByDescending(item => item.NumericRating)
                .ThenByDescending(item => item.When)
                .First();
            return $"Next move: revisit {strongest.Mood.ToLowerInvariant()} / {strongest.ClipType.ToLowerInvariant()} and keep: {strongest.Worked}";
        }
    }

    public string LiveAlbumPlan =>
        $"Scene: {LiveAlbumScene}. Record, save, and build the folder you want to listen to.";

    public string CommandHelp =>
        "Try: chrome, warmer, room, delete last, mix, harvest.";

    public string LastEffectChain =>
        SelectedLayerSlot is { } slot && !string.IsNullOrWhiteSpace(slot.EffectChain)
            ? $"{slot.Name}: {slot.EffectChain}"
            : "No lane effect yet.";

    public string VisualPaintingSignal
    {
        get
        {
            var takes = Versions.Count;
            var layers = LayerSlots.Count(slot => !string.IsNullOrWhiteSpace(slot.Path));
            return layers == 0
                ? takes == 0 ? "Blank canvas." : $"{takes} take(s) saved."
                : $"{layers} lane(s), {takes} take(s). Visual mix can grow from this.";
        }
    }

    public string Rc505CaptureGuide =>
        "Capture full loop or separate cue lanes.";

    public string SessionMemorySignal =>
        "Capture -> lanes -> mix -> visual.";

    public string SectionTimelineSignal =>
        "Intro / Groove / Hook / Bridge / Outro.";

    public string ExportPlanningSignal =>
        "Mix, stems, demo, archive.";

    public string RoutingSignal =>
        "RC-505 -> Scarlett -> GateKPT.";

    public RecorderWindowViewModel()
    {
        _diagnostics = new RecorderDiagnosticLog(_versions.RootDirectory);
        _recordingTimer.Tick += (_, _) => UpdateRecordingElapsed();
        _visualTimer.Tick += (_, _) => DriveVisualTick();
        for (var index = 0; index < 48; index++)
        {
            SignalBars.Add(10 + (index % 6) * 2);
        }

        SelectedCaptureLane = CaptureLanes.FirstOrDefault();
        SelectedLayerSlot = LayerSlots.FirstOrDefault();
        SelectedVocalPreset = VocalPresets.FirstOrDefault();
        RefreshInputDevices();
        RefreshOutputDevices();
        Status = SelectedInputDevice is null
            ? "No input yet."
            : "One take. Keep what feels good.";
        SignalProbeSummary = SelectedInputDevice is null
            ? ""
            : "";
        RefreshVersions();
        LoadTasteMemories();
        RestoreLayerDeck();
        _visualTimer.Start();
        StartVisualMeter();
    }

    // Pre-record live metering is intentionally DISABLED: opening a second WASAPI capture
    // on the same interface that the recorder uses caused a device-contention crash when
    // pressing Record. The stage still breathes on idle (PushSignalBar) and reacts hard
    // while recording via the recorder's own peak callback, so no live capture is needed.
    private void StartVisualMeter()
    {
        // No-op by design. See comment above.
    }

    private void StopVisualMeter() => _liveMeter.Stop();

    private void SetRecordActionInFlight(bool value)
    {
        if (_recordActionInFlight == value)
        {
            return;
        }

        _recordActionInFlight = value;
        OnPropertyChanged(nameof(CanStartRecording));
        OnPropertyChanged(nameof(CanStopRecording));
    }

    // Chrome = every control surface. Hidden in stage mode so only the living stage shows.
    public bool ChromeVisible => !StageMode;

    public string StageButtonLabel => StageMode ? "FULL" : "VIEW";

    partial void OnStageModeChanged(bool value)
    {
        OnPropertyChanged(nameof(ChromeVisible));
        OnPropertyChanged(nameof(StageButtonLabel));
        Status = value
            ? "Clean view on."
            : "Controls back.";
    }

    [RelayCommand]
    private void ToggleStage() => StageMode = !StageMode;

    // Cam layout presets: guide-only framing for OBS/Elgato. No camera/audio device is opened here.
    private static readonly (string Label, string Note, bool Visible, double Width, double Height, double Left, double Top)[] CamLayouts =
    {
        ("CAM off", "", false, 320, 180, 660, 470),
        ("TikTok lower", "Face/hands low. Visuals stay above.", true, 360, 210, 330, 430),
        ("TikTok corner", "Small face box. Keeps caption/action rail clear.", true, 250, 178, 700, 430),
        ("YouTube corner", "Bottom-left talking head.", true, 360, 210, 74, 404),
        ("Performance", "Full frame performance. Visuals become overlay.", true, 890, 520, 62, 94),
    };

    [RelayCommand]
    private void CycleCamLayout()
    {
        _camLayoutIndex = (_camLayoutIndex + 1) % CamLayouts.Length;
        ApplyCamLayout(_camLayoutIndex);
    }

    private void ApplyCamLayout(int index)
    {
        var layout = CamLayouts[index];
        CamGuideVisible = layout.Visible;
        CamGuideWidth = layout.Width;
        CamGuideHeight = layout.Height;
        CamGuideLeft = layout.Left;
        CamGuideTop = layout.Top;
        CamGuideLabel = layout.Label;
        CamGuideNote = layout.Note;
        Status = layout.Visible
            ? $"{layout.Label}. {layout.Note}"
            : "Cam guide hidden.";
        CommandResult = Status;
    }

    [RelayCommand]
    private void FindScarlett()
    {
        RefreshInputDevices();
        if (SelectedInputDevice is not null)
        {
            InputName = SelectedInputDevice.Name;
            Status = "Input ready.";
            SignalProbeSummary = "";
            return;
        }

        Status = "No input found.";
    }

    [RelayCommand]
    private async Task CheckSignal()
    {
        RefreshInputDevices();
        Status = "Listening for sound...";
        var results = await _inputDevices.ProbeAllAsync(Path.Combine(_versions.RootDirectory, "diagnostics"), 2);
        var best = results.FirstOrDefault(result => result.Success);
        if (best is null)
        {
            PeakPercent = 0;
            SignalReady = false;
            Status = "No input found.";
            return;
        }

        SelectedInputDevice = InputDevices.FirstOrDefault(device => device.Id == best.Id)
            ?? new AudioInputDeviceItem(best.Name, best.Id, true);
        InputName = SelectedInputDevice.Name;
        PeakPercent = best.PeakPercent;
        SignalReady = best.RmsPercent >= 0.05 || best.PeakPercent >= 1;
        SignalProbeSummary = "";
        WriteDiagnostic($"CHECK SIGNAL | selected={best.Name} | peak={best.PeakPercent:0.0}% | rms={best.RmsPercent:0.00}% | bytes={best.BytesWritten} | ready={SignalReady}");
        Status = SignalReady
            ? "Sound found."
            : "No sound yet.";
        SignalProbeSummary = "";
        OnPropertyChanged(nameof(AudioHealthLabel));
    }

    [RelayCommand]
    private void StartRecording()
    {
        var lane = SelectedCaptureLane ?? CaptureLanes.First();
        StartRecordingForLayer(lane.FileLabel, lane.LayerNumber);
    }

    [RelayCommand]
    private void RecordFullLoop()
    {
        StartRecordingForLayer("rc505-full-loop", null);
    }

    [RelayCommand]
    private void RecordDrumsLayer()
    {
        StartRecordingForLayer("rc505-track-1-drums", 1);
    }

    [RelayCommand]
    private void RecordGuitarLayer()
    {
        StartRecordingForLayer("rc505-track-2-guitar", 2);
    }

    [RelayCommand]
    private void RecordPianoLayer()
    {
        StartRecordingForLayer("rc505-track-3-piano", 3);
    }

    [RelayCommand]
    private void RecordVocalLayer()
    {
        StartRecordingForLayer("rc505-track-4-vocal", 4);
    }

    [RelayCommand]
    private void RecordExtraLayer()
    {
        StartRecordingForLayer("rc505-track-5-extra", 5);
    }

    private void StartRecordingForLayer(string label, int? layerNumber)
    {
        if (_recordActionInFlight)
        {
            Status = "One recording action at a time.";
            return;
        }

        SetRecordActionInFlight(true);
        try
        {
            ApplySessionToStore();
            if (IsRecording)
            {
                Status = "Already recording.";
                return;
            }

            if (IsMonitoring)
            {
                _monitor.Stop();
                IsMonitoring = false;
            }

            RefreshInputDevices();

            if (SelectedInputDevice is null)
            {
                Status = "No input found. Plug in Scarlett, then press record again.";
                return;
            }

            InputName = SelectedInputDevice.Name;
            Status = "Recording...";

            StopVisualMeter();
            PeakPercent = 0;
            _recordingSignalSeen = false;
            _activeCaptureLabel = label;
            _activeCaptureLayerNumber = layerNumber;
            ActiveRecordingName = layerNumber is null
                ? "Full loop"
                : $"{LayerSlots.First(slot => slot.Number == layerNumber).Name} lane";
            IsRecorderBusy = true;
            var result = _recorder.Start(InputName, _versions.ActiveTakesDirectory, label, peak =>
            {
                Dispatcher.UIThread.Post(() =>
                {
                    PeakPercent = peak;
                    if (!_recordingSignalSeen && peak >= 1)
                    {
                        _recordingSignalSeen = true;
                        Status = peak >= 8
                            ? "Sound is in."
                            : "Quiet take.";
                    }
                });
            });
            IsRecording = result.Success;
            IsRecorderBusy = false;
            CurrentFilePath = result.Path;
            WriteDiagnostic($"START | success={result.Success} | input={SelectedInputDevice.Name} | label={label} | path={result.Path} | message={result.Message}");
            if (result.Success)
            {
                _recordingStartedAt = DateTimeOffset.Now;
                RecordingElapsedLabel = "00:00";
                _recordingTimer.Start();
            }
            else
            {
                ActiveRecordingName = "Not recording";
            }

            Status = result.Success
                ? "Recording. Play now."
                : result.Message;
        }
        finally
        {
            IsRecorderBusy = false;
            SetRecordActionInFlight(false);
        }
    }

    private void RefreshInputDevices()
    {
        var currentId = SelectedInputDevice?.Id;
        InputDevices.Clear();
        foreach (var device in _inputDevices.ListInputs())
        {
            InputDevices.Add(device);
        }

        SelectedInputDevice = InputDevices.FirstOrDefault(device => device.Id == currentId)
            ?? InputDevices.FirstOrDefault(device => device.IsPreferred)
            ?? InputDevices.FirstOrDefault();
        InputName = SelectedInputDevice?.Name ?? "No input selected";
        SignalProbeSummary = "";
    }

    private void RefreshOutputDevices()
    {
        var currentId = SelectedOutputDevice?.Id;
        OutputDevices.Clear();
        foreach (var device in _playback.ListOutputs())
        {
            OutputDevices.Add(device);
        }

        SelectedOutputDevice = OutputDevices.FirstOrDefault(device => device.Id == currentId)
            ?? OutputDevices.FirstOrDefault(device => device.IsDefault)
            ?? OutputDevices.FirstOrDefault();
    }

    [RelayCommand]
    private async Task StopRecording()
    {
        if (_recordActionInFlight)
        {
            Status = "Finishing the recording action.";
            return;
        }

        if (!IsRecording)
        {
            Status = "No active recording to stop.";
            return;
        }

        SetRecordActionInFlight(true);
        IsRecorderBusy = true;
        try
        {
            await Task.Delay(80);
            var result = await Task.Run(() => _recorder.Stop());
            IsRecording = false;
            _recordingTimer.Stop();
            StartVisualMeter();
            WriteDiagnostic($"STOP | success={result.Success} | path={result.Path} | duration={result.DurationLabel} | peak={result.PeakPercent:0.0}% | rms={result.RmsPercent:0.00}% | message={result.Message}");
            if (result.Success)
            {
                PeakPercent = result.PeakPercent;
                CurrentFilePath = result.Path;
                if (result.RmsPercent < 0.05)
                {
                    _versions.MoveToTrash(result.Path);
                    CurrentFilePath = "";
                    Status = "No sound saved.";
                    CommandResult = "Try one short take.";
                    SignalProbeSummary = "";
                    WriteDiagnostic($"REJECT SILENT | raw={result.Path} | peak={result.PeakPercent:0.0}% | rms={result.RmsPercent:0.00}%");
                    RefreshVersions();
                    _activeCaptureLayerNumber = null;
                    _activeCaptureLabel = "recording";
                    ActiveRecordingName = "Not recording";
                    return;
                }

                var repair = _takeRepair.RepairToPlayableStereo(result.Path);
                CurrentFilePath = repair.Path;
                var metrics = AudioPreviewService.InspectMetrics(CurrentFilePath);
                WriteDiagnostic($"REPAIR | success={repair.Success} | path={repair.Path} | duration={metrics.Duration.TotalSeconds:0.00}s | peak={metrics.PeakPercent:0.0}% | rms={metrics.RmsPercent:0.00}% | waveform={metrics.Waveform} | message={repair.Message}");
                if (!repair.Success || !metrics.Success || metrics.Duration.TotalSeconds < 0.75 || metrics.PeakPercent < 1.5 || metrics.RmsPercent < 0.25)
                {
                    if (File.Exists(CurrentFilePath))
                    {
                        _versions.MoveToTrash(CurrentFilePath);
                    }

                    CurrentFilePath = "";
                    var isClipping = repair.Message.Contains("overloaded", StringComparison.OrdinalIgnoreCase)
                        || repair.Message.Contains("clipping", StringComparison.OrdinalIgnoreCase);
                    Status = isClipping
                        ? "Too hot."
                        : "No sound saved.";
                    CommandResult = isClipping
                        ? "Lower Scarlett gain."
                        : "Try one short take.";
                    SignalProbeSummary = "";
                    RefreshVersions();
                    _activeCaptureLayerNumber = null;
                    _activeCaptureLabel = "recording";
                    ActiveRecordingName = "Not recording";
                    return;
                }

                Status = "Saved. Press play.";
                CommandResult = $"{metrics.Duration:mm\\:ss}.";
                SignalProbeSummary = "";
                WriteTakeMetadata(CurrentFilePath, metrics, repair.Message);
                WriteDiagnostic($"SAVED PLAYABLE | path={CurrentFilePath} | duration={metrics.Duration.TotalSeconds:0.00}s | peak={metrics.PeakPercent:0.0}% | rms={metrics.RmsPercent:0.00}%");
                RefreshVersions();
                AutoAssignActiveCapture(CurrentFilePath);
                SelectFileInExplorer(CurrentFilePath);
                return;
            }

            PeakPercent = result.PeakPercent;
            if (!string.IsNullOrWhiteSpace(result.Path) && File.Exists(result.Path))
            {
                _versions.MoveToTrash(result.Path);
                CurrentFilePath = "";
                RefreshVersions();
            }

            Status = "No sound saved.";
            WriteDiagnostic($"STOP FAILED | message={result.Message}");
            _activeCaptureLayerNumber = null;
            _activeCaptureLabel = "recording";
            ActiveRecordingName = "Not recording";
        }
        finally
        {
            IsRecorderBusy = false;
            SetRecordActionInFlight(false);
        }
    }

    [RelayCommand]
    private void PlaySelected()
    {
        var path = SelectedVersion?.Path ?? CurrentFilePath;
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            Status = "No saved take selected.";
            return;
        }

        CurrentFilePath = path;
        StopPlaybackVisual();
        _playback.StopAll();
        var metrics = AudioPreviewService.InspectMetrics(path);
        var outputId = SelectedOutputDevice?.Id ?? "";
        var outputName = _playback.GetOutputName(outputId);
        var result = _playback.PlayOnce(0, path, 100, outputId);
        if (result.Success)
        {
            StartPlaybackVisual(path, metrics.Duration);
        }

        Status = result.Success
            ? "Playing take."
            : result.Message;
        CommandResult = result.Success
            ? $"Playing: {metrics.Duration:mm\\:ss}."
            : result.Message;
    }

    [RelayCommand]
    private void PlayVersion(RecorderVersionFile? version)
    {
        if (version is null)
        {
            Status = "No take selected.";
            return;
        }

        SelectedVersion = version;
        CurrentFilePath = version.Path;
        PlaySelected();
    }

    [RelayCommand]
    private void OpenVersionFolder(RecorderVersionFile? version)
    {
        if (version is null || string.IsNullOrWhiteSpace(version.Path) || !File.Exists(version.Path))
        {
            OpenFolder();
            return;
        }

        SelectedVersion = version;
        SelectFileInExplorer(version.Path);
        Status = $"Opened take: {Path.GetFileName(version.Path)}";
    }

    [RelayCommand]
    private void StopPlayback()
    {
        _playback.StopAll();
        StopPlaybackVisual();
        Status = "Internal playback stopped. If Windows player opened, close/pause it there.";
    }

    [RelayCommand]
    private void TestSpeaker()
    {
        _playback.StopAll();
        var outputId = SelectedOutputDevice?.Id ?? "";
        var outputName = _playback.GetOutputName(outputId);
        var result = _playback.PlayTestTone(outputId);
        Status = result.Message;
        CommandResult = $"{result.Message} Output: {outputName}.";
    }

    [RelayCommand]
    private void ToggleMonitor()
    {
        if (IsMonitoring)
        {
            _monitor.Stop();
            IsMonitoring = false;
            Status = "Monitor off. Recording can still capture silently.";
            CommandResult = "Direct Monitor off + GateKPT Monitor off means you will not hear yourself while recording.";
            return;
        }

        if (SelectedInputDevice is null)
        {
            RefreshInputDevices();
        }

        if (SelectedOutputDevice is null)
        {
            RefreshOutputDevices();
        }

        var result = _monitor.Start(SelectedInputDevice?.Id ?? "", SelectedOutputDevice?.Id ?? "");
        IsMonitoring = result.Success;
        Status = result.Message;
        CommandResult = result.Success
            ? "Monitor is live. If you hear doubling/echo, turn it off and use Scarlett Direct Monitor instead."
            : result.Message;
    }

    [RelayCommand]
    private void PrimeShapeSound()
    {
        ChatText = "make it warmer";
        Status = "Shape sound loaded.";
        CommandResult = "Run command when ready.";
    }

    [RelayCommand]
    private void PrimeVisual()
    {
        Status = "Visual direction: cover, clip, caption, color.";
        CommandResult = "Next: capture visual note or use the visual room.";
    }

    [RelayCommand]
    private void PrimeExportShare()
    {
        Status = "Export/share: mix, folder, archive.";
        CommandResult = LayerSlots.Any(slot => !string.IsNullOrWhiteSpace(slot.Path))
            ? "Layer deck has sound. Export mix when ready."
            : "No layers yet. Record or assign takes first.";
    }

    [RelayCommand]
    private void AssignSelectedToNextLayer()
    {
        var path = SelectedVersion?.Path ?? CurrentFilePath;
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            Status = "No take selected. Record or select a take first.";
            return;
        }

        var slot = LayerSlots.FirstOrDefault(item => string.IsNullOrWhiteSpace(item.Path));
        if (slot is null)
        {
            Status = "All layer lanes are loaded. Clear the deck first, or re-record a specific RC-505 track to replace that lane.";
            CommandResult = "Layer deck full. No silent overwrite happened.";
            return;
        }

        ReplaceLayerSlot(slot.Number, slot with
        {
            Path = path,
            FileName = Path.GetFileName(path),
            Status = "Loaded"
        });

        Status = $"Assigned {Path.GetFileName(path)} to {slot.Name}.";
        CommandResult = $"Layer loaded: {slot.Name}";
    }

    [RelayCommand]
    private void ReplaceSelectedLayer()
    {
        var path = SelectedVersion?.Path ?? CurrentFilePath;
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            Status = "No take selected.";
            return;
        }

        var slot = SelectedLayerSlot ?? LayerSlots.FirstOrDefault();
        if (slot is null)
        {
            Status = "No stem lane selected.";
            return;
        }

        ReplaceLayerSlot(slot.Number, slot with
        {
            Path = path,
            FileName = Path.GetFileName(path),
            Status = "Loaded"
        });

        Status = $"Replaced {slot.Name}.";
        CommandResult = $"{slot.Name}: {Path.GetFileName(path)}";
    }

    [RelayCommand]
    private void OpenSelectedLayer()
    {
        var slot = SelectedLayerSlot;
        if (slot is null || string.IsNullOrWhiteSpace(slot.Path) || !File.Exists(slot.Path))
        {
            Status = "Selected lane is empty.";
            return;
        }

        _playback.StopAll();
        Process.Start(new ProcessStartInfo
        {
            FileName = slot.Path,
            UseShellExecute = true
        });
        Status = $"Opened {slot.Name}: {slot.FileName}";
    }

    [RelayCommand]
    private void PlayLayerDeck()
    {
        var loaded = LayerSlots.Where(slot => !string.IsNullOrWhiteSpace(slot.Path) && File.Exists(slot.Path)).ToList();
        if (loaded.Count == 0)
        {
            Status = "No lanes loaded. Record or assign takes first.";
            CommandResult = "Layer deck is empty.";
            return;
        }

        _playback.StopAll();
        var messages = loaded
            .Select(slot => _playback.PlayLoop(slot.Number, slot.Path, 80))
            .ToList();

        var failed = messages.FirstOrDefault(result => !result.Success);
        if (failed is not null)
        {
            Status = failed.Message;
            CommandResult = "Some lanes could not play.";
            return;
        }

        Status = $"Playing {loaded.Count} loop lane(s). Use STOP INTERNAL to stop.";
        CommandResult = $"Looping deck: {string.Join(", ", loaded.Select(slot => slot.Name))}";
    }

    [RelayCommand]
    private void ClearSelectedLayer()
    {
        var slot = SelectedLayerSlot;
        if (slot is null)
        {
            Status = "No stem lane selected.";
            return;
        }

        ReplaceLayerSlot(slot.Number, new LayerSlotItem(slot.Number, slot.Name));
        Status = $"Cleared {slot.Name}.";
        CommandResult = "Take file kept. Lane cleared.";
    }

    [RelayCommand]
    private void ExportLayerMix()
    {
        var loaded = LayerSlots.Where(slot => !string.IsNullOrWhiteSpace(slot.Path) && File.Exists(slot.Path)).ToList();
        if (loaded.Count == 0)
        {
            Status = "No layers loaded yet. Assign takes to the layer deck first.";
            return;
        }

        _playback.StopAll();
        var targetPath = _versions.CreateVersionPath("layer-mix", ".wav");
        var result = _mixdown.CreateMixdown(loaded.Select(slot => slot.Path), targetPath);
        if (!result.Success)
        {
            Status = result.Message;
            CommandResult = "Mix export failed.";
            return;
        }

        CurrentFilePath = result.Path;
        LastExportedMixPath = result.Path;
        RefreshVersions();
        SelectedVersion = Versions.FirstOrDefault(item => item.Path == result.Path) ?? SelectedVersion;
        var included = string.Join(", ", loaded.Select(slot => slot.Name));
        Status = $"{result.Message} Included: {included}.";
        CommandResult = $"Created mix: {Path.GetFileName(result.Path)} | Layers: {included}";
    }

    [RelayCommand]
    private void MixSessionTakes()
    {
        RefreshVersions();
        var sourcePaths = Versions
            .Select(version => version.Path)
            .Where(IsMixableTake)
            .ToList();

        if (sourcePaths.Count == 0)
        {
            Status = "Record one take first.";
            CommandResult = "No WAV takes found in this session.";
            return;
        }

        _playback.StopAll();
        var targetPath = _versions.CreateVersionPath("session-mix", ".wav");
        var result = _mixdown.CreateSmartMixdown(sourcePaths, targetPath);
        if (!result.Success)
        {
            Status = result.Message;
            CommandResult = "Mix failed.";
            return;
        }

        CurrentFilePath = result.Path;
        LastExportedMixPath = result.Path;
        RefreshVersions();
        SelectedVersion = Versions.FirstOrDefault(item => item.Path == result.Path) ?? SelectedVersion;
        Status = $"One WAV ready from {sourcePaths.Count} take(s).";
        CommandResult = $"Made one WAV: {Path.GetFileName(result.Path)}";
    }

    [RelayCommand]
    private void ExportSeparateStems()
    {
        var loaded = LayerSlots.Where(slot => !string.IsNullOrWhiteSpace(slot.Path) && File.Exists(slot.Path)).ToList();
        if (loaded.Count == 0)
        {
            Status = "No stems loaded.";
            CommandResult = "Load lanes before exporting stems.";
            return;
        }

        var targetDirectory = _versions.CreateStemExportDirectory();
        var exported = loaded
            .Select(slot => _versions.CopyStemExport(slot.Path, targetDirectory, slot.Number, slot.Name))
            .Where(path => !string.IsNullOrWhiteSpace(path))
            .ToList();

        LastStemExportDirectory = targetDirectory;
        Status = $"Exported {exported.Count} separate stem(s).";
        CommandResult = $"Stem folder: {Path.GetFileName(targetDirectory)}";
    }

    [RelayCommand]
    private void OpenStemExportFolder()
    {
        if (string.IsNullOrWhiteSpace(LastStemExportDirectory) || !Directory.Exists(LastStemExportDirectory))
        {
            Status = "No stem export folder yet.";
            return;
        }

        Process.Start(new ProcessStartInfo
        {
            FileName = LastStemExportDirectory,
            UseShellExecute = true
        });
        Status = $"Opened stems: {Path.GetFileName(LastStemExportDirectory)}";
    }

    [RelayCommand]
    private void OpenExportedMix()
    {
        if (string.IsNullOrWhiteSpace(LastExportedMixPath) || !File.Exists(LastExportedMixPath))
        {
            Status = "No exported mix found yet. Export the layer mix first.";
            return;
        }

        _playback.StopAll();
        Process.Start(new ProcessStartInfo
        {
            FileName = LastExportedMixPath,
            UseShellExecute = true
        });
        Status = $"Opened exported mix: {Path.GetFileName(LastExportedMixPath)}";
    }

    [RelayCommand]
    private void FindLatestPhoneVideo()
    {
        var result = _phoneVideo.FindLatestVideo();
        if (result.Success)
        {
            PhoneVideoPath = result.Path;
        }

        VideoWorkflowStatus = result.Message;
        Status = result.Message;
    }

    [RelayCommand]
    private void OpenCamera()
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "microsoft.windows.camera:",
                UseShellExecute = true
            });

            VideoWorkflowStatus = "Camera opened. Put your face in the corner, screen-record GateKPT, then use Make post clip when ready.";
            Status = VideoWorkflowStatus;
        }
        catch (Exception ex)
        {
            VideoWorkflowStatus = $"Could not open camera: {ex.Message}";
            Status = VideoWorkflowStatus;
        }
    }

    [RelayCommand]
    private void OptimizePhoneVideo()
    {
        if (string.IsNullOrWhiteSpace(PhoneVideoPath))
        {
            FindLatestPhoneVideo();
        }

        var result = _phoneVideo.OptimizeVideo(PhoneVideoPath);
        if (result.Success)
        {
            PhoneVideoPath = result.Path;
            LastVideoOutputPath = result.Path;
        }

        VideoWorkflowStatus = result.Message;
        Status = result.Message;
    }

    [RelayCommand]
    private void RenderPhoneVideoWithTake()
    {
        if (string.IsNullOrWhiteSpace(PhoneVideoPath))
        {
            FindLatestPhoneVideo();
        }

        var audioPath = SelectedVersion?.Path ?? CurrentFilePath;
        if (string.IsNullOrWhiteSpace(audioPath) || !File.Exists(audioPath))
        {
            VideoWorkflowStatus = "No GateKPT take selected. Record or select a playable take first.";
            Status = VideoWorkflowStatus;
            return;
        }

        var result = _phoneVideo.RenderWithGateKptAudio(PhoneVideoPath, audioPath, VideoAudioOffsetMs, VideoExportPreset);
        if (result.Success)
        {
            LastVideoOutputPath = result.Path;
        }

        VideoWorkflowStatus = result.Message;
        Status = result.Message;
    }

    [RelayCommand]
    private void StartScreenCapture()
    {
        if (_screenCapture.IsRecording)
        {
            VideoWorkflowStatus = "Already recording screen.";
            Status = VideoWorkflowStatus;
            return;
        }

        var inputName = SelectedInputDevice?.Name;
        var result = _screenCapture.Start(inputName);
        if (result.Success)
        {
            LastScreenCapturePath = result.Path;
            _screenCaptureStartedAt = DateTimeOffset.Now;
            _screenCaptureMarkers.Clear();
            _screenCaptureMarkerLogPath = Path.ChangeExtension(result.Path, ".markers.txt");
            SaveScreenCaptureMarkers();
        }

        VideoWorkflowStatus = result.Success ? "Screen recording. Mark good moments." : result.Message;
        Status = VideoWorkflowStatus;
        OnPropertyChanged(nameof(IsScreenCapturing));
        OnPropertyChanged(nameof(ScreenCaptureActionLabel));
        OnPropertyChanged(nameof(VideoLaneTitle));
        OnPropertyChanged(nameof(VideoLaneStatus));
    }

    [RelayCommand]
    private void StopScreenCapture()
    {
        var result = _screenCapture.Stop();
        if (result.Success)
        {
            LastScreenCapturePath = result.Path;
            LastVideoOutputPath = result.Path;
            SaveScreenCaptureMarkers();
            _screenCapture.OpenOutputFolder();
        }

        var markerSummary = _screenCaptureMarkers.Count == 0
            ? ""
            : $" {_screenCaptureMarkers.Count} marked.";
        VideoWorkflowStatus = result.Success ? $"Screen saved.{markerSummary}" : result.Message;
        Status = VideoWorkflowStatus;
        OnPropertyChanged(nameof(IsScreenCapturing));
        OnPropertyChanged(nameof(ScreenCaptureActionLabel));
        OnPropertyChanged(nameof(VideoLaneTitle));
        OnPropertyChanged(nameof(VideoLaneStatus));
    }

    [RelayCommand]
    private void ToggleScreenCapture()
    {
        if (_screenCapture.IsRecording)
        {
            StopScreenCapture();
        }
        else
        {
            StartScreenCapture();
        }
    }

    [RelayCommand]
    private void MarkMoment()
    {
        DropScreenCaptureMarker("clip this");
    }

    [RelayCommand]
    private void ClipLastMoment()
    {
        ClipLastScreenCaptureMarker();
    }

    [RelayCommand]
    private void OpenScreenCaptureFolder()
    {
        _screenCapture.OpenOutputFolder();
        Status = "Opened screen folder.";
    }

    private void DropScreenCaptureMarker(string rawCommand)
    {
        if (!_screenCapture.IsRecording || _screenCaptureStartedAt == DateTimeOffset.MinValue)
        {
            CommandResult = "Start screen recording first.";
            Status = CommandResult;
            return;
        }

        var elapsed = DateTimeOffset.Now - _screenCaptureStartedAt;
        var label = ExtractMarkerLabel(rawCommand);
        var marker = new LongSessionMarker(DateTimeOffset.Now, elapsed, label);
        _screenCaptureMarkers.Add(marker);
        SaveScreenCaptureMarkers();

        CommandResult = $"Marked {FormatMarkerTime(elapsed)}.";
        Status = CommandResult;
    }

    private void ClipLastScreenCaptureMarker()
    {
        var marker = _screenCaptureMarkers.LastOrDefault();
        if (marker is null)
        {
            CommandResult = "Mark a moment first.";
            Status = CommandResult;
            return;
        }

        var source = LastVideoOutputPath;
        if (string.IsNullOrWhiteSpace(source) || !File.Exists(source))
        {
            source = LastScreenCapturePath;
        }

        var result = _longSessionClips.CutAroundMarker(source, marker.Elapsed, marker.Label);
        if (result.Success)
        {
            LastVideoOutputPath = result.Path;
            _longSessionClips.OpenOutputFolder();
        }

        CommandResult = result.Success ? "Clip ready." : result.Message;
        Status = CommandResult;
    }

    private void OpenScreenClipFolder()
    {
        _longSessionClips.OpenOutputFolder();
        Status = "Opened clips folder.";
    }

    [RelayCommand]
    private async Task HarvestVoice()
    {
        if (IsCommandBusy || IsRecorderBusy || IsRecording)
        {
            Status = "Finish the current GateKPT action first.";
            return;
        }

        IsCommandBusy = true;
        HarvestStatus = "Finding clips...";
        Status = "Finding clips...";
        CommandResult = "Finding clips...";
        try
        {
            var result = await Task.Run(() => _voiceHarvest.Harvest());
            HarvestStatus = result.Success ? "Clips checked." : result.Message;
            CommandResult = HarvestStatus;
            Status = HarvestStatus;
            if (result.Success && result.ClipCount > 0)
            {
                _voiceHarvest.OpenClipsFolder();
            }
        }
        finally
        {
            IsCommandBusy = false;
        }
    }

    [RelayCommand]
    private void OpenVoiceInbox()
    {
        _voiceHarvest.OpenInboxFolder();
        HarvestStatus = "Opened video inbox.";
        Status = HarvestStatus;
    }

    [RelayCommand]
    private void OpenHarvestClips()
    {
        _voiceHarvest.OpenClipsFolder();
        HarvestStatus = "Opened clips.";
        Status = HarvestStatus;
    }

    private void SaveScreenCaptureMarkers()
    {
        if (string.IsNullOrWhiteSpace(_screenCaptureMarkerLogPath))
        {
            return;
        }

        Directory.CreateDirectory(Path.GetDirectoryName(_screenCaptureMarkerLogPath)!);
        var lines = new List<string>
        {
            "GateKPT long-session markers",
            $"capture={LastScreenCapturePath}",
            $"started={_screenCaptureStartedAt:O}",
            ""
        };

        lines.AddRange(_screenCaptureMarkers.Select(marker =>
            $"{FormatMarkerTime(marker.Elapsed)} | {marker.Label} | {marker.CreatedAt:O}"));

        File.WriteAllLines(_screenCaptureMarkerLogPath, lines);
    }

    private static string ExtractMarkerLabel(string rawCommand)
    {
        var label = rawCommand
            .Replace("clip this", "", StringComparison.OrdinalIgnoreCase)
            .Replace("mark this", "", StringComparison.OrdinalIgnoreCase)
            .Replace("mark moment", "", StringComparison.OrdinalIgnoreCase)
            .Replace("drop marker", "", StringComparison.OrdinalIgnoreCase)
            .Replace("good moment", "", StringComparison.OrdinalIgnoreCase)
            .Replace("remember this", "", StringComparison.OrdinalIgnoreCase)
            .Replace("marker", "", StringComparison.OrdinalIgnoreCase)
            .Trim(' ', ':', '-', '.');

        return string.IsNullOrWhiteSpace(label) ? "moment" : label;
    }

    private static string FormatMarkerTime(TimeSpan time) =>
        $"{(int)time.TotalHours:00}:{time.Minutes:00}:{time.Seconds:00}";

    [RelayCommand]
    private async Task MakeVisualClip()
    {
        if (IsCommandBusy || IsRecorderBusy || IsRecording)
        {
            Status = "Finish the current recording/action first.";
            return;
        }

        var audioPath = SelectedVersion?.Path ?? CurrentFilePath;
        if (string.IsNullOrWhiteSpace(audioPath) || !File.Exists(audioPath))
        {
            VideoWorkflowStatus = "Record or select one take first.";
            Status = VideoWorkflowStatus;
            return;
        }

        IsCommandBusy = true;
        VideoWorkflowStatus = "Rendering visual clip...";
        Status = "Rendering GateKPT visual MP4 from the selected take.";
        try
        {
            var mood = string.IsNullOrWhiteSpace(ContentPackWorld) ? "night" : ContentPackWorld;
            var result = await Task.Run(() => _visualClip.RenderFromAudio(audioPath, mood));
            if (result.Success)
            {
                LastVideoOutputPath = result.Path;
                VideoWorkflowStatus = result.Message;
                Status = result.Message;
                _visualClip.OpenOutputFolder();
                return;
            }

            VideoWorkflowStatus = result.Message;
            Status = result.Message;
        }
        finally
        {
            IsCommandBusy = false;
        }
    }

    [RelayCommand]
    private async Task MakePostClip()
    {
        if (IsCommandBusy || IsRecorderBusy || IsRecording)
        {
            Status = "Finish the current recording/action first.";
            return;
        }

        var audioPath = SelectedVersion?.Path ?? CurrentFilePath;
        if (string.IsNullOrWhiteSpace(audioPath) || !File.Exists(audioPath))
        {
            VideoWorkflowStatus = "Record or select a GateKPT take first.";
            Status = VideoWorkflowStatus;
            return;
        }

        var audio = AudioPreviewService.InspectMetrics(audioPath);
        if (!audio.Success || audio.Duration.TotalSeconds < 0.75 || audio.RmsPercent < 0.10)
        {
            VideoWorkflowStatus = "Selected take does not look usable yet. Record one clean take first.";
            Status = VideoWorkflowStatus;
            return;
        }

        IsCommandBusy = true;
        VideoWorkflowStatus = "Building post clip...";
        Status = "Finding phone video and pairing it with GateKPT audio.";
        try
        {
            var videoPath = PhoneVideoPath;
            if (string.IsNullOrWhiteSpace(videoPath) || !File.Exists(videoPath))
            {
                var found = await Task.Run(() => _phoneVideo.FindLatestVideo());
                if (!found.Success)
                {
                    var mood = string.IsNullOrWhiteSpace(ContentPackWorld) ? "night" : ContentPackWorld;
                    var visual = await Task.Run(() => _visualClip.RenderFromAudio(audioPath, mood));
                    if (visual.Success)
                    {
                        LastVideoOutputPath = visual.Path;
                        VideoWorkflowStatus = $"No phone video found, so GateKPT made a visual clip: {Path.GetFileName(visual.Path)}.";
                        Status = VideoWorkflowStatus;
                        _visualClip.OpenOutputFolder();
                        return;
                    }

                    VideoWorkflowStatus = $"{found.Message} Also could not render visual clip: {visual.Message}";
                    Status = VideoWorkflowStatus;
                    return;
                }

                PhoneVideoPath = found.Path;
                videoPath = found.Path;
            }

            var offset = VideoAudioOffsetMs;
            var preset = VideoExportPreset;
            var result = await Task.Run(() => _phoneVideo.RenderWithGateKptAudio(videoPath, audioPath, offset, preset));
            if (result.Success)
            {
                LastVideoOutputPath = result.Path;
                VideoWorkflowStatus = $"Post clip ready: {Path.GetFileName(result.Path)} / {VideoSyncLabel}.";
                Status = VideoWorkflowStatus;
                _phoneVideo.OpenOutputFolder();
                return;
            }

            VideoWorkflowStatus = result.Message;
            Status = result.Message;
        }
        finally
        {
            IsCommandBusy = false;
        }
    }

    [RelayCommand]
    private void OpenVideoOutputFolder()
    {
        _phoneVideo.OpenOutputFolder();
        Status = $"Opened {_phoneVideo.OutputDirectory}";
    }

    [RelayCommand]
    private void OpenLatestPostClip()
    {
        if (string.IsNullOrWhiteSpace(LastVideoOutputPath) || !File.Exists(LastVideoOutputPath))
        {
            Status = "No post clip exported yet.";
            VideoWorkflowStatus = Status;
            return;
        }

        Process.Start(new ProcessStartInfo
        {
            FileName = LastVideoOutputPath,
            UseShellExecute = true
        });
        Status = $"Opened post clip: {Path.GetFileName(LastVideoOutputPath)}";
        VideoWorkflowStatus = Status;
    }

    [RelayCommand]
    private void AudioEarlier()
    {
        VideoAudioOffsetMs = Math.Max(VideoAudioOffsetMs - 100, -3000);
        VideoWorkflowStatus = $"Sync set: {VideoSyncLabel}. Re-export with Make post clip.";
        Status = VideoWorkflowStatus;
    }

    [RelayCommand]
    private void AudioLater()
    {
        VideoAudioOffsetMs = Math.Min(VideoAudioOffsetMs + 100, 3000);
        VideoWorkflowStatus = $"Sync set: {VideoSyncLabel}. Re-export with Make post clip.";
        Status = VideoWorkflowStatus;
    }

    [RelayCommand]
    private void ResetVideoSync()
    {
        VideoAudioOffsetMs = 0;
        VideoWorkflowStatus = $"Sync reset: {VideoSyncLabel}.";
        Status = VideoWorkflowStatus;
    }

    [RelayCommand]
    private async Task AutoSyncPostClip()
    {
        if (IsCommandBusy || IsRecorderBusy || IsRecording)
        {
            Status = "Finish the current recording/action first.";
            return;
        }

        var audioPath = SelectedVersion?.Path ?? CurrentFilePath;
        if (string.IsNullOrWhiteSpace(audioPath) || !File.Exists(audioPath))
        {
            VideoWorkflowStatus = "Record or select a GateKPT take first.";
            Status = VideoWorkflowStatus;
            return;
        }

        IsCommandBusy = true;
        VideoWorkflowStatus = "Looking for first loud hit in video and take...";
        Status = VideoWorkflowStatus;
        try
        {
            var videoPath = PhoneVideoPath;
            if (string.IsNullOrWhiteSpace(videoPath) || !File.Exists(videoPath))
            {
                var found = await Task.Run(() => _phoneVideo.FindLatestVideo());
                if (!found.Success)
                {
                    VideoWorkflowStatus = found.Message;
                    Status = found.Message;
                    return;
                }

                PhoneVideoPath = found.Path;
                videoPath = found.Path;
            }

            var sync = await Task.Run(() => _phoneVideo.SuggestSyncOffset(videoPath, audioPath));
            if (!sync.Success)
            {
                VideoWorkflowStatus = sync.Message;
                Status = sync.Message;
                return;
            }

            VideoAudioOffsetMs = sync.OffsetMs;
            VideoWorkflowStatus = $"{sync.Message} Re-export with Make post clip.";
            Status = VideoWorkflowStatus;
        }
        finally
        {
            IsCommandBusy = false;
        }
    }

    [RelayCommand]
    private void ToggleVideoPreset()
    {
        VideoExportPreset = VideoExportPreset.Equals("short", StringComparison.OrdinalIgnoreCase)
            ? "same"
            : "short";
        VideoWorkflowStatus = $"Video preset: {VideoExportPresetLabel}.";
        Status = VideoWorkflowStatus;
    }

    private static (string Caption, string MoodTag) BuildWorldLine(string world)
    {
        return world.ToLowerInvariant() switch
        {
            "storm" => ("Storm around the take.", "#stormsession"),
            "chrome" => ("Soft chrome around the take.", "#chromesession"),
            _ => ("Fire around the take.", "#firesession")
        };
    }

    private static (string Title, string Caption, string Snap) BuildClipLine(string clipType)
    {
        return clipType.ToLowerInvariant() switch
        {
            "process" => (
                "Building the sound after work",
                "one take, then shape it",
                "process pass"),
            "visual" => (
                "Sound as a night scene",
                "guitar first, world around it",
                "visual pass"),
            "human" => (
                "Small idea, real mood",
                "keeping the charm in the take",
                "quick mood"),
            "build" => (
                "Building my own music tool",
                "custom tools for the way I make music",
                "music tech pass"),
            _ => (
                "Late-night cover pass",
                "raw take, clean feeling",
                "cover pass")
        };
    }

    private static string BuildHashtags(string world, string clipType)
    {
        var worldTag = BuildWorldLine(world).MoodTag;
        var clipTag = clipType.ToLowerInvariant() switch
        {
            "process" => "#process",
            "visual" => "#visuals",
            "human" => "#artist",
            "build" => "#musictech",
            _ => "#cover"
        };

        return $"#gatekpt #floridanightpop {clipTag} {worldTag}";
    }

    private string TasteMemoryPath => Path.Combine(_tasteMemoryDirectory, "take-taste-memory.json");

    private string LiveAlbumJournalPath => Path.Combine(_liveAlbumDirectory, "live-album-journal.txt");

    private void LoadTasteMemories()
    {
        Directory.CreateDirectory(_tasteMemoryDirectory);
        if (!File.Exists(TasteMemoryPath))
        {
            return;
        }

        try
        {
            var json = File.ReadAllText(TasteMemoryPath);
            var items = JsonSerializer.Deserialize<List<TakeTasteMemoryItem>>(json, JsonOptions) ?? [];
            TasteMemories.Clear();
            foreach (var item in items.OrderByDescending(item => item.When).Take(30))
            {
                TasteMemories.Add(item);
            }

            OnPropertyChanged(nameof(TasteMemorySummary));
            OnPropertyChanged(nameof(TasteNextMove));
        }
        catch
        {
            TasteMemoryStatus = "Taste memory file could not be read.";
        }
    }

    private void SaveTasteMemories()
    {
        Directory.CreateDirectory(_tasteMemoryDirectory);
        var json = JsonSerializer.Serialize(TasteMemories.ToList(), JsonOptions);
        File.WriteAllText(TasteMemoryPath, json);
    }

    private string BuildLiveAlbumEntry()
    {
        var audioPath = SelectedVersion?.Path ?? CurrentFilePath;
        var take = string.IsNullOrWhiteSpace(audioPath) ? "no take selected" : Path.GetFileName(audioPath);
        var note = string.IsNullOrWhiteSpace(LiveAlbumNote)
            ? "one honest session note TBD"
            : LiveAlbumNote.Trim();

        return string.Join(
            Environment.NewLine,
            $"[{DateTimeOffset.Now:yyyy-MM-dd HH:mm}] {LiveAlbumEra}",
            $"Scene: {LiveAlbumScene}",
            $"Take: {take}",
            $"Note: {note}",
            $"Public idea: build the album slowly, let people see the room, keep the tools open.",
            "");
    }

    [RelayCommand]
    private void GenerateContentPack()
    {
        var audioPath = SelectedVersion?.Path ?? CurrentFilePath;
        if (string.IsNullOrWhiteSpace(audioPath) || !File.Exists(audioPath))
        {
            ContentPackResult = "Record or select one take first.";
            Status = ContentPackResult;
            return;
        }

        var metrics = AudioPreviewService.InspectMetrics(audioPath);
        var takeName = Path.GetFileNameWithoutExtension(audioPath);
        var duration = metrics.Success ? metrics.Duration.ToString(@"mm\:ss") : "unknown length";
        var world = string.IsNullOrWhiteSpace(ContentPackWorld) ? "Fire" : ContentPackWorld;
        var clipType = string.IsNullOrWhiteSpace(ContentPackClipType) ? "Cover" : ContentPackClipType;
        var worldLine = BuildWorldLine(world);
        var clipLine = BuildClipLine(clipType);
        var hashtags = BuildHashtags(world, clipType);

        ContentPackResult =
            $"Title: {clipLine.Title}\n" +
            $"IG/TikTok: {clipLine.Caption} {worldLine.Caption}\n" +
            $"Snap: {clipLine.Snap}\n" +
            $"LinkedIn: Built a small GateKPT pass from one take: {clipType.ToLowerInvariant()}, {world.ToLowerInvariant()}, {duration}.\n" +
            $"Order: YouTube Short -> TikTok -> Reels -> Snapchat story -> archive.\n" +
            $"Tags: {hashtags}\n" +
            $"Artist note: Raw first. Polish only if it helps. ({takeName})";

        Directory.CreateDirectory(_contentPackDirectory);
        var fileName = $"{DateTimeOffset.Now:yyyyMMdd-HHmmss}-{clipType.ToLowerInvariant()}-{world.ToLowerInvariant()}-content-pack.txt";
        LastContentPackPath = Path.Combine(_contentPackDirectory, fileName);
        File.WriteAllText(LastContentPackPath, ContentPackResult);

        CommandResult = $"Content pack ready: {clipType} / {world}.";
        Status = $"{CommandResult} Saved to content-packs.";
    }

    [RelayCommand]
    private void OpenContentPackFolder()
    {
        Directory.CreateDirectory(_contentPackDirectory);
        Process.Start(new ProcessStartInfo
        {
            FileName = _contentPackDirectory,
            UseShellExecute = true
        });
        Status = $"Opened {_contentPackDirectory}";
    }

    [RelayCommand]
    private void SaveTasteMemory()
    {
        var audioPath = SelectedVersion?.Path ?? CurrentFilePath;
        if (string.IsNullOrWhiteSpace(audioPath) || !File.Exists(audioPath))
        {
            TasteMemoryStatus = "Record or select one take first.";
            Status = TasteMemoryStatus;
            return;
        }

        var worked = string.IsNullOrWhiteSpace(TasteWorked)
            ? "good moment TBD"
            : TasteWorked.Trim();
        var off = string.IsNullOrWhiteSpace(TasteOff)
            ? "needs another listen"
            : TasteOff.Trim();
        var item = new TakeTasteMemoryItem(
            DateTimeOffset.Now,
            Path.GetFileName(audioPath),
            audioPath,
            SelectedCaptureLaneLabel,
            string.IsNullOrWhiteSpace(ContentPackClipType) ? "Cover" : ContentPackClipType,
            string.IsNullOrWhiteSpace(TasteMood) ? ContentPackWorld : TasteMood,
            int.TryParse(TasteRating, out var rating) ? Math.Clamp(rating, 1, 10) : 7,
            worked,
            off);

        TasteMemories.Insert(0, item);
        while (TasteMemories.Count > 30)
        {
            TasteMemories.RemoveAt(TasteMemories.Count - 1);
        }

        SaveTasteMemories();
        TasteMemoryStatus = $"Saved taste: {item.Rating}/10 / {item.Mood}.";
        Status = TasteMemoryStatus;
        OnPropertyChanged(nameof(TasteMemorySummary));
        OnPropertyChanged(nameof(TasteNextMove));
    }

    [RelayCommand]
    private void OpenTasteMemoryFolder()
    {
        Directory.CreateDirectory(_tasteMemoryDirectory);
        Process.Start(new ProcessStartInfo
        {
            FileName = _tasteMemoryDirectory,
            UseShellExecute = true
        });
        Status = $"Opened {_tasteMemoryDirectory}";
    }

    [RelayCommand]
    private void SaveLiveAlbumNote()
    {
        Directory.CreateDirectory(_liveAlbumDirectory);
        var entry = BuildLiveAlbumEntry();
        File.AppendAllText(LiveAlbumJournalPath, entry + Environment.NewLine);
        LiveAlbumStatus = $"Saved live album note: {LiveAlbumScene}.";
        Status = LiveAlbumStatus;
    }

    [RelayCommand]
    private void OpenLiveAlbumFolder()
    {
        Directory.CreateDirectory(_liveAlbumDirectory);
        Process.Start(new ProcessStartInfo
        {
            FileName = _liveAlbumDirectory,
            UseShellExecute = true
        });
        Status = $"Opened {_liveAlbumDirectory}";
    }

    [RelayCommand]
    private void ClearLayerDeck()
    {
        _playback.StopAll();
        for (var index = 0; index < LayerSlots.Count; index++)
        {
            var slot = LayerSlots[index];
            LayerSlots[index] = new LayerSlotItem(slot.Number, slot.Name);
        }

        OnPropertyChanged(nameof(LayerDeckSummary));
        PersistLayerDeck();
        Status = "Layer deck cleared. Takes are still saved in Versions.";
    }

    [RelayCommand]
    private async Task RunChatCommand()
    {
        await RunUserCommandAsync(ChatText.Trim());
    }

    [RelayCommand]
    private void QuickWarmer() => StageCommand("make warmer");

    [RelayCommand]
    private void QuickLouder() => StageCommand("make louder");

    [RelayCommand]
    private void QuickReverb() => StageCommand("add reverb");

    [RelayCommand]
    private void QuickDelete() => StageCommand("delete last");

    [RelayCommand]
    private void StageLateNightChrome() => StageVocalColor("late-night-chrome", "chrome vocal");

    [RelayCommand]
    private void StageSilkSynth() => StageVocalColor("silk-synth", "silk hook");

    [RelayCommand]
    private void StageRobotVocoder() => StageVocalColor("robot-vocoder", "robot vocoder");

    [RelayCommand]
    private void StageLunaPop() => StageVocalColor("luna-pop", "luna vocal");

    [RelayCommand]
    private void StageCloudDoubles() => StageVocalColor("cloud-doubles", "cloud doubles");

    [RelayCommand]
    private void StageRawClean() => StageVocalColor("raw-clean", "clean vocal");

    private void StageVocalColor(string slug, string command)
    {
        SelectedVocalPreset = VocalPresets.FirstOrDefault(item => item.Slug == slug) ?? SelectedVocalPreset;
        ChatText = command;
        CommandResult = "";
        Status = "Color selected. Press Do it or make a version.";
    }

    [RelayCommand]
    private void RenderSelectedVocalPreset()
    {
        var preset = SelectedVocalPreset;
        if (preset is null)
        {
            CommandResult = "Pick a vocal preset first.";
            Status = "No vocal preset selected.";
            return;
        }

        CreateSafeEditCopy(preset.AudioPreset);
    }

    private void StageCommand(string command)
    {
        ChatText = command;
        CommandResult = $"Ready: \"{command}\". Press Do it when you want me to change the take.";
        Status = "Command staged. Nothing changed yet.";
    }

    private async Task RunUserCommandAsync(string command)
    {
        if (string.IsNullOrWhiteSpace(command))
        {
            CommandResult = "Ask me what now, status, mix, content plan, or P/L.";
            Status = "";
            return;
        }

        CommandResult = $"I heard: \"{command}\"";
        AddCommandHistory(command);
        ChatText = command;
        IsCommandBusy = true;
        CommandResult = $"Working on: \"{command}\"...";
        await Task.Delay(180);

        if (command.Contains("stage mode", StringComparison.OrdinalIgnoreCase)
            || command.Contains("hide ui", StringComparison.OrdinalIgnoreCase)
            || command.Contains("hide controls", StringComparison.OrdinalIgnoreCase)
            || command.Contains("clean screen", StringComparison.OrdinalIgnoreCase)
            || command.Contains("just the stage", StringComparison.OrdinalIgnoreCase)
            || command.Contains("full stage", StringComparison.OrdinalIgnoreCase)
            || command.Equals("stage", StringComparison.OrdinalIgnoreCase))
        {
            StageMode = true;
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("show ui", StringComparison.OrdinalIgnoreCase)
            || command.Contains("show controls", StringComparison.OrdinalIgnoreCase)
            || command.Contains("exit stage", StringComparison.OrdinalIgnoreCase)
            || command.Contains("leave stage", StringComparison.OrdinalIgnoreCase))
        {
            StageMode = false;
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("cam", StringComparison.OrdinalIgnoreCase)
            || command.Contains("camera", StringComparison.OrdinalIgnoreCase)
            || command.Contains("webcam", StringComparison.OrdinalIgnoreCase)
            || command.Contains("elgato", StringComparison.OrdinalIgnoreCase)
            || command.Contains("face cam", StringComparison.OrdinalIgnoreCase))
        {
            if (command.Contains("off", StringComparison.OrdinalIgnoreCase)
                || command.Contains("hide", StringComparison.OrdinalIgnoreCase)
                || command.Contains("no cam", StringComparison.OrdinalIgnoreCase))
            {
                _camLayoutIndex = 0;
                ApplyCamLayout(0);
            }
            else
            {
                CycleCamLayout();
            }

            IsCommandBusy = false;
            return;
        }

        if (command.Contains("delete", StringComparison.OrdinalIgnoreCase))
        {
            DeleteSelectedOrLatest();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("clean blanks", StringComparison.OrdinalIgnoreCase)
            || command.Contains("remove blanks", StringComparison.OrdinalIgnoreCase)
            || command.Contains("trash blanks", StringComparison.OrdinalIgnoreCase))
        {
            CleanBlankTakes();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("rename", StringComparison.OrdinalIgnoreCase))
        {
            var label = command
                .Replace("rename", "", StringComparison.OrdinalIgnoreCase)
                .Replace("this", "", StringComparison.OrdinalIgnoreCase)
                .Replace("take", "", StringComparison.OrdinalIgnoreCase)
                .Trim();
            RenameSelected(string.IsNullOrWhiteSpace(label) ? "renamed-take" : label);
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("show", StringComparison.OrdinalIgnoreCase)
            || command.Contains("versions", StringComparison.OrdinalIgnoreCase))
        {
            RefreshVersions();
            CommandResult = Versions.Count == 0
                ? "No takes yet."
                : $"I found {Versions.Count} take(s). Pick one, then play or shape it.";
            Status = CommandResult;
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("help", StringComparison.OrdinalIgnoreCase)
            || command.Contains("commands", StringComparison.OrdinalIgnoreCase))
        {
            CommandResult = CommandHelp;
            Status = "Showing command examples.";
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("harvest", StringComparison.OrdinalIgnoreCase)
            || command.Contains("find clips", StringComparison.OrdinalIgnoreCase)
            || command.Contains("process long session", StringComparison.OrdinalIgnoreCase)
            || command.Contains("couch recording", StringComparison.OrdinalIgnoreCase)
            || command.Contains("voice inbox", StringComparison.OrdinalIgnoreCase))
        {
            if (command.Contains("clips", StringComparison.OrdinalIgnoreCase))
            {
                OpenHarvestClips();
                IsCommandBusy = false;
                return;
            }

            if (command.Contains("open", StringComparison.OrdinalIgnoreCase)
                || command.Contains("folder", StringComparison.OrdinalIgnoreCase))
            {
                OpenVoiceInbox();
                IsCommandBusy = false;
                return;
            }

            IsCommandBusy = false;
            await HarvestVoice();
            return;
        }

        var vocalPreset = FindVocalPreset(command);
        if (vocalPreset is not null)
        {
            SelectedVocalPreset = vocalPreset;
            CreateSafeEditCopy(vocalPreset.AudioPreset);
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("export stems", StringComparison.OrdinalIgnoreCase)
            || command.Contains("separate stems", StringComparison.OrdinalIgnoreCase))
        {
            ExportSeparateStems();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("export mix", StringComparison.OrdinalIgnoreCase)
            || command.Contains("mixdown", StringComparison.OrdinalIgnoreCase)
            || command.Equals("mix", StringComparison.OrdinalIgnoreCase)
            || command.Contains("mix session", StringComparison.OrdinalIgnoreCase)
            || command.Contains("one wav", StringComparison.OrdinalIgnoreCase)
            || command.Contains("combine", StringComparison.OrdinalIgnoreCase)
            || command.Contains("bounce", StringComparison.OrdinalIgnoreCase))
        {
            MixSessionTakes();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("clip last", StringComparison.OrdinalIgnoreCase)
            || command.Contains("make clip", StringComparison.OrdinalIgnoreCase)
            || command.Contains("cut clip", StringComparison.OrdinalIgnoreCase)
            || command.Contains("cut last", StringComparison.OrdinalIgnoreCase))
        {
            ClipLastScreenCaptureMarker();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("clip this", StringComparison.OrdinalIgnoreCase)
            || command.Contains("mark this", StringComparison.OrdinalIgnoreCase)
            || command.Contains("mark moment", StringComparison.OrdinalIgnoreCase)
            || command.Contains("drop marker", StringComparison.OrdinalIgnoreCase)
            || command.Contains("good moment", StringComparison.OrdinalIgnoreCase)
            || command.Contains("remember this", StringComparison.OrdinalIgnoreCase))
        {
            DropScreenCaptureMarker(command);
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("post clip", StringComparison.OrdinalIgnoreCase)
            || command.Contains("cover video", StringComparison.OrdinalIgnoreCase)
            || command.Contains("make video", StringComparison.OrdinalIgnoreCase)
            || command.Contains("visual clip", StringComparison.OrdinalIgnoreCase)
            || command.Contains("screen clip", StringComparison.OrdinalIgnoreCase)
            || command.Contains("use phone video", StringComparison.OrdinalIgnoreCase))
        {
            IsCommandBusy = false;
            await MakePostClip();
            return;
        }

        if (command.Contains("start capture", StringComparison.OrdinalIgnoreCase)
            || command.Contains("start screen", StringComparison.OrdinalIgnoreCase)
            || command.Contains("record screen", StringComparison.OrdinalIgnoreCase)
            || command.Contains("screen record", StringComparison.OrdinalIgnoreCase))
        {
            StartScreenCapture();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("stop capture", StringComparison.OrdinalIgnoreCase)
            || command.Contains("stop screen", StringComparison.OrdinalIgnoreCase)
            || command.Contains("finish capture", StringComparison.OrdinalIgnoreCase))
        {
            StopScreenCapture();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("open captures", StringComparison.OrdinalIgnoreCase)
            || command.Contains("capture folder", StringComparison.OrdinalIgnoreCase))
        {
            OpenScreenCaptureFolder();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("open clips", StringComparison.OrdinalIgnoreCase)
            || command.Contains("clip folder", StringComparison.OrdinalIgnoreCase))
        {
            OpenScreenClipFolder();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("open harvest clips", StringComparison.OrdinalIgnoreCase)
            || command.Contains("harvest clips folder", StringComparison.OrdinalIgnoreCase)
            || command.Contains("voice clips", StringComparison.OrdinalIgnoreCase))
        {
            OpenHarvestClips();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("audio earlier", StringComparison.OrdinalIgnoreCase)
            || command.Contains("sound earlier", StringComparison.OrdinalIgnoreCase))
        {
            AudioEarlier();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("audio later", StringComparison.OrdinalIgnoreCase)
            || command.Contains("sound later", StringComparison.OrdinalIgnoreCase))
        {
            AudioLater();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("reset sync", StringComparison.OrdinalIgnoreCase)
            || command.Contains("no offset", StringComparison.OrdinalIgnoreCase))
        {
            ResetVideoSync();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("auto sync", StringComparison.OrdinalIgnoreCase)
            || command.Contains("sync video", StringComparison.OrdinalIgnoreCase)
            || command.Contains("sync audio", StringComparison.OrdinalIgnoreCase))
        {
            IsCommandBusy = false;
            await AutoSyncPostClip();
            return;
        }

        if (command.Contains("play deck", StringComparison.OrdinalIgnoreCase)
            || command.Contains("play stack", StringComparison.OrdinalIgnoreCase)
            || command.Contains("play layers", StringComparison.OrdinalIgnoreCase))
        {
            PlayLayerDeck();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("stop deck", StringComparison.OrdinalIgnoreCase)
            || command.Contains("stop stack", StringComparison.OrdinalIgnoreCase)
            || command.Contains("stop layers", StringComparison.OrdinalIgnoreCase))
        {
            StopPlayback();
            CommandResult = "Layer deck stopped.";
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("assign", StringComparison.OrdinalIgnoreCase)
            && (command.Contains("lane", StringComparison.OrdinalIgnoreCase)
                || command.Contains("layer", StringComparison.OrdinalIgnoreCase)
                || command.Contains("stem", StringComparison.OrdinalIgnoreCase)))
        {
            AssignSelectedToNextLayer();
            IsCommandBusy = false;
            return;
        }

        if (TryGetEditPreset(command, out var preset))
        {
            CreateSafeEditCopy(preset);
            IsCommandBusy = false;
            return;
        }

        CommandResult = _brain.Answer(BuildBrainContext(), command);
        Status = "GateKPT answered.";
        IsCommandBusy = false;
    }

    private GateKptBrainContext BuildBrainContext()
    {
        var selected = SelectedVersion?.DisplayName ?? CurrentFileLabel;
        var hasMix = !string.IsNullOrWhiteSpace(LastExportedMixPath) && File.Exists(LastExportedMixPath);
        return new GateKptBrainContext(
            ActiveSessionLabel,
            Versions.Count,
            Versions.Count > 0 || !string.IsNullOrWhiteSpace(CurrentFilePath),
            hasMix,
            selected,
            hasMix ? Path.GetFileName(LastExportedMixPath) : "");
    }

    [RelayCommand]
    private void OpenFolder()
    {
        ApplySessionToStore();
        Directory.CreateDirectory(_versions.ActiveTakesDirectory);
        Process.Start(new ProcessStartInfo
        {
            FileName = _versions.ActiveTakesDirectory,
            UseShellExecute = true
        });
        Status = $"Opened {ActiveSessionLabel}";
    }

    private static void SelectFileInExplorer(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            return;
        }

        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "explorer.exe",
                Arguments = $"/select,\"{path}\"",
                UseShellExecute = true
            });
        }
        catch
        {
            // Folder button remains available if Explorer cannot select the file.
        }
    }

    [RelayCommand]
    private void OpenDiagnostics()
    {
        Directory.CreateDirectory(_versions.RootDirectory);
        if (!File.Exists(_diagnostics.Path))
        {
            File.WriteAllText(_diagnostics.Path, "No diagnostics written yet." + Environment.NewLine);
        }

        Process.Start(new ProcessStartInfo
        {
            FileName = _diagnostics.Path,
            UseShellExecute = true
        });
        Status = $"Opened recorder diagnostics: {_diagnostics.Path}";
    }

    private void WriteDiagnostic(string message)
    {
        LastRecorderDiagnostic = message;
        _diagnostics.Write(message);
    }

    private static string BuildTakeHealthLabel(AudioPreviewMetrics metrics)
    {
        if (!metrics.Success)
        {
            return "";
        }

        if (metrics.Duration.TotalSeconds < 0.75)
        {
            return "Short";
        }

        if (metrics.PeakPercent > 96)
        {
            return "Hot";
        }

        if (metrics.RmsPercent < 0.25)
        {
            return "Quiet";
        }

        return "Good";
    }

    private void WriteTakeMetadata(string path, AudioPreviewMetrics metrics, string repairMessage)
    {
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            return;
        }

        try
        {
            var takeDirectory = Path.GetDirectoryName(path);
            if (string.IsNullOrWhiteSpace(takeDirectory))
            {
                return;
            }

            var metadataDirectory = Path.Combine(takeDirectory, ".gatekpt");
            Directory.CreateDirectory(metadataDirectory);
            var metadataPath = Path.Combine(
                metadataDirectory,
                $"{Path.GetFileNameWithoutExtension(path)}.json");
            var payload = new
            {
                kind = "gatekpt-take",
                version = 1,
                file = Path.GetFileName(path),
                session = ActiveSessionLabel,
                lane = SelectedCaptureLane?.Name ?? ActiveRecordingName,
                label = _activeCaptureLabel,
                input = SelectedInputDevice?.Name ?? InputName,
                inputMode = repairMessage.Contains("Input 1 locked", StringComparison.OrdinalIgnoreCase)
                    ? "Scarlett input 1 locked to stereo"
                    : "auto",
                health = BuildTakeHealthLabel(metrics),
                savedAt = DateTimeOffset.Now,
                durationSeconds = Math.Round(metrics.Duration.TotalSeconds, 3),
                peakPercent = Math.Round(metrics.PeakPercent, 3),
                rmsPercent = Math.Round(metrics.RmsPercent, 3),
                repair = repairMessage,
                note = "Raw take kept safe. Shape copies separately."
            };
            File.WriteAllText(metadataPath, JsonSerializer.Serialize(payload, new JsonSerializerOptions
            {
                WriteIndented = true
            }));
        }
        catch (Exception ex)
        {
            WriteDiagnostic($"METADATA FAILED | path={path} | message={ex.Message}");
        }
    }

    private void DeleteSelectedOrLatest()
    {
        var version = SelectedVersion ?? Versions.FirstOrDefault();
        if (version is null)
        {
            CommandResult = "No version to delete.";
            Status = "No version to delete.";
            return;
        }

        var trashPath = _versions.MoveToTrash(version.Path);
        CommandResult = string.IsNullOrWhiteSpace(trashPath)
            ? "Could not move version to trash."
            : $"Moved to trash: {version.Name}";
        Status = CommandResult;
        RefreshVersions();
    }

    private void CleanBlankTakes()
    {
        var moved = 0;
        foreach (var version in Versions.ToList())
        {
            var metrics = AudioPreviewService.InspectMetrics(version.Path);
            if (!metrics.Success || metrics.Duration.TotalSeconds < 0.75 || metrics.PeakPercent < 1.5 || metrics.RmsPercent < 0.25)
            {
                _versions.MoveToTrash(version.Path);
                moved++;
            }
        }

        if (!string.IsNullOrWhiteSpace(CurrentFilePath))
        {
            var current = AudioPreviewService.InspectMetrics(CurrentFilePath);
            if (!current.Success || current.Duration.TotalSeconds < 0.75 || current.PeakPercent < 1.5 || current.RmsPercent < 0.25)
            {
                CurrentFilePath = "";
            }
        }

        RefreshVersions();
        CommandResult = moved == 0
            ? "No blank takes found."
            : $"Moved {moved} blank/broken take(s) to trash.";
        Status = CommandResult;
    }

    private static bool IsMixableTake(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            return false;
        }

        var name = Path.GetFileNameWithoutExtension(path);
        return !name.Contains("session-mix", StringComparison.OrdinalIgnoreCase)
            && !name.Contains("layer-mix", StringComparison.OrdinalIgnoreCase)
            && !name.Contains("mixdown", StringComparison.OrdinalIgnoreCase)
            && !name.Contains("post-clip", StringComparison.OrdinalIgnoreCase);
    }

    private void RenameSelected(string label)
    {
        var version = SelectedVersion ?? Versions.FirstOrDefault();
        if (version is null)
        {
            CommandResult = "No version to rename.";
            Status = "No version to rename.";
            return;
        }

        var newPath = _versions.RenameVersion(version.Path, label);
        CurrentFilePath = newPath;
        CommandResult = string.IsNullOrWhiteSpace(newPath)
            ? "Could not rename version."
            : $"Renamed take: {Path.GetFileName(newPath)}";
        Status = CommandResult;
        RefreshVersions();
    }

    private void CreateSafeEditCopy(AudioEditPreset preset)
    {
        var sourcePath = SelectedVersion?.Path ?? CurrentFilePath;
        if (string.IsNullOrWhiteSpace(sourcePath) || !File.Exists(sourcePath))
        {
            CommandResult = "No recording yet. Record, Stop & Save, then run the command.";
            Status = "No recording yet. Press Record, play sound, then Stop & Save first.";
            return;
        }

        var newPath = _versions.CreateVersionPath(preset.Label, ".wav");
        if (TryCreateLayerEditCopy(preset, sourcePath, out var layerResult))
        {
            CommandResult = layerResult;
            return;
        }

        var result = _transforms.CreatePresetCopy(sourcePath, newPath, preset);
        if (!result.Success)
        {
            newPath = _versions.CopyVersion(sourcePath, preset.Label);
        }

        if (string.IsNullOrWhiteSpace(newPath))
        {
            CommandResult = "Could not create edit copy.";
            Status = "Could not create edit copy.";
            return;
        }

        CurrentFilePath = newPath;
        RefreshVersions();
        SelectedVersion = Versions.FirstOrDefault(item => item.Path == newPath) ?? SelectedVersion;
        CommandResult = $"Made a new version: {preset.Description} Original kept. Press Play latest to hear it.";
        Status = $"New version ready: {Path.GetFileName(newPath)}";
        OnPropertyChanged(nameof(VisualPaintingSignal));
    }

    private bool TryCreateLayerEditCopy(AudioEditPreset preset, string fallbackSourcePath, out string message)
    {
        message = "";
        var slot = ResolveTargetLayer(preset);
        if (slot is null)
        {
            return false;
        }

        var sourcePath = !string.IsNullOrWhiteSpace(slot.Path) && File.Exists(slot.Path)
            ? slot.Path
            : fallbackSourcePath;
        if (string.IsNullOrWhiteSpace(sourcePath) || !File.Exists(sourcePath))
        {
            message = $"No source take for {slot.Name}. Record/select a take first.";
            Status = message;
            return true;
        }

        var newPath = _versions.CreateVersionPath($"{slot.Name}-{preset.Label}", ".wav");
        var result = _transforms.CreatePresetCopy(sourcePath, newPath, preset);
        if (!result.Success || !File.Exists(newPath))
        {
            message = $"Could not process {slot.Name}: {result.Message}";
            Status = message;
            return true;
        }

        ReplaceLayerSlot(slot.Number, slot with
        {
            Path = newPath,
            FileName = Path.GetFileName(newPath),
            Status = "Edited",
            EffectChain = preset.Description
        });

        CurrentFilePath = newPath;
        RefreshVersions();
        SelectedVersion = Versions.FirstOrDefault(item => item.Path == newPath) ?? SelectedVersion;
        Status = $"Processed {slot.Name}: {Path.GetFileName(newPath)}. Original kept in takes.";
        OnPropertyChanged(nameof(LastEffectChain));
        OnPropertyChanged(nameof(VisualPaintingSignal));
        message = $"{slot.Name} chain: {preset.Description}";
        return true;
    }

    private LayerSlotItem? ResolveTargetLayer(AudioEditPreset preset)
    {
        if (!string.IsNullOrWhiteSpace(preset.TargetLayer))
        {
            var targeted = LayerSlots.FirstOrDefault(slot =>
                slot.Name.Equals(preset.TargetLayer, StringComparison.OrdinalIgnoreCase));
            if (targeted is not null)
            {
                return targeted;
            }
        }

        if (ChatText.Contains("lane", StringComparison.OrdinalIgnoreCase)
            || ChatText.Contains("stem", StringComparison.OrdinalIgnoreCase)
            || ChatText.Contains("track", StringComparison.OrdinalIgnoreCase))
        {
            return SelectedLayerSlot;
        }

        return null;
    }

    private VocalPresetItem? FindVocalPreset(string command)
    {
        var text = command.ToLowerInvariant();
        if (text.Contains("late night")
            || text.Contains("chrome")
            || text.Contains("tory")
            || text.Contains("lanez"))
        {
            return VocalPresets.FirstOrDefault(item => item.Slug == "late-night-chrome");
        }

        if (text.Contains("silk")
            || text.Contains("synth")
            || text.Contains("tecca")
            || text.Contains("hvn"))
        {
            return VocalPresets.FirstOrDefault(item => item.Slug == "silk-synth");
        }

        if (text.Contains("vocoder")
            || text.Contains("robot")
            || text.Contains("daft")
            || text.Contains("punk")
            || text.Contains("talkbox"))
        {
            return VocalPresets.FirstOrDefault(item => item.Slug == "robot-vocoder");
        }

        if (text.Contains("luna")
            || text.Contains("rauw")
            || text.Contains("reggaeton")
            || text.Contains("spanish")
            || text.Contains("spanglish"))
        {
            return VocalPresets.FirstOrDefault(item => item.Slug == "luna-pop");
        }

        if (text.Contains("double")
            || text.Contains("adlib")
            || text.Contains("ad lib")
            || text.Contains("background")
            || text.Contains("cloud"))
        {
            return VocalPresets.FirstOrDefault(item => item.Slug == "cloud-doubles");
        }

        if (text.Contains("raw clean")
            || text.Contains("clean vocal")
            || text.Contains("clean lead")
            || text.Contains("dry vocal"))
        {
            return VocalPresets.FirstOrDefault(item => item.Slug == "raw-clean");
        }

        return null;
    }

    private static AudioEditPreset CreateLateNightChromePreset() =>
        new(
            "late-night-chrome",
            "Late Night Chrome: glossy melodic lead, tight level, smooth top, short delay, medium room. Tuning engine slot reserved.",
            Gain: 1.55,
            HighPassHz: 95,
            LowShelfDb: 1.2,
            HighShelfDb: 3.2,
            CompressionAmount: 0.58,
            SaturationAmount: 0.08,
            EchoMs: 118,
            EchoMix: 0.11,
            ReverbMs: 185,
            ReverbMix: 0.14,
            TargetLayer: "Vocal");

    private static AudioEditPreset CreateSilkSynthPreset() =>
        new(
            "silk-synth",
            "Silk Synth: stronger hook polish, smooth synthetic edge, wider delay feel, glossy highs. Tuning engine slot reserved.",
            Gain: 1.48,
            HighPassHz: 115,
            LowShelfDb: 0.6,
            HighShelfDb: 4.5,
            CompressionAmount: 0.66,
            SaturationAmount: 0.12,
            EchoMs: 145,
            EchoMix: 0.15,
            ReverbMs: 210,
            ReverbMix: 0.16,
            TargetLayer: "Vocal");

    private static AudioEditPreset CreateRobotVocoderPreset() =>
        new(
            "robot-vocoder",
            "Robot Vocoder: hard-compressed electric voice, synthetic edge, tight band, short room. Live carrier layer is the next build.",
            Gain: 1.42,
            HighPassHz: 180,
            LowPassHz: 6800,
            LowShelfDb: -2.2,
            HighShelfDb: 5.8,
            CompressionAmount: 0.82,
            SaturationAmount: 0.22,
            EchoMs: 72,
            EchoMix: 0.08,
            ReverbMs: 120,
            ReverbMix: 0.07,
            TargetLayer: "Vocal");

    private static AudioEditPreset CreateLunaPopPreset() =>
        new(
            "luna-pop",
            "Luna Pop: airy Spanish/English lead, warm clean presence, rhythmic delay, lighter room.",
            Gain: 1.38,
            HighPassHz: 90,
            LowShelfDb: 1.6,
            HighShelfDb: 3.8,
            CompressionAmount: 0.42,
            SaturationAmount: 0.04,
            EchoMs: 170,
            EchoMix: 0.13,
            ReverbMs: 240,
            ReverbMix: 0.17,
            TargetLayer: "Vocal");

    private static AudioEditPreset CreateCloudDoublesPreset() =>
        new(
            "cloud-doubles",
            "Cloud Doubles: softer wide support layer, tucked lead level, bigger reverb, adlib space.",
            Gain: 1.12,
            HighPassHz: 140,
            LowShelfDb: -0.8,
            HighShelfDb: 2.2,
            CompressionAmount: 0.48,
            SaturationAmount: 0.05,
            EchoMs: 190,
            EchoMix: 0.18,
            ReverbMs: 320,
            ReverbMix: 0.24,
            TargetLayer: "Vocal");

    private static AudioEditPreset CreateRawCleanPreset() =>
        new(
            "raw-clean",
            "Raw Clean: vocal cleanup, rumble cut, stable level, light top control before heavier styling.",
            Gain: 1.22,
            HighPassHz: 105,
            LowPassHz: 12000,
            HighShelfDb: 1.2,
            CompressionAmount: 0.26,
            SaturationAmount: 0.02,
            TargetLayer: "Vocal");

    private void AddCommandHistory(string command)
    {
        var stamped = $"{DateTime.Now:h:mm tt} - {command}";
        CommandHistory = CommandHistory == "No commands yet."
            ? stamped
            : $"{stamped}{Environment.NewLine}{CommandHistory}";
    }

    private static bool TryGetEditPreset(string command, out AudioEditPreset preset)
    {
        var text = command.ToLowerInvariant();

        if (text.Contains("cyber") || text.Contains("electric") || text.Contains("glitch") || text.Contains("future"))
        {
            preset = new AudioEditPreset(
                text.Contains("vocal") || text.Contains("voice") ? "cyber-vocal" : "cyber-texture",
                "Cyber texture: tighter lows, bright edge, controlled saturation, and short digital room.",
                Gain: 1.35,
                HighPassHz: 120,
                HighShelfDb: 4.5,
                CompressionAmount: 0.42,
                SaturationAmount: 0.22,
                EchoMs: 85,
                EchoMix: 0.10,
                ReverbMs: 130,
                ReverbMix: 0.11,
                TargetLayer: text.Contains("vocal") || text.Contains("voice") ? "Vocal" : "");
            return true;
        }

        if (text.Contains("vocal") || text.Contains("sing"))
        {
            preset = new AudioEditPreset(
                "vocal-polish",
                "Vocal polish: cleanup high-pass, light compression, presence lift, small room.",
                Gain: text.Contains("loud") ? 1.8 : 1.35,
                HighPassHz: 95,
                HighShelfDb: 3.5,
                CompressionAmount: 0.45,
                ReverbMs: 95,
                ReverbMix: 0.10,
                TargetLayer: "Vocal");
            return true;
        }

        if (text.Contains("distort") || text.Contains("dirty") || text.Contains("grit"))
        {
            preset = new AudioEditPreset(
                "distorted",
                "Distorted copy with extra saturation and controlled level.",
                Gain: 1.45,
                CompressionAmount: 0.55,
                SaturationAmount: 0.38);
            return true;
        }

        if (text.Contains("intimate") || text.Contains("close") || text.Contains("dry"))
        {
            preset = new AudioEditPreset(
                "intimate-close",
                "Intimate close copy with rumble cut, gentle compression, and almost no room.",
                Gain: 1.28,
                HighPassHz: 85,
                HighShelfDb: 1.4,
                CompressionAmount: 0.32,
                ReverbMs: 55,
                ReverbMix: 0.035);
            return true;
        }

        if (text.Contains("live room") || text.Contains("stage") || text.Contains("roomy"))
        {
            preset = new AudioEditPreset(
                "live-room",
                "Live room copy with wider space and light glue.",
                Gain: 1.18,
                CompressionAmount: 0.22,
                ReverbMs: 210,
                ReverbMix: 0.20,
                EchoMs: 115,
                EchoMix: 0.05);
            return true;
        }

        if (text.Contains("raw") || text.Contains("original vibe") || text.Contains("less processed"))
        {
            preset = new AudioEditPreset(
                "raw-lift",
                "Raw lifted copy with only safe level control.",
                Gain: 1.18,
                CompressionAmount: 0.08);
            return true;
        }

        if (text.Contains("drum") || text.Contains("kick") || text.Contains("snare"))
        {
            var warm = text.Contains("warm") || text.Contains("round") || text.Contains("less harsh");
            preset = new AudioEditPreset(
                warm ? "drums-warmer" : "drums-punch",
                warm
                    ? "Drums warmer: more body, softer top, controlled punch."
                    : "Drums punch: low-end weight, transient-style compression, light saturation.",
                Gain: warm ? 1.35 : 1.45,
                LowShelfDb: warm ? 3.5 : 4,
                HighShelfDb: warm ? -1.2 : 1.5,
                CompressionAmount: warm ? 0.48 : 0.65,
                SaturationAmount: warm ? 0.12 : 0.18,
                TargetLayer: "Drums");
            return true;
        }

        if (text.Contains("piano") || text.Contains("keys"))
        {
            preset = new AudioEditPreset(
                "piano-bright",
                "Piano bright: cleanup low rumble, presence lift, soft compression.",
                Gain: 1.25,
                HighPassHz: 70,
                HighShelfDb: text.Contains("warm") ? -0.8 : 3,
                CompressionAmount: 0.25,
                ReverbMs: text.Contains("room") || text.Contains("wide") ? 150 : 0,
                ReverbMix: text.Contains("room") || text.Contains("wide") ? 0.10 : 0,
                TargetLayer: "Piano");
            return true;
        }

        if (text.Contains("acoustic") || text.Contains("guitar"))
        {
            preset = new AudioEditPreset(
                text.Contains("wide") ? "guitar-wide" : "acoustic-warm",
                text.Contains("wide")
                    ? "Guitar wide: warm body, short delay, small room."
                    : "Acoustic warm: body lift, harsh top trimmed, small room glue.",
                Gain: 1.35,
                LowShelfDb: 2.8,
                HighShelfDb: -1.8,
                CompressionAmount: 0.22,
                ReverbMs: text.Contains("wide") ? 170 : 120,
                ReverbMix: text.Contains("wide") ? 0.12 : 0.08,
                EchoMs: text.Contains("wide") ? 95 : 0,
                EchoMix: text.Contains("wide") ? 0.06 : 0,
                TargetLayer: "Guitar");
            return true;
        }

        if (text.Contains("drone") || text.Contains("pad") || text.Contains("ambient"))
        {
            preset = new AudioEditPreset(
                "drone-wide",
                "Drone wide: warmer body, darker top, long wash.",
                Gain: 1.3,
                LowShelfDb: 3,
                HighShelfDb: -2,
                ReverbMs: 280,
                ReverbMix: 0.22,
                EchoMs: 180,
                EchoMix: 0.08);
            return true;
        }

        if (text.Contains("reverb") || text.Contains("room") || text.Contains("space"))
        {
            preset = new AudioEditPreset(
                "reverb-room",
                "Added room reverb.",
                Gain: 1.15,
                ReverbMs: text.Contains("big") ? 260 : 140,
                ReverbMix: text.Contains("big") ? 0.24 : 0.14);
            return true;
        }

        if (text.Contains("echo") || text.Contains("delay"))
        {
            preset = new AudioEditPreset(
                "echo-delay",
                "Added echo delay.",
                Gain: 1.1,
                EchoMs: 220,
                EchoMix: 0.22);
            return true;
        }

        if (text.Contains("compress") || text.Contains("compressor") || text.Contains("even"))
        {
            preset = new AudioEditPreset(
                "compressed",
                "Compression: more even level and controlled peaks.",
                Gain: 1.5,
                CompressionAmount: 0.65);
            return true;
        }

        if (text.Contains("normalize") || text.Contains("rescue") || text.Contains("boost"))
        {
            preset = new AudioEditPreset(
                "normalized-boost",
                "Normalized-style boost for quiet takes.",
                Gain: 6,
                CompressionAmount: 0.35);
            return true;
        }

        if (text.Contains("clean") || text.Contains("noise") || text.Contains("rumble"))
        {
            preset = new AudioEditPreset(
                "clean-rumble-cut",
                "Cleaned low rumble and tightened level.",
                Gain: 1.25,
                HighPassHz: 110,
                CompressionAmount: 0.20);
            return true;
        }

        if (text.Contains("bright") || text.Contains("air") || text.Contains("clear"))
        {
            preset = new AudioEditPreset(
                "brighter-air",
                "Brighter copy with more top-end air.",
                Gain: 1.25,
                HighPassHz: 70,
                HighShelfDb: 4);
            return true;
        }

        if (text.Contains("dark") || text.Contains("soft") || text.Contains("less harsh"))
        {
            preset = new AudioEditPreset(
                "darker-soft",
                "Darker copy with softened top end.",
                Gain: 1.15,
                LowPassHz: 6200,
                HighShelfDb: -3);
            return true;
        }

        if (text.Contains("bass") || text.Contains("low end") || text.Contains("low-end"))
        {
            preset = new AudioEditPreset(
                "bass-boost",
                "Bass boost with controlled compression.",
                Gain: 1.35,
                LowShelfDb: 5,
                CompressionAmount: 0.35);
            return true;
        }

        if (text.Contains("warm") || text.Contains("warmer"))
        {
            preset = new AudioEditPreset(
                "warmer",
                "Warmer copy with more body and softer top.",
                Gain: 1.6,
                LowShelfDb: 3,
                HighShelfDb: -1.5,
                CompressionAmount: 0.18,
                SaturationAmount: 0.08);
            return true;
        }

        if (text.Contains("louder"))
        {
            preset = new AudioEditPreset(
                "louder",
                "Louder copy with compression to protect peaks.",
                Gain: 4,
                CompressionAmount: 0.45);
            return true;
        }

        if (text.Contains("quiet") || text.Contains("lower"))
        {
            preset = new AudioEditPreset(
                "quieter",
                "Quieter copy.",
                Gain: 0.55);
            return true;
        }

        preset = AudioEditPreset.Flat("edited-copy", "No edit matched.");
        return false;
    }

    private void RefreshVersions()
    {
        ApplySessionToStore();
        _versions.MoveNonAudioArtifactsToTrash();
        Versions.Clear();
        foreach (var version in _versions.ListVersions())
        {
            Versions.Add(version);
        }

        SelectedVersion = Versions.FirstOrDefault(item => item.Path == CurrentFilePath) ?? Versions.FirstOrDefault();
        OnPropertyChanged(nameof(CurrentFileLabel));
        OnPropertyChanged(nameof(CurrentFilePreviewLabel));
        OnPropertyChanged(nameof(VersionListHint));
        OnPropertyChanged(nameof(VisualPaintingSignal));
        OnPropertyChanged(nameof(SessionFolderLabel));
        OnPropertyChanged(nameof(TakeHealthLabel));
        OnPropertyChanged(nameof(SelectedTakeMixLabel));
    }

    [RelayCommand]
    private void SelectVersion(RecorderVersionFile? version)
    {
        if (version is null)
        {
            return;
        }

        SelectedVersion = version;
        CurrentFilePath = version.Path;
        Status = $"Selected: {version.DisplayName}";
    }

    private void ApplySessionToStore()
    {
        _versions.ActiveSessionName = ActiveSessionLabel;
    }

    private void ReplaceLayerSlot(int number, LayerSlotItem updated)
    {
        var index = LayerSlots.IndexOf(LayerSlots.First(item => item.Number == number));
        LayerSlots[index] = updated;
        if (SelectedLayerSlot?.Number == number)
        {
            SelectedLayerSlot = updated;
        }

        OnPropertyChanged(nameof(LayerDeckSummary));
        OnPropertyChanged(nameof(LastEffectChain));
        OnPropertyChanged(nameof(VisualPaintingSignal));
        PersistLayerDeck();
    }

    private void RestoreLayerDeck()
    {
        var stored = _versions.LoadLayerDeck();
        foreach (var saved in stored)
        {
            if (string.IsNullOrWhiteSpace(saved.Path) || !File.Exists(saved.Path))
            {
                continue;
            }

            var slot = LayerSlots.FirstOrDefault(item => item.Number == saved.Number);
            if (slot is null)
            {
                continue;
            }

            ReplaceLayerSlot(saved.Number, slot with
            {
                Path = saved.Path,
                FileName = string.IsNullOrWhiteSpace(saved.FileName) ? Path.GetFileName(saved.Path) : saved.FileName,
                Status = string.IsNullOrWhiteSpace(saved.Status) ? "Loaded" : saved.Status,
                EffectChain = saved.EffectChain
            });
        }

        OnPropertyChanged(nameof(LayerDeckSummary));
        OnPropertyChanged(nameof(VisualPaintingSignal));
    }

    private void PersistLayerDeck()
    {
        _versions.SaveLayerDeck(LayerSlots.Select(slot => new StoredLayerSlot(
            slot.Number,
            slot.Name,
            slot.Path,
            slot.FileName,
            slot.Status,
            slot.EffectChain)));
    }

    private void AutoAssignActiveCapture(string path)
    {
        if (_activeCaptureLayerNumber is not { } layerNumber || !File.Exists(path))
        {
            _activeCaptureLayerNumber = null;
            _activeCaptureLabel = "recording";
            return;
        }

        var slot = LayerSlots.First(item => item.Number == layerNumber);
        ReplaceLayerSlot(layerNumber, slot with
        {
            Path = path,
            FileName = Path.GetFileName(path),
            Status = "Loaded"
        });
        CommandResult = $"Auto-loaded {slot.Name}: {Path.GetFileName(path)}";
        Status = $"{Status} Auto-loaded into {slot.Name}.";
        _activeCaptureLayerNumber = null;
        _activeCaptureLabel = "recording";
        ActiveRecordingName = "Not recording";
    }

    private void UpdateRecordingElapsed()
    {
        if (!IsRecording || _recordingStartedAt == DateTimeOffset.MinValue)
        {
            RecordingElapsedLabel = "00:00";
            return;
        }

        var elapsed = DateTimeOffset.Now - _recordingStartedAt;
        RecordingElapsedLabel = $"{(int)elapsed.TotalMinutes:00}:{elapsed.Seconds:00}";
        if (elapsed.TotalSeconds >= 3 && PeakPercent < 1)
        {
            Status = "Recording. No sound yet.";
        }
        else if (elapsed.TotalSeconds >= 3 && PeakPercent < 20)
        {
            Status = "Recording. Quiet, but saving.";
        }

        if (elapsed.TotalSeconds >= 8 && PeakPercent < 1)
        {
            _ = StopRecording();
            Status = "Auto-stopped: no sound entered for 8 seconds. No blank take kept.";
            CommandResult = "No audio detected. Check RC-505 output, Scarlett input gain, and Windows input device.";
        }
    }

    private void DriveVisualTick()
    {
        var drivePeak = GetVisualDrivePeak();
        if (_isPlaybackVisualActive)
        {
            if (Math.Abs(PeakPercent - drivePeak) > 0.1)
            {
                PeakPercent = drivePeak;
            }
            else
            {
                PushSignalBar(drivePeak);
            }

            return;
        }

        PushSignalBar(drivePeak);
    }

    private double GetVisualDrivePeak()
    {
        if (IsRecording)
        {
            return PeakPercent;
        }

        if (!_isPlaybackVisualActive || _playbackEnvelope.Length == 0 || _playbackVisualDuration <= TimeSpan.Zero)
        {
            return 0;
        }

        var elapsed = DateTimeOffset.Now - _playbackVisualStartedAt;
        if (elapsed >= _playbackVisualDuration)
        {
            StopPlaybackVisual();
            return 0;
        }

        var progress = Math.Clamp(elapsed.TotalMilliseconds / Math.Max(1, _playbackVisualDuration.TotalMilliseconds), 0, 0.999);
        var index = (int)Math.Clamp(progress * _playbackEnvelope.Length, 0, _playbackEnvelope.Length - 1);
        return _playbackEnvelope[index];
    }

    private void StartPlaybackVisual(string path, TimeSpan duration)
    {
        _playbackEnvelope = AudioPreviewService.BuildEnvelope(path);
        _playbackVisualDuration = duration > TimeSpan.Zero ? duration : TimeSpan.FromSeconds(Math.Max(1, _playbackEnvelope.Length / 12.0));
        _playbackVisualStartedAt = DateTimeOffset.Now;
        _isPlaybackVisualActive = _playbackEnvelope.Length > 0;
        OnPropertyChanged(nameof(AudioDriveLabel));
        OnPropertyChanged(nameof(RecorderStateLabel));
        if (!_isPlaybackVisualActive)
        {
            PeakPercent = 0;
        }
    }

    private void StopPlaybackVisual()
    {
        _isPlaybackVisualActive = false;
        _playbackEnvelope = [];
        _playbackVisualDuration = TimeSpan.Zero;
        _playbackVisualStartedAt = DateTimeOffset.MinValue;
        OnPropertyChanged(nameof(AudioDriveLabel));
        OnPropertyChanged(nameof(RecorderStateLabel));
        if (!IsRecording)
        {
            PeakPercent = 0;
            PushSignalBar(0);
        }
    }

    partial void OnPeakPercentChanged(double value)
    {
        PushSignalBar(value);
        OnPropertyChanged(nameof(PeakLabel));
        OnPropertyChanged(nameof(PeakDecibelLabel));
        OnPropertyChanged(nameof(SimpleSignalLabel));
        OnPropertyChanged(nameof(HasVisibleSignal));
        OnPropertyChanged(nameof(AudioHealthLabel));
        OnPropertyChanged(nameof(PrimaryHeadline));
        OnPropertyChanged(nameof(PrimaryDetail));
        OnPropertyChanged(nameof(RecorderStateLabel));
        OnPropertyChanged(nameof(NextActionLabel));
    }

    private void PushSignalBar(double peak)
    {
        if (SignalBars.Count == 0)
        {
            return;
        }

        var normalized = Math.Clamp(peak / 100.0, 0, 1);
        var now = DateTimeOffset.Now.ToUnixTimeMilliseconds();
        var slowBreath = Math.Sin(now / 8600.0) * 0.5 + 0.5;
        var flow = (now % 76000) / 76000.0;
        var drift = Math.Sin(flow * Math.Tau) * 0.12;
        var height = 12 + (normalized * 82) + slowBreath * 5;
        if (peak < 0.5)
        {
            height = 10 + slowBreath * 6;
        }

        var isAudioActive = IsRecording || _isPlaybackVisualActive;
        var idlePulse = 0.5 + Math.Sin(now / 13000.0) * 0.5;
        // Audio is absorbed into the pools/glow. It should not yank the whole
        // room around like a meter; the river keeps its own slow gravity.
        var react = Math.Pow(normalized, 0.72);
        var rawEnergy = isAudioActive ? react * 1.22 + idlePulse * 0.08 : idlePulse * 0.055;
        // Big visual bloom, still with a slow drain so the stage does not twitch.
        var target = Math.Clamp(rawEnergy, 0, 1);
        var visualEnergy = target > VisualEnergy
            ? VisualEnergy + (target - VisualEnergy) * 0.62
            : VisualEnergy + (target - VisualEnergy) * 0.14;
        VisualEnergy = visualEnergy;
        VisualCoreSize = 145 + visualEnergy * 360;
        VisualBloomSize = 420 + visualEnergy * 820;
        VisualBloomOpacity = (isAudioActive ? 0.22 : 0.10) + visualEnergy * 0.68;
        VisualRoomScale = 1 + visualEnergy * 0.035;
        VisualBackScale = 1 + visualEnergy * 0.055;
        VisualMidScale = 1 + visualEnergy * 0.078;
        VisualFrontScale = 1 + visualEnergy * 0.095;
        VisualRoomTilt = -2 + drift * 1.1;
        VisualDriftX = drift * 28;
        VisualLiftY = -56 + flow * 116;

        // Spinning record layer: alive while recording or playing a saved take.
        var spinSpeed = isAudioActive ? 13.0 + visualEnergy * 42 : 1.2;
        RecordSpinAngle = (RecordSpinAngle + spinSpeed) % 360;
        RecordSpinScale = 0.98 + visualEnergy * 0.20 + (isAudioActive ? 0.04 : 0);
        RecordSpinOpacity = isAudioActive ? 0.82 + visualEnergy * 0.18 : 0.52;

        // Recording badge pulses with the live signal.
        var recBeat = 0.5 + Math.Sin(now / 520.0) * 0.5;
        RecDotSize = 16 + visualEnergy * 10 + recBeat * 2;
        RecGlowSize = 26 + visualEnergy * 14 + recBeat * 4;
        RecGlowOpacity = 0.30 + visualEnergy * 0.35 + recBeat * 0.12;

        SignalBars.RemoveAt(0);
        SignalBars.Add(Math.Clamp(height, 8, 96));
    }

    partial void OnSignalReadyChanged(bool value)
    {
        OnPropertyChanged(nameof(MeterStateLabel));
        OnPropertyChanged(nameof(PrimaryHeadline));
        OnPropertyChanged(nameof(PrimaryDetail));
        OnPropertyChanged(nameof(NextActionLabel));
    }

    partial void OnIsRecordingChanged(bool value)
    {
        OnPropertyChanged(nameof(MeterStateLabel));
        OnPropertyChanged(nameof(PrimaryHeadline));
        OnPropertyChanged(nameof(PrimaryDetail));
        OnPropertyChanged(nameof(RecorderStateLabel));
        OnPropertyChanged(nameof(AudioDriveLabel));
        OnPropertyChanged(nameof(NextActionLabel));
        OnPropertyChanged(nameof(RecordingButtonLabel));
        OnPropertyChanged(nameof(StopButtonLabel));
        OnPropertyChanged(nameof(CanStartRecording));
        OnPropertyChanged(nameof(CanStopRecording));
        OnPropertyChanged(nameof(RecordingGuardLabel));
        OnPropertyChanged(nameof(CaptureInstruction));
        OnPropertyChanged(nameof(SimpleSignalLabel));
        OnPropertyChanged(nameof(AudioHealthLabel));
    }

    partial void OnIsCommandBusyChanged(bool value)
    {
        OnPropertyChanged(nameof(IsBusy));
        OnPropertyChanged(nameof(BusyLabel));
        OnPropertyChanged(nameof(CanStartRecording));
        OnPropertyChanged(nameof(CanStopRecording));
    }

    partial void OnIsRecorderBusyChanged(bool value)
    {
        OnPropertyChanged(nameof(IsBusy));
        OnPropertyChanged(nameof(BusyLabel));
        OnPropertyChanged(nameof(CanStartRecording));
        OnPropertyChanged(nameof(CanStopRecording));
    }

    partial void OnIsMonitoringChanged(bool value)
    {
        OnPropertyChanged(nameof(MonitorButtonLabel));
    }

    partial void OnActiveRecordingNameChanged(string value)
    {
        OnPropertyChanged(nameof(RecordingGuardLabel));
    }

    partial void OnRecordingElapsedLabelChanged(string value)
    {
        OnPropertyChanged(nameof(RecordingGuardLabel));
        OnPropertyChanged(nameof(CaptureInstruction));
        OnPropertyChanged(nameof(VideoLaneTitle));
    }

    partial void OnInputNameChanged(string value)
    {
        OnPropertyChanged(nameof(MeterInputLabel));
    }

    partial void OnCurrentFilePathChanged(string value)
    {
        OnPropertyChanged(nameof(CurrentFileLabel));
        OnPropertyChanged(nameof(CurrentFilePreviewLabel));
        OnPropertyChanged(nameof(ContentPackTakeLabel));
        OnPropertyChanged(nameof(LatestTakeTitle));
        OnPropertyChanged(nameof(LatestTakeDetail));
        OnPropertyChanged(nameof(PostReadySignal));
        OnPropertyChanged(nameof(TakeHealthLabel));
        OnPropertyChanged(nameof(SelectedTakeMixLabel));
        OnPropertyChanged(nameof(RecorderStateLabel));
        OnPropertyChanged(nameof(NextActionLabel));
    }

    partial void OnSessionNameChanged(string value)
    {
        ApplySessionToStore();
        RefreshVersions();
        OnPropertyChanged(nameof(ActiveSessionLabel));
        OnPropertyChanged(nameof(SessionFolderLabel));
        OnPropertyChanged(nameof(LatestTakeDetail));
    }

    partial void OnSelectedVersionChanged(RecorderVersionFile? value)
    {
        OnPropertyChanged(nameof(CurrentFilePreviewLabel));
        OnPropertyChanged(nameof(ContentPackTakeLabel));
        OnPropertyChanged(nameof(LatestTakeTitle));
        OnPropertyChanged(nameof(LatestTakeDetail));
        OnPropertyChanged(nameof(PostReadySignal));
        OnPropertyChanged(nameof(TakeHealthLabel));
        OnPropertyChanged(nameof(SelectedTakeMixLabel));
    }

    partial void OnLastExportedMixPathChanged(string value)
    {
        OnPropertyChanged(nameof(LastExportedMixLabel));
    }

    partial void OnLastStemExportDirectoryChanged(string value)
    {
        OnPropertyChanged(nameof(LastStemExportLabel));
    }

    partial void OnPhoneVideoPathChanged(string value)
    {
        OnPropertyChanged(nameof(PhoneVideoLabel));
        OnPropertyChanged(nameof(VideoLayerTitle));
        OnPropertyChanged(nameof(VideoLayerDetail));
        OnPropertyChanged(nameof(VideoLaneStatus));
    }

    partial void OnLastVideoOutputPathChanged(string value)
    {
        OnPropertyChanged(nameof(LastVideoOutputLabel));
        OnPropertyChanged(nameof(VideoLayerDetail));
        OnPropertyChanged(nameof(VideoLaneTitle));
        OnPropertyChanged(nameof(VideoLaneStatus));
    }

    partial void OnVideoWorkflowStatusChanged(string value)
    {
        OnPropertyChanged(nameof(VideoLaneStatus));
    }

    partial void OnHarvestStatusChanged(string value)
    {
        OnPropertyChanged(nameof(VideoLaneStatus));
    }

    partial void OnLastContentPackPathChanged(string value)
    {
        OnPropertyChanged(nameof(ContentPackSaveLabel));
    }

    partial void OnLiveAlbumSceneChanged(string value)
    {
        OnPropertyChanged(nameof(LiveAlbumPlan));
    }

    partial void OnVideoAudioOffsetMsChanged(int value)
    {
        OnPropertyChanged(nameof(VideoSyncLabel));
        OnPropertyChanged(nameof(VideoLayerDetail));
        OnPropertyChanged(nameof(VideoLaneStatus));
    }

    partial void OnVideoExportPresetChanged(string value)
    {
        OnPropertyChanged(nameof(VideoExportPresetLabel));
        OnPropertyChanged(nameof(VideoLayerDetail));
    }

    partial void OnSelectedLayerSlotChanged(LayerSlotItem? value)
    {
        OnPropertyChanged(nameof(LastEffectChain));
        OnPropertyChanged(nameof(CaptureInstruction));
        OnPropertyChanged(nameof(RecordingButtonLabel));
    }

    partial void OnSelectedCaptureLaneChanged(CaptureLaneItem? value)
    {
        OnPropertyChanged(nameof(SelectedCaptureLaneLabel));
        OnPropertyChanged(nameof(SelectedCaptureLaneDetail));
        OnPropertyChanged(nameof(CaptureInstruction));
        OnPropertyChanged(nameof(LatestTakeDetail));
    }

    partial void OnSelectedInputDeviceChanged(AudioInputDeviceItem? value)
    {
        InputName = value?.Name ?? "No input selected";
        OnPropertyChanged(nameof(AudioHealthLabel));

        // Re-point the reactive backdrop at the newly selected input (not while recording).
        if (!IsRecording)
        {
            StopVisualMeter();
            StartVisualMeter();
        }
    }
}

public sealed record LayerSlotItem(
    int Number,
    string Name,
    string Path = "",
    string FileName = "Empty",
    string Status = "Empty",
    string EffectChain = "");

public sealed record CaptureLaneItem(
    string Name,
    string FileLabel,
    string Detail,
    int? LayerNumber,
    string Icon)
{
    public string DisplayLabel => $"{Icon}  {Name}";

    public override string ToString() => DisplayLabel;
}

public sealed record LongSessionMarker(
    DateTimeOffset CreatedAt,
    TimeSpan Elapsed,
    string Label);

public sealed record TakeTasteMemoryItem(
    DateTimeOffset When,
    string TakeName,
    string Path,
    string Lane,
    string ClipType,
    string Mood,
    int Rating,
    string Worked,
    string FeltOff)
{
    public int NumericRating => Math.Clamp(Rating, 1, 10);
}
