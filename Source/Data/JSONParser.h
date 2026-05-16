/*
  ==============================================================================

    JSONparser.h
    Created: 17 Aug 2025 8:20:06am
    Author:  marcelo zapata

  ==============================================================================
*/

#pragma once
#include <JuceHeader.h>
#include "../Analysis/AnalysisResult.h"

namespace GateKPT::Data
{
struct JSONParser
{
    // Safe, partial readers (ignore unknown/missing fields)
    static bool fromJson (const juce::String& json, GateKPT::Analysis::AnalysisResult& out);
    static bool fromVar  (const juce::var& v,      GateKPT::Analysis::AnalysisResult& out);
};
} // namespace GateKPT::Data

