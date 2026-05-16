/*
  ==============================================================================
    ReferenceMatcher.h
  ==============================================================================
*/
#pragma once
#include <JuceHeader.h>
#include "AnalysisResult.h"

namespace GateKPT::Analysis
{
// Result of comparing one analysis against a reference track
struct ReferenceMatch
{
    float loudnessDeltaDb  = 0.0f; // a.loudness.lufsI - b.loudness.lufsI
    float tonalDelta       = 0.0f; // 0..1 based on spectral centroid gap
    float widthDeltaPct    = 0.0f; // a.stereo.widthPct - b.stereo.widthPct
    float tempoDeltaPct    = 0.0f; // % difference vs reference tempo
};

struct ReferenceMatcher
{
    static ReferenceMatch compare (const AnalysisResult& a, const AnalysisResult& b);
};
} // namespace GateKPT::Analysis
