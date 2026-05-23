using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using GateKPT.MusicOS.ViewModels;

namespace GateKPT.MusicOS.Services;

public sealed class LocalLibraryStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
    };

    public string LibraryDirectory { get; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "GateKPT",
        "MusicOS");

    private string CapturesPath => Path.Combine(LibraryDirectory, "captures.json");

    private string ProjectPath => Path.Combine(LibraryDirectory, "project.json");

    private string ExportHistoryPath => Path.Combine(LibraryDirectory, "export-history.json");

    private string ExportQueuePath => Path.Combine(LibraryDirectory, "export-queue.json");

    private string TimelineMarkersPath => Path.Combine(LibraryDirectory, "timeline-markers.json");

    private string TakeReviewsPath => Path.Combine(LibraryDirectory, "take-reviews.json");

    private string HardwareRoutingPath => Path.Combine(LibraryDirectory, "hardware-routing.json");

    public IReadOnlyList<CaptureItem> LoadCaptures()
    {
        try
        {
            if (!File.Exists(CapturesPath))
            {
                return [];
            }

            var json = File.ReadAllText(CapturesPath);
            return JsonSerializer.Deserialize<List<CaptureItem>>(json, JsonOptions) ?? [];
        }
        catch
        {
            return [];
        }
    }

    public void SaveCaptures(IEnumerable<CaptureItem> captures)
    {
        Directory.CreateDirectory(LibraryDirectory);
        var json = JsonSerializer.Serialize(captures, JsonOptions);
        File.WriteAllText(CapturesPath, json);
    }

    public ProjectSettings LoadProject()
    {
        try
        {
            if (!File.Exists(ProjectPath))
            {
                return ProjectSettings.Default;
            }

            var json = File.ReadAllText(ProjectPath);
            return JsonSerializer.Deserialize<ProjectSettings>(json, JsonOptions) ?? ProjectSettings.Default;
        }
        catch
        {
            return ProjectSettings.Default;
        }
    }

    public void SaveProject(ProjectSettings project)
    {
        Directory.CreateDirectory(LibraryDirectory);
        var json = JsonSerializer.Serialize(project, JsonOptions);
        File.WriteAllText(ProjectPath, json);
    }

    public IReadOnlyList<ExportHistoryItem> LoadExportHistory() => LoadList<ExportHistoryItem>(ExportHistoryPath);

    public void SaveExportHistory(IEnumerable<ExportHistoryItem> items) => SaveList(ExportHistoryPath, items);

    public IReadOnlyList<ExportQueueItem> LoadExportQueue() => LoadList<ExportQueueItem>(ExportQueuePath);

    public void SaveExportQueue(IEnumerable<ExportQueueItem> items) => SaveList(ExportQueuePath, items);

    public IReadOnlyList<TimelineMarker> LoadTimelineMarkers() => LoadList<TimelineMarker>(TimelineMarkersPath);

    public void SaveTimelineMarkers(IEnumerable<TimelineMarker> markers) => SaveList(TimelineMarkersPath, markers);

    public IReadOnlyList<TakeReviewItem> LoadTakeReviews() => LoadList<TakeReviewItem>(TakeReviewsPath);

    public void SaveTakeReviews(IEnumerable<TakeReviewItem> reviews) => SaveList(TakeReviewsPath, reviews);

    public HardwareRoutingSettings LoadHardwareRouting()
    {
        try
        {
            if (!File.Exists(HardwareRoutingPath))
            {
                return HardwareRoutingSettings.Default;
            }

            var json = File.ReadAllText(HardwareRoutingPath);
            return JsonSerializer.Deserialize<HardwareRoutingSettings>(json, JsonOptions) ?? HardwareRoutingSettings.Default;
        }
        catch
        {
            return HardwareRoutingSettings.Default;
        }
    }

    public void SaveHardwareRouting(HardwareRoutingSettings settings)
    {
        Directory.CreateDirectory(LibraryDirectory);
        var json = JsonSerializer.Serialize(settings, JsonOptions);
        File.WriteAllText(HardwareRoutingPath, json);
    }

    private static IReadOnlyList<T> LoadList<T>(string path)
    {
        try
        {
            if (!File.Exists(path))
            {
                return [];
            }

            var json = File.ReadAllText(path);
            return JsonSerializer.Deserialize<List<T>>(json, JsonOptions) ?? [];
        }
        catch
        {
            return [];
        }
    }

    private void SaveList<T>(string path, IEnumerable<T> items)
    {
        Directory.CreateDirectory(LibraryDirectory);
        var json = JsonSerializer.Serialize(items, JsonOptions);
        File.WriteAllText(path, json);
    }
}

public sealed record HardwareRoutingSettings(
    string PreferredAudioInput,
    string PreferredAudioOutput,
    string PreferredMidiInput,
    string PreferredMidiOutput,
    string RoutingNotes)
{
    public static HardwareRoutingSettings Default => new(
        "Focusrite / Scarlett input",
        "Focusrite / Scarlett output",
        "RC-505 MIDI input",
        "RC-505 MIDI output",
        "Goal: mic/instruments through Focusrite, loops and transport via RC-505.");
}

public sealed record ProjectSettings(
    string ProjectName,
    string PlatformProfile,
    int SyncOffsetMs,
    double FrameRate,
    string LoudnessTarget,
    string BusinessMode,
    string OutputDirectory)
{
    public static ProjectSettings Default => new(
        "GateKPT clip system",
        "LinkedIn / 16:9",
        42,
        29.97,
        "-14 LUFS",
        "Build video catalog",
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyVideos),
            "GateKPT Exports"));
}
