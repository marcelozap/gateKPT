/*
  ==============================================================================

    Stats.h
    Created: 15 Aug 2025 1:37:36pm
    Author:  marcelo zapata

  ==============================================================================
*/

#pragma once
#include <JuceHeader.h>

namespace GateKPT::Utils {

struct RunningStats
{
    // Welford’s algorithm
    void add (double x)
    {
        ++n;
        const double delta = x - mean;
        mean += delta / (double) n;
        m2   += delta * (x - mean);
    }

    int    n   = 0;
    double mean = 0.0;
    double m2   = 0.0; // sum of squares of differences

    double variance() const { return n > 1 ? m2 / (double) (n - 1) : 0.0; }
    double stddev()   const { return std::sqrt (variance()); }
};

inline double rms (const float* x, int N)
{
    if (N <= 0) return 0.0;
    double ss = 0.0; for (int i = 0; i < N; ++i) ss += (double) x[i] * (double) x[i];
    return std::sqrt (ss / (double) N);
}

inline float dbfs (double lin, double floorLin = 1.0e-12)
{
    return (float) juce::Decibels::gainToDecibels (juce::jmax (lin, floorLin));
}

// In-place percentile (0..1). Copies into a vector for safety.
inline double percentile (const juce::Array<double>& a, double p)
{
    if (a.isEmpty()) return 0.0;
    p = juce::jlimit (0.0, 1.0, p);
    std::vector<double> v (a.begin(), a.end());
    const size_t idx = (size_t) juce::jlimit (0, (int) v.size()-1, (int) std::floor (p * (v.size()-1)));
    std::nth_element (v.begin(), v.begin() + (int) idx, v.end());
    return v[idx];
}

} // namespace GateKPT::Utils
