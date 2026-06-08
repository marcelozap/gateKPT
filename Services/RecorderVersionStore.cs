using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

namespace GateKPT.MusicOS.Services;

public sealed class RecorderVersionStore
{
    public RecorderVersionStore(string? rootDirectory = null)
    {
        RootDirectory = string.IsNullOrWhiteSpace(rootDirectory)
            ? Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.MyMusic),
                "GateKPT Recorder")
            : rootDirectory;
    }

    public string RootDirectory { get; }

    public string TakesDirectory => Path.Combine(RootDirectory, "takes");

    public string ActiveSessionName { get; set; } = "Session 1";

    public string ActiveTakesDirectory => Path.Combine(TakesDirectory, AutoSaveFileNamer.Sanitize(ActiveSessionName));

    public string StemsDirectory => Path.Combine(RootDirectory, "stems");

    public string TrashDirectory => Path.Combine(RootDirectory, "trash");

    public string LayerDeckPath => Path.Combine(RootDirectory, "layer-deck.json");

    public IReadOnlyList<RecorderVersionFile> ListVersions() =>
        Directory.Exists(ActiveTakesDirectory)
            ? Directory.GetFiles(ActiveTakesDirectory, "*.wav")
                .Select(path => new FileInfo(path))
                .OrderByDescending(info => info.LastWriteTime)
                .Select(info => new RecorderVersionFile(
                    info.Name,
                    info.FullName,
                    FormatFileSize(info.Length),
                    info.LastWriteTime.ToString("M/d h:mm tt")))
                .ToList()
            : [];

    public int MoveNonAudioArtifactsToTrash()
    {
        if (!Directory.Exists(ActiveTakesDirectory))
        {
            return 0;
        }

        var moved = 0;
        foreach (var path in Directory.GetFiles(ActiveTakesDirectory).Where(path => !path.EndsWith(".wav", StringComparison.OrdinalIgnoreCase)))
        {
            if (!string.IsNullOrWhiteSpace(MoveToTrash(path)))
            {
                moved++;
            }
        }

        return moved;
    }

    public string CreateRecordingPath(string label)
    {
        Directory.CreateDirectory(ActiveTakesDirectory);
        return AutoSaveFileNamer.CreatePath(ActiveTakesDirectory, label, ".wav");
    }

    public string MoveToTrash(string path)
    {
        Directory.CreateDirectory(TrashDirectory);
        if (!File.Exists(path))
        {
            return "";
        }

        var target = Path.Combine(TrashDirectory, Path.GetFileName(path));
        if (File.Exists(target))
        {
            target = Path.Combine(
                TrashDirectory,
                $"{Path.GetFileNameWithoutExtension(path)}-{DateTime.Now:yyyyMMdd-HHmmss}{Path.GetExtension(path)}");
        }

        File.Move(path, target);
        return target;
    }

    public string RenameVersion(string path, string label)
    {
        if (!File.Exists(path))
        {
            return "";
        }

        var target = Path.Combine(
            Path.GetDirectoryName(path) ?? TakesDirectory,
            $"{AutoSaveFileNamer.Prefix}-{DateTime.Now:yyyyMMdd-HHmmss}-{AutoSaveFileNamer.Sanitize(label)}{Path.GetExtension(path)}");
        File.Move(path, target);
        return target;
    }

    public string CopyVersion(string sourcePath, string label)
    {
        Directory.CreateDirectory(ActiveTakesDirectory);
        if (!File.Exists(sourcePath))
        {
            return "";
        }

        var target = AutoSaveFileNamer.CreatePath(ActiveTakesDirectory, label, Path.GetExtension(sourcePath));
        File.Copy(sourcePath, target, false);
        return target;
    }

    public string CreateVersionPath(string label, string extension)
    {
        Directory.CreateDirectory(ActiveTakesDirectory);
        return AutoSaveFileNamer.CreatePath(ActiveTakesDirectory, label, extension);
    }

    public string CreateStemExportDirectory()
    {
        var directory = Path.Combine(StemsDirectory, $"{AutoSaveFileNamer.Prefix}-{DateTime.Now:yyyyMMdd-HHmmss}-stems");
        Directory.CreateDirectory(directory);
        return directory;
    }

    public string CopyStemExport(string sourcePath, string targetDirectory, int laneNumber, string laneName)
    {
        if (!File.Exists(sourcePath))
        {
            return "";
        }

        Directory.CreateDirectory(targetDirectory);
        var extension = Path.GetExtension(sourcePath);
        var target = Path.Combine(
            targetDirectory,
            $"{laneNumber:00}-{AutoSaveFileNamer.Sanitize(laneName)}{extension}");
        File.Copy(sourcePath, target, true);
        return target;
    }

    public IReadOnlyList<StoredLayerSlot> LoadLayerDeck()
    {
        try
        {
            if (!File.Exists(LayerDeckPath))
            {
                return [];
            }

            var json = File.ReadAllText(LayerDeckPath);
            return JsonSerializer.Deserialize<List<StoredLayerSlot>>(json) ?? [];
        }
        catch
        {
            return [];
        }
    }

    public void SaveLayerDeck(IEnumerable<StoredLayerSlot> slots)
    {
        Directory.CreateDirectory(RootDirectory);
        var json = JsonSerializer.Serialize(slots, new JsonSerializerOptions
        {
            WriteIndented = true
        });
        File.WriteAllText(LayerDeckPath, json);
    }

    private static string FormatFileSize(long bytes)
    {
        if (bytes >= 1024 * 1024)
        {
            return $"{bytes / 1024.0 / 1024.0:0.0} MB";
        }

        return bytes >= 1024 ? $"{bytes / 1024.0:0.0} KB" : $"{bytes} B";
    }
}

public sealed record RecorderVersionFile(string Name, string Path, string Size, string Modified)
{
    public string DisplayName
    {
        get
        {
            var preview = AudioPreviewService.Inspect(Path);
            var duration = preview == AudioPreview.Empty ? "take" : preview.Duration;
            var label = Name.Contains("vocal", StringComparison.OrdinalIgnoreCase)
                ? "Vocal"
                : Name.Contains("guitar", StringComparison.OrdinalIgnoreCase)
                    ? "Guitar"
                    : Name.Contains("drum", StringComparison.OrdinalIgnoreCase)
                        ? "Drums"
                        : Name.Contains("chrome", StringComparison.OrdinalIgnoreCase)
                            ? "Chrome"
                            : "Take";

            return $"{label} / {duration}";
        }
    }

    public string DisplayMeta
    {
        get
        {
            var preview = AudioPreviewService.Inspect(Path);
            return preview == AudioPreview.Empty ? Modified : Modified;
        }
    }
}

public sealed record StoredLayerSlot(
    int Number,
    string Name,
    string Path,
    string FileName,
    string Status,
    string EffectChain);
