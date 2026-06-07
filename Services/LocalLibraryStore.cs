using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using GateKPT.MusicOS.Models;
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

    private string ProjectFilePath => Path.Combine(LibraryDirectory, "music-project-file.json");

    public string ProjectFileLocation => ProjectFilePath;

    private string ExportHistoryPath => Path.Combine(LibraryDirectory, "export-history.json");

    private string ExportQueuePath => Path.Combine(LibraryDirectory, "export-queue.json");

    private string TimelineMarkersPath => Path.Combine(LibraryDirectory, "timeline-markers.json");

    private string TakeReviewsPath => Path.Combine(LibraryDirectory, "take-reviews.json");

    private string HardwareRoutingPath => Path.Combine(LibraryDirectory, "hardware-routing.json");

    private string SongWorkflowPath => Path.Combine(LibraryDirectory, "song-workflow.json");

    private string LyricIdeasPath => Path.Combine(LibraryDirectory, "lyric-ideas.json");

    private string VisualizerPath => Path.Combine(LibraryDirectory, "visualizer.json");

    private string CaptionsPath => Path.Combine(LibraryDirectory, "captions.json");

    private string PerformanceLayersPath => Path.Combine(LibraryDirectory, "performance-layers.json");

    private string InstrumentChannelsPath => Path.Combine(LibraryDirectory, "instrument-channels.json");

    private string LooperTracksPath => Path.Combine(LibraryDirectory, "looper-tracks.json");

    private string PinnedMemoryPath => Path.Combine(LibraryDirectory, "pinned-memory.json");

    private string CompletionHistoryPath => Path.Combine(LibraryDirectory, "completion-history.json");

    private string WorldMemoryPath => Path.Combine(LibraryDirectory, "world-memory.json");

    private string ArtistSessionsPath => Path.Combine(LibraryDirectory, "artist-sessions.json");

    private string CoverSignalsPath => Path.Combine(LibraryDirectory, "cover-signals.json");

    private string SongStudiesPath => Path.Combine(LibraryDirectory, "song-studies.json");

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

    public void SaveProjectFile(MusicProjectFile projectFile)
    {
        Directory.CreateDirectory(LibraryDirectory);
        var json = JsonSerializer.Serialize(projectFile, JsonOptions);
        File.WriteAllText(ProjectFilePath, json);
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

    public SongWorkflowSettings LoadSongWorkflow()
    {
        try
        {
            if (!File.Exists(SongWorkflowPath))
            {
                return SongWorkflowSettings.Default;
            }

            var json = File.ReadAllText(SongWorkflowPath);
            return JsonSerializer.Deserialize<SongWorkflowSettings>(json, JsonOptions) ?? SongWorkflowSettings.Default;
        }
        catch
        {
            return SongWorkflowSettings.Default;
        }
    }

    public void SaveSongWorkflow(SongWorkflowSettings settings)
    {
        Directory.CreateDirectory(LibraryDirectory);
        var json = JsonSerializer.Serialize(settings, JsonOptions);
        File.WriteAllText(SongWorkflowPath, json);
    }

    public IReadOnlyList<LyricIdeaItem> LoadLyricIdeas() => LoadList<LyricIdeaItem>(LyricIdeasPath);

    public void SaveLyricIdeas(IEnumerable<LyricIdeaItem> ideas) => SaveList(LyricIdeasPath, ideas);

    public VisualizerSettings LoadVisualizer()
    {
        try
        {
            if (!File.Exists(VisualizerPath))
            {
                return VisualizerSettings.Default;
            }

            var json = File.ReadAllText(VisualizerPath);
            return JsonSerializer.Deserialize<VisualizerSettings>(json, JsonOptions) ?? VisualizerSettings.Default;
        }
        catch
        {
            return VisualizerSettings.Default;
        }
    }

    public void SaveVisualizer(VisualizerSettings settings)
    {
        Directory.CreateDirectory(LibraryDirectory);
        var json = JsonSerializer.Serialize(settings, JsonOptions);
        File.WriteAllText(VisualizerPath, json);
    }

    public IReadOnlyList<CaptionLine> LoadCaptions() => LoadList<CaptionLine>(CaptionsPath);

    public void SaveCaptions(IEnumerable<CaptionLine> captions) => SaveList(CaptionsPath, captions);

    public IReadOnlyList<PerformanceLayerItem> LoadPerformanceLayers() => LoadList<PerformanceLayerItem>(PerformanceLayersPath);

    public void SavePerformanceLayers(IEnumerable<PerformanceLayerItem> layers) => SaveList(PerformanceLayersPath, layers);

    public IReadOnlyList<InstrumentChannelItem> LoadInstrumentChannels() => LoadList<InstrumentChannelItem>(InstrumentChannelsPath);

    public void SaveInstrumentChannels(IEnumerable<InstrumentChannelItem> channels) => SaveList(InstrumentChannelsPath, channels);

    public IReadOnlyList<LooperTrackItem> LoadLooperTracks() => LoadList<LooperTrackItem>(LooperTracksPath);

    public void SaveLooperTracks(IEnumerable<LooperTrackItem> tracks) => SaveList(LooperTracksPath, tracks);

    public PinnedProjectMemory? LoadPinnedProjectMemory()
    {
        try
        {
            if (!File.Exists(PinnedMemoryPath))
            {
                return null;
            }

            var json = File.ReadAllText(PinnedMemoryPath);
            return JsonSerializer.Deserialize<PinnedProjectMemory>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

    public void SavePinnedProjectMemory(PinnedProjectMemory item)
    {
        Directory.CreateDirectory(LibraryDirectory);
        var json = JsonSerializer.Serialize(item, JsonOptions);
        File.WriteAllText(PinnedMemoryPath, json);
    }

    public void ClearPinnedProjectMemory()
    {
        if (File.Exists(PinnedMemoryPath))
        {
            File.Delete(PinnedMemoryPath);
        }
    }

    public IReadOnlyList<ProjectCompletionRecord> LoadCompletionHistory() => LoadList<ProjectCompletionRecord>(CompletionHistoryPath);

    public void SaveCompletionHistory(IEnumerable<ProjectCompletionRecord> records) => SaveList(CompletionHistoryPath, records);

    public IReadOnlyList<WorldMemoryItem> LoadWorldMemory() => LoadList<WorldMemoryItem>(WorldMemoryPath);

    public void SaveWorldMemory(IEnumerable<WorldMemoryItem> items) => SaveList(WorldMemoryPath, items);

    public IReadOnlyList<ArtistSessionItem> LoadArtistSessions() => LoadList<ArtistSessionItem>(ArtistSessionsPath);

    public void SaveArtistSessions(IEnumerable<ArtistSessionItem> sessions) => SaveList(ArtistSessionsPath, sessions);

    public IReadOnlyList<CoverSignalItem> LoadCoverSignals() => LoadList<CoverSignalItem>(CoverSignalsPath);

    public void SaveCoverSignals(IEnumerable<CoverSignalItem> signals) => SaveList(CoverSignalsPath, signals);

    public IReadOnlyList<SongStudyItem> LoadSongStudies() => LoadList<SongStudyItem>(SongStudiesPath);

    public void SaveSongStudies(IEnumerable<SongStudyItem> studies) => SaveList(SongStudiesPath, studies);

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

public sealed record SongWorkflowSettings(
    string ActiveStageName,
    string StageNotes,
    string Tempo,
    string KeyCenter,
    string MixPrompt,
    string MixRecommendation,
    string MixChain)
{
    public static SongWorkflowSettings Default => new(
        "Drums",
        "Start with drums. Lock the groove before adding harmony or vocals.",
        "120 BPM",
        "TBD",
        "make it tighter and warmer",
        "Prioritize groove, kick/snare balance, and transient control.",
        "HPF only if rumble -> warm EQ -> light compression -> short room/plate if needed -> level match");
}

public sealed record VisualizerSettings(
    string Mode,
    string Palette,
    string Motion,
    string LyricSource,
    double Intensity,
    string Notes,
    string QualityMode,
    string OutputTarget,
    bool ProjectorBlackout,
    bool DawSafeMode,
    string RendererPath = "2D Avalonia preview")
{
    public static VisualizerSettings Default => new(
        "Lyric Pulse",
        "Amber / seafoam",
        "Breathing waveform",
        "Latest lyric",
        64,
        "Use live input energy, song stage color, and lyric fragments.",
        "Balanced",
        "Projector",
        false,
        true,
        "2D Avalonia preview");
}

public sealed record CaptionLine(string Start, string End, string Text, string Status, string Note);

public sealed record PinnedProjectMemory(
    string When,
    string Room,
    string TargetRoom,
    string Filter,
    string Title,
    string Detail,
    string Accent);

public sealed record ProjectCompletionRecord(
    string CompletedAt,
    string TargetRoom,
    string Title,
    string Detail);

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
