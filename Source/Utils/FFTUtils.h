/*
  ==============================================================================

    FFTUtils.h
    Created: 12 Aug 2025 3:34:31am
    Author:  marcelo zapata

  ==============================================================================
*/

#pragma once
#include <JuceHeader.h>
#include "Windowing.h"
#include "Stats.h"

namespace GateKPT::Utils {

// next power-of-two ≥ n
inline int nextPow2 (int n)
{
    int p = 1; while (p < n) p <<= 1; return p;
}

struct Spectrum
{
    // magnitude spectrum (linear), size = fftSize/2+1
    juce::Array<float> mag;
    double binHz = 0.0;
};

inline void realFFTMag (const float* mono, int N, Spectrum& out,
                        Utils::WindowType wt = Utils::WindowType::Hann)
{
    jassert (mono && N > 0);
    const int fftSize = nextPow2 (N);
    const int order   = juce::roundToInt (std::log2 ((double) fftSize));

    juce::dsp::FFT fft (order);
    juce::HeapBlock<float> window = makeWindow (fftSize, wt);

    juce::HeapBlock<float> buf; buf.malloc ((size_t) (2 * fftSize)); // interleaved real/imag
    float* time = buf.get();
    std::fill (time, time + fftSize, 0.0f);
    std::memcpy (time, mono, (size_t) N * sizeof(float));
    applyWindowInPlace (time, window.get(), fftSize);

    float* freq = buf.get();
    fft.performRealOnlyForwardTransform (freq);

    const int bins = fftSize / 2 + 1;
    out.mag.resize (bins);
    for (int k = 0; k < bins; ++k)
    {
        const float re = freq[2 * k];
        const float im = freq[2 * k + 1];
        out.mag.set (k, std::sqrt (re * re + im * im) / (float) fftSize);
    }
}

inline double spectralCentroidHz (const Spectrum& s, double sampleRate)
{
    if (s.mag.isEmpty()) return 0.0;
    double num = 0.0, den = 0.0;
    const int bins = s.mag.size();
    for (int k = 0; k < bins; ++k)
    {
        const double f = (double) k * sampleRate / (2.0 * (bins - 1)) * 2.0; // map back to 0..sr/2
        const double m = s.mag[(int) k];
        num += f * m; den += m;
    }
    return den > 1e-12 ? num / den : 0.0;
}

inline double spectralRolloffHz (const Spectrum& s, double sampleRate, double roll = 0.85)
{
    if (s.mag.isEmpty()) return 0.0;
    const double total = std::accumulate (s.mag.begin(), s.mag.end(), 0.0);
    const double target = total * juce::jlimit (0.0, 1.0, roll);
    double acc = 0.0;
    const int bins = s.mag.size();
    int idx = bins - 1;
    for (int k = 0; k < bins; ++k)
    {
        acc += s.mag[k];
        if (acc >= target) { idx = k; break; }
    }
    const double binWidth = sampleRate / (double) (2 * (bins - 1)) * 2.0;
    return idx * binWidth;
}

// Positive changes only (classic spectral flux)
inline double spectralFlux (const Spectrum& prev, const Spectrum& curr)
{
    jassert (prev.mag.size() == curr.mag.size());
    double flux = 0.0;
    for (int i = 0; i < prev.mag.size(); ++i)
    {
        const double d = (double) curr.mag[i] - (double) prev.mag[i];
        if (d > 0.0) flux += d;
    }
    return flux;
}

// Sum of magnitudes inside [f0,f1) in Hz
inline double bandEnergy (const Spectrum& s, double sampleRate, double f0, double f1)
{
    if (s.mag.isEmpty() || f1 <= f0) return 0.0;
    const int bins = s.mag.size();
    const double binWidth = sampleRate / (double) (2 * (bins - 1)) * 2.0;
    const int i0 = juce::jlimit (0, bins - 1, (int) std::floor (f0 / binWidth));
    const int i1 = juce::jlimit (0, bins - 1, (int) std::ceil  (f1 / binWidth));
    double sum = 0.0;
    for (int i = i0; i < i1; ++i) sum += s.mag[i];
    return sum;
}

} // namespace GateKPT::Utils
