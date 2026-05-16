/*
  ==============================================================================

    SpectralAnalyzer.cpp
    Created: 15 Aug 2025 1:34:25pm
    Author:  marcelo zapata

  ==============================================================================
*/

#include "SpectralAnalyzer.h"
#include <JuceHeader.h>

using namespace GateKPT::Analysis;
using namespace GateKPT::Utils;

namespace
{
    // Downmix any buffer to mono (no allocations beyond the output buffer)
    static void downmixMono (const juce::AudioBuffer<float>& in, juce::AudioBuffer<float>& mono)
    {
        const int n   = in.getNumSamples();
        const int chs = juce::jmax (1, in.getNumChannels());

        mono.setSize (1, n, false, false, true);
        mono.clear();

        if (n == 0)
            return;

        float* m = mono.getWritePointer (0);
        for (int i = 0; i < n; ++i)
        {
            double s = 0.0;
            for (int ch = 0; ch < chs; ++ch)
                s += in.getReadPointer (ch)[i];

            m[i] = (float) (s / (double) chs);
        }
    }
}

SpectralReport SpectralAnalyzer::analyze (const juce::AudioBuffer<float>& in, double sr)
{
    SpectralReport r{};
    if (in.getNumSamples() == 0 || sr <= 0.0)
        return r;

    // Mono
    juce::AudioBuffer<float> mono;
    downmixMono (in, mono);

    // Zero-pad to N (power of two)
    const int nSamples = mono.getNumSamples();
    const int Nraw     = Utils::nextPow2 (nSamples);
    const int N        = juce::jlimit (1024, 8192, Nraw);

    juce::HeapBlock<float> fftBuf (N);
    std::fill (fftBuf.get(), fftBuf.get() + N, 0.0f);
    std::memcpy (fftBuf.get(),
                 mono.getReadPointer (0),
                 (size_t) juce::jmin (nSamples, N) * sizeof (float));

    // Magnitude spectrum
    Spectrum S;
    realFFTMag (fftBuf.get(), N, S, WindowType::Hann);

    // Core descriptors
    r.centroidHz = (float) spectralCentroidHz (S, sr);
    r.rolloffHz  = (float) spectralRolloffHz  (S, sr, 0.85);

    // 5-band distribution (sums to ~100%)
    const double sub   = bandEnergy (S, sr,   20.0,    60.0);
    const double bass  = bandEnergy (S, sr,   60.0,   250.0);
    const double lowMd = bandEnergy (S, sr,  250.0,   500.0);
    const double hiMd  = bandEnergy (S, sr,  500.0,  2000.0);
    const double treb  = bandEnergy (S, sr, 2000.0, 20000.0);

    juce::Array<double> pct { sub, bass, lowMd, hiMd, treb };
    Utils::toPercent (pct);

    r.bandSub     = (float) pct[0];
    r.bandBass    = (float) pct[1];
    r.bandLowMid  = (float) pct[2];
    r.bandHighMid = (float) pct[3];
    r.bandTreble  = (float) pct[4];

    // If your SpectralReport includes brightness/harshness fields, you may add:
    // const double total = sub + bass + lowMd + hiMd + treb + 1.0e-12;
    // r.brightness = (float) juce::jlimit (0.0, 1.0, bandEnergy (S, sr, 5000.0, 12000.0) / total);
    // r.harshness  = (float) juce::jlimit (0.0, 1.0, bandEnergy (S, sr, 2500.0,  6000.0) / total);

    return r;
}
