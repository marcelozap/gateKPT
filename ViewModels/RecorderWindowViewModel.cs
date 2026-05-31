using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using GateKPT.MusicOS.Services;

namespace GateKPT.MusicOS.ViewModels;

public sealed partial class RecorderWindowViewModel : ViewModelBase
{
    private readonly FocusriteDiagnosticService _focusrite = new();
    private readonly LayerRecordingService _recorder = new();
    private readonly BuiltInLooperPlaybackService _playback = new();
    private readonly RecorderVersionStore _versions = new();
    private readonly AudioTransformService _transforms = new();

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
    private RecorderVersionFile? _selectedVersion;

    public ObservableCollection<RecorderVersionFile> Versions { get; } = [];

    public string PeakLabel => $"{PeakPercent:0}%";

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
            : $"{Versions.Count} take(s). Select one, or type: delete, rename, make warmer.";

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

        var result = _recorder.Start(InputName, _versions.TakesDirectory, "recording");
        IsRecording = result.Success;
        CurrentFilePath = result.Path;
        Status = result.Success ? "Recording. Play the RC-505 now." : result.Message;
    }

    [RelayCommand]
    private void StopRecording()
    {
        var result = _recorder.Stop();
        IsRecording = false;
        if (result.Success)
        {
            CurrentFilePath = result.Path;
            PeakPercent = result.PeakPercent;
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
        var result = _playback.PlayLoop(1, path, 80);
        Status = result.Message;
    }

    [RelayCommand]
    private void StopPlayback()
    {
        _playback.StopAll();
        Status = "Playback stopped.";
    }

    [RelayCommand]
    private void RunChatCommand()
    {
        var command = ChatText.Trim();
        if (string.IsNullOrWhiteSpace(command))
        {
            Status = "Type a command like: delete last version, rename hook idea, show versions.";
            return;
        }

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
            Status = $"Showing {Versions.Count} version(s).";
            return;
        }

        if (command.Contains("warmer", StringComparison.OrdinalIgnoreCase)
            || command.Contains("faster", StringComparison.OrdinalIgnoreCase)
            || command.Contains("clean", StringComparison.OrdinalIgnoreCase)
            || command.Contains("louder", StringComparison.OrdinalIgnoreCase))
        {
            var settings = GetEditSettings(command);
            CreateSafeEditCopy(settings.Label, settings.Gain);
            return;
        }

        Status = "Command not wired yet. Working commands: delete, rename, show versions, make warmer.";
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
            Status = "No version to delete.";
            return;
        }

        var trashPath = _versions.MoveToTrash(version.Path);
        Status = string.IsNullOrWhiteSpace(trashPath)
            ? "Could not move version to trash."
            : $"Moved to trash: {version.Name}";
        RefreshVersions();
    }

    private void RenameSelected(string label)
    {
        var version = SelectedVersion ?? Versions.FirstOrDefault();
        if (version is null)
        {
            Status = "No version to rename.";
            return;
        }

        var newPath = _versions.RenameVersion(version.Path, label);
        CurrentFilePath = newPath;
        Status = string.IsNullOrWhiteSpace(newPath)
            ? "Could not rename version."
            : $"Renamed take: {Path.GetFileName(newPath)}";
        RefreshVersions();
    }

    private void CreateSafeEditCopy(string label, double gain)
    {
        var sourcePath = SelectedVersion?.Path ?? CurrentFilePath;
        if (string.IsNullOrWhiteSpace(sourcePath) || !File.Exists(sourcePath))
        {
            Status = "No recording yet. Press Record, play sound, then Stop & Save first.";
            return;
        }

        var newPath = _versions.CreateVersionPath(label, ".wav");
        var result = _transforms.CreateGainCopy(sourcePath, newPath, gain);
        if (!result.Success)
        {
            newPath = _versions.CopyVersion(sourcePath, label);
        }

        if (string.IsNullOrWhiteSpace(newPath))
        {
            Status = "Could not create edit copy.";
            return;
        }

        CurrentFilePath = newPath;
        RefreshVersions();
        SelectedVersion = Versions.FirstOrDefault(item => item.Path == newPath) ?? SelectedVersion;
        Status = $"Created edit copy: {Path.GetFileName(newPath)}. Original kept. {result.Message}";
    }

    private static AudioEditSettings GetEditSettings(string command)
    {
        if (command.Contains("warmer", StringComparison.OrdinalIgnoreCase)
            || command.Contains("warm", StringComparison.OrdinalIgnoreCase))
        {
            return new AudioEditSettings("warmer-boost", 3.0);
        }

        if (command.Contains("faster", StringComparison.OrdinalIgnoreCase))
        {
            return new AudioEditSettings("faster-copy", 1.0);
        }

        if (command.Contains("clean", StringComparison.OrdinalIgnoreCase))
        {
            return new AudioEditSettings("clean-copy", 1.25);
        }

        if (command.Contains("louder", StringComparison.OrdinalIgnoreCase))
        {
            return new AudioEditSettings("louder-boost", 6.0);
        }

        return new AudioEditSettings("edited-copy", 1.0);
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

    partial void OnPeakPercentChanged(double value)
    {
        OnPropertyChanged(nameof(PeakLabel));
        OnPropertyChanged(nameof(PrimaryHeadline));
        OnPropertyChanged(nameof(PrimaryDetail));
    }

    partial void OnSignalReadyChanged(bool value)
    {
        OnPropertyChanged(nameof(PrimaryHeadline));
        OnPropertyChanged(nameof(PrimaryDetail));
    }

    partial void OnIsRecordingChanged(bool value)
    {
        OnPropertyChanged(nameof(PrimaryHeadline));
        OnPropertyChanged(nameof(PrimaryDetail));
    }

    partial void OnCurrentFilePathChanged(string value)
    {
        OnPropertyChanged(nameof(CurrentFileLabel));
    }

    private sealed record AudioEditSettings(string Label, double Gain);
}
