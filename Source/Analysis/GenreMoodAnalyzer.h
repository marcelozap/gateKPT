#pragma once
#include <JuceHeader.h>
#include "AnalysisResult.h"

namespace GateKPT::Analysis
{
struct GenreMoodAnalyzer
{
    static GenreMoodReport classify (const juce::AudioBuffer<float>& in, double sampleRate);
};
} // namespace GateKPT::Analysis
