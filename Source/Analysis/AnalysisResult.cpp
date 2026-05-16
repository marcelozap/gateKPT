/*
  ==============================================================================
    AnalysisResult.cpp
    Utility helpers for printing & sanity-clamping analysis data.
  ==============================================================================
*/
#include "AnalysisResult.h"
#include <JuceHeader.h>

namespace GateKPT::Analysis
{
juce::String toDebugString (const AnalysisResult& r)
{
    juce::String s;
    s << "Loudness(I/S/M/LRA/TP): "
      << juce::String (r.loudness.lufsI, 1) << " / "
      << juce::String (r.loudness.lufsS, 1) << " / "
      << juce::String (r.loudness.lufsM, 1) << " / "
      << juce::String (r.loudness.lra,   1) << " / "
      << juce::String (r.loudness.truePeakDb, 1) << "\n";

    s << "Dynamics(peak/rms/crest/gride): "
      << juce::String (r.dynamics.peakDbfs, 1) << " / "
      << juce::String (r.dynamics.rmsDbfs,  1) << " / "
      << juce::String (r.dynamics.crestDb,  1) << " / "
      << juce::String (r.dynamics.gainRideSuggestionDb, 1) << "\n";

    s << "Spectral(centroid/rolloff Hz | sub/bass/LM/HM/treble %): "
      << juce::String (r.spectral.centroidHz, 0) << " / "
      << juce::String (r.spectral.rolloffHz,  0) << " | "
      << juce::String (r.spectral.bandSub,     0) << "/"
      << juce::String (r.spectral.bandBass,    0) << "/"
      << juce::String (r.spectral.bandLowMid,  0) << "/"
      << juce::String (r.spectral.bandHighMid, 0) << "/"
      << juce::String (r.spectral.bandTreble,  0) << "\n";

    s << "Stereo(width%/corr/ΔLRdB/monoRisk): "
      << juce::String (r.stereo.widthPct, 0) << " / "
      << juce::String (r.stereo.corr, 2)      << " / "
      << juce::String (r.stereo.lrImbalanceDb, 1) << " / "
      << (r.stereo.monoRisk ? "yes" : "no") << "\n";

    s << "BeatKey(tempo/key/conf): "
      << juce::String (r.beatKey.tempoBpm) << " / "
      << r.beatKey.key << " / "
      << juce::String (r.beatKey.keyConf, 2) << "\n";

    if (! r.chords.isEmpty())
    {
        s << "Chords:";
        for (int i = 0; i < juce::jmin (r.chords.size(), 6); ++i)
            s << (i ? " | " : " ") << r.chords.getReference (i).chord;
        s << "\n";
    }

    if (! r.instruments.isEmpty())
    {
        s << "Instruments:";
        for (int i = 0; i < juce::jmin (r.instruments.size(), 6); ++i)
        {
            const auto& ins = r.instruments.getReference (i);
            s << (i ? ", " : " ") << ins.name << "(" << juce::String (ins.confidence, 2) << ")";
        }
        s << "\n";
    }

    s << "Vox(genderish/conf): "
      << r.voice.genderLikelihood << " / "
      << juce::String (r.voice.confidence, 2) << "\n";

    s << "Sib/Plosive(sib, plosive, de-ess dB): "
      << juce::String (r.sibilancePlosive.sibilanceProb, 2) << ", "
      << juce::String (r.sibilancePlosive.plosiveProb,   2) << ", "
      << juce::String (r.sibilancePlosive.suggestedDeEssDb, 1) << "\n";

    s << "Reverb(dryness/wetness/RT60/roomy): "
      << juce::String (r.reverb.dryness, 2) << " / "
      << juce::String (r.reverb.wetness, 2) << " / "
      << juce::String (r.reverb.rt60Est, 2) << " / "
      << (r.reverb.roomy ? "yes" : "no") << "\n";

    s << "Tuning(cents med/spread/vibrato/A440): "
      << juce::String (r.tuning.centsMedian, 1) << " / "
      << juce::String (r.tuning.centsSpread, 1) << " / "
      << juce::String (r.tuning.vibratoRateHz, 2) << " / "
      << (r.tuning.tunedToA440 ? "true" : "false") << "\n";

    s << "Masking(vocalVsLead/bassVsKick/broadband%): "
      << juce::String (r.masking.vocalVsLeadMaskingDb, 1) << " / "
      << juce::String (r.masking.bassVsKickMaskingDb,  1) << " / "
      << juce::String (r.masking.broadbandMaskingPct,  0) << "\n";

    return s.trimEnd();
}

void clampInPlace (AnalysisResult& r)
{
    auto clampf = [] (float v, float lo, float hi) { return juce::jlimit (lo, hi, v); };

    r.stereo.widthPct      = clampf (r.stereo.widthPct,      0.f, 100.f);
    r.stereo.corr          = clampf (r.stereo.corr,         -1.f,   1.f);
    r.spectral.bandSub     = clampf (r.spectral.bandSub,     0.f, 100.f);
    r.spectral.bandBass    = clampf (r.spectral.bandBass,    0.f, 100.f);
    r.spectral.bandLowMid  = clampf (r.spectral.bandLowMid,  0.f, 100.f);
    r.spectral.bandHighMid = clampf (r.spectral.bandHighMid, 0.f, 100.f);
    r.spectral.bandTreble  = clampf (r.spectral.bandTreble,  0.f, 100.f);

    r.sibilancePlosive.sibilanceProb = clampf (r.sibilancePlosive.sibilanceProb, 0.f, 1.f);
    r.sibilancePlosive.plosiveProb   = clampf (r.sibilancePlosive.plosiveProb,   0.f, 1.f);

    r.beatKey.keyConf = clampf (r.beatKey.keyConf, 0.f, 1.f);

    r.reverb.dryness = clampf (r.reverb.dryness, 0.f, 1.f);
    r.reverb.wetness = clampf (r.reverb.wetness, 0.f, 1.f);

    r.masking.broadbandMaskingPct = clampf (r.masking.broadbandMaskingPct, 0.f, 100.f);
}
} // namespace GateKPT::Analysis
