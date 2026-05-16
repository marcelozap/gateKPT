/*
  ==============================================================================

    VoiceAnalyzer.cpp
    Created: 12 Aug 2025 3:37:29am
    Author:  marcelo zapata

  ==============================================================================
*/
#include "VoiceAnalyzer.h"
#include <JuceHeader.h>

using namespace GateKPT::Analysis;
using namespace GateKPT::Utils;

VoiceReport VoiceAnalyzer::analyze (const juce::AudioBuffer<float>& in, double sr)
{
    VoiceReport r{};
    if (in.getNumSamples() == 0) return r;

    // mono
    juce::AudioBuffer<float> mono (1, in.getNumSamples()); mono.clear();
    const int n = in.getNumSamples(), chs = juce::jmax (1, in.getNumChannels());
    for (int i = 0; i < n; ++i)
    {
        double s = 0.0; for (int ch = 0; ch < chs; ++ch) s += in.getReadPointer (ch)[i];
        mono.setSample (0, i, (float) (s / chs));
    }

    const int win = (int) std::round (0.0464 * sr);
    const int hop = (int) std::round (0.0200 * sr);
    juce::Array<double> voicedHz;

    for (int pos = 0; pos + win <= n; pos += hop)
    {
        auto pr = yinPitchHz (mono.getReadPointer (0) + pos, win, sr);
        if (pr.second > 0.7 && pr.first >= 70.0 && pr.first <= 400.0)
            voicedHz.add (pr.first);
    }

    if (voicedHz.isEmpty()) { r.genderLikelihood = "unknown"; r.confidence = 0.0; return r; }

    double meanHz = 0.0; for (auto h : voicedHz) meanHz += h; meanHz /= voicedHz.size();

    if (meanHz < 165.0) { r.genderLikelihood = "male-ish";   r.confidence = 0.7; }
    else if (meanHz < 255.0) { r.genderLikelihood = "androgynous"; r.confidence = 0.6; }
    else { r.genderLikelihood = "female-ish"; r.confidence = 0.7; }

    return r;
}
