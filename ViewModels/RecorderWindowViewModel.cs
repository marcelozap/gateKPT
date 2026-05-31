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
    private bool _recordingSignalSeen;
    private int? _activeCaptureLayerNumber;
    private string _activeCaptureLabel = "recording";

    [ObservableProperty]
    private string _inputName = "Scarlett not selected";

    [ObservableProperty]
    private double _peakPercent = 0;

    [ObservableProperty]
    private bool _signalReady = false;

    [ObservableProperty]
    private bool _isRecording = false;

    [ObservableProperty]
    private string _currentFilePath = "";

    [ObservableProperty]
    private string _chatText = "make drums warmer";

    [ObservableProperty]
    private string _status = "Ready.";

    [ObservableProperty]
    private string _commandResult = "No command yet.";

    [ObservableProperty]
    private string _assistantBrief = "Text edits. Safe copies.";

    [ObservableProperty]
    private string _commandHistory = "No commands yet.";

    [ObservableProperty]
    private RecorderVersionFile? _selectedVersion;

    [ObservableProperty]
    private string _lastExportedMixPath = "";

    public ObservableCollection<RecorderVersionFile> Versions { get; } = [];

    public ObservableCollection<LayerSlotItem> LayerSlots { get; } =
    [
        new(1, "Drums"),
        new(2, "Guitar"),
        new(3, "Piano"),
        new(4, "Vocal"),
        new(5, "Extra")
    ];

    public string PeakLabel => $"{PeakPercent:0}%";

    public string RecorderStateLabel =>
        IsRecording
            ? "LIVE RECORDING"
            : string.IsNullOrWhiteSpace(CurrentFilePath)
                ? "WAITING"
                : "TAKE READY";

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
                : "Audio check.";

    public string PrimaryDetail =>
        IsRecording
            ? "Play the pass."
            : SignalReady
                ? "Capture when ready."
                : "Find Scarlett. Check signal.";

    public string CurrentFileLabel =>
        string.IsNullOrWhiteSpace(CurrentFilePath)
            ? "No take saved yet."
            : Path.GetFileName(CurrentFilePath);

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

    public string CommandHelp =>
        "Try: drums punch, vocal polish, add reverb, warmer, louder, delete.";

    public string Rc505CaptureGuide =>
        "Full loop or solo track.";

    public string SessionMemorySignal =>
        "Capture -> lanes -> mix -> visual.";

    public string SectionTimelineSignal =>
        "Intro / Groove / Hook / Bridge / Outro.";

    public string ExportPlanningSignal =>
        "Mix, review, prep.";

    public string RoutingSignal =>
        "RC-505 -> Scarlett -> GateKPT.";

    public RecorderWindowViewModel()
    {
        RefreshVersions();
    }

    [RelayCommand]
    private void FindScarlett()
    {
        var selection = _focusrite.Detect();
        InputName = selection.HasInput ? selection.InputName : "Scarlett input not found";
        Status = selection.Summary;
    }

    [RelayCommand]
    private async Task CheckSignal()
    {
        FindScarlett();
        Status = "Checking 3 seconds. Play the RC-505 now.";
        var result = await _focusrite.RunInputTestAsync(InputName, Path.Combine(_versions.RootDirectory, "diagnostics"), 3);
        PeakPercent = result.PeakPercent;
        SignalReady = result.PeakPercent is >= 8 and <= 88;
        CurrentFilePath = result.Path;
        Status = result.Success
            ? $"{result.Message} Target is 35-75%, but anything above 8% proves signal."
            : result.Message;
        RefreshVersions();
    }

    [RelayCommand]
    private void StartRecording()
    {
        StartRecordingForLayer("recording", null);
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

        FindScarlett();
        if (!InputName.Contains("Scarlett", StringComparison.OrdinalIgnoreCase)
            && !InputName.Contains("Focusrite", StringComparison.OrdinalIgnoreCase))
        {
            Status = "Scarlett input not selected. Click Find Scarlett first.";
            return;
        }

        PeakPercent = 0;
        _recordingSignalSeen = false;
        _activeCaptureLabel = label;
        _activeCaptureLayerNumber = layerNumber;
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
        CurrentFilePath = result.Path;
        Status = result.Success
            ? layerNumber is null
                ? "Recording full RC-505 output. Watch the signal number move."
                : $"Recording {LayerSlots.First(slot => slot.Number == layerNumber).Name}. Solo that RC-505 track now."
            : result.Message;
    }

    [RelayCommand]
    private void StopRecording()
    {
        var result = _recorder.Stop();
        IsRecording = false;
        if (result.Success)
        {
            PeakPercent = result.PeakPercent;
            CurrentFilePath = result.Path;
            if (result.PeakPercent is > 0 and < 8)
            {
                var rescuedPath = _versions.CreateVersionPath("auto-rescued", ".wav");
                var rescue = _transforms.CreateNormalizedCopy(result.Path, rescuedPath, result.PeakPercent);
                if (rescue.Success)
                {
                    CurrentFilePath = rescuedPath;
                    Status = $"Saved low signal take and created louder rescue: {Path.GetFileName(rescuedPath)}. Original peak {result.PeakPercent:0.0}%.";
                    RefreshVersions();
                    SelectedVersion = Versions.FirstOrDefault(item => item.Path == rescuedPath) ?? SelectedVersion;
                    AutoAssignActiveCapture(rescuedPath);
                    return;
                }
            }

            Status = $"Saved take: {Path.GetFileName(result.Path)}. Peak {result.PeakPercent:0.0}%.";
            RefreshVersions();
            AutoAssignActiveCapture(result.Path);
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
        _activeCaptureLayerNumber = null;
        _activeCaptureLabel = "recording";
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
        Process.Start(new ProcessStartInfo
        {
            FileName = path,
            UseShellExecute = true
        });
        Status = $"Opened in Windows player: {Path.GetFileName(path)}";
    }

    [RelayCommand]
    private void StopPlayback()
    {
        _playback.StopAll();
        Status = "Internal playback stopped. If Windows player opened, close/pause it there.";
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
    private void ClearLayerDeck()
    {
        _playback.StopAll();
        for (var index = 0; index < LayerSlots.Count; index++)
        {
            var slot = LayerSlots[index];
            LayerSlots[index] = new LayerSlotItem(slot.Number, slot.Name);
        }

        OnPropertyChanged(nameof(LayerDeckSummary));
        Status = "Layer deck cleared. Takes are still saved in Versions.";
    }

    [RelayCommand]
    private void RunChatCommand()
    {
        var command = ChatText.Trim();
        if (string.IsNullOrWhiteSpace(command))
        {
            CommandResult = "No command entered.";
            Status = "Type a command like: delete last version, rename hook idea, show versions.";
            return;
        }

        CommandResult = $"Running: {command}";
        AddCommandHistory(command);
        if (command.Contains("delete", StringComparison.OrdinalIgnoreCase))
        {
            DeleteSelectedOrLatest();
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
            return;
        }

        if (command.Contains("show", StringComparison.OrdinalIgnoreCase)
            || command.Contains("versions", StringComparison.OrdinalIgnoreCase))
        {
            RefreshVersions();
            CommandResult = $"Showing {Versions.Count} version(s).";
            Status = CommandResult;
            return;
        }

        if (command.Contains("help", StringComparison.OrdinalIgnoreCase)
            || command.Contains("commands", StringComparison.OrdinalIgnoreCase))
        {
            CommandResult = CommandHelp;
            Status = "Showing command examples.";
            return;
        }

        if (TryGetEditPreset(command, out var preset))
        {
            CreateSafeEditCopy(preset);
            return;
        }

        CommandResult = $"Command not wired yet. {CommandHelp}";
        Status = CommandResult;
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
        CommandResult = $"Created: {Path.GetFileName(newPath)}";
        Status = $"Created edit copy: {Path.GetFileName(newPath)}. Original kept. {result.Message}";
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
                ReverbMix: 0.10);
            return true;
        }

        if (text.Contains("drum") || text.Contains("kick") || text.Contains("snare"))
        {
            preset = new AudioEditPreset(
                "drums-punch",
                "Drums punch: low-end weight, transient-style compression, light saturation.",
                Gain: 1.45,
                LowShelfDb: 4,
                HighShelfDb: 1.5,
                CompressionAmount: 0.65,
                SaturationAmount: 0.18);
            return true;
        }

        if (text.Contains("piano") || text.Contains("keys"))
        {
            preset = new AudioEditPreset(
                "piano-bright",
                "Piano bright: cleanup low rumble, presence lift, soft compression.",
                Gain: 1.25,
                HighPassHz: 70,
                HighShelfDb: 3,
                CompressionAmount: 0.25);
            return true;
        }

        if (text.Contains("acoustic") || text.Contains("guitar"))
        {
            preset = new AudioEditPreset(
                "acoustic-warm",
                "Acoustic warm: body lift, harsh top trimmed, small room glue.",
                Gain: 1.35,
                LowShelfDb: 2.8,
                HighShelfDb: -1.8,
                CompressionAmount: 0.22,
                ReverbMs: 120,
                ReverbMix: 0.08);
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
        Versions.Clear();
        foreach (var version in _versions.ListVersions())
        {
            Versions.Add(version);
        }

        SelectedVersion = Versions.FirstOrDefault(item => item.Path == CurrentFilePath) ?? Versions.FirstOrDefault();
        OnPropertyChanged(nameof(CurrentFileLabel));
        OnPropertyChanged(nameof(VersionListHint));
    }

    private void ReplaceLayerSlot(int number, LayerSlotItem updated)
    {
        var index = LayerSlots.IndexOf(LayerSlots.First(item => item.Number == number));
        LayerSlots[index] = updated;
        OnPropertyChanged(nameof(LayerDeckSummary));
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
    }

    partial void OnPeakPercentChanged(double value)
    {
        OnPropertyChanged(nameof(PeakLabel));
        OnPropertyChanged(nameof(PrimaryHeadline));
        OnPropertyChanged(nameof(PrimaryDetail));
        OnPropertyChanged(nameof(RecorderStateLabel));
        OnPropertyChanged(nameof(NextActionLabel));
    }

    partial void OnSignalReadyChanged(bool value)
    {
        OnPropertyChanged(nameof(PrimaryHeadline));
        OnPropertyChanged(nameof(PrimaryDetail));
        OnPropertyChanged(nameof(NextActionLabel));
    }

    partial void OnIsRecordingChanged(bool value)
    {
        OnPropertyChanged(nameof(PrimaryHeadline));
        OnPropertyChanged(nameof(PrimaryDetail));
        OnPropertyChanged(nameof(RecorderStateLabel));
        OnPropertyChanged(nameof(NextActionLabel));
    }

    partial void OnCurrentFilePathChanged(string value)
    {
        OnPropertyChanged(nameof(CurrentFileLabel));
        OnPropertyChanged(nameof(RecorderStateLabel));
        OnPropertyChanged(nameof(NextActionLabel));
    }

    partial void OnLastExportedMixPathChanged(string value)
    {
        OnPropertyChanged(nameof(LastExportedMixLabel));
    }
}

public sealed record LayerSlotItem(
    int Number,
    string Name,
    string Path = "",
    string FileName = "Empty",
    string Status = "Empty");
