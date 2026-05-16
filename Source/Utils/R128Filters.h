/*
  ==============================================================================

    R128Filters.h
    Created: 15 Aug 2025 1:37:32pm
    Author:  marcelo zapata

  ==============================================================================
*/

#pragma once
#include <JuceHeader.h>

namespace GateKPT::Utils {

// Lightweight K-weighting approximation for loudness work (BS.1770-ish).
// Chain: 1st-order HPF ~60 Hz + gentle high-shelf tilt.
// Deterministic and fast; not a bit-perfect R128 implementation.
struct KWeightApprox
{
    void prepare (double sr)
    {
        sampleRate = (sr > 0 ? sr : 44100.0);

        // 1st order HPF (60 Hz) – bilinear transform
        const double fc = 60.0, K = std::tan (juce::MathConstants<double>::pi * fc / sampleRate);
        const double norm = 1.0 / (1.0 + K);
        hpf_b0 = (float) ( 1.0 * norm);
        hpf_b1 = (float) (-1.0 * norm);
        hpf_a1 = (float) ((1.0 - K) * norm);

        // High-shelf (approx +4 dB above 1 kHz)
        const double f0 = 1000.0, A = std::pow (10.0, 4.0/40.0);
        const double w0 = 2.0 * juce::MathConstants<double>::pi * f0 / sampleRate;
        const double alpha = std::sin (w0) / 2.0 * std::sqrt ((A + 1.0/A) * (1.0/0.707 - 1.0) + 2.0);
        const double cs = std::cos (w0);
        const double b0 =    A*( (A+1) + (A-1)*cs + 2*std::sqrt(A)*alpha );
        const double b1 = -2*A*( (A-1) + (A+1)*cs );
        const double b2 =    A*( (A+1) + (A-1)*cs - 2*std::sqrt(A)*alpha );
        const double a0 =        (A+1) - (A-1)*cs + 2*std::sqrt(A)*alpha;
        const double a1 =    2*( (A-1) - (A+1)*cs );
        const double a2 =        (A+1) - (A-1)*cs - 2*std::sqrt(A)*alpha;

        sh_b0 = (float) (b0/a0);
        sh_b1 = (float) (b1/a0);
        sh_b2 = (float) (b2/a0);
        sh_a1 = (float) (a1/a0);
        sh_a2 = (float) (a2/a0);

        reset();
    }

    void reset()
    {
        z1 = z2 = 0.0f;   // shelf state
        x1 = y1 = 0.0f;   // hpf state
    }

    // In-place
    void process (float* x, int n)
    {
        jassert (x && n > 0);
        // HPF
        for (int i = 0; i < n; ++i)
        {
            const float xi = x[i];
            const float y = hpf_b0 * xi + hpf_b1 * x1 - hpf_a1 * y1;
            x1 = xi; y1 = y;
            x[i] = y;
        }
        // Shelf (Direct Form I)
        for (int i = 0; i < n; ++i)
        {
            const float in = x[i];
            const float y  = sh_b0 * in + sh_b1 * d1 + sh_b2 * d2
                           - sh_a1 * z1 - sh_a2 * z2;
            d2 = d1; d1 = in;
            z2 = z1; z1 = y;
            x[i] = y;
        }
    }

    double sampleRate = 44100.0;

private:
    // HPF
    float hpf_b0=0, hpf_b1=0, hpf_a1=0, x1=0, y1=0;
    // Shelf
    float sh_b0=0, sh_b1=0, sh_b2=0, sh_a1=0, sh_a2=0, d1=0, d2=0, z1=0, z2=0;
};

} // namespace GateKPT::Utils
