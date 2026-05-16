#pragma once
#include <JuceHeader.h>
#include "../Analysis/AnalysisResult.h"

namespace GateKPT::Data
{
struct JSONExporter
{
    static juce::var     toVar  (const GateKPT::Analysis::AnalysisResult& r);
    static juce::String  toJson (const GateKPT::Analysis::AnalysisResult& r, bool pretty = false);
};
} // namespace GateKPT::Data
