/*
  ==============================================================================
    SibilancePlosiveAnalyzer.cpp
    Lightweight band-RMS approach (no heavy FFT deps):
      - Sibilance proxy: 5–10 kHz band RMS vs broadband
      - Plosive proxy:   20–150 Hz band RMS vs broadband
  ==============================================================================
*/
#include <JuceHeader.h>
#include "SibilancePlosiveAnalyzer.h"

using namespace GateKPT::Analysis;

// ----- tiny biquad (RBJ bandpass) -----
namespace
{
    struct Biquad
    {
        double b0=0, b1=0, b2=0, a0=1, a1=0, a2=0;
        double z1=0, z2=0;

        void reset() { z1 = z2 = 0; }

        void setBandpass (double fs, double f0, double Q)
        {
            if (fs <= 0.0) fs = 44100.0;
            f0 = juce::jlimit (10.0, fs * 0.45, f0);
            Q  = juce::jmax (0.1, Q);

            const double w0 = 2.0 * juce::MathConstants<double>::pi * (f0 / fs);
            const double cw = std::cos (w0);
            const double sw = std::sin (w0);
            const double alpha = sw / (2.0 * Q);

            const double A0 = 1.0 + alpha;
            b0 =  alpha / A0;
            b1 =  0.0   / A0;
            b2 = -alpha / A0;
            a0 =  1.0;
            a1 = -2.0 * cw / A0;
            a2 = (1.0 - alpha) / A0;
        }

        inline float process (float x)
        {
            const double y = b0 * x + z1;
            z1 = b1 * x + z2 - a1 * y;
            z2 = b2 * x        - a2 * y;
            return (float) y;
        }
    };

    inline float dbfs (double lin)
    {
        return (float) juce::Decibels::gainToDecibels (juce::jmax (lin, 1.0e-12));
    }

    // mono downmix
    void toMono (const juce::AudioBuffer<float>& in, juce::AudioBuffer<float>& mono)
    {
        const int n = in.getNumSamples();
        const int c = juce::jmax (1, in.getNumChannels());
        mono.setSize (1, n, false, false, true);
        mono.clear();

        if (c == 1) { mono.copyFrom (0, 0, in, 0, 0, n); return; }

        for (int ch = 0; ch < c; ++ch)
            mono.addFrom (0, 0, in, ch, 0, n, 1.0f / (float) c);
    }

    double bandRms (const juce::AudioBuffer<float>& mono, double fs, double f0, double Q)
    {
        Biquad bp; bp.setBandpass (fs, f0, Q); bp.reset();
        const float* d = mono.getReadPointer (0);
        const int n = mono.getNumSamples();

        double sum2 = 0.0;
        for (int i = 0; i < n; ++i)
        {
            const float y = bp.process (d[i]);
            sum2 += (double) y * (double) y;
        }
        return std::sqrt (sum2 / juce::jmax (1, n));
    }

    double rmsAll (const juce::AudioBuffer<float>& mono)
    {
        const float* d = mono.getReadPointer (0);
        const int n = mono.getNumSamples();
        double sum2 = 0.0;
        for (int i = 0; i < n; ++i) { const double x = d[i]; sum2 += x * x; }
        return std::sqrt (sum2 / juce::jmax (1, n));
    }
} // namespace

SibilancePlosiveReport SibilancePlosiveAnalyzer::analyze (const juce::AudioBuffer<float>& in, double sr)
{
    SibilancePlosiveReport r{};
    if (in.getNumSamples() == 0 || in.getNumChannels() == 0 || sr <= 0.0) return r;

    juce::AudioBuffer<float> mono;
    toMono (in, mono);

    // broadband reference
    const double rmsBroad = rmsAll (mono);
    const float  rmsBroadDb = dbfs (rmsBroad);

    // bands (gentle Q to span target regions)
    const double Q = 0.8;

    // sibilance proxy: 5–10 kHz (use two band centres and average)
    const double rmsS1 = bandRms (mono, sr, 6000.0, Q);
    const double rmsS2 = bandRms (mono, sr, 9000.0, Q);
    const double rmsSib = 0.5 * (rmsS1 + rmsS2);

    // plosive proxy: 20–150 Hz (two centres)
    const double rmsP1 = bandRms (mono, sr, 60.0, Q);
    const double rmsP2 = bandRms (mono, sr, 120.0, Q);
    const double rmsPlo = 0.5 * (rmsP1 + rmsP2);

    // convert to relative probabilities:
    // ratio vs broadband, then scale & clamp to 0..1
    const double sibRatio = rmsBroad > 0.0 ? (rmsSib / (rmsBroad + 1.0e-12)) : 0.0;
    const double ploRatio = rmsBroad > 0.0 ? (rmsPlo / (rmsBroad + 1.0e-12)) : 0.0;

    r.sibilanceProb = juce::jlimit (0.0f, 1.0f, (float) (sibRatio * 2.5)); // heuristics
    r.plosiveProb   = juce::jlimit (0.0f, 1.0f, (float) (ploRatio * 3.0));

    // de-ess suggestion: map prob to dB range 0..8, but don’t suggest if overall is very quiet
    r.suggestedDeEssDb = (rmsBroadDb < -36.0f ? 0.0f
                                              : juce::jlimit (0.0f, 8.0f, r.sibilanceProb * 8.0f));

    return r;
}
