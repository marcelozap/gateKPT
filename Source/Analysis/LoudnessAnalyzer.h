#pragma once
#include <JuceHeader.h>
#include "AnalysisResult.h"

namespace GateKPT::Analysis
{
    struct LoudnessAnalyzer
    {
        static LoudnessReport analyze (const juce::AudioBuffer<float>&, double sampleRate);
    };
}
