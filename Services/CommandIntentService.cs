using System;

namespace GateKPT.MusicOS.Services;

public sealed class CommandIntentService
{
    public CommandIntent Parse(string input)
    {
        var text = input.Trim();
        var normalized = text.ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(text))
        {
            return new CommandIntent(CommandAction.Unknown, "Type a command first.", "");
        }

        if (ContainsAny(normalized, "caption", "subtitles", "words on video"))
        {
            return new CommandIntent(CommandAction.DraftCaptions, "Draft captions in safe mode. Review-needed lines will not be treated as ready.", text);
        }

        if (ContainsAny(normalized, "sync", "line up", "match audio", "match vocal"))
        {
            return new CommandIntent(CommandAction.SyncMedia, "Run media sync analysis and suggest vocal offset.", text);
        }

        if (ContainsAny(normalized, "drum", "guitar", "piano", "vocal", "effects", "filter", "warmer", "harsh", "layers", "layer"))
        {
            return new CommandIntent(CommandAction.ApplyMixIntent, "Apply words as a stage-aware mix intent.", text);
        }

        if (ContainsAny(normalized, "visual", "visualizer", "pulse", "camera overlay", "stage aura"))
        {
            return new CommandIntent(CommandAction.SaveVisualizer, "Save visualizer direction to the project.", text);
        }

        if (ContainsAny(normalized, "lyric", "hook", "song idea", "line idea"))
        {
            return new CommandIntent(CommandAction.SaveLyric, "Save the text as a lyric idea.", text);
        }

        if (ContainsAny(normalized, "export", "render", "reels", "tiktok", "youtube", "linkedin"))
        {
            return new CommandIntent(CommandAction.QueueExport, "Queue export instead of rendering immediately.", text);
        }

        return new CommandIntent(CommandAction.CaptureNote, "Saved as a session note because no safe command matched.", text);
    }

    private static bool ContainsAny(string text, params string[] words)
    {
        foreach (var word in words)
        {
            if (text.Contains(word, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}

public enum CommandAction
{
    Unknown,
    DraftCaptions,
    SyncMedia,
    ApplyMixIntent,
    SaveVisualizer,
    SaveLyric,
    QueueExport,
    CaptureNote,
}

public sealed record CommandIntent(CommandAction Action, string SafetyNote, string Payload);
