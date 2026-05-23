using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;

namespace GateKPT.MusicOS.Services;

public sealed class FfmpegRenderService
{
    public ExportResult RenderReviewClip(
        string videoPath,
        string vocalPath,
        int offsetMs,
        string outputDirectory,
        ExportPreset preset)
    {
        if (!File.Exists(videoPath))
        {
            return ExportResult.Fail("Video file is missing.");
        }

        if (!File.Exists(vocalPath))
        {
            return ExportResult.Fail("Final vocal/audio file is missing.");
        }

        Directory.CreateDirectory(outputDirectory);
        var outputPath = Path.Combine(
            outputDirectory,
            $"{Path.GetFileNameWithoutExtension(videoPath)}-{preset.Slug}-synced.mp4");

        var filter = BuildAudioFilter(offsetMs);
        var scale = preset.Width > 0 && preset.Height > 0
            ? $"-vf \"scale={preset.Width}:{preset.Height}:force_original_aspect_ratio=decrease,pad={preset.Width}:{preset.Height}:(ow-iw)/2:(oh-ih)/2\""
            : "";

        var args =
            $"-y -i \"{videoPath}\" -i \"{vocalPath}\" {scale} -filter_complex \"{filter}\" " +
            $"-map 0:v:0 -map \"[synced]\" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 192k -shortest \"{outputPath}\"";

        try
        {
            using var process = Process.Start(new ProcessStartInfo
            {
                FileName = "ffmpeg",
                Arguments = args,
                CreateNoWindow = true,
                RedirectStandardError = true,
                RedirectStandardOutput = true,
                UseShellExecute = false,
            });

            if (process is null)
            {
                return ExportResult.Fail("Could not start FFmpeg.");
            }

            if (!process.WaitForExit(TimeSpan.FromMinutes(5)))
            {
                process.Kill(entireProcessTree: true);
                return ExportResult.Fail("FFmpeg export timed out after 5 minutes.");
            }

            var stderr = process.StandardError.ReadToEnd();
            if (process.ExitCode != 0 || !File.Exists(outputPath))
            {
                return ExportResult.Fail($"FFmpeg export failed. {stderr.Trim()}");
            }

            return ExportResult.Ok(outputPath, $"Rendered {preset.Name} review clip.");
        }
        catch (Exception ex)
        {
            return ExportResult.Fail($"FFmpeg is not available or export failed: {ex.Message}");
        }
    }

    private static string BuildAudioFilter(int offsetMs)
    {
        if (offsetMs > 0)
        {
            return $"[1:a]adelay={offsetMs}|{offsetMs},asetpts=PTS-STARTPTS[synced]";
        }

        if (offsetMs < 0)
        {
            var seconds = (-offsetMs / 1000.0).ToString("0.###", CultureInfo.InvariantCulture);
            return $"[1:a]atrim=start={seconds},asetpts=PTS-STARTPTS[synced]";
        }

        return "[1:a]asetpts=PTS-STARTPTS[synced]";
    }
}

public sealed record ExportPreset(string Name, string Slug, int Width, int Height, string Description);

public sealed record ExportResult(bool Success, string? OutputPath, string Message)
{
    public static ExportResult Ok(string outputPath, string message) => new(true, outputPath, message);

    public static ExportResult Fail(string message) => new(false, null, message);
}
