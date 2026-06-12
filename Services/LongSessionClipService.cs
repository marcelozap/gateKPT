using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;

namespace GateKPT.MusicOS.Services;

public sealed class LongSessionClipService
{
    public string OutputDirectory { get; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.MyVideos),
        "GateKPT Screen Clips");

    public LongSessionClipResult CutAroundMarker(
        string sourceVideoPath,
        TimeSpan markerTime,
        string label,
        TimeSpan? before = null,
        TimeSpan? after = null)
    {
        if (string.IsNullOrWhiteSpace(sourceVideoPath) || !File.Exists(sourceVideoPath))
        {
            return LongSessionClipResult.Fail("No long capture found. Use start capture, mark moments, then stop capture.");
        }

        var ffmpeg = ResolveTool("ffmpeg.exe");
        if (string.IsNullOrWhiteSpace(ffmpeg))
        {
            return LongSessionClipResult.Fail("FFmpeg not found. Install FFmpeg before cutting long-session clips.");
        }

        var leadIn = before ?? TimeSpan.FromSeconds(12);
        var tail = after ?? TimeSpan.FromSeconds(20);
        var start = markerTime > leadIn ? markerTime - leadIn : TimeSpan.Zero;
        var duration = leadIn + tail;

        Directory.CreateDirectory(OutputDirectory);
        var safeLabel = MakeSafeLabel(label);
        var outputPath = AutoSaveFileNamer.CreatePath(OutputDirectory, $"gatekpt-clip-{safeLabel}", ".mp4");

        var args =
            "-y -hide_banner " +
            $"-ss {FormatTime(start)} -i \"{sourceVideoPath}\" " +
            $"-t {FormatTime(duration)} " +
            "-c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p " +
            "-c:a aac -b:a 192k -movflags +faststart " +
            $"\"{outputPath}\"";

        try
        {
            using var process = Process.Start(new ProcessStartInfo
            {
                FileName = ffmpeg,
                Arguments = args,
                CreateNoWindow = true,
                RedirectStandardError = true,
                RedirectStandardOutput = true,
                UseShellExecute = false
            });

            if (process is null)
            {
                return LongSessionClipResult.Fail("Could not start FFmpeg clip cutter.");
            }

            var stderr = process.StandardError.ReadToEnd();
            process.StandardOutput.ReadToEnd();
            process.WaitForExit();

            if (process.ExitCode != 0)
            {
                return LongSessionClipResult.Fail($"Clip cut failed: {LastLine(stderr)}");
            }

            return File.Exists(outputPath) && new FileInfo(outputPath).Length > 1024
                ? LongSessionClipResult.Ok(outputPath, $"Clip saved: {Path.GetFileName(outputPath)}")
                : LongSessionClipResult.Fail("Clip command finished, but no playable clip was created.");
        }
        catch (Exception ex)
        {
            return LongSessionClipResult.Fail($"Clip cut failed: {ex.Message}");
        }
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

    private static string MakeSafeLabel(string label)
    {
        var value = string.IsNullOrWhiteSpace(label) ? "moment" : label.Trim().ToLowerInvariant();
        foreach (var invalid in Path.GetInvalidFileNameChars())
        {
            value = value.Replace(invalid, '-');
        }

        value = string.Join("-", value.Split(' ', StringSplitOptions.RemoveEmptyEntries));
        return string.IsNullOrWhiteSpace(value) ? "moment" : value[..Math.Min(value.Length, 40)];
    }

    private static string FormatTime(TimeSpan time) =>
        time.TotalSeconds.ToString("0.###", CultureInfo.InvariantCulture);

    private static string LastLine(string text) =>
        text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries).LastOrDefault() ?? "unknown FFmpeg error";

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
}

public sealed record LongSessionClipResult(bool Success, string Path, string Message)
{
    public static LongSessionClipResult Ok(string path, string message) => new(true, path, message);

    public static LongSessionClipResult Fail(string message) => new(false, "", message);
}
