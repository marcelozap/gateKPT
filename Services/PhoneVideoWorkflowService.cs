using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;

namespace GateKPT.MusicOS.Services;

public sealed class PhoneVideoWorkflowService
{
    private static readonly string[] VideoExtensions = [".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"];

    public string OutputDirectory { get; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.MyVideos),
        "GateKPT Optimized");

    public PhoneVideoResult FindLatestVideo()
    {
        var roots = new[]
            {
                Environment.GetFolderPath(Environment.SpecialFolder.MyVideos),
                Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads"),
                Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
            }
            .Where(Directory.Exists)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var latest = roots
            .SelectMany(root => SafeEnumerate(root))
            .Where(file => VideoExtensions.Contains(file.Extension, StringComparer.OrdinalIgnoreCase))
            .OrderByDescending(file => file.LastWriteTimeUtc)
            .FirstOrDefault();

        return latest is null
            ? PhoneVideoResult.Fail("No phone/video file found in Videos, Downloads, Documents, or Desktop.")
            : PhoneVideoResult.Ok(latest.FullName, $"Found latest video: {latest.Name}");
    }

    public PhoneVideoResult OptimizeVideo(string videoPath)
    {
        if (!File.Exists(videoPath))
        {
            return PhoneVideoResult.Fail("Video file missing.");
        }

        Directory.CreateDirectory(OutputDirectory);
        var outputPath = AutoSaveFileNamer.CreatePath(
            OutputDirectory,
            $"{Path.GetFileNameWithoutExtension(videoPath)}-smooth-1080p",
            ".mp4");

        var args =
            $"-y -hide_banner -i \"{videoPath}\" -map 0:v:0 -map 0:a:0? " +
            "-vf \"fps=30,format=yuv420p\" -c:v libx264 -preset veryfast -crf 20 " +
            "-c:a aac -b:a 192k -movflags +faststart -map_metadata -1 " +
            $"\"{outputPath}\"";

        return RunFfmpeg(args, outputPath, "Optimized phone video.");
    }

    public PhoneVideoResult RenderWithGateKptAudio(string videoPath, string audioPath)
    {
        if (!File.Exists(videoPath))
        {
            return PhoneVideoResult.Fail("Video file missing.");
        }

        if (!File.Exists(audioPath))
        {
            return PhoneVideoResult.Fail("GateKPT audio take missing.");
        }

        Directory.CreateDirectory(OutputDirectory);
        var outputPath = AutoSaveFileNamer.CreatePath(
            OutputDirectory,
            $"{Path.GetFileNameWithoutExtension(videoPath)}-gatekpt-audio",
            ".mp4");

        var args =
            $"-y -hide_banner -i \"{videoPath}\" -i \"{audioPath}\" " +
            "-map 0:v:0 -map 1:a:0 -vf \"fps=30,format=yuv420p\" " +
            "-c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 192k " +
            "-shortest -movflags +faststart -map_metadata -1 " +
            $"\"{outputPath}\"";

        return RunFfmpeg(args, outputPath, "Rendered phone video with GateKPT audio.");
    }

    public void OpenOutputFolder()
    {
        Directory.CreateDirectory(OutputDirectory);
        Process.Start(new ProcessStartInfo
        {
            FileName = OutputDirectory,
            UseShellExecute = true
        });
    }

    private static PhoneVideoResult RunFfmpeg(string args, string outputPath, string successMessage)
    {
        var ffmpeg = ResolveTool("ffmpeg.exe");
        if (string.IsNullOrWhiteSpace(ffmpeg))
        {
            return PhoneVideoResult.Fail("FFmpeg not found. Install FFmpeg before rendering video.");
        }

        try
        {
            using var process = Process.Start(new ProcessStartInfo
            {
                FileName = ffmpeg,
                Arguments = args,
                CreateNoWindow = true,
                RedirectStandardError = true,
                RedirectStandardOutput = true,
                UseShellExecute = false,
            });

            if (process is null)
            {
                return PhoneVideoResult.Fail("Could not start FFmpeg.");
            }

            var stderr = process.StandardError.ReadToEnd();
            if (!process.WaitForExit(TimeSpan.FromMinutes(5)))
            {
                process.Kill(entireProcessTree: true);
                return PhoneVideoResult.Fail("FFmpeg timed out after 5 minutes.");
            }

            return process.ExitCode == 0 && File.Exists(outputPath)
                ? PhoneVideoResult.Ok(outputPath, $"{successMessage} {Path.GetFileName(outputPath)}")
                : PhoneVideoResult.Fail($"FFmpeg failed. {stderr.Trim()}");
        }
        catch (Exception ex)
        {
            return PhoneVideoResult.Fail($"Video render failed: {ex.Message}");
        }
    }

    private static string ResolveTool(string name)
    {
        var path = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (var directory in path.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var candidate = Path.Combine(directory.Trim(), name);
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        var wingetRoot = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Microsoft",
            "WinGet",
            "Packages");
        return Directory.Exists(wingetRoot)
            ? Directory.EnumerateFiles(wingetRoot, name, SearchOption.AllDirectories).FirstOrDefault() ?? ""
            : "";
    }

    private static IEnumerable<FileInfo> SafeEnumerate(string root)
    {
        try
        {
            return Directory.EnumerateFiles(root, "*.*", SearchOption.AllDirectories)
                .Select(path => new FileInfo(path));
        }
        catch
        {
            return [];
        }
    }
}

public sealed record PhoneVideoResult(bool Success, string Path, string Message)
{
    public static PhoneVideoResult Ok(string path, string message) => new(true, path, message);

    public static PhoneVideoResult Fail(string message) => new(false, "", message);
}
