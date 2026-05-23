using System;
using System.Collections.Generic;
using System.Linq;

namespace GateKPT.MusicOS.Services;

public sealed class MixIntentService
{
    public MixIntentResult Interpret(string stageName, string prompt)
    {
        var text = prompt.ToLowerInvariant();
        var moves = new List<string>();

        AddStageDefaults(stageName, moves);
        AddIf(text, moves, ["more punch", "punchier", "harder", "hit harder"], "Add transient punch and gentle bus compression.");
        AddIf(text, moves, ["less harsh", "softer", "smooth", "too sharp"], "Reduce upper mids and soften bright transients.");
        AddIf(text, moves, ["warmer", "warm", "body", "fuller"], "Add low-mid body and keep top end controlled.");
        AddIf(text, moves, ["brighter", "shine", "air", "clearer"], "Add presence/air while watching harsh consonants.");
        AddIf(text, moves, ["less muddy", "muddy", "cleaner", "tight"], "Cut low-mid mud and tighten low end.");
        AddIf(text, moves, ["more intimate", "closer", "in front"], "Bring the source forward with light compression and less room.");
        AddIf(text, moves, ["space", "reverb", "bigger", "wide"], "Add short space and width without washing out the timing.");
        AddIf(text, moves, ["less reverb", "dryer", "dry"], "Pull back room/reverb and keep the source direct.");
        AddIf(text, moves, ["less", "back off", "too much"], "Use smaller moves; reduce the strongest processing by one step.");
        AddIf(text, moves, ["more", "extra", "really"], "Increase the main move slightly, but avoid clipping.");

        if (moves.Count == 0)
        {
            moves.Add("Keep the track natural. Make one small corrective EQ move and one level move.");
        }

        var chain = BuildChain(stageName, text, moves);
        return new MixIntentResult(prompt.Trim(), stageName, string.Join(" ", moves.Distinct()), chain);
    }

    private static void AddStageDefaults(string stageName, List<string> moves)
    {
        if (stageName.Contains("drum", StringComparison.OrdinalIgnoreCase))
        {
            moves.Add("Prioritize groove, kick/snare balance, and transient control.");
        }
        else if (stageName.Contains("guitar", StringComparison.OrdinalIgnoreCase)
                 || stageName.Contains("piano", StringComparison.OrdinalIgnoreCase))
        {
            moves.Add("Fit harmony around the drums; leave space for the vocal.");
        }
        else if (stageName.Contains("vocal", StringComparison.OrdinalIgnoreCase))
        {
            moves.Add("Keep the vocal emotionally forward and intelligible.");
        }
    }

    private static void AddIf(string text, List<string> moves, string[] words, string move)
    {
        if (words.Any(word => text.Contains(word, StringComparison.OrdinalIgnoreCase)))
        {
            moves.Add(move);
        }
    }

    private static string BuildChain(string stageName, string text, IReadOnlyList<string> moves)
    {
        var highPass = stageName.Contains("vocal", StringComparison.OrdinalIgnoreCase) ? "HPF 80-100 Hz" : "HPF only if rumble";
        var compression = text.Contains("punch", StringComparison.OrdinalIgnoreCase) ? "medium compression" : "light compression";
        var tone = text.Contains("warm", StringComparison.OrdinalIgnoreCase)
            ? "warm EQ"
            : text.Contains("bright", StringComparison.OrdinalIgnoreCase) || text.Contains("air", StringComparison.OrdinalIgnoreCase)
                ? "presence/air EQ"
                : "corrective EQ";
        var space = text.Contains("dry", StringComparison.OrdinalIgnoreCase) ? "minimal space" : "short room/plate if needed";
        return $"{highPass} -> {tone} -> {compression} -> {space} -> level match";
    }
}

public sealed record MixIntentResult(string Prompt, string StageName, string Recommendation, string Chain);
