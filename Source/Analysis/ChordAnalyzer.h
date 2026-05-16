/*
  ==============================================================================

    ChordAnalyzer.h
    Created: 12 Aug 2025 3:24:21am
    Author:  marcelo zapata

  ==============================================================================
*/

#pragma once
#include <JuceHeader.h>
#include "../Utils/FFTUtils.h"
#include "../Utils/FeatureMath.h"
#include "AnalysisResult.h"

namespace GateKPT::Analysis {

struct ChordAnalyzer {
    static juce::Array<ChordHit> detect (const juce::AudioBuffer<float>&, double sampleRate);
};

} // namespace GateKPT::Analysis
