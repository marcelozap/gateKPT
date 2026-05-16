/*
  ==============================================================================

    DynamicsAnalyzer.h
    Created: 15 Aug 2025 1:34:08pm
    Author:  marcelo zapata

  ==============================================================================
*/

#pragma once
#include <JuceHeader.h>
#include "../Utils/Stats.h"
#include "AnalysisResult.h"

namespace GateKPT::Analysis {

struct DynamicsAnalyzer {
    static DynamicsReport analyze (const juce::AudioBuffer<float>&, double sampleRate);
};

} // namespace GateKPT::Analysis
