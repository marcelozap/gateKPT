/*
  ==============================================================================

    PitchUtils.h
    Created: 12 Aug 2025 3:39:50am
    Author:  marcelo zapata

  ==============================================================================
*/

#pragma once
#include <JuceHeader.h>
#include "Stats.h"

namespace GateKPT::Utils {

// Simple YIN-like pitch detector (monophonic). Returns {hz, confidence 0..1}
inline std::pair<double,double> yinPitchHz (const float* x, int N, double sr,
                                            double thresh = 0.15, int minHz = 50, int maxHz = 1000)
{
    if (!x || N <= 32 || sr <= 0) return {0.0, 0.0};

    const int tauMin = juce::jmax (1, (int) std::floor (sr / (double) maxHz));
    const int tauMax = juce::jmin (N/2 - 1, (int) std::ceil (sr / (double) minHz));

    juce::HeapBlock<double> diff; diff.calloc ((size_t) (tauMax + 1));
    // Difference function
    for (int tau = 1; tau <= tauMax; ++tau)
    {
        double s = 0.0;
        for (int i = 0; i < N - tau; ++i)
        {
            const double d = (double) x[i] - (double) x[i + tau];
            s += d * d;
        }
        diff[tau] = s;
    }

    // Cumulative mean normalized difference
    juce::HeapBlock<double> cmnd; cmnd.calloc ((size_t) (tauMax + 1));
    cmnd[0] = 1.0;
    double running = 0.0;
    for (int tau = 1; tau <= tauMax; ++tau)
    {
        running += diff[tau];
        cmnd[tau] = diff[tau] * tau / juce::jmax (1.0e-12, running);
    }

    // Absolute threshold
    int tau = -1;
    for (int t = tauMin; t <= tauMax; ++t)
        if (cmnd[t] < thresh) { tau = t; break; }

    if (tau < 0)
        return {0.0, 0.0};

    // Parabolic interpolation around tau for better resolution
    const int t0 = juce::jlimit (1, tauMax - 1, tau);
    const double y1 = cmnd[t0 - 1], y2 = cmnd[t0], y3 = cmnd[t0 + 1];
    const double denom = (y1 - 2.0*y2 + y3);
    const double delta = (std::abs (denom) > 1e-12 ? 0.5 * (y1 - y3) / denom : 0.0);
    const double tauRef = juce::jlimit (1.0, (double) tauMax, (double) t0 + delta);

    const double hz = sr / tauRef;
    const double conf = juce::jlimit (0.0, 1.0, 1.0 - cmnd[t0]);
    return {hz, conf};
}

} // namespace GateKPT::Utils
