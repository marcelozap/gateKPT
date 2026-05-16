/*
  ==============================================================================

    VoiceAnalyzer.h
    Created: 12 Aug 2025 3:37:29am
    Author:  marcelo zapata

  ==============================================================================
*/
#pragma once
#include <JuceHeader.h>
#include "../Utils/PitchUtils.h"
#include "AnalysisResult.h"

namespace GateKPT::Analysis {

struct VoiceAnalyzer {
    static VoiceReport analyze (const juce::AudioBuffer<float>&, double sampleRate);
};

} // namespace GateKPT::Analysis
