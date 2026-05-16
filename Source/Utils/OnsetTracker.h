/*
  ==============================================================================

    OnsetTracker.h
    Created: 15 Aug 2025 1:37:25pm
    Author:  marcelo zapata

  ==============================================================================
*/

#pragma once
#include <JuceHeader.h>
#include "FFTUtils.h"
#include "Stats.h"

namespace GateKPT::Utils {

// Rolling spectral-flux onset tracker. Feed consecutive blocks of mono audio.
struct OnsetTracker
{
    void prepare (double sr, int blockSize, Utils::WindowType wt = Utils::WindowType::Hann)
    {
        sampleRate = (sr > 0 ? sr : 44100.0);
        N = juce::jmax (64, blockSize);
        windowType = wt;
        ready = true;
        prev.mag.clear();
        fluxStats = RunningStats{};
    }

    // Returns true if an onset is detected on this block.
    bool processBlock (const float* mono, juce::int64 /*frameIndex*/ = 0)
    {
        if (!ready) return false;
        Spectrum curr;
        realFFTMag (mono, N, curr, windowType);
        bool onset = false;

        if (!prev.mag.isEmpty())
        {
            const double flux = spectralFlux (prev, curr);
            fluxStats.add (flux);
            const double th = fluxStats.mean + 1.5 * fluxStats.stddev(); // adaptive
            onset = (flux > th && flux > 1.0e-5);
        }

        prev = std::move (curr);
        return onset;
    }

    double sampleRate = 44100.0;
    int    N = 1024;
    Utils::WindowType windowType = Utils::WindowType::Hann;
    bool ready = false;

private:
    Spectrum prev;
    RunningStats fluxStats;
};

} // namespace GateKPT::Utils
