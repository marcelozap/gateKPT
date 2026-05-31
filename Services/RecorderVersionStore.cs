using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace GateKPT.MusicOS.Services;

public sealed class RecorderVersionStore
{
    public string RootDirectory { get; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.MyMusic),
        "GateKPT Recorder");

    public string TakesDirectory => Path.Combine(RootDirectory, "takes");

    public string TrashDirectory => Path.Combine(RootDirectory, "trash");

    public IReadOnlyList<RecorderVersionFile> ListVersions() =>
        Directory.Exists(TakesDirectory)
            ? Directory.GetFiles(TakesDirectory, "*.wav")
                .Select(path => new FileInfo(path))
                .OrderByDescending(info => info.LastWriteTime)
                .Select(info => new RecorderVersionFile(
                    info.Name,
                    info.FullName,
                    FormatFileSize(info.Length),
                    info.LastWriteTime.ToString("M/d h:mm tt")))
                .ToList()
            : [];

    public string CreateRecordingPath(string label)
    {
        Directory.CreateDirectory(TakesDirectory);
        return AutoSaveFileNamer.CreatePath(TakesDirectory, label, ".wav");
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
        Directory.CreateDirectory(TakesDirectory);
        if (!File.Exists(sourcePath))
        {
            return "";
        }

        var target = AutoSaveFileNamer.CreatePath(TakesDirectory, label, Path.GetExtension(sourcePath));
        File.Copy(sourcePath, target, false);
        return target;
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

public sealed record RecorderVersionFile(string Name, string Path, string Size, string Modified);
