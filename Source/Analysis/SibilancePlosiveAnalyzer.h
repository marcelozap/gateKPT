/*
  ==============================================================================

    SibilancePlosiveAnalyzer.h
    Created: 15 Aug 2025 1:36:03pm
    Author:  marcelo zapata

  ==============================================================================
*/

#pragma once
#include <JuceHeader.h>
#include "../Utils/FFTUtils.h"
#include "AnalysisResult.h"

namespace GateKPT::Analysis {

struct SibilancePlosiveAnalyzer {
    static SibilancePlosiveReport analyze (const juce::AudioBuffer<float>&, double sampleRate);
};

} // namespace GateKPT::Analysis
