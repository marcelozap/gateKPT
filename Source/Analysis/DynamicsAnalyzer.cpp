#include <JuceHeader.h>
#include "DynamicsAnalyzer.h"

using namespace GateKPT::Analysis;

static inline float dbfsFromLin (double lin, double floorLin = 1.0e-12)
{
    return (float) juce::Decibels::gainToDecibels (juce::jmax (lin, floorLin));
}

DynamicsReport DynamicsAnalyzer::analyze (const juce::AudioBuffer<float>& in, double)
{
    DynamicsReport r{};
    if (in.getNumSamples() == 0 || in.getNumChannels() == 0) return r;

    const int n = in.getNumSamples();
    const int chs = juce::jmax (1, in.getNumChannels());

    double peak = 0.0, sumSquares = 0.0;

    for (int ch = 0; ch < chs; ++ch)
    {
        const float* d = in.getReadPointer (ch);
        for (int i = 0; i < n; ++i)
        {
            const double s = d[i];
            peak = std::max (peak, std::abs (s));
            sumSquares += s * s;
        }
    }

    const double rms = std::sqrt (sumSquares / (double) (n * chs));

    r.peakDbfs = dbfsFromLin (peak);
    r.rmsDbfs  = dbfsFromLin (rms);
    r.crestDb  = r.peakDbfs - r.rmsDbfs;

    // simple gain-ride hint toward ~ -18 dBFS RMS
    r.gainRideSuggestionDb = (r.rmsDbfs < -18.0f ? -18.0f - r.rmsDbfs : 0.0f);
    return r;
}
