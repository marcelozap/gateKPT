using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
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
    private readonly RecorderDiagnosticLog _diagnostics;
    private readonly DispatcherTimer _recordingTimer = new() { Interval = TimeSpan.FromSeconds(1) };
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
    private string _commandResult = "No command yet.";

    [ObservableProperty]
    private bool _isCommandBusy = false;

    [ObservableProperty]
    private bool _isRecorderBusy = false;

    [ObservableProperty]
    private string _assistantBrief = "Shape takes without losing the original.";

    [ObservableProperty]
    private string _commandHistory = "No commands yet.";

    [ObservableProperty]
    private string _signalProbeSummary = "Run Check signal before the first take.";

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
    private LayerSlotItem? _selectedLayerSlot;

    public ObservableCollection<RecorderVersionFile> Versions { get; } = [];

    public ObservableCollection<AudioInputDeviceItem> InputDevices { get; } = [];

    public ObservableCollection<AudioOutputDeviceItem> OutputDevices { get; } = [];

    public ObservableCollection<LayerSlotItem> LayerSlots { get; } =
    [
        new(1, "Drums"),
        new(2, "Guitar"),
        new(3, "Piano"),
        new(4, "Vocal"),
        new(5, "Extra")
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

    public string RecordingButtonLabel =>
        IsRecording ? "● RECORDING" : "● RECORD";

    public string StopButtonLabel =>
        IsRecording ? "■ SAVE NOW" : "■ SAVE";

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
        PeakPercent >= 8
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
        SelectedLayerSlot?.Name ?? "Drums";

    public string CaptureInstruction =>
        IsRecording
            ? PeakPercent < 1 && RecordingElapsedLabel != "00:00"
                ? "Recording, but no sound is entering. Play now or GateKPT will reject it."
                : "GateKPT is recording now."
            : "Press RECORD, play sound, then STOP & SAVE.";

    public string NextActionLabel =>
        IsRecording
            ? "Stop when done."
            : SignalReady
                ? "Record the take."
                : "Check signal.";

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
                : "Check signal, then record.";

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

    public string CommandHelp =>
        "Try: make warmer, louder, add reverb, clean it, delete last, play latest.";

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
        SelectedLayerSlot = LayerSlots.FirstOrDefault();
        RefreshInputDevices();
        RefreshOutputDevices();
        RefreshVersions();
        RestoreLayerDeck();
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
        StartRecordingForLayer("take", null);
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
                Status = $"Rejected silent take. Peak {result.PeakPercent:0.0}%, RMS {result.RmsPercent:0.00}%. No rescue copy created.";
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
                Status = $"Rejected weak take. {repair.Message} Final check: {metrics.Duration.TotalSeconds:0.00}s, peak {metrics.PeakPercent:0.0}%, RMS {metrics.RmsPercent:0.00}%.";
                CommandResult = "No take saved. GateKPT only keeps audio with real sustained signal now.";
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
        var result = _playback.OpenAudioInWindowsPlayer(path);
        Status = result.Success
            ? $"Opened take in Windows player: {Path.GetFileName(path)}"
            : result.Message;
        CommandResult = result.Success
            ? $"Take opened: {metrics.Duration:mm\\:ss}, peak {metrics.PeakPercent:0.0}%, RMS {metrics.RmsPercent:0.00}%."
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
        var result = _playback.OpenTestToneInWindowsPlayer();
        Status = result.Message;
        CommandResult = result.Success
            ? "If Windows player makes sound, GateKPT playback is confirmed through the system route."
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

        var result = _phoneVideo.RenderWithGateKptAudio(PhoneVideoPath, audioPath);
        if (result.Success)
        {
            LastVideoOutputPath = result.Path;
        }

        VideoWorkflowStatus = result.Message;
        Status = result.Message;
    }

    [RelayCommand]
    private void OpenVideoOutputFolder()
    {
        _phoneVideo.OpenOutputFolder();
        Status = $"Opened {_phoneVideo.OutputDirectory}";
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

        if (elapsed.TotalSeconds >= 8 && PeakPercent < 1)
        {
            _ = StopRecording();
            Status = "Auto-stopped: no sound entered for 8 seconds. No blank take kept.";
            CommandResult = "No audio detected. Check RC-505 output, Scarlett input gain, and Windows input device.";
        }
    }

    partial void OnPeakPercentChanged(double value)
    {
        OnPropertyChanged(nameof(PeakLabel));
        OnPropertyChanged(nameof(PeakDecibelLabel));
        OnPropertyChanged(nameof(SimpleSignalLabel));
        OnPropertyChanged(nameof(AudioHealthLabel));
        OnPropertyChanged(nameof(PrimaryHeadline));
        OnPropertyChanged(nameof(PrimaryDetail));
        OnPropertyChanged(nameof(RecorderStateLabel));
        OnPropertyChanged(nameof(NextActionLabel));
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
        OnPropertyChanged(nameof(RecordingGuardLabel));
        OnPropertyChanged(nameof(CaptureInstruction));
        OnPropertyChanged(nameof(SimpleSignalLabel));
        OnPropertyChanged(nameof(AudioHealthLabel));
    }

    partial void OnIsCommandBusyChanged(bool value)
    {
        OnPropertyChanged(nameof(IsBusy));
        OnPropertyChanged(nameof(BusyLabel));
    }

    partial void OnIsRecorderBusyChanged(bool value)
    {
        OnPropertyChanged(nameof(IsBusy));
        OnPropertyChanged(nameof(BusyLabel));
    }

    partial void OnActiveRecordingNameChanged(string value)
    {
        OnPropertyChanged(nameof(RecordingGuardLabel));
    }

    partial void OnRecordingElapsedLabelChanged(string value)
    {
        OnPropertyChanged(nameof(RecordingGuardLabel));
    }

    partial void OnInputNameChanged(string value)
    {
        OnPropertyChanged(nameof(MeterInputLabel));
    }

    partial void OnCurrentFilePathChanged(string value)
    {
        OnPropertyChanged(nameof(CurrentFileLabel));
        OnPropertyChanged(nameof(CurrentFilePreviewLabel));
        OnPropertyChanged(nameof(RecorderStateLabel));
        OnPropertyChanged(nameof(NextActionLabel));
    }

    partial void OnSelectedVersionChanged(RecorderVersionFile? value)
    {
        OnPropertyChanged(nameof(CurrentFilePreviewLabel));
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
    }

    partial void OnLastVideoOutputPathChanged(string value)
    {
        OnPropertyChanged(nameof(LastVideoOutputLabel));
    }

    partial void OnSelectedLayerSlotChanged(LayerSlotItem? value)
    {
        OnPropertyChanged(nameof(LastEffectChain));
        OnPropertyChanged(nameof(SelectedCaptureLaneLabel));
        OnPropertyChanged(nameof(CaptureInstruction));
        OnPropertyChanged(nameof(RecordingButtonLabel));
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
