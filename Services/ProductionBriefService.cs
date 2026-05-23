using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using GateKPT.MusicOS.ViewModels;

namespace GateKPT.MusicOS.Services;

public sealed class ProductionBriefService
{
    public string WriteBrief(
        string libraryDirectory,
        ProjectSettings project,
        SongWorkflowSettings workflow,
        IEnumerable<CaptureItem> captures,
        IEnumerable<TimelineMarker> markers,
        IEnumerable<TakeReviewItem> takes,
        IEnumerable<LyricIdeaItem> lyrics,
        IEnumerable<ExportQueueItem> queue,
        IEnumerable<ExportHistoryItem> history)
    {
        Directory.CreateDirectory(libraryDirectory);
        var path = Path.Combine(libraryDirectory, $"production-brief-{DateTime.Now:yyyyMMdd-HHmmss}.md");
        var brief = new StringBuilder();
        brief.AppendLine($"# {project.ProjectName}");
        brief.AppendLine();
        brief.AppendLine($"Generated: {DateTime.Now:yyyy-MM-dd h:mm tt}");
        brief.AppendLine($"Platform: {project.PlatformProfile}");
        brief.AppendLine($"Loudness: {project.LoudnessTarget}");
        brief.AppendLine($"Current offset: {project.SyncOffsetMs:+#;-#;0} ms");
        brief.AppendLine($"Business mode: {project.BusinessMode}");
        brief.AppendLine($"Song stage: {workflow.ActiveStageName}");
        brief.AppendLine($"Tempo: {workflow.Tempo}");
        brief.AppendLine($"Key center: {workflow.KeyCenter}");
        brief.AppendLine($"Stage notes: {workflow.StageNotes}");
        brief.AppendLine($"Mix intent: {workflow.MixPrompt}");
        brief.AppendLine($"Mix recommendation: {workflow.MixRecommendation}");
        brief.AppendLine($"Mix chain: {workflow.MixChain}");
        brief.AppendLine();
        AppendSection(brief, "Timeline Markers", markers, item => $"- `{item.Timecode}` {item.Label} [{item.Room}] {item.Notes}");
        AppendSection(brief, "Lyric Ideas", lyrics, item => $"- {item.Title} [{item.Stage} / {item.Mood}] {item.Tags}: {item.Preview}");
        AppendSection(brief, "Take Reviews", takes, item => $"- {item.Rating}/5 {item.Name}: {item.Notes}");
        AppendSection(brief, "Export Queue", queue, item => $"- {item.Status}: {item.PresetName} + {item.AudioPresetName} at {item.OffsetMs:+#;-#;0} ms");
        AppendSection(brief, "Export History", history, item => $"- {item.RenderedAt}: {item.PresetName} / {item.AudioPresetName} / {item.OffsetLabel}");
        AppendSection(brief, "Session Notes", captures, item => $"- {item.Status}: {item.Title} - {item.Detail}");
        File.WriteAllText(path, brief.ToString());
        return path;
    }

    private static void AppendSection<T>(StringBuilder brief, string title, IEnumerable<T> items, Func<T, string> format)
    {
        brief.AppendLine($"## {title}");
        var wroteAny = false;
        foreach (var item in items)
        {
            brief.AppendLine(format(item));
            wroteAny = true;
        }

        if (!wroteAny)
        {
            brief.AppendLine("- None yet.");
        }

        brief.AppendLine();
    }
}
