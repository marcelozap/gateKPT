/*
  ==============================================================================

    ChordAnalyzer.cpp
    Created: 12 Aug 2025 3:24:21am
    Author:  marcelo zapata

  ==============================================================================
*/

#include "ChordAnalyzer.h"
#include <JuceHeader.h>

using namespace GateKPT::Analysis;
using namespace GateKPT::Utils;

namespace
{
    static void monoMix (const juce::AudioBuffer<float>& in, juce::AudioBuffer<float>& mono)
    {
        const int n   = in.getNumSamples();
        const int chs = juce::jmax (1, in.getNumChannels());

        mono.setSize (1, n, false, false, true);
        mono.clear();

        if (n == 0) return;

        float* m = mono.getWritePointer (0);
        for (int i = 0; i < n; ++i)
        {
            double s = 0.0;
            for (int ch = 0; ch < chs; ++ch)
                s += in.getReadPointer (ch)[i];
            m[i] = (float) (s / (double) chs);
        }
    }

    static void triadTemplate (bool minor, juce::Array<int>& pcs)
    {
        pcs.clear();
        pcs.add (0);
        pcs.add (minor ? 3 : 4);
        pcs.add (7);
    }

    struct ChordHitByConfidenceDesc
    {
        int compareElements (const ChordHit& a, const ChordHit& b) const noexcept
        {
            if (a.confidence > b.confidence) return -1; // sort descending
            if (a.confidence < b.confidence) return  1;
            return 0;
        }
    };
}

juce::Array<ChordHit> ChordAnalyzer::detect (const juce::AudioBuffer<float>& in, double sr)
{
    juce::Array<ChordHit> out;
    if (in.getNumSamples() == 0 || sr <= 0.0)
        return out;

    // Downmix
    juce::AudioBuffer<float> mono;
    monoMix (in, mono);

    // FFT
    const int N = juce::jlimit (2048, 8192, Utils::nextPow2 (mono.getNumSamples()));
    Spectrum S;
    realFFTMag (mono.getReadPointer (0), N, S, WindowType::Hann);

    // Chroma accumulation
    juce::Array<double> chroma (12);
    for (int i = 0; i < 12; ++i) chroma.set (i, 0.0);

    const int    bins  = (int) S.mag.size();            // ~ N/2 + 1
    const double Nreal = 2.0 * juce::jmax (1, bins - 1);

    for (int k = 1; k < bins; ++k)
    {
        const double f = (double) k * sr / Nreal;       // bin -> Hz
        if (f < 50.0 || f > 5000.0) continue;

        const int pc = ((int) std::round (hzToMidi (f)) % 12 + 12) % 12;
        chroma.set (pc, chroma[pc] + (double) S.mag[k]);
    }

    double totalChroma = 0.0;
    for (int i = 0; i < 12; ++i) totalChroma += chroma[i];
    if (totalChroma <= 0.0) totalChroma = 1.0; // avoid div-by-zero

    // Score major/minor triads
    static const char* names[12] = { "C","C#","D","D#","E","F","F#","G","G#","A","A#","B" };

    for (int root = 0; root < 12; ++root)
    {
        for (int m = 0; m < 2; ++m) // 0 = major, 1 = minor
        {
            juce::Array<int> pcs; triadTemplate (m == 1, pcs);

            double score = 0.0;
            for (auto pc : pcs)
                score += chroma[(root + pc) % 12];

            if (score > 0.0)
            {
                ChordHit h;
                h.time       = 0.0; // global summary
                h.chord      = juce::String (names[root]) + (m ? "m" : "");
                h.bass       = "";   // not estimated here
                h.confidence = (float) juce::jlimit (0.0, 1.0, score / totalChroma);
                out.add (h);
            }
        }
    }

    // Keep top 6 by confidence (IMPORTANT: pass an lvalue comparator)
    ChordHitByConfidenceDesc comp;
    out.sort (comp);

    if (out.size() > 6)
        out.removeRange (6, out.size() - 6);

    return out;
}
