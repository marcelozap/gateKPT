#pragma once
#include <JuceHeader.h>
#include "../Utils/OnsetTracker.h"
#include "AnalysisResult.h"

namespace GateKPT::Analysis {

struct SectionSegmentation {
    static juce::Array<TimeRange> detect (const juce::AudioBuffer<float>&, double sampleRate);
};

} // namespace GateKPT::Analysis
