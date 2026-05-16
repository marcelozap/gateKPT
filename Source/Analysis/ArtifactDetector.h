#pragma once
#include <JuceHeader.h>
#include "AnalysisResult.h" // must declare GateKPT::Analysis::ArtifactReport

namespace GateKPT::Analysis
{
    struct ArtifactDetector
    {
        // Analyze artifacts; sampleRate is used for time thresholds only.
        static ArtifactReport analyze (const juce::AudioBuffer<float>& buf, double sampleRate);
    };
} // namespace GateKPT::Analysis
