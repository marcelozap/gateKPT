#pragma once
#include <JuceHeader.h>
#include "AnalysisResult.h"

namespace GateKPT::Analysis
{
    struct TechnicalMetrics
    {
        double sampleRate  = 0.0;
        int    channels    = 0;
        double durationSec = 0.0;

        float  peakDbfs    = 0.0f;
        float  rmsDbfs     = 0.0f;
        float  crestDb     = 0.0f;
    };

    struct TechnicalAnalyzer
    {
        static TechnicalMetrics analyze (const juce::AudioBuffer<float>&, double sampleRate);
    };
} // namespace GateKPT::Analysis
