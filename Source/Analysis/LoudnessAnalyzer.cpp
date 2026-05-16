/*
  ==============================================================================

    LoudnessAnalyzer.cpp
    Created: 15 Aug 2025 1:33:09pm
    Author:  marcelo zapata

  ==============================================================================
*/

#include "LoudnessAnalyzer.h"
#include <JuceHeader.h>

#include <vector>

using namespace GateKPT::Analysis;

namespace {
    // Simple K-weighting approximation:
    //  - 1st-order high-pass ~60 Hz
    //  - high-shelf (~+4 dB above ~1 kHz) – implemented as a gentle tilt
    struct KWFilter
    {
        void prepare (double sr)
        {
            sampleRate = (sr > 0 ? sr : 44100.0);
            // One-pole HPF at ~60 Hz
            const double fc = 60.0;
            const double x  = std::exp (-2.0 * juce::MathConstants<double>::pi * fc / sampleRate);
            a0 = 1.0 - x; b1 = x;
            // Shelf tilt factor (very gentle)
            shelfGain = std::pow (10.0, 4.0 / 20.0);
        }

        inline float process (float s)
        {
            // HPF
            z = (float) (a0 * s + b1 * z);
            float y = s - z;
            // crude tilt: mix with a tiny high-passed portion
            return (float) (0.9 * y + 0.1 * (y * shelfGain));
        }

        double sampleRate = 44100.0, a0=0, b1=0, shelfGain=1.0;
        float z = 0.f;
    };

    inline float dbfs (double g) { return (float) juce::Decibels::gainToDecibels (juce::jmax (g, 1.0e-12)); }

    static float truePeak4x (const juce::AudioBuffer<float>& buf)
    {
        // 4× linear interpolation oversampling (cheap but catches many intersample peaks)
        const int n = buf.getNumSamples();
        const int chs = juce::jmax (1, buf.getNumChannels());
        double maxAbs = 0.0;

        for (int ch = 0; ch < chs; ++ch)
        {
            const float* d = buf.getReadPointer (ch);
            for (int i = 0; i < n - 1; ++i)
            {
                const double s0 = d[i], s1 = d[i+1];
                for (int k = 0; k < 4; ++k)
                {
                    const double t = (double) k / 4.0;
                    const double v = s0 + (s1 - s0) * t;
                    maxAbs = std::max (maxAbs, std::abs (v));
                }
            }
        }
        return dbfs (maxAbs);
    }

    struct BlockStats
    {
        double energy = 0.0; // sum of squares (K-weighted)
        int    count  = 0;   // samples per block
        double lufs   = 0.0; // computed later
    };
}

LoudnessReport LoudnessAnalyzer::analyze (const juce::AudioBuffer<float>& in, double sr)
{
    LoudnessReport out{};
    if (in.getNumSamples() == 0) return out;

    // 1) Downmix to mono and apply K-ish weighting
    juce::AudioBuffer<float> mono (1, in.getNumSamples());
    mono.clear();
    KWFilter kw; kw.prepare (sr);
    {
        const int n = in.getNumSamples();
        const int chs = juce::jmax (1, in.getNumChannels());
        float* m = mono.getWritePointer (0);
        for (int i = 0; i < n; ++i)
        {
            double s = 0.0;
            for (int ch = 0; ch < chs; ++ch) s += in.getReadPointer (ch)[i];
            s /= (double) chs;
            m[i] = kw.process ((float) s);
        }
    }

    // 2) Block energies: 400 ms (momentary), 3 s (short-term). Integrated with gating
    const int n = mono.getNumSamples();
    const int blockM = (int) std::round (0.400 * sr);
    const int blockS = (int) std::round (3.000 * sr);
    const int hop    = (int) std::round (0.100 * sr); // 100 ms hop

    std::vector<BlockStats> mom, sho;
    mom.reserve (n / hop + 2);
   
}
