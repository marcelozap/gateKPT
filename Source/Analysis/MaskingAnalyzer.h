/*
  ==============================================================================
    MaskingAnalyzer.h
  ==============================================================================
*/
#pragma once
#include <JuceHeader.h>
#include "AnalysisResult.h"

namespace GateKPT::Analysis
{
struct MaskingAnalyzer
{
    // Returns simple masking diagnostics:
    //  - vocalVsLeadMaskingDb: +dB => vocals dominate in presence band; negative => vocals may be masked
    //  - bassVsKickMaskingDb:  +dB => bass dominates low band;          negative => kick may be masked
    //  - broadbandMaskingPct:  % frames with low crest (over-dense/compressed), RMS > -24 dBFS
    static MaskingReport analyze (const juce::AudioBuffer<float>& in, double sampleRate);
};
} // namespace GateKPT::Analysis
