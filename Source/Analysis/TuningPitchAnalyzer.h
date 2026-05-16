#pragma once
#include <JuceHeader.h>
#include "AnalysisResult.h"

namespace GateKPT::Analysis
{
    struct TuningPitchAnalyzer
    {
        static TuningReport analyze (const juce::AudioBuffer<float>& buf, double sampleRate);
    };
} // namespace GateKPT::Analysis
