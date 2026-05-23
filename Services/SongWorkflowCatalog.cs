using System.Collections.Generic;

namespace GateKPT.MusicOS.Services;

public static class SongWorkflowCatalog
{
    public static IReadOnlyList<SongStage> DefaultStages { get; } =
    [
        new(
            "Drums",
            "01",
            "#E37B45",
            "Build the body first: tempo, groove, loop length, kick/snare feel.",
            "RC-505 or drum module into Scarlett. Keep monitoring simple and commit a usable groove."),
        new(
            "Guitar / Piano",
            "02",
            "#EABF7A",
            "Add harmony after the drums: chords, rhythm pocket, bass movement, arrangement shape.",
            "Instrument into Scarlett. Record around the drum pocket before judging tone too hard."),
        new(
            "Vocals",
            "03",
            "#6FB6A6",
            "Lead vocal last: melody, diction, emotional take, doubles, hook clarity.",
            "Mic through Scarlett. Check meter, mouth sync, consonants, and performance before export."),
        new(
            "Review / Export",
            "04",
            "#F2EADC",
            "Choose the best take, sync video, process vocal, and render platform clips.",
            "Use take ratings, markers, vocal presets, and production brief before publishing."),
    ];
}

public sealed record SongStage(
    string Name,
    string Step,
    string Accent,
    string Goal,
    string Routing);
