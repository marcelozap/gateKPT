/*
  ==============================================================================

    FeatureMath.h
    Created: 12 Aug 2025 3:39:39am
    Author:  marcelo zapata

  ==============================================================================
*/

#pragma once
#include <JuceHeader.h>

namespace GateKPT::Utils {

// Normalise vector so it sums to 100 (%). Returns sum before scaling.
inline double toPercent (juce::Array<double>& v)
{
    const double sum = std::accumulate (v.begin(), v.end(), 0.0);
    if (sum <= 1.0e-12) return 0.0;
    const double s = 100.0 / sum;
    for (auto& x : v) x *= s;
    return sum;
}

inline float clamp01f (float x) { return juce::jlimit (0.0f, 1.0f, x); }
inline double clamp01  (double x){ return juce::jlimit (0.0, 1.0, x); }
inline double lerp (double a, double b, double t) { return a + (b - a) * t; }

// Map Hz to MIDI note (A4=440)
inline double hzToMidi (double hz)
{
    if (hz <= 0) return -1500.0;
    return 69.0 + 12.0 * std::log2 (hz / 440.0);
}

juce::String midiToName (int midi, bool preferSharps = true);

// non-inline impl in FeatureMath.cpp (keeps linkers happy)
juce::String noteNameFromHz (double hz, bool preferSharps = true);

} // namespace GateKPT::Utils
