#pragma once
#include <JuceHeader.h>

namespace GateKPT::Suggestions
{
struct Suggestion
{
    juce::String text;
    float confidence = 0.0f;
};

struct ChordSuggestionEngine
{
    // keyContext optional, e.g., "C major", "A minor"
    static juce::Array<Suggestion> improve (const juce::String& chordName,
                                            const juce::String& keyContext = {});
};
} // namespace GateKPT::Suggestions
