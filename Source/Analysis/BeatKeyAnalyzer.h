#pragma once
#include <JuceHeader.h>
#include "AnalysisResult.h"

namespace GateKPT::Analysis
{
    struct BeatKeyAnalyzer
    {
        static BeatKeyReport analyze (const juce::AudioBuffer<float>&, double sampleRate);
    };
}
