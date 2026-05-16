#include "ArrangementSuggestionEngine.h"
#include <JuceHeader.h>

using namespace GateKPT;
using namespace GateKPT::Analysis;
using namespace GateKPT::Suggestions;

namespace {
    template <typename T>
    static T clamp01 (T v) { return juce::jlimit<T>((T)0, (T)1, v); }

    static float rampConf (float value, float target, float width)
    {
        const float d = std::abs (value - target);
        return clamp01 (1.0f - d / juce::jmax (0.001f, width));
    }
}

juce::Array<Suggestion> ArrangementSuggestionEngine::analyze (const AnalysisResult& r)
{
    juce::Array<Suggestion> out;

    // --- 1) Low-end support: sub+bass share below threshold
    {
        const float lowPct = r.spectral.bandSub + r.spectral.bandBass; // %
        if (lowPct < 28.0f)
        {
            const float conf = clamp01 ((28.0f - lowPct) / 28.0f);
            out.add ({ "Layer a dedicated bass line (sine or clean sub) to reinforce low-end (current low energy ≈ "
                       + juce::String (lowPct, 0) + "%).", conf });
        }
    }

    // --- 2) High-end control (proxy): use treble % and centroid
    {
        const float bright = clamp01 (r.spectral.bandTreble / 100.0f);                 // proxy for brightness
        const float harsh  = clamp01 ((float) (r.spectral.centroidHz / 8000.0));       // crude proxy (0..~1)
        if (bright > 0.70f || harsh > 0.60f)
        {
            const float conf = clamp01 (juce::jmax (bright - 0.70f, 0.0f) * 0.7f
                                      + juce::jmax (harsh  - 0.60f, 0.0f) * 0.8f);
            out.add ({ "Tame top-end with softer layers (e.g., closed hats/brushes) and leave space for air; current "
                       "top-end proxy brightness=" + juce::String (bright, 2) + ", centroidNorm=" + juce::String (harsh, 2) + ".", conf });
        }
    }

    // --- 3) Stereo image: narrow/mono risk
    {
        const float width = r.stereo.widthPct;   // 0..100
        const float corr  = r.stereo.corr;       // -1..+1
        if (width < 22.0f && corr > 0.7f)
        {
            const float conf = clamp01 ((22.0f - width) / 22.0f * 0.6f + (corr - 0.7f) / 0.3f * 0.4f);
            out.add ({ "Create width with arrangement (double a hook and pan L/R, add stereo pads or room mics). "
                       "Current width≈" + juce::String (width, 0) + "%, correlation=" + juce::String (corr, 2) + ".", conf });
        }
    }

    // --- 4) Transient presence vs. over-compression (crest)
    {
        const float crest = r.dynamics.crestDb; // peak - rms
        if (crest < 6.0f)
        {
            const float conf = clamp01 ((6.0f - crest) / 6.0f);
            out.add ({ "Percussive layering can restore impact (e.g., add short transients or double main hits with "
                       "low-velocity ghosts). Crest=" + juce::String (crest, 1) + " dB.", conf });
        }
    }

    // --- 5) Tempo-aware texture
    {
        const int bpm = r.beatKey.tempoBpm;
        if (bpm > 0)
        {
            if      (bpm <= 82) { out.add ({ "Slow tempo: add sparse textures (pads, dotted delays) to fill space without crowding.", 0.55f }); }
            else if (bpm <= 105){ out.add ({ "Mid tempo: reinforce backbeat layers (claps/rims at 2 & 4) for pocket.", 0.55f }); }
            else if (bpm <= 128){ out.add ({ "Up tempo: complement groove with off-beat hats and 8th-note pulses.", 0.55f }); }
            else                 { out.add ({ "Very fast: thin sustained layers; emphasize short articulations to avoid smear.", 0.55f }); }
        }
    }

    // --- 6) Reverb wetness sanity (uses ReverbReport.wetness)
    {
        const float wet = clamp01 (r.reverb.wetness);
        if (wet > 0.65f)
        {
            const float conf = clamp01 ((wet - 0.65f) / 0.35f);
            out.add ({ "Arrangement space: keep leads drier and push ambience to supporting parts; current wetness="
                       + juce::String (wet, 2) + ".", conf });
        }
    }

    // --- 7) Vocal intelligibility vs sibilance (arrangement perspective)
    {
        const float sib = clamp01 (r.sibilancePlosive.sibilanceProb);
        const bool  voxPresent = ! r.voice.activeRanges.isEmpty();
        if (sib > 0.55f && voxPresent)
        {
            const float conf = clamp01 ((sib - 0.55f) / 0.45f);
            out.add ({ "Free the 5–10 kHz band for vocals by moving bright counter-lines down an octave or swapping "
                       "timbres (softer cymbals/keys). Sibilance≈" + juce::String (sib, 2) + ".", conf });
        }
    }

    // --- 8) Tonal balance anchor (centroid)
    {
        const float centroid = (float) r.spectral.centroidHz;
        if (centroid > 0.0f)
        {
            const float conf = rampConf (centroid, 2500.0f, 1800.0f);
            if (conf < 0.35f)
            {
                if (centroid < 1700.0f)
                    out.add ({ "Track feels bottom-weighted: add mid-range melodies/comping to carry focus.", 0.55f });
                else if (centroid > 3500.0f)
                    out.add ({ "Track leans top-weighted: add mid-low body (warm pads/guitars) to anchor.", 0.55f });
            }
        }
    }

    // --- 9) Loudness target hint (arrangement lever, not limiting)
    {
        const float lufs = r.loudness.lufsI;
        if (lufs != 0.0f && lufs < -17.0f)
        {
            const float conf = clamp01 ((-17.0f - lufs) / 8.0f);
            out.add ({ "Increase perceived loudness via arrangement: add sustained beds or rhythmic doubles rather "
                       "than only pushing a limiter (current ≈ " + juce::String (lufs, 1) + " LUFS).", conf });
        }
    }

    return out;
}
