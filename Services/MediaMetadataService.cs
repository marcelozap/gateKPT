using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Text.Json;

namespace GateKPT.MusicOS.Services;

public sealed class MediaMetadataService
{
    public MediaMetadata Inspect(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            return MediaMetadata.Missing;
        }

        var file = new FileInfo(path);
        var fallback = new MediaMetadata(file.Name, FormatBytes(file.Length), "unknown", "-", "-", "-", "-", "File exists; FFprobe metadata unavailable.");

        try
        {
            using var process = Process.Start(new ProcessStartInfo
            {
                FileName = "ffprobe",
                Arguments = $"-v error -show_entries format=duration:stream=codec_type,codec_name,width,height,r_frame_rate -of json \"{path}\"",
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
            });

            if (process is null)
            {
                return fallback;
            }

            var json = process.StandardOutput.ReadToEnd();
            if (!process.WaitForExit(TimeSpan.FromSeconds(10)) || process.ExitCode != 0)
            {
                return fallback;
            }

            return ParseMetadata(json, fallback);
        }
        catch
        {
            return fallback;
        }
    }

    private static MediaMetadata ParseMetadata(string json, MediaMetadata fallback)
    {
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;
        var duration = "-";
        if (root.TryGetProperty("format", out var format)
            && format.TryGetProperty("duration", out var durationElement)
            && double.TryParse(durationElement.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var seconds))
        {
            duration = FormatDuration(seconds);
        }

        var videoCodec = "-";
        var audioCodec = "-";
        var dimensions = "-";
        var frameRate = "-";
        if (root.TryGetProperty("streams", out var streams))
        {
            foreach (var stream in streams.EnumerateArray())
            {
                var codecType = stream.TryGetProperty("codec_type", out var typeElement) ? typeElement.GetString() : "";
                var codecName = stream.TryGetProperty("codec_name", out var codecElement) ? codecElement.GetString() ?? "-" : "-";
                if (codecType == "video" && videoCodec == "-")
                {
                    videoCodec = codecName;
                    dimensions = ReadDimensions(stream);
                    frameRate = ReadFrameRate(stream);
                }
                else if (codecType == "audio" && audioCodec == "-")
                {
                    audioCodec = codecName;
                }
            }
        }

        return fallback with
        {
            Duration = duration,
            VideoCodec = videoCodec,
            AudioCodec = audioCodec,
            Dimensions = dimensions,
            FrameRate = frameRate,
            Summary = $"Duration {duration}, video {videoCodec}, audio {audioCodec}, frame {dimensions}."
        };
    }

    private static string ReadDimensions(JsonElement stream)
    {
        if (!stream.TryGetProperty("width", out var width) || !stream.TryGetProperty("height", out var height))
        {
            return "-";
        }

        return $"{width.GetInt32()}x{height.GetInt32()}";
    }

    private static string ReadFrameRate(JsonElement stream)
    {
        if (!stream.TryGetProperty("r_frame_rate", out var rate))
        {
            return "-";
        }

        var value = rate.GetString() ?? "-";
        var parts = value.Split('/');
        if (parts.Length == 2
            && double.TryParse(parts[0], NumberStyles.Float, CultureInfo.InvariantCulture, out var numerator)
            && double.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var denominator)
            && denominator != 0)
        {
            return $"{numerator / denominator:0.##} fps";
        }

        return value;
    }

    private static string FormatDuration(double seconds)
    {
        var span = TimeSpan.FromSeconds(seconds);
        return span.TotalHours >= 1
            ? $"{(int)span.TotalHours:0}:{span.Minutes:00}:{span.Seconds:00}"
            : $"{span.Minutes:0}:{span.Seconds:00}";
    }

    private static string FormatBytes(long bytes)
    {
        string[] units = ["B", "KB", "MB", "GB"];
        var value = (double)bytes;
        var unit = 0;
        while (value >= 1024 && unit < units.Length - 1)
        {
            value /= 1024;
            unit++;
        }

        return $"{value:0.##} {units[unit]}";
    }
}

public sealed record MediaMetadata(
    string FileName,
    string SizeLabel,
    string Duration,
    string VideoCodec,
    string AudioCodec,
    string Dimensions,
    string FrameRate,
    string Summary)
{
    public static MediaMetadata Missing => new("No file selected", "-", "-", "-", "-", "-", "-", "Choose media to inspect.");
}
