/*
  ==============================================================================
    MaskingAnalyzer.cpp
  ==============================================================================
*/
#include "MaskingAnalyzer.h"
#include <JuceHeader.h>

namespace GateKPT::Analysis
{
namespace // helpers
{
    struct Biquad
    {
        double b0 = 0, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0;
        double z1 = 0, z2 = 0;
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

            b0 =  alpha / A0;  b1 =  0.0   / A0;  b2 = -alpha / A0;
            a0 =  1.0;         a1 = -2.0 * cw / A0; a2 = (1.0 - alpha) / A0;
        }

        inline float process (float x)
        {
            const double y = b0 * x + z1;
            z1 = b1 * x + z2 - a1 * y;
            z2 = b2 * x        - a2 * y;
            return (float) y;
        }
    };

    inline float dbfsFromLin (double lin)
    {
        return (float) juce::Decibels::gainToDecibels (juce::jmax (lin, 1.0e-12));
    }

    void downmixToMono (const juce::AudioBuffer<float>& in, juce::AudioBuffer<float>& mono)
    {
        const int n   = in.getNumSamples();
        const int chs = juce::jmax (1, in.getNumChannels());
        mono.setSize (1, n, false, false, true);
        mono.clear();

        if (chs == 1) { mono.copyFrom (0, 0, in, 0, 0, n); return; }
        for (int ch = 0; ch < chs; ++ch)
            mono.addFrom (0, 0, in, ch, 0, n, 1.0f / (float) chs);
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

    float broadbandMaskingPercent (const juce::AudioBuffer<float>& mono, double crestThreshDb = 6.0)
    {
        const int n = mono.getNumSamples();
        const float* d = mono.getReadPointer (0);
        if (n <= 0) return 0.0f;

        const int win = juce::jlimit (256, 8192, 1024);
        const int hop = win / 2;
        int frames = 0, masked = 0;

        for (int pos = 0; pos + win <= n; pos += hop)
        {
            double peak = 0.0, sum2 = 0.0;
            for (int i = 0; i < win; ++i)
            {
                const double s = d[pos + i];
                peak = std::max (peak, std::abs (s));
                sum2 += s * s;
            }
            const double rms = std::sqrt (sum2 / (double) win);
            const float  crest = dbfsFromLin (peak) - dbfsFromLin (rms);
            const float  rmsDb = dbfsFromLin (rms);

            const bool isMaskedFrame = (crest < crestThreshDb) && (rmsDb > -24.0f);
            masked += (isMaskedFrame ? 1 : 0);
            ++frames;
        }

        if (frames == 0) return 0.0f;
        return 100.0f * (float) masked / (float) frames;
    }
} // anon helpers

MaskingReport MaskingAnalyzer::analyze (const juce::AudioBuffer<float>& in, double fs)
{
    MaskingReport out{};
    if (in.getNumSamples() == 0 || in.getNumChannels() == 0 || fs <= 0.0)
        return out;

    juce::AudioBuffer<float> mono;
    downmixToMono (in, mono);

    const double Q = 1.0;
    const double rmsKick = bandRms (mono, fs,  60.0, Q);
    const double rmsBass = bandRms (mono, fs, 100.0, Q);
    const double rmsLead = bandRms (mono, fs, 1500.0, Q);
    const double rmsVox  = bandRms (mono, fs, 3000.0, Q);

    const float dBKick = dbfsFromLin (rmsKick);
    const float dBBass = dbfsFromLin (rmsBass);
    const float dBLead = dbfsFromLin (rmsLead);
    const float dBVox  = dbfsFromLin (rmsVox);

    out.vocalVsLeadMaskingDb = dBVox - dBLead;
    out.bassVsKickMaskingDb  = dBBass - dBKick;
    out.broadbandMaskingPct  = broadbandMaskingPercent (mono);

    return out;
}
} // namespace GateKPT::Analysis
