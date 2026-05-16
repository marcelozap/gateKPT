#include <JuceHeader.h>
#include <algorithm> // std::clamp
#include "GenreMoodAnalyzer.h"

using namespace GateKPT::Analysis;

namespace
{
    struct Biquad
    {
        double b0 = 0, b1 = 0, b2 = 0, a1 = 0, a2 = 0, z1 = 0, z2 = 0;
        void reset() { z1 = z2 = 0; }
        void setBandpass (double fs, double f0, double Q)
        {
            if (fs <= 0.0) fs = 44100.0;
            f0 = std::clamp (f0, 10.0, fs * 0.45);
            Q  = std::max (0.1, Q);

            const double w0   = 2.0 * juce::MathConstants<double>::pi * (f0 / fs);
            const double cw   = std::cos (w0);
            const double sw   = std::sin (w0);
            const double alpha = sw / (2.0 * Q);
            const double a0    = 1.0 + alpha;

            const double _b0 =  alpha, _b1 = 0.0, _b2 = -alpha;
            const double _a1 = -2.0 * cw, _a2 = 1.0 - alpha;

            b0 = _b0 / a0; b1 = _b1 / a0; b2 = _b2 / a0;
            a1 = _a1 / a0; a2 = _a2 / a0;
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

    void downmix (const juce::AudioBuffer<float>& in, juce::AudioBuffer<float>& mono)
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

    struct Feat { float dBBass=0, dBMid=0, dBHigh=0, rmsDb=0, crestDb=0, bright=0; };

    Feat extract (const juce::AudioBuffer<float>& in, double fs)
    {
        Feat f{};
        juce::AudioBuffer<float> mono; downmix (in, mono);

        const int n = mono.getNumSamples();
        if (n <= 0) return f;

        const float* x = mono.getReadPointer (0);
        double peak = 0.0, sum2 = 0.0;
        for (int i=0;i<n;++i)
        {
            const double s = x[i];
            peak = std::max (peak, std::abs (s));
            sum2 += s*s;
        }
        const double rms = std::sqrt (sum2 / juce::jmax (1, n));

        f.rmsDb   = dbfs (rms);
        f.crestDb = dbfs (peak) - f.rmsDb;

        const double Q = 1.0;
        f.dBBass = dbfs (bandRms (mono, fs, 120.0,  Q));
        f.dBMid  = dbfs (bandRms (mono, fs, 800.0,  Q));
        f.dBHigh = dbfs (bandRms (mono, fs, 3500.0, Q));
        f.bright = f.dBHigh - f.dBBass;
        return f;
    }

    inline double clamp01d (double v) { return std::clamp (v, 0.0, 1.0); }

    void addGenre (GenreMoodReport& r, const juce::String& name, double confRaw)
    {
        GenreConf g;
        g.name       = name;
        g.confidence = clamp01d (confRaw);
        r.genres.add (g);
    }
    void addMood (GenreMoodReport& r, const juce::String& m)
    {
        if (! r.moods.contains (m))
            r.moods.add (m);
    }
} // anon

GenreMoodReport GenreMoodAnalyzer::classify (const juce::AudioBuffer<float>& in, double fs)
{
    GenreMoodReport r{};
    if (in.getNumSamples() == 0 || fs <= 0.0) return r;

    const auto f = extract (in, fs);

    if (f.bright > 4.0f)      { addMood (r, "bright"); addMood (r, "airy"); }
    else if (f.bright < -4.0f){ addMood (r, "dark");  addMood (r, "warm");  }
    else                      { addMood (r, "balanced"); }

    if (f.crestDb >= 12.0f)      addMood (r, "dynamic");
    else if (f.crestDb <= 6.0f)  addMood (r, "dense");

    if (f.rmsDb > -18.0f) addMood (r, "energetic");
    else                  addMood (r, "relaxed");

    const float bassLead = f.dBBass - f.dBHigh;
    const float midLead  = f.dBMid  - std::max (f.dBBass, f.dBHigh);
    const float highLead = f.dBHigh - std::max (f.dBBass, f.dBMid);

    if (bassLead > 3.0f)
    {
        addGenre (r, "Hip-Hop / Trap",      ((double) bassLead + 6.0) / 12.0);
        addGenre (r, "Bass Music / House",  ((double) (f.dBBass - f.dBMid) + 6.0) / 12.0);
        addMood (r, "punchy");
    }
    if (midLead > 2.0f)
    {
        addGenre (r, "Rock / Indie",        ((double) midLead + 6.0) / 12.0);
        addGenre (r, "Singer-Songwriter",   ((double) (f.dBMid - f.dBBass) + 6.0) / 12.0);
        addMood (r, "forward mids");
    }
    if (highLead > 2.0f || f.bright > 4.0f)
    {
        addGenre (r, "Pop / EDM",           ((double) highLead + 6.0) / 12.0);
        addGenre (r, "Techno",              ((double) (f.dBHigh - f.dBMid) + 6.0) / 12.0);
        addMood (r, "crisp");
    }
    if (f.crestDb >= 14.0f && f.bright < 0.0f && f.rmsDb <= -16.0f)
    {
        addGenre (r, "Ambient / Classical", 0.6);
        addMood (r, "open");
        addMood (r, "spacious");
    }
    if (r.genres.isEmpty())
        addGenre (r, "Mixed / Crossover", 0.4);

    return r;
}
