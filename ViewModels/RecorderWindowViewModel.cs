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
    private bool _recordingSignalSeen;

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
    private string _status = "Find Scarlett, check signal, then record. Nothing else.";

    [ObservableProperty]
    private string _commandResult = "Command result will show here.";

    [ObservableProperty]
    private string _assistantBrief = "Private assistant mode: it listens to your instructions and makes safe versions. It does not replace the artist.";

    [ObservableProperty]
    private string _commandHistory = "No commands yet.";

    [ObservableProperty]
    private RecorderVersionFile? _selectedVersion;

    public ObservableCollection<RecorderVersionFile> Versions { get; } = [];

    public ObservableCollection<LayerSlotItem> LayerSlots { get; } =
    [
        new(1, "Drums"),
        new(2, "Guitar"),
        new(3, "Piano"),
        new(4, "Vocal")
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
            ? "Press STOP & SAVE when the loop is done."
            : SignalReady
                ? "Press RECORD, play, then STOP & SAVE."
                : "Press CHECK SIGNAL while the RC-505 is playing.";

    public string PrimaryHeadline =>
        IsRecording
            ? "Recording. Play now."
            : SignalReady
                ? "Signal works. Record when ready."
                : "First: prove sound.";

    public string PrimaryDetail =>
        IsRecording
            ? "Press Stop & Save when the pass is done."
            : SignalReady
                ? "Now record a short take. Original files stay safe."
                : "Click Find Scarlett, then Check Signal while the RC-505 is playing.";

    public string CurrentFileLabel =>
        string.IsNullOrWhiteSpace(CurrentFilePath)
            ? "No take saved yet."
            : Path.GetFileName(CurrentFilePath);

    public string VersionListHint =>
        Versions.Count == 0
            ? "No takes yet. Record, then Stop & Save."
            : $"{Versions.Count} take(s). Select one, or type: vocal polish, drums punch, add reverb.";

    public string LayerDeckSummary
    {
        get
        {
            var loaded = LayerSlots.Count(slot => !string.IsNullOrWhiteSpace(slot.Path));
            return loaded == 0
                ? "No layers assigned yet. Select a take, then assign it to the next lane."
                : $"{loaded}/{LayerSlots.Count} layer(s) ready. Play stack to perform over them.";
        }
    }

    public string CommandHelp =>
        "Ask for changes in plain words: make the drums hit harder, polish the vocal, add a small room, make it warmer, clean the rumble, make a DJ-ready boost.";

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
        var result = _recorder.Start(InputName, _versions.TakesDirectory, "recording", peak =>
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
        Status = result.Success ? "Recording. Watch the signal number move while you play." : result.Message;
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
                    return;
                }
            }

            Status = $"Saved take: {Path.GetFileName(result.Path)}. Peak {result.PeakPercent:0.0}%.";
            RefreshVersions();
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
    private void AssignSelectedToNextLayer()
    {
        var path = SelectedVersion?.Path ?? CurrentFilePath;
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            Status = "No take selected. Record or select a take first.";
            return;
        }

        var slot = LayerSlots.FirstOrDefault(item => string.IsNullOrWhiteSpace(item.Path))
            ?? LayerSlots.First();
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
    private void PlayLayerStack()
    {
        var loaded = LayerSlots.Where(slot => !string.IsNullOrWhiteSpace(slot.Path) && File.Exists(slot.Path)).ToList();
        if (loaded.Count == 0)
        {
            Status = "No layers loaded yet. Assign takes to the layer deck first.";
            return;
        }

        _playback.StopAll();
        foreach (var slot in loaded)
        {
            _playback.PlayLoop(slot.Number, slot.Path, 80);
        }

        Status = $"Playing {loaded.Count} layer(s). Record the next layer while the stack plays.";
    }

    [RelayCommand]
    private void StopLayerStack()
    {
        _playback.StopAll();
        Status = "Layer stack stopped.";
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
}

public sealed record LayerSlotItem(
    int Number,
    string Name,
    string Path = "",
    string FileName = "Empty",
    string Status = "Empty");
