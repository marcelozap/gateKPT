/*
  ==============================================================================
    SpecData.h
    Shared constants/targets used by JSONExporter and others.
  ==============================================================================
*/
#pragma once
#include <JuceHeader.h>

namespace GateKPT::Data
{
    // Note names for pretty-printing pitch classes.
    static inline const char* noteName (int pc)
    {
        static const char* names[12] = { "C","C#","D","D#","E","F","F#","G","G#","A","A#","B" };
        return names[((pc % 12) + 12) % 12];
    }

    // Very simple loudness targets (streaming guidance; not prescriptive).
    namespace Targets
    {
        constexpr float LUFS_Mix_Bus_Headroom = -18.0f; // good working headroom
        constexpr float LUFS_Streaming        = -14.0f; // typical platform ref
        constexpr float TruePeak_Max_dB       = -1.0f;  // delivery safety
        constexpr float Stereo_Width_Max_pct  = 85.0f;  // beyond this: check mono
    }

    // Helper to format seconds as mm:ss.
    static inline juce::String mmss (double sec)
    {
        if (sec < 0.0) sec = 0.0;
        const int s = (int) std::round (sec);
        return juce::String (s / 60).paddedLeft ('0', 2) + ":" + juce::String (s % 60).paddedLeft ('0', 2);
    }
}
