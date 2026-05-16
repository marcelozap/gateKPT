/*
  ==============================================================================

    SpectralAnalyzer.h
    Created: 15 Aug 2025 1:34:25pm
    Author:  marcelo zapata

  ==============================================================================
*/

#pragma once
#include <JuceHeader.h>
#include "../Utils/FFTUtils.h"
#include "../Utils/Windowing.h"
#include "../Utils/FeatureMath.h"
#include "AnalysisResult.h"

namespace GateKPT::Analysis {

struct SpectralAnalyzer {
    static SpectralReport analyze (const juce::AudioBuffer<float>&, double sampleRate);
};

} // namespace GateKPT::Analysis
