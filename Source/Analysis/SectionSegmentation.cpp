#include "SectionSegmentation.h"
#include <JuceHeader.h>


using namespace GateKPT::Analysis;
using namespace GateKPT::Utils;

juce::Array<TimeRange> SectionSegmentation::detect (const juce::AudioBuffer<float>& in, double sr)
{
    juce::Array<TimeRange> out;
    if (in.getNumSamples() == 0) return out;

    // simple novelty: use OnsetTracker on 1s windows to find quiet gaps that suggest boundaries
    const int n = in.getNumSamples();
    juce::AudioBuffer<float> mono (1, n); mono.clear();
    for (int i = 0; i < n; ++i)
    {
        double s = 0.0; for (int ch = 0; ch < in.getNumChannels(); ++ch) s += in.getReadPointer (ch)[i];
        mono.setSample (0, i, (float) (s / juce::jmax (1, in.getNumChannels())));
    }

    const int block = (int) std::round (0.050 * sr);
    OnsetTracker ot; ot.prepare (sr, block);

    juce::Array<int> boundaries; boundaries.add (0);
    int lastOnset = 0; int noOnsetCount = 0;

    for (int pos = 0; pos + block <= n; pos += block)
    {
        const bool on = ot.processBlock (mono.getReadPointer (0) + pos);
        if (on) { lastOnset = pos; noOnsetCount = 0; }
        else    { ++noOnsetCount; }

        // if we've had ~2s without onsets, mark a boundary
        if (noOnsetCount * block >= (int) std::round (2.0 * sr))
        {
            boundaries.add (pos);
            noOnsetCount = 0;
        }
    }
    boundaries.add (n);

    for (int i = 0; i+1 < boundaries.size(); ++i)
    {
        TimeRange tr;
        tr.start = boundaries[i]     / sr;
        tr.end   = boundaries[i + 1] / sr;
        if (tr.end - tr.start > 0.5)
            out.add (tr);
    }
    return out;
}
