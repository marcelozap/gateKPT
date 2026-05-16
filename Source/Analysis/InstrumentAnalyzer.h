/*
  =============================================================================

    InstrumentAnalyzer.
    Created: 12 Aug 2025 3:38:16a
    Author:  marcelo zapat

  =============================================================================
*/
#pragma once
#include <JuceHeader.h>
#include "../Utils/FFTUtils.h"
#include "AnalysisResult.h"

namespace GateKPT::Analysis {

struct InstrumentAnalyzer {
    static juce::Array<InstrumentPresence> analyze (const juce::AudioBuffer<float>&, double sampleRate);
};

} // namespace GateKPT::Analysis
