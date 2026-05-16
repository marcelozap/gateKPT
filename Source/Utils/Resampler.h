/*
  ==============================================================================

    Resampler.h
    Created: 15 Aug 2025 1:37:42pm
    Author:  marcelo zapata

  ==============================================================================
*/

#pragma once
#include <JuceHeader.h>

namespace GateKPT::Utils {

// Simple per-channel Lagrange resampler. ratio = outSR / inSR
inline void resampleBuffer (const juce::AudioBuffer<float>& in,
                            juce::AudioBuffer<float>& out,
                            double ratio)
{
    jassert (ratio > 0.0);
    const int chs = in.getNumChannels();
    const int inN = in.getNumSamples();
    const int outN = (int) std::ceil (inN * ratio);

    out.setSize (chs, outN, false, false, true);
    out.clear();

    juce::LagrangeInterpolator interp;

    for (int ch = 0; ch < chs; ++ch)
    {
        interp.reset();
        const float* src = in.getReadPointer (ch);
        float* dst       = out.getWritePointer (ch);
        int done = 0;
        double srcPos = 0.0;

        while (done < outN)
        {
            const int block = juce::jmin (512, outN - done);
            const int used  = interp.process (ratio, src + (int) srcPos, dst + done, block);
            srcPos += used;
            done   += block;
            if ((int) srcPos >= inN - 4) break; // avoid reading past end
        }
    }
}

} // namespace GateKPT::Utils
