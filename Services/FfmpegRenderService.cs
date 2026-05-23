using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Text.Json;

namespace GateKPT.MusicOS.Services;

public sealed class FfmpegRenderService
{
    public ExportResult RenderReviewClip(
        string videoPath,
        string vocalPath,
        int offsetMs,
        string outputDirectory,
        ExportPreset preset,
        AudioProcessingPreset audioPreset)
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

        var filter = BuildAudioFilter(offsetMs, audioPreset);
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

            WriteManifest(outputPath, videoPath, vocalPath, offsetMs, preset, audioPreset);
            return ExportResult.Ok(outputPath, $"Rendered {preset.Name} review clip.");
        }
        catch (Exception ex)
        {
            return ExportResult.Fail($"FFmpeg is not available or export failed: {ex.Message}");
        }
    }

    private static string BuildAudioFilter(int offsetMs, AudioProcessingPreset audioPreset)
    {
        var processing = BuildProcessingFilter(audioPreset);
        if (offsetMs > 0)
        {
            return $"[1:a]adelay={offsetMs}|{offsetMs},asetpts=PTS-STARTPTS{processing}[synced]";
        }

        if (offsetMs < 0)
        {
            var seconds = (-offsetMs / 1000.0).ToString("0.###", CultureInfo.InvariantCulture);
            return $"[1:a]atrim=start={seconds},asetpts=PTS-STARTPTS{processing}[synced]";
        }

        return $"[1:a]asetpts=PTS-STARTPTS{processing}[synced]";
    }

    private static string BuildProcessingFilter(AudioProcessingPreset audioPreset)
    {
        if (audioPreset.Slug == "dry")
        {
            return "";
        }

        var filters = "";
        if (audioPreset.HighPassHz > 0)
        {
            filters += $",highpass=f={audioPreset.HighPassHz}";
        }

        if (audioPreset.TargetLufs != 0)
        {
            filters += $",loudnorm=I={audioPreset.TargetLufs}:TP=-1.5:LRA=11";
        }

        return filters;
    }

    private static void WriteManifest(
        string outputPath,
        string videoPath,
        string vocalPath,
        int offsetMs,
        ExportPreset preset,
        AudioProcessingPreset audioPreset)
    {
        var manifest = new ExportManifest(
            DateTimeOffset.Now,
            outputPath,
            videoPath,
            vocalPath,
            offsetMs,
            preset.Name,
            audioPreset.Name,
            preset.Width,
            preset.Height);

        var json = JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(Path.ChangeExtension(outputPath, ".manifest.json"), json);
    }
}

public sealed record ExportPreset(string Name, string Slug, int Width, int Height, string Description);

public sealed record ExportManifest(
    DateTimeOffset RenderedAt,
    string OutputPath,
    string VideoPath,
    string VocalPath,
    int OffsetMs,
    string PresetName,
    string AudioPresetName,
    int Width,
    int Height);

public sealed record ExportResult(bool Success, string? OutputPath, string Message)
{
    public static ExportResult Ok(string outputPath, string message) => new(true, outputPath, message);

    public static ExportResult Fail(string message) => new(false, null, message);
}
