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
    private readonly InputMonitorService _monitor = new();
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
    private readonly DispatcherTimer _visualTimer = new() { Interval = TimeSpan.FromMilliseconds(140) };
    private DateTimeOffset _recordingStartedAt = DateTimeOffset.MinValue;
    private bool _recordingSignalSeen;
    private int? _activeCaptureLayerNumber;
    private string _activeCaptureLabel = "recording";

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
    private string _activeRecordingName = "Not recording";

    [ObservableProperty]
    private string _recordingElapsedLabel = "00:00";

    [ObservableProperty]
    private string _currentFilePath = "";

    [ObservableProperty]
    private string _chatText = "";

    [ObservableProperty]
    private string _status = "Ready.";

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
    private string _signalProbeSummary = "Record one take. GateKPT verifies the audio when you stop.";

    [ObservableProperty]
    private string _lastRecorderDiagnostic = "No recorder diagnostic yet.";

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
    private string _videoWorkflowStatus = "Find latest phone video, then pair it with the selected GateKPT take.";

    [ObservableProperty]
    private int _videoAudioOffsetMs = 0;

    [ObservableProperty]
    private string _videoExportPreset = "short";

    [ObservableProperty]
    private string _contentPackWorld = "Fire";

    [ObservableProperty]
    private string _contentPackClipType = "Cover";

    [ObservableProperty]
    private string _contentPackResult = "Record or select a take, then generate the pack.";

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
    private string _liveAlbumEra = "Album built in public";

    [ObservableProperty]
    private string _liveAlbumScene = "Night room";

    [ObservableProperty]
    private string _liveAlbumNote = "";

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
        new("Cover Pass", "cover-pass", "One usable section for a post", null),
        new("Drum Clip", "drums", "Groove first", 1),
        new("Guitar / Keys", "guitar-keys", "Harmony or movement", 2),
        new("Vocal Hook", "vocals", "Lead line or hook", 4),
        new("Visual / Dance", "visual-dance", "Audio bed for movement or visualizer", null)
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
        "Fire",
        "Storm",
        "Chrome"
    ];

    public IReadOnlyList<string> ContentPackClipTypes { get; } =
    [
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
        "Night room",
        "Projector session",
        "Guitar cover",
        "Vocal pass",
        "Loop build",
        "Behind the tool"
    ];

    public string PeakLabel => $"{PeakPercent:0}%";

    public string PeakDecibelLabel
    {
        get
        {
            if (PeakPercent <= 0.01)
            {
                return "-inf dB";
            }

            var db = 20 * Math.Log10(Math.Clamp(PeakPercent / 100.0, 0.0001, 1.0));
            return $"{db:0.0} dB";
        }
    }

    public string MeterStateLabel =>
        IsRecording
            ? "REC"
            : SignalReady
                ? "ARMED"
                : "IDLE";

    public string MeterInputLabel =>
        InputName.Contains("Scarlett", StringComparison.OrdinalIgnoreCase) || InputName.Contains("Focusrite", StringComparison.OrdinalIgnoreCase)
            ? InputName
            : "No input";

    public string RecorderStateLabel =>
        IsRecording
            ? "LIVE RECORDING"
            : string.IsNullOrWhiteSpace(CurrentFilePath)
                ? "WAITING"
                : "TAKE READY";

    public string RecordingButtonLabel => IsRecording ? "RECORDING" : "RECORD";

    public string StopButtonLabel => "STOP";

    public bool CanStartRecording => !IsRecording && !IsBusy;

    public bool CanStopRecording => IsRecording && !IsRecorderBusy;

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
            ? $"REC {RecordingElapsedLabel} / {ActiveRecordingName}"
            : "Ready";

    public string SimpleSignalLabel =>
        PeakPercent >= 96
            ? "CLIPPING"
            : PeakPercent >= 8
                ? "SOUND DETECTED"
                : PeakPercent > 0.5
                    ? "LOW SIGNAL"
                    : "NO SOUND YET";

    public string AudioHealthLabel =>
        SelectedInputDevice is null
            ? "Input not selected."
            : SignalReady
                ? $"Ready: {SelectedInputDevice.Name}"
                : $"Input: {SelectedInputDevice.Name}. If the meter moves, record.";

    public string SelectedCaptureLaneLabel =>
        SelectedCaptureLane?.Name ?? "Cover Pass";

    public string SelectedCaptureLaneDetail =>
        SelectedCaptureLane?.Detail ?? "One usable section for a post";

    public string LatestTakeTitle =>
        string.IsNullOrWhiteSpace(CurrentFilePath)
            ? "No take saved yet."
            : "Take ready.";

    public string LatestTakeDetail
    {
        get
        {
            var path = SelectedVersion?.Path ?? CurrentFilePath;
            var preview = AudioPreviewService.Inspect(path);
            if (preview == AudioPreview.Empty)
            {
                return "Record one take, then shape it.";
            }

            return $"{SelectedCaptureLaneLabel} / {preview.Duration} / peak {preview.Peak}";
        }
    }

    public string PostReadySignal
    {
        get
        {
            var path = SelectedVersion?.Path ?? CurrentFilePath;
            var metrics = AudioPreviewService.InspectMetrics(path);
            if (!metrics.Success)
            {
                return "Record or choose one take.";
            }

            if (metrics.Duration.TotalSeconds < 8)
            {
                return "Short take.";
            }

            if (metrics.RmsPercent < 0.20)
            {
                return "Quiet. Try louder.";
            }

            if (metrics.PeakPercent > 96)
            {
                return "Hot. Watch the gain.";
            }

            return $"Ready enough. {metrics.Duration:mm\\:ss}.";
        }
    }

    public string CaptureInstruction =>
        IsRecording
            ? PeakPercent >= 96
                ? "Too hot. Lower Scarlett gain if the ring is red."
                : PeakPercent < 1 && RecordingElapsedLabel != "00:00"
                    ? "No usable signal yet. Play now or stop this take."
                    : PeakPercent < 20
                        ? "Quiet signal is recording. Raise input gain only if Scarlett is not red."
                        : "GateKPT is recording now."
            : $"Ready: {SelectedCaptureLaneLabel}. Record, play, stop.";

    public string NextActionLabel =>
        IsRecording
            ? "Stop when done."
            : SignalReady
                ? "Record the take."
                : "Record.";

    public string PrimaryHeadline =>
        IsRecording
            ? "Recording."
            : SignalReady
                ? "Signal ready."
                : "Ready to capture.";

    public string PrimaryDetail =>
        IsRecording
            ? "Play the pass."
            : SignalReady
                ? "Capture when ready."
                : "Record, then GateKPT verifies.";

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
            : $"{Versions.Count} take(s).";

    public string LayerDeckSummary
    {
        get
        {
            var loaded = LayerSlots.Count(slot => !string.IsNullOrWhiteSpace(slot.Path));
            return loaded == 0
                ? "Empty lanes."
                : $"{loaded}/{LayerSlots.Count} loaded.";
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
        $"Scene: {LiveAlbumScene}. Build one piece, keep the room open, save the moment.";

    public string CommandHelp =>
        "Try: chrome, silk, luna, cloud, clean, warmer, room, post.";

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
        _visualTimer.Tick += (_, _) => PushSignalBar(PeakPercent);
        for (var index = 0; index < 48; index++)
        {
            SignalBars.Add(10 + (index % 6) * 2);
        }

        SelectedCaptureLane = CaptureLanes.FirstOrDefault();
        SelectedLayerSlot = LayerSlots.FirstOrDefault();
        SelectedVocalPreset = VocalPresets.FirstOrDefault();
        RefreshInputDevices();
        RefreshOutputDevices();
        RefreshVersions();
        LoadTasteMemories();
        RestoreLayerDeck();
        _visualTimer.Start();
    }

    [RelayCommand]
    private void FindScarlett()
    {
        RefreshInputDevices();
        if (SelectedInputDevice is not null)
        {
            InputName = SelectedInputDevice.Name;
            Status = $"Input selected: {SelectedInputDevice.Name}";
            return;
        }

        Status = "No active recording input found in Windows.";
    }

    [RelayCommand]
    private async Task CheckSignal()
    {
        RefreshInputDevices();
        Status = "Scanning every input for sound. Play the RC-505 now.";
        var results = await _inputDevices.ProbeAllAsync(Path.Combine(_versions.RootDirectory, "diagnostics"), 2);
        var best = results.FirstOrDefault(result => result.Success);
        if (best is null)
        {
            PeakPercent = 0;
            SignalReady = false;
            Status = "No Windows input could be tested.";
            return;
        }

        SelectedInputDevice = InputDevices.FirstOrDefault(device => device.Id == best.Id)
            ?? new AudioInputDeviceItem(best.Name, best.Id, true);
        InputName = SelectedInputDevice.Name;
        PeakPercent = best.PeakPercent;
        SignalReady = best.RmsPercent >= 0.05 || best.PeakPercent >= 1;
        SignalProbeSummary = $"Probe: {best.Name} | peak {best.PeakPercent:0.0}% | RMS {best.RmsPercent:0.00}%";
        WriteDiagnostic($"CHECK SIGNAL | selected={best.Name} | peak={best.PeakPercent:0.0}% | rms={best.RmsPercent:0.00}% | bytes={best.BytesWritten} | ready={SignalReady}");
        Status = SignalReady
            ? $"Sound found: {best.Name}. Peak {best.PeakPercent:0.0}%, RMS {best.RmsPercent:0.00}%. Now press {RecordingButtonLabel}."
            : $"No signal found. Loudest input was {best.Name}: peak {best.PeakPercent:0.0}%, RMS {best.RmsPercent:0.00}%. Check RC-505 output into Scarlett input.";
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
        if (IsRecording)
        {
            Status = "Already recording.";
            return;
        }

        if (SelectedInputDevice is null)
        {
            RefreshInputDevices();
        }

        if (SelectedInputDevice is null)
        {
            Status = "No input selected. Click FIND INPUT and choose the real Scarlett/RC-505 input.";
            return;
        }

        InputName = SelectedInputDevice.Name;

        PeakPercent = 0;
        _recordingSignalSeen = false;
        _activeCaptureLabel = label;
        _activeCaptureLayerNumber = layerNumber;
        ActiveRecordingName = layerNumber is null
            ? "Full loop"
            : $"{LayerSlots.First(slot => slot.Number == layerNumber).Name} lane";
        IsRecorderBusy = true;
        var result = _recorder.Start(InputName, _versions.TakesDirectory, label, peak =>
        {
            Dispatcher.UIThread.Post(() =>
            {
                PeakPercent = peak;
                if (!_recordingSignalSeen && peak >= 1)
                {
                    _recordingSignalSeen = true;
                    Status = peak >= 8
                        ? $"Recording. Signal is live: {peak:0.0}%."
                        : $"Recording. Low signal seen: {peak:0.0}%. Turn up if playback is quiet.";
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
            ? layerNumber is null
                ? "Recording full RC-505 output. Watch the signal number move."
                : $"Recording {LayerSlots.First(slot => slot.Number == layerNumber).Name}. Solo that RC-505 track now."
            : result.Message;
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
        IsRecorderBusy = true;
        await Task.Delay(80);
        var result = await Task.Run(() => _recorder.Stop());
        IsRecording = false;
        _recordingTimer.Stop();
        WriteDiagnostic($"STOP | success={result.Success} | path={result.Path} | duration={result.DurationLabel} | peak={result.PeakPercent:0.0}% | rms={result.RmsPercent:0.00}% | message={result.Message}");
        if (result.Success)
        {
            PeakPercent = result.PeakPercent;
            CurrentFilePath = result.Path;
            if (result.RmsPercent < 0.05)
            {
                _versions.MoveToTrash(result.Path);
                CurrentFilePath = "";
                Status = $"NO TAKE SAVED. GateKPT heard silence: peak {result.PeakPercent:0.0}%, RMS {result.RmsPercent:0.00}%.";
                CommandResult = "No take saved. Play sound after pressing RECORD, then press STOP.";
                SignalProbeSummary = "Folder is empty because the last take had no usable audio.";
                WriteDiagnostic($"REJECT SILENT | raw={result.Path} | peak={result.PeakPercent:0.0}% | rms={result.RmsPercent:0.00}%");
                RefreshVersions();
                _activeCaptureLayerNumber = null;
                _activeCaptureLabel = "recording";
                ActiveRecordingName = "Not recording";
                IsRecorderBusy = false;
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
                    ? "NO TAKE SAVED. Scarlett input is clipping. Lower input gain until the meter stays below 80%."
                    : $"NO TAKE SAVED. {repair.Message}";
                CommandResult = isClipping
                    ? "GateKPT rejected this on purpose: clipping makes a file that looks loud but sounds wrong. Lower Scarlett gain, record again."
                    : $"No take saved. Final check: {metrics.Duration.TotalSeconds:0.00}s, peak {metrics.PeakPercent:0.0}%, RMS {metrics.RmsPercent:0.00}%.";
                SignalProbeSummary = isClipping
                    ? "Folder is empty because the last take clipped."
                    : "Folder is empty because GateKPT rejected the last take.";
                RefreshVersions();
                _activeCaptureLayerNumber = null;
                _activeCaptureLabel = "recording";
                ActiveRecordingName = "Not recording";
                IsRecorderBusy = false;
                return;
            }

            Status = repair.Success
                ? $"Saved playable take: {Path.GetFileName(repair.Path)}. {repair.Message}"
                : $"Saved take: {Path.GetFileName(result.Path)}. Peak {result.PeakPercent:0.0}%, RMS {result.RmsPercent:0.00}%. {repair.Message}";
            CommandResult = $"Take verified: {metrics.Duration:mm\\:ss}, peak {metrics.PeakPercent:0.0}%, RMS {metrics.RmsPercent:0.00}%, {metrics.Waveform}";
            WriteDiagnostic($"SAVED PLAYABLE | path={CurrentFilePath} | duration={metrics.Duration.TotalSeconds:0.00}s | peak={metrics.PeakPercent:0.0}% | rms={metrics.RmsPercent:0.00}%");
            RefreshVersions();
            AutoAssignActiveCapture(CurrentFilePath);
            SelectFileInExplorer(CurrentFilePath);
            IsRecorderBusy = false;
            return;
        }

        PeakPercent = result.PeakPercent;
        if (!string.IsNullOrWhiteSpace(result.Path) && File.Exists(result.Path))
        {
            _versions.MoveToTrash(result.Path);
            CurrentFilePath = "";
            RefreshVersions();
        }

        Status = result.Message;
        WriteDiagnostic($"STOP FAILED | message={result.Message}");
        _activeCaptureLayerNumber = null;
        _activeCaptureLabel = "recording";
        ActiveRecordingName = "Not recording";
        IsRecorderBusy = false;
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
        _playback.StopAll();
        var metrics = AudioPreviewService.InspectMetrics(path);
        var outputId = SelectedOutputDevice?.Id ?? "";
        var outputName = _playback.GetOutputName(outputId);
        var result = _playback.PlayOnce(0, path, 100, outputId);
        Status = result.Success
            ? $"Playing latest inside GateKPT -> {outputName}: {Path.GetFileName(path)}"
            : result.Message;
        CommandResult = result.Success
            ? $"Playing verified take: {metrics.Duration:mm\\:ss}, peak {metrics.PeakPercent:0.0}%, RMS {metrics.RmsPercent:0.00}%. Output: {outputName}."
            : result.Message;
    }

    [RelayCommand]
    private void StopPlayback()
    {
        _playback.StopAll();
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
                    VideoWorkflowStatus = found.Message;
                    Status = found.Message;
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
    private void StageLunaPop() => StageVocalColor("luna-pop", "luna vocal");

    [RelayCommand]
    private void StageCloudDoubles() => StageVocalColor("cloud-doubles", "cloud doubles");

    [RelayCommand]
    private void StageRawClean() => StageVocalColor("raw-clean", "clean vocal");

    private void StageVocalColor(string slug, string command)
    {
        SelectedVocalPreset = VocalPresets.FirstOrDefault(item => item.Slug == slug) ?? SelectedVocalPreset;
        ChatText = command;
        CommandResult = $"{SelectedVocalPreset?.Name ?? "Color"} selected.";
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
            CommandResult = "Tell me what you want changed. Example: make warmer, louder, add reverb, delete last.";
            Status = "Waiting for a command.";
            return;
        }

        CommandResult = $"I heard: \"{command}\"";
        AddCommandHistory(command);
        ChatText = command;
        IsCommandBusy = true;
        CommandResult = $"Working on: \"{command}\"...";
        await Task.Delay(180);
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
            || command.Contains("mixdown", StringComparison.OrdinalIgnoreCase))
        {
            ExportLayerMix();
            IsCommandBusy = false;
            return;
        }

        if (command.Contains("post clip", StringComparison.OrdinalIgnoreCase)
            || command.Contains("cover video", StringComparison.OrdinalIgnoreCase)
            || command.Contains("make video", StringComparison.OrdinalIgnoreCase)
            || command.Contains("use phone video", StringComparison.OrdinalIgnoreCase))
        {
            IsCommandBusy = false;
            await MakePostClip();
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

        CommandResult = $"I saved that as a note for this session. If you want me to change audio, say something like: {CommandHelp}";
        Status = "Saved as a note. No audio was changed.";
        IsCommandBusy = false;
    }

    [RelayCommand]
    private void OpenFolder()
    {
        Directory.CreateDirectory(_versions.TakesDirectory);
        Process.Start(new ProcessStartInfo
        {
            FileName = _versions.TakesDirectory,
            UseShellExecute = true
        });
        Status = $"Opened {_versions.TakesDirectory}";
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
            Status = $"Recording, but no sound is entering {InputName}. Play now or stop.";
        }
        else if (elapsed.TotalSeconds >= 3 && PeakPercent < 20)
        {
            Status = $"Recording quiet signal from {InputName}: {PeakPercent:0.0}%. It will save, but may play back soft.";
        }

        if (elapsed.TotalSeconds >= 8 && PeakPercent < 1)
        {
            _ = StopRecording();
            Status = "Auto-stopped: no sound entered for 8 seconds. No blank take kept.";
            CommandResult = "No audio detected. Check RC-505 output, Scarlett input gain, and Windows input device.";
        }
    }

    partial void OnPeakPercentChanged(double value)
    {
        PushSignalBar(value);
        OnPropertyChanged(nameof(PeakLabel));
        OnPropertyChanged(nameof(PeakDecibelLabel));
        OnPropertyChanged(nameof(SimpleSignalLabel));
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
        var wave = Math.Sin((DateTimeOffset.Now.ToUnixTimeMilliseconds() / 120.0) + SignalBars.Count) * 0.22;
        var height = 8 + (normalized * 74) + Math.Abs(wave * 24);
        if (peak < 0.5)
        {
            height = 8 + Math.Abs(wave * 9);
        }

        SignalBars.RemoveAt(0);
        SignalBars.Add(Math.Clamp(height, 6, 92));
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
        OnPropertyChanged(nameof(RecorderStateLabel));
        OnPropertyChanged(nameof(NextActionLabel));
    }

    partial void OnSelectedVersionChanged(RecorderVersionFile? value)
    {
        OnPropertyChanged(nameof(CurrentFilePreviewLabel));
        OnPropertyChanged(nameof(ContentPackTakeLabel));
        OnPropertyChanged(nameof(LatestTakeTitle));
        OnPropertyChanged(nameof(LatestTakeDetail));
        OnPropertyChanged(nameof(PostReadySignal));
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
    }

    partial void OnLastVideoOutputPathChanged(string value)
    {
        OnPropertyChanged(nameof(LastVideoOutputLabel));
        OnPropertyChanged(nameof(VideoLayerDetail));
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
    int? LayerNumber)
{
    public override string ToString() => Name;
}

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
