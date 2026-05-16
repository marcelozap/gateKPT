/*
  ==============================================================================

    StereoImageAnalyzer.cpp
    Created: 15 Aug 2025 1:34:55pm
    Author:  marcelo zapata

  ==============================================================================
*/

#include "StereoImageAnalyzer.h"
#include <JuceHeader.h>

using namespace GateKPT::Analysis;

static inline float dbfs (double lin) { return (float) juce::Decibels::gainToDecibels (juce::jmax (lin, 1.0e-12)); }

StereoImageReport StereoImageAnalyzer::analyze (const juce::AudioBuffer<float>& in, double)
{
    StereoImageReport r{};
    if (in.getNumChannels() < 2 || in.getNumSamples() == 0)
    {
        r.widthPct = 0.f; r.corr = 1.f; r.lrImbalanceDb = 0.f;
        return r;
    }

    const int n = in.getNumSamples();
    const float* L = in.getReadPointer (0);
    const float* R = in.getReadPointer (1);

    double sumL = 0, sumR = 0, sumLL = 0, sumRR = 0, sumLR = 0;
    double midE = 0, sideE = 0;

    for (int i = 0; i < n; ++i)
    {
        const double l = L[i], rr = R[i];
        sumL  += l; sumR += rr;
        sumLL += l*l; sumRR += rr*rr; sumLR += l*rr;

        const double m = 0.5 * (l + rr);
        const double s = 0.5 * (l - rr);
        midE  += m*m;
        sideE += s*s;
    }

    const double width = sideE / juce::jmax (1.0e-12, midE + sideE);
    r.widthPct = (float) juce::jlimit (0.0, 1.0, width) * 100.0f;

    const double cov = sumLR - (sumL * sumR) / (double) n;
    const double vL  = sumLL - (sumL * sumL) / (double) n;
    const double vR  = sumRR - (sumR * sumR) / (double) n;
    const double denom = std::sqrt (juce::jmax (1.0e-24, vL * vR));
    r.corr = (float) juce::jlimit (-1.0, 1.0, cov / denom);

    const double rmsL = std::sqrt (sumLL / n), rmsR = std::sqrt (sumRR / n);
    r.lrImbalanceDb = dbfs (rmsL) - dbfs (rmsR);

    // crude mono-compatibility risk: negative correlation and large side energy
    r.monoRisk = (r.corr < -0.2f && r.widthPct > 40.f);

    return r;
}
