using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;

namespace GateKPT.MusicOS.Services;

public sealed class VisualClipRenderService
{
    public string OutputDirectory { get; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.MyVideos),
        "GateKPT Visual Clips");

    public VisualClipResult RenderFromAudio(string audioPath, string mood = "night")
    {
        if (!File.Exists(audioPath))
        {
            return VisualClipResult.Fail("Audio take missing.");
        }

        var ffmpeg = ResolveTool("ffmpeg.exe");
        if (string.IsNullOrWhiteSpace(ffmpeg))
        {
            return VisualClipResult.Fail("FFmpeg not found. Install FFmpeg to render visual clips.");
        }

        Directory.CreateDirectory(OutputDirectory);
        var outputPath = AutoSaveFileNamer.CreatePath(
            OutputDirectory,
            $"{Path.GetFileNameWithoutExtension(audioPath)}-visual-{Slug(mood)}",
            ".mp4");

        var duration = ReadDurationSeconds(audioPath);
        var visualDuration = Math.Clamp(duration <= 0 ? 30 : duration, 3, 180)
            .ToString("0.###", CultureInfo.InvariantCulture);

        var palette = ResolvePalette(mood);
        var args =
            "-y -hide_banner " +
            $"-f lavfi -t {visualDuration} -i \"color=c={palette.Base}:s=1080x1920:r=30\" " +
            $"-i \"{audioPath}\" " +
            "-filter_complex \"" +
            $"[0:v]format=rgba," +
            $"drawbox=x=0:y=0:w=1080:h=1920:color={palette.Wash}@0.20:t=fill," +
            $"drawbox=x='120+45*sin(t*0.31)':y='430+130*sin(t*0.19)':w=760:h=240:color={palette.Pool}@0.18:t=fill," +
            $"drawbox=x='260+70*sin(t*0.17)':y='980+180*sin(t*0.13)':w=580:h=360:color={palette.Glow}@0.15:t=fill," +
            $"drawbox=x='-160+80*sin(t*0.11)':y='1480+80*sin(t*0.23)':w=760:h=260:color={palette.Accent}@0.16:t=fill," +
            "gblur=sigma=42[base];" +
            $"[1:a]showwaves=s=1080x520:mode=p2p:rate=30:colors={palette.Line}@0.38,format=rgba," +
            "colorchannelmixer=aa=0.34[waves];" +
            "[base][waves]overlay=0:690:format=auto," +
            $"drawbox=x=80:y=124:w=920:h=160:color={palette.Cream}@0.08:t=fill," +
            $"drawbox=x=132:y=1540:w=820:h=92:color={palette.Cream}@0.07:t=fill," +
            "format=yuv420p[v]\" " +
            "-map \"[v]\" -map 1:a:0 -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 192k " +
            "-shortest -movflags +faststart -map_metadata -1 " +
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
                UseShellExecute = false,
            });

            if (process is null)
            {
                return VisualClipResult.Fail("Could not start FFmpeg.");
            }

            var stderr = process.StandardError.ReadToEnd();
            if (!process.WaitForExit(TimeSpan.FromMinutes(5)))
            {
                process.Kill(entireProcessTree: true);
                return VisualClipResult.Fail("Visual clip render timed out.");
            }

            return process.ExitCode == 0 && File.Exists(outputPath)
                ? VisualClipResult.Ok(outputPath, $"Visual clip ready: {Path.GetFileName(outputPath)}")
                : VisualClipResult.Fail($"Visual render failed. {stderr.Trim()}");
        }
        catch (Exception ex)
        {
            return VisualClipResult.Fail($"Visual clip render failed: {ex.Message}");
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

    private static double ReadDurationSeconds(string audioPath)
    {
        try
        {
            var metrics = AudioPreviewService.InspectMetrics(audioPath);
            return metrics.Success ? metrics.Duration.TotalSeconds : 0;
        }
        catch
        {
            return 0;
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

    private static VisualClipPalette ResolvePalette(string mood)
    {
        var text = mood.Trim().ToLowerInvariant();
        if (text.Contains("storm"))
        {
            return new("0x090D12", "0x0E4D49", "0x1C7A6E", "0x6B4FA3", "0x2FA38F", "0xF4E3BE", "0x2FA38F");
        }

        if (text.Contains("fire"))
        {
            return new("0x0C0A07", "0x2B1208", "0xE07A2E", "0xB14A6E", "0xFFA94F", "0xFFF3D6", "0xFFA94F");
        }

        if (text.Contains("chrome"))
        {
            return new("0x0C0A07", "0x15181C", "0xF4E3BE", "0x2FA38F", "0xB14A6E", "0xFFF3D6", "0xF4E3BE");
        }

        return new("0x0C0A07", "0x131009", "0x1C7A6E", "0xE07A2E", "0xB14A6E", "0xF4E3BE", "0x2FA38F");
    }

    private static string Slug(string value)
    {
        var clean = new string(value
            .ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : '-')
            .ToArray());
        while (clean.Contains("--", StringComparison.Ordinal))
        {
            clean = clean.Replace("--", "-", StringComparison.Ordinal);
        }

        return clean.Trim('-');
    }
}

public sealed record VisualClipResult(bool Success, string Path, string Message)
{
    public static VisualClipResult Ok(string path, string message) => new(true, path, message);

    public static VisualClipResult Fail(string message) => new(false, "", message);
}

internal sealed record VisualClipPalette(
    string Base,
    string Wash,
    string Pool,
    string Glow,
    string Accent,
    string Cream,
    string Line);
