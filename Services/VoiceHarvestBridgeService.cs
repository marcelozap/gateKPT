using System;
using System.Diagnostics;
using System.IO;
using System.Text.Json;

namespace GateKPT.MusicOS.Services;

public sealed class VoiceHarvestBridgeService
{
    private readonly string _greenMachineRoot;

    public VoiceHarvestBridgeService(string? greenMachineRoot = null)
    {
        _greenMachineRoot = greenMachineRoot
            ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Green-Machine");
    }

    public string InboxDirectory => Path.Combine(_greenMachineRoot, "data", "xiv", "voice", "inbox");

    public string ProcessedDirectory => Path.Combine(_greenMachineRoot, "data", "xiv", "voice", "processed");

    public string ClipsDirectory => Path.Combine(_greenMachineRoot, "data", "xiv", "voice", "clips");

    public VoiceHarvestResult Harvest()
    {
        EnsureVoiceFolders();
        var script = Path.Combine(_greenMachineRoot, "tools", "xiv_audio_harvest.py");
        if (!File.Exists(script))
        {
            return VoiceHarvestResult.Fail($"Voice harvester not found: {script}");
        }

        var python = ResolvePython();
        if (string.IsNullOrWhiteSpace(python))
        {
            return VoiceHarvestResult.Fail("Python not found. GateKPT could not run the Voice harvester.");
        }

        var result = RunPython(python, $"\"{script}\" --clips");
        if (!result.Success)
        {
            return result;
        }

        return ParseResult(result.RawJson);
    }

    public void OpenClipsFolder()
    {
        OpenFolder(ClipsDirectory);
    }

    public void OpenInboxFolder()
    {
        OpenFolder(InboxDirectory);
    }

    public void OpenProcessedFolder()
    {
        OpenFolder(ProcessedDirectory);
    }

    public void EnsureVoiceFolders()
    {
        Directory.CreateDirectory(InboxDirectory);
        Directory.CreateDirectory(ProcessedDirectory);
        Directory.CreateDirectory(ClipsDirectory);
    }

    private static void OpenFolder(string path)
    {
        Directory.CreateDirectory(path);
        Process.Start(new ProcessStartInfo
        {
            FileName = path,
            UseShellExecute = true
        });
    }

    private string ResolvePython()
    {
        var venvPython = Path.Combine(_greenMachineRoot, "engine", ".venv", "Scripts", "python.exe");
        if (File.Exists(venvPython))
        {
            return venvPython;
        }

        return "python";
    }

    private VoiceHarvestResult RunPython(string python, string arguments)
    {
        try
        {
            using var process = Process.Start(new ProcessStartInfo
            {
                FileName = python,
                Arguments = arguments,
                WorkingDirectory = _greenMachineRoot,
                CreateNoWindow = true,
                RedirectStandardError = true,
                RedirectStandardOutput = true,
                UseShellExecute = false
            });

            if (process is null)
            {
                return VoiceHarvestResult.Fail("Could not start the Voice harvester.");
            }

            var stdout = process.StandardOutput.ReadToEnd();
            var stderr = process.StandardError.ReadToEnd();
            process.WaitForExit();

            if (process.ExitCode != 0)
            {
                return VoiceHarvestResult.Fail(LastLine(stderr));
            }

            return VoiceHarvestResult.Ok(stdout, 0, 0, 0, "Voice harvest finished.");
        }
        catch (Exception ex)
        {
            return VoiceHarvestResult.Fail($"Voice harvest failed: {ex.Message}");
        }
    }

    private static VoiceHarvestResult ParseResult(string rawJson)
    {
        try
        {
            using var document = JsonDocument.Parse(rawJson);
            var root = document.RootElement;
            var recordings = root.TryGetProperty("recording_count", out var count)
                ? count.GetInt32()
                : 0;
            var seconds = root.TryGetProperty("total_duration_seconds", out var duration)
                ? duration.GetDouble()
                : 0;
            var clips = 0;
            if (root.TryGetProperty("clip_candidates", out var clipCandidates)
                && clipCandidates.TryGetProperty("clip_count", out var clipCount))
            {
                clips = clipCount.GetInt32();
            }

            var message = (recordings, clips) switch
            {
                (0, _) => "No long recordings found. Drop OBS/Elgato files into the Voice inbox, then Harvest.",
                (_, > 0) => $"Harvested {recordings} recording(s), {FormatDuration(seconds)}, {clips} clip(s).",
                _ => $"Harvested {recordings} recording(s), {FormatDuration(seconds)}, no clip candidates yet."
            };

            return VoiceHarvestResult.Ok(rawJson, recordings, seconds, clips, message);
        }
        catch (Exception ex)
        {
            return VoiceHarvestResult.Fail($"Voice harvester returned unreadable JSON: {ex.Message}");
        }
    }

    private static string FormatDuration(double seconds)
    {
        var span = TimeSpan.FromSeconds(Math.Max(0, seconds));
        return span.TotalHours >= 1
            ? $"{(int)span.TotalHours}h {span.Minutes}m"
            : $"{span.Minutes}m {span.Seconds}s";
    }

    private static string LastLine(string text)
    {
        var lines = text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        return lines.Length == 0 ? "Voice harvest failed." : lines[^1];
    }
}

public sealed record VoiceHarvestResult(
    bool Success,
    string RawJson,
    int RecordingCount,
    double TotalDurationSeconds,
    int ClipCount,
    string Message)
{
    public static VoiceHarvestResult Ok(string rawJson, int recordingCount, double totalDurationSeconds, int clipCount, string message) =>
        new(true, rawJson, recordingCount, totalDurationSeconds, clipCount, message);

    public static VoiceHarvestResult Fail(string message) =>
        new(false, "", 0, 0, 0, message);
}
