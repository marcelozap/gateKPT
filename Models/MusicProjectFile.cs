using System.Collections.Generic;

namespace GateKPT.MusicOS.Models;

public sealed record MusicProjectFile(
    string ProjectId,
    string Title,
    string ArtistName,
    string Bpm,
    string Key,
    string Status,
    string PlatformProfile,
    string LoudnessTarget,
    IReadOnlyList<MusicProjectCapture> Captures,
    IReadOnlyList<MusicProjectLyric> Lyrics,
    IReadOnlyList<MusicProjectTake> Takes,
    IReadOnlyList<MusicProjectLayer> PerformanceLayers,
    IReadOnlyList<MusicProjectCaption> Captions,
    IReadOnlyList<MusicProjectVisualPreset> VisualPresets,
    IReadOnlyList<MusicProjectRoutingNote> RoutingNotes,
    IReadOnlyList<MusicProjectExportTask> ExportTasks,
    string ModifiedAt,
    IReadOnlyList<MusicProjectLooperTrack>? LooperTracks = null,
    IReadOnlyList<MusicProjectWorldMemory>? WorldMemories = null);

public sealed record MusicProjectCapture(string Title, string Detail, string Status, string Room);

public sealed record MusicProjectWorldMemory(
    string CreatedAt,
    string Type,
    string Language,
    string Phrase,
    string Meaning,
    string Place,
    string Person,
    string Food,
    string Rhythm,
    string SongIdea,
    string Notes);

public sealed record MusicProjectLyric(string Title, string Stage, string Mood, string Tags, string Text, string CreatedAt);

public sealed record MusicProjectTake(
    string Name,
    int Rating,
    string Notes,
    string ReviewedAt,
    string Decision = "Fix",
    string NextAction = "No next action written.",
    string AttachedPath = "");

public sealed record MusicProjectCaption(string Start, string End, string Text, string Status, string Note);

public sealed record MusicProjectLayer(
    int Order,
    string CreatedAt,
    string Instrument,
    string BeatTarget,
    string EffectIntent,
    string Notes,
    string Stage,
    string StemPath,
    string DurationLabel);

public sealed record MusicProjectVisualPreset(
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
    string RendererPath = "2D Avalonia preview");

public sealed record MusicProjectRoutingNote(
    string PreferredAudioInput,
    string PreferredAudioOutput,
    string PreferredMidiInput,
    string PreferredMidiOutput,
    string Notes);

public sealed record MusicProjectExportTask(
    string Id,
    string CreatedAt,
    string PresetName,
    string AudioPresetName,
    string Status,
    string OutputPath);

public sealed record MusicProjectLooperTrack(
    int Number,
    string Instrument,
    string InputNote,
    string Status,
    string StemPath,
    string DurationLabel,
    double Volume,
    bool Muted,
    bool Solo,
    string Mode,
    int TakeCount,
    string LastAction,
    string TakeArchive);
