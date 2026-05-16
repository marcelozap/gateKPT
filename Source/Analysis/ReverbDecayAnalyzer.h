#pragma once
#include <JuceHeader.h>
#include "AnalysisResult.h"

namespace GateKPT::Analysis
{
struct ReverbDecayAnalyzer
{
    // Estimates RT60 using a Schroeder energy-decay curve and returns a dryness index [0..1]:
    //   dryness ≈ 1 for very dry (short RT60), ≈ 0 for wet (long RT60).
    static ReverbReport analyze (const juce::AudioBuffer<float>& in, double sampleRate);
};
} // namespace GateKPT::Analysis
