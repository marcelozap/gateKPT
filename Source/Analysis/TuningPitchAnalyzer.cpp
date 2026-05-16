/*
  ==============================================================================
    TuningPitchAnalyzer.cpp  (self-contained)
    - Mono mixdown
    - Framewise autocorrelation pitch estimate (lag search)
    - Cents offset to nearest ET note (A4=440)
    - Median detune, spread (MAD->sigma-ish), vibrato rate estimate
  ==============================================================================
*/
#include <JuceHeader.h>
#include "TuningPitchAnalyzer.h"

#include <algorithm>
#include <vector>
#include <cmath>

namespace
{
    // -------- math helpers --------
    inline double midiToHz (double midi) noexcept  { return 440.0 * std::pow (2.0, (midi - 69.0) / 12.0); }
    inline double hzToMidi (double hz)  noexcept   { return 69.0 + 12.0 * std::log2 (juce::jmax (hz, 1.0e-12) / 440.0); }
    inline double centsBetween (double aHz, double bHz) noexcept { return 1200.0 * std::log2 (aHz / juce::jmax (bHz, 1.0e-12)); }

    template <typename T>
    static T median (std::vector<T>& v)
    {
        if (v.empty()) return T{};
        auto mid = v.begin() + (v.size() / 2);
        std::nth_element (v.begin(), mid, v.end());
        if ((v.size() & 1u) == 1u) return *mid;
        auto maxLower = *std::max_element (v.begin(), mid);
        return (maxLower + *mid) / (T) 2;
    }

    // quick RMS
    static double frameRMS (const float* x, int n)
    {
        double s = 0.0;
        for (int i = 0; i < n; ++i) s += (double) x[i] * (double) x[i];
        return std::sqrt (s / juce::jmax (1, n));
    }

    // apply Hann in-place
    static void applyHann (std::vector<float>& f)
    {
        const int n = (int) f.size();
        if (n <= 1) return;
        const double k = juce::MathConstants<double>::twoPi / (double) (n - 1);
        for (int i = 0; i < n; ++i)
            f[(size_t) i] = (float) ((0.5 - 0.5 * std::cos (k * i)) * f[(size_t) i]);
    }

    // normalized autocorrelation, returns {bestLag, bestCoeff}
    static std::pair<int,double> bestACFLag (const float* x, int n, int lagMin, int lagMax)
    {
        double e0 = 0.0;
        for (int i = 0; i < n; ++i) e0 += (double) x[i] * (double) x[i];
        e0 = juce::jmax (e0, 1e-12);

        lagMin = juce::jlimit (1, n/2, lagMin);
        lagMax = juce::jlimit (lagMin, n-1, lagMax);

        int    bestL = 0;
        double bestR = 0.0;

        for (int L = lagMin; L <= lagMax; ++L)
        {
            const int m = n - L;
            double num = 0.0, eL = 0.0;
            for (int i = 0; i < m; ++i)
            {
                const double a = x[i];
                const double b = x[i + L];
                num += a * b;
                eL  += b * b;
            }
            const double den = std::sqrt (e0 * juce::jmax (eL, 1e-12));
            const double r   = (den > 0.0 ? num / den : 0.0);
            if (r > bestR) { bestR = r; bestL = L; }
        }
        return { bestL, bestR };
    }

