#include <JuceHeader.h>
#include "ChordSuggestionEngine.h"

using namespace GateKPT::Suggestions;

namespace
{
    struct ParsedChord
    {
        juce::String root;   // e.g. "C", "F#", "Bb"
        juce::String quality; // e.g. "m", "maj7", "7", "sus2", ...
    };

    bool isNoteStart (juce::juce_wchar c)
    {
        const juce::juce_wchar u = juce::CharacterFunctions::toUpperCase (c);
        return u == 'A' || u == 'B' || u == 'C' || u == 'D' || u == 'E' || u == 'F' || u == 'G';
    }

    ParsedChord parseChord (juce::String s)
    {
        ParsedChord pc;
        s = s.trim();
        if (s.isEmpty()) return pc;

        // Root: letter + optional #/b
        if (! isNoteStart (s[0])) { pc.root.clear(); pc.quality = s; return pc; }
        pc.root = s.substring (0, 1);
        if (s.length() >= 2)
        {
            const juce::juce_wchar a = s[1];
            if (a == '#' || a == 'b') pc.root = s.substring (0, 2);
        }
        pc.quality = s.substring (pc.root.length()).trim();
        return pc;
    }

    bool hasAny (const juce::String& q, std::initializer_list<const char*> toks)
    {
        for (auto* t : toks) if (q.containsIgnoreCase (t)) return true;
        return false;
    }

    // Confidence helper (0..1 clamp)
    float cv (float v) { return juce::jlimit (0.0f, 1.0f, v); }
}

juce::Array<Suggestion> ChordSuggestionEngine::improve (const juce::String& chord, const juce::String& key)
{
    juce::Array<Suggestion> out;
    const juce::String ch = chord.trim();
    if (ch.isEmpty())
        return out;

    const ParsedChord pc = parseChord (ch);
    const juce::String root = pc.root.isNotEmpty() ? pc.root : juce::String ("?");
    const juce::String q = pc.quality.toLowerCase();

    // Generic color tones that are musically safe for triads
    if (q.isEmpty() || q == "m" || q == "maj")
        out.add ({ root + (q.isEmpty() ? "" : q) + "add9 for a more open texture", cv (0.70f) });

    if (q.isEmpty() || q == "maj")
        out.add ({ root + "maj7 to add color (hold 7th lightly)", cv (0.65f) });

    if (q == "m" || q.startsWith ("m"))
        out.add ({ root + "m7 to smooth voice-leading", cv (0.62f) });

    // Dominant enrichments
    if (q == "7" || q.contains ("dom"))
    {
        out.add ({ root + "9 (dominant 9th) for extra tension", cv (0.68f) });
        out.add ({ root + "13 when the top end can breathe",     cv (0.55f) });
    }

    // Suspensions
    if (! hasAny (q, { "sus2", "sus4" }))
        out.add ({ root + "sus2 or " + root + "sus4 before resolving", cv (0.58f) });

    // Inversions (text-only; DAW-agnostic)
    out.add ({ "Try 1st inversion for smoother bass motion", cv (0.60f) });
    out.add ({ "Try 2nd inversion to stabilize cadences",    cv (0.52f) });

    // Key-aware diatonic nudge (very light heuristic)
    if (key.isNotEmpty())
    {
        const juce::String lk = key.toLowerCase();
        if (lk.contains ("minor") && (q == "" || q == "m"))
            out.add ({ "Borrow iv -> IV (raise 3rd) momentarily for lift", cv (0.48f) });
        if (lk.contains ("major") && (q == "" || q == "maj"))
            out.add ({ "Use V7/V (secondary dominant) to approach the V", cv (0.46f) });
    }

    // De-duplicate identical texts if any (cheap pass)
    juce::StringArray seen;
    juce::Array<Suggestion> unique;
    for (const auto& s : out)
    {
        if (! seen.contains (s.text))
        {
            seen.add (s.text);
            unique.add (s);
        }
    }
    return unique;
}
