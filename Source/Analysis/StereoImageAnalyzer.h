/*
  ==============================================================================

    StereoImageAnalyzer.h
    Created: 15 Aug 2025 1:34:55pm
    Author:  marcelo zapata

  ==============================================================================
*/

#pragma once
#include <JuceHeader.h>
#include "AnalysisResult.h"

namespace GateKPT::Analysis {

struct StereoImageAnalyzer {
    static StereoImageReport analyze (const juce::AudioBuffer<float>&, double sampleRate);
};

} // namespace GateKPT::Analysis