    // rough vibrato from zero-crossings of detrended cents curve
    static double vibratoFromCents (const std::vector<double>& cents, double hopSec)
    {
        if (cents.size() < 8 || hopSec <= 0.0) return 0.0;

        // tiny moving-mean detrend
        std::vector<double> y (cents.size());
        const int W = 5;
        for (size_t i = 0; i < cents.size(); ++i)
        {
            const int a = (int) std::max<int> (0, (int)i - W);
            const int b = (int) std::min<int> ((int)cents.size() - 1, (int)i + W);
            double sum = 0.0; int cnt = 0;
            for (int k = a; k <= b; ++k) { sum += cents[(size_t) k]; ++cnt; }
            y[i] = cents[i] - (sum / juce::jmax (1, cnt));
        }

        int zc = 0;
        for (size_t i = 1; i < y.size(); ++i)
            if ((y[i - 1] <= 0.0 && y[i] > 0.0) || (y[i - 1] >= 0.0 && y[i] < 0.0))
                ++zc;

        const double dur = hopSec * (double) y.size();
        if (dur <= 0.0) return 0.0;
        return (zc / 2.0) / dur; // 2 crossings per oscillation
    }
}

using namespace GateKPT::Analysis;

TuningReport TuningPitchAnalyzer::analyze (const juce::AudioBuffer<float>& in, double sr)
{
    TuningReport r{};
    if (in.getNumSamples() == 0 || in.getNumChannels() == 0 || sr <= 0.0)
        return r;

    // --- mono mixdown ---
    const int N   = in.getNumSamples();
    const int chs = juce::jmax (1, in.getNumChannels());
    std::vector<float> mono ((size_t) N, 0.0f);
    for (int ch = 0; ch < chs; ++ch)
    {
        const float* d = in.getReadPointer (ch);
        for (int i = 0; i < N; ++i) mono[(size_t) i] += d[i];
    }
    const float invCh = 1.0f / (float) chs;
    for (int i = 0; i < N; ++i) mono[(size_t) i] *= invCh;

    // --- framing params ---
    const int frameLen = (int) juce::jlimit (1024, 8192, (int) std::round (0.046 * sr)); // ~46 ms
    const int hop      = (int) juce::jlimit (128,  4096, (int) std::round (0.010 * sr)); // 10 ms
    const int lagMin   = (int) std::ceil  (sr / 1000.0); // ~1 kHz upper pitch
    const int lagMax   = (int) std::floor (sr / 60.0);   // ~60 Hz lower pitch

    std::vector<double> centsSeries;
    centsSeries.reserve ((size_t) (N / juce::jmax (1, hop)));

    std::vector<float> frame ((size_t) frameLen, 0.0f);

    for (int pos = 0; pos + frameLen <= N; pos += hop)
    {
        // copy frame
        for (int i = 0; i < frameLen; ++i)
            frame[(size_t) i] = mono[(size_t) (pos + i)];

        // gate silence
        if (frameRMS (frame.data(), frameLen) < 0.005)
            continue;

        applyHann (frame);

        // ACF pitch
        auto [L, rCoeff] = bestACFLag (frame.data(), frameLen, lagMin, lagMax);
        if (L <= 0 || rCoeff < 0.30) // weak periodicity
            continue;

        const double hz = sr / (double) L;
        if (hz < 40.0 || hz > 2000.0) // sanity band
            continue;

        const double midi    = hzToMidi (hz);
        const double nearest = std::round (midi);
        const double cents   = (midi - nearest) * 100.0; // ~[-50, +50]
        centsSeries.push_back (cents);
    }

    if (centsSeries.empty())
    {
        r.tunedToA440 = true;  // nothing detected—don’t spook users
        return r;
    }

    // median detune
    auto tmp = centsSeries;
    const double med = median (tmp);

    // robust spread (MAD→sigma-ish)
    std::vector<double> absDev;
    absDev.reserve (centsSeries.size());
    for (double c : centsSeries) absDev.push_back (std::abs (c - med));
    const double mad    = median (absDev);
    const double spread = mad * 1.4826; // ≈σ

    // vibrato rate
    const double hopSec = (double) hop / sr;
    const double vibHz  = vibratoFromCents (centsSeries, hopSec);

    r.centsMedian   = med;
    r.centsSpread   = spread;
    r.vibratoRateHz = vibHz;
    r.tunedToA440   = (std::abs (med) <= 5.0); // ±5 cents ≈ “in tune”

    return r;
}
