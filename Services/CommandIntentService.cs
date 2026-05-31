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

        if (ContainsAny(normalized, "play arrangement", "start arrangement", "play all loops", "play all lanes"))
        {
            return new CommandIntent(CommandAction.PlayLooperArrangement, "Start all playable looper lanes. Muted lanes stay silent; solo lanes are respected.", text);
        }

        if (ContainsAny(normalized, "stop arrangement", "stop all loops", "stop looper", "stop all lanes"))
        {
            return new CommandIntent(CommandAction.StopLooperArrangement, "Stop looper playback safely.", text);
        }

        if (ContainsAny(normalized, "export arrangement", "export loop stack", "mix arrangement", "mixdown arrangement", "bounce arrangement", "bounce loop stack"))
        {
            return new CommandIntent(CommandAction.ExportLooperArrangement, "Export the audible looper stack into one WAV.", text);
        }

        if (ContainsAny(normalized, "delete selected", "delete autosave", "delete file", "trash selected", "trash file", "remove selected"))
        {
            return new CommandIntent(CommandAction.DeleteSelectedAutosave, "Move the selected autosave to trash instead of deleting permanently.", text);
        }

        if (ContainsAny(normalized, "load selected to lane", "use selected as lane", "assign selected to lane", "put selected on lane", "attach selected to lane"))
        {
            return new CommandIntent(CommandAction.AssignSelectedAutosaveToLooperLane, "Load the selected audio autosave into the selected looper lane.", text);
        }

        if (ContainsAny(normalized, "stop preview", "stop selected preview", "stop autosave preview", "stop file preview"))
        {
            return new CommandIntent(CommandAction.StopSelectedAutosavePreview, "Stop the selected file preview.", text);
        }

        if (ContainsAny(normalized, "prime next lane", "next lane", "next loop", "prime loop", "prime drums", "prime drum", "prime guitar", "prime piano", "prime vocal", "prime harmony"))
        {
            return new CommandIntent(CommandAction.PrimeLooperLane, "Prime the next recordable looper lane.", text);
        }

        if (ContainsAny(normalized, "overdub", "replace loop", "replace lane", "record mode"))
        {
            return new CommandIntent(CommandAction.SetLooperMode, "Set looper capture mode without recording yet.", text);
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
    PrimeLooperLane,
    PlayLooperArrangement,
    StopLooperArrangement,
    SetLooperMode,
    ExportLooperArrangement,
    DeleteSelectedAutosave,
    AssignSelectedAutosaveToLooperLane,
    StopSelectedAutosavePreview,
}

public sealed record CommandIntent(CommandAction Action, string SafetyNote, string Payload);
