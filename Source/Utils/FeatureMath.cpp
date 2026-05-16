/*
  ==============================================================================

    FeatureMath.cpp
    Created: 12 Aug 2025 3:39:39am
    Author:  marcelo zapata

  ==============================================================================
*/

#include "FeatureMath.h"
#include <JuceHeader.h>


namespace GateKPT::Utils {

juce::String midiToName (int midi, bool preferSharps)
{
    static const char* sharps[12] = {"C","C#","D","D#","E","F","F#","G","G#","A","A#","B"};
    static const char* flats [12] = {"C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"};
    const int n = juce::jlimit (0, 127, midi);
    const int pc = n % 12;
    const int oc = n / 12 - 1;
    return juce::String (preferSharps ? sharps[pc] : flats[pc]) + juce::String (oc);
}

juce::String noteNameFromHz (double hz, bool preferSharps)
{
    const double midi = hzToMidi (hz);
    return midiToName ((int) std::round (midi), preferSharps);
}

} // namespace GateKPT::Utils
