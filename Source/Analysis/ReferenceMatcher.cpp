/*
  ==============================================================================
    ReferenceMatcher.cpp
  ==============================================================================
*/
#include <JuceHeader.h>
#include "ReferenceMatcher.h"

using namespace GateKPT::Analysis;

namespace { inline float clamp01 (float x) { return juce::jlimit (0.0f, 1.0f, x); } }

ReferenceMatch ReferenceMatcher::compare (const AnalysisResult& a, const AnalysisResult& b)
{
    ReferenceMatch m{};

    // Loudness delta (dB)
    m.loudnessDeltaDb = (float) (a.loudness.lufsI - b.loudness.lufsI);

    // Tonal delta from spectral centroid (normalise by a coarse limit)
    const double maxC = 8000.0;
    m.tonalDelta = clamp01 ((float) (std::abs (a.spectral.centroidHz - b.spectral.centroidHz) / maxC));

    // Stereo width delta (%)
    m.widthDeltaPct = (float) (a.stereo.widthPct - b.stereo.widthPct);

    // Tempo delta (% vs reference)
    if (a.beatKey.tempoBpm > 0 && b.beatKey.tempoBpm > 0)
        m.tempoDeltaPct = (float) (100.0 * (double) (a.beatKey.tempoBpm - b.beatKey.tempoBpm)
                                            / (double) b.beatKey.tempoBpm);
    else
        m.tempoDeltaPct = 0.0f;

    return m;
}
