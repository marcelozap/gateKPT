using System;
using System.Linq;

namespace GateKPT.MusicOS.Services;

public sealed class GateKptBrainService
{
    public string Answer(GateKptBrainContext context, string input)
    {
        var text = (input ?? "").Trim();
        var lower = text.ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(text))
        {
            return "";
        }

        if (ContainsAny(lower, "p/l", "pl ", "profit", "loss", "trading", "budget", "schwab", "spy"))
        {
            return "Green Machine owns trading P/L. GateKPT Music OS does not read broker or budget data here. Creative status: "
                   + BuildSessionStatus(context);
        }

        if (ContainsAny(lower, "what now", "next", "what should i do", "where do i go", "plan"))
        {
            return NextMove(context);
        }

        if (ContainsAny(lower, "status", "how is", "what happened", "what do i have", "session", "takes"))
        {
            return BuildSessionStatus(context);
        }

        if (ContainsAny(lower, "mix", "combine", "bounce"))
        {
            return context.TakeCount <= 1
                ? "Record at least two takes in this session, then press Mix. GateKPT will make one auto-leveled WAV."
                : $"You have {context.TakeCount} takes in {context.SessionName}. Press Mix to combine them into one auto-leveled WAV.";
        }

        if (ContainsAny(lower, "content", "post", "youtube", "short", "tiktok", "instagram", "reel", "snap"))
        {
            return context.HasTake
                ? "Use one strong take. Keep the clip simple: face/instrument + OS moving + one hook line. Generate the content pack after the audio feels good."
                : "Record one honest take first. Content comes after the sound exists.";
        }

        if (ContainsAny(lower, "why", "confused", "not working", "help me"))
        {
            return "GateKPT should stay simple: Record a take, Play it, Mix the session if there are multiple takes, then shape/export only if the sound is worth keeping.";
        }

        return "I’m here. For audio changes say: warmer, louder, room, chrome, clean, delete, or mix. For thinking, ask: what now, status, content plan, or P/L.";
    }

    private static string NextMove(GateKptBrainContext context)
    {
        if (!context.HasTake)
        {
            return "Record one short guitar or vocal pass. Do not polish yet.";
        }

        if (context.TakeCount == 1 && !context.HasMix)
        {
            return "Play the take. If it feels alive, record one more layer or make a clean/chrome version.";
        }

        if (context.TakeCount > 1 && !context.HasMix)
        {
            return $"You have {context.TakeCount} takes. Press Mix and make one session WAV.";
        }

        return "Use the mix as the center. Next: make one visual/post pack, then save one taste note about what worked.";
    }

    private static string BuildSessionStatus(GateKptBrainContext context)
    {
        var takeText = context.TakeCount == 1 ? "1 take" : $"{context.TakeCount} takes";
        var selected = string.IsNullOrWhiteSpace(context.SelectedTakeName) ? "none selected" : context.SelectedTakeName;
        var mix = context.HasMix ? "mix exists" : "no mix yet";
        return $"{context.SessionName}: {takeText}, {mix}, selected: {selected}.";
    }

    private static bool ContainsAny(string text, params string[] terms)
        => terms.Any(term => text.Contains(term, StringComparison.OrdinalIgnoreCase));
}

public sealed record GateKptBrainContext(
    string SessionName,
    int TakeCount,
    bool HasTake,
    bool HasMix,
    string SelectedTakeName,
    string LastMixName);
