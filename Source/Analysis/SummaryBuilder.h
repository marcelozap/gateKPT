/*
  ==============================================================================
    SummaryBuilder.h
  ==============================================================================
*/
#pragma once
#include <JuceHeader.h>
#include "AnalysisResult.h"

namespace GateKPT::Analysis
{
struct SummaryBuilder
{
    static juce::String makeHumanSummary (const AnalysisResult& r);
    static juce::String makeOneLiner     (const AnalysisResult& r);
};
} // namespace GateKPT::Analysis
