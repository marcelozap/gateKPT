#include "TechnicalAnalyzer.h"
#include <JuceHeader.h>


using namespace GateKPT::Analysis;

namespace {
    inline float dbfs (double lin) { return (float) juce::Decibels::gainToDecibels (juce::jmax (lin, 1.0e-12)); }
}

TechnicalMetrics TechnicalAnalyzer::analyze (const juce::AudioBuffer<float>& buf, double sr)
{
    TechnicalMetrics m{};
    m.sampleRate  = sr > 0 ? sr : 44100.0;
    m.channels    = buf.getNumChannels();
    m.durationSec = buf.getNumSamples() / juce::jmax (1.0, m.sampleRate);

    if (buf.getNumSamples() == 0 || buf.getNumChannels() == 0)
        return m;

    const int n   = buf.getNumSamples();
    const int chs = buf.getNumChannels();

    double peak = 0.0;
    double ss   = 0.0;

    for (int ch = 0; ch < chs; ++ch)
    {
        const float* d = buf.getReadPointer (ch);
        for (int i = 0; i < n; ++i)
        {
            const double s = d[i];
            peak = std::max (peak, std::abs (s));
            ss   += s*s;
        }
    }

    const double rms = std::sqrt (ss / (double) (n * chs));
    m.peakDbfs = dbfs (peak);
    m.rmsDbfs  = dbfs (rms);
    m.crestDb  = m.peakDbfs - m.rmsDbfs;
    return m;
}
