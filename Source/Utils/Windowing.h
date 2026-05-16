/*
  ==============================================================================

    Windowing.h
    Created: 15 Aug 2025 1:37:17pm
    Author:  marcelo zapata

  ==============================================================================
*/

#pragma once
#include <JuceHeader.h>

namespace GateKPT::Utils {

enum class WindowType { Rect, Hann, Hamming, Blackman };

inline void fillWindow (float* w, int N, WindowType t)
{
    jassert (w != nullptr && N > 0);
    switch (t)
    {
        case WindowType::Rect:
            for (int i = 0; i < N; ++i) w[i] = 1.0f;
            break;

        case WindowType::Hann:
        {
            const double scale = juce::MathConstants<double>::twoPi / (N - 1);
            for (int i = 0; i < N; ++i)
                w[i] = (float) (0.5 * (1.0 - std::cos (scale * i)));
            break;
        }

        case WindowType::Hamming:
        {
            const double scale = juce::MathConstants<double>::twoPi / (N - 1);
            for (int i = 0; i < N; ++i)
                w[i] = (float) (0.54 - 0.46 * std::cos (scale * i));
            break;
        }

        case WindowType::Blackman:
        {
            const double a0 = 0.42, a1 = 0.5, a2 = 0.08;
            const double scale = juce::MathConstants<double>::twoPi / (N - 1);
            for (int i = 0; i < N; ++i)
            {
                const double c = std::cos (scale * i);
                w[i] = (float) (a0 - a1 * c + a2 * std::cos (2.0 * scale * i));
            }
            break;
        }
    }
}

inline void applyWindowInPlace (float* data, const float* w, int N)
{
    jassert (data && w && N > 0);
    for (int i = 0; i < N; ++i) data[i] *= w[i];
}

inline juce::HeapBlock<float> makeWindow (int N, WindowType t)
{
    juce::HeapBlock<float> w; w.malloc (N);
    fillWindow (w.get(), N, t);
    return w;
}

} // namespace GateKPT::Utils

