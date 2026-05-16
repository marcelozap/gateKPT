#pragma once
#include <JuceHeader.h>
#include "../Analysis/AnalysisResult.h"
#include "ChordSuggestionEngine.h" // for GateKPT::Suggestions::Suggestion

namespace GateKPT::Suggestions {

struct ArrangementSuggestionEngine
{
    // Returns arrangement-oriented suggestions based purely on r’s metrics (no guesses).
    static juce::Array<Suggestion> analyze (const GateKPT::Analysis::AnalysisResult& r);

    // Legacy helper you had in your stub
    static juce::String basicLayeringTip() { return "Double with octave + subtle arpeggio"; }
};

} // namespace GateKPT::Suggestions
