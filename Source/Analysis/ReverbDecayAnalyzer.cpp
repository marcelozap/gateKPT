#include <JuceHeader.h>
#include <algorithm> // for std::clamp
#include "ReverbDecayAnalyzer.h"

using namespace GateKPT::Analysis;

namespace
{
    void downmixToMono (const juce::AudioBuffer<float>& in, juce::AudioBuffer<float>& mono)
    {
        const int n   = in.getNumSamples();
        const int chs = juce::jmax (1, in.getNumChannels());
        mono.setSize (1, n, false, false, true);
        mono.clear();

        if (chs == 1) { mono.copyFrom (0, 0, in, 0, 0, n); return; }

        for (int ch = 0; ch < chs; ++ch)
            mono.addFrom (0, 0, in, ch, 0, n, 1.0f / (float) chs);
    }

    // Schroeder energy-decay curve based RT60 estimate.
    // Fits a line to the decay between -5 and -35 dB of the integrated energy curve.
    double estimateRT60_Schroeder (const juce::AudioBuffer<float>& mono, double fs)
    {
        const int N = mono.getNumSamples();
        if (N <= 0 || fs <= 0.0) return 0.0;

        const float* x = mono.getReadPointer (0);

        // Energy per-sample
        juce::HeapBlock<double> e (N);
        for (int i = 0; i < N; ++i)
        {
            const double s = (double) x[i];
            e[i] = s * s;
        }

        // Reverse cumulative sum (Schroeder integral)
        juce::HeapBlock<double> E (N);
        double acc = 0.0;
        for (int i = N - 1; i >= 0; --i)
        {
            acc += e[i];
            E[i] = acc;
        }

        if (acc <= 0.0)
            return 0.0;

        // Convert to dB relative to max energy
        const double E0 = E[0];
        const double eps = 1.0e-20;
        juce::HeapBlock<double> EdB (N);
        for (int i = 0; i < N; ++i)
            EdB[i] = 10.0 * std::log10 (std::max (E[i] / std::max (E0, eps), eps));

        // Find indices near -5 dB and -35 dB
        auto findIndexForDb = [&] (double targetDb)
        {
            for (int i = 0; i < N; ++i)
                if (EdB[i] <= targetDb)
                    return i;
            return N - 1;
        };

        const int i1 = findIndexForDb (-5.0);
        const int i2 = findIndexForDb (-35.0);

        if (i2 <= i1 || i1 <= 0 || i2 >= N)
            return 0.0;

        const double t1 = (double) i1 / fs;
        const double t2 = (double) i2 / fs;
        const double y1 = EdB[i1];
        const double y2 = EdB[i2];

        const double slopeDbPerSec = (y2 - y1) / std::max (1.0e-9, (t2 - t1)); // negative
        if (slopeDbPerSec >= -1.0e-6) // not decaying meaningfully
            return 0.0;

        // Extrapolate to -60 dB from the fitted slope
        const double rt60 = -60.0 / slopeDbPerSec; // seconds (positive)
        return std::clamp (rt60, 0.0, 4.0); // clamp to a reasonable range
    }
}

// -------------------- Public API --------------------
ReverbReport ReverbDecayAnalyzer::analyze (const juce::AudioBuffer<float>& in, double fs)
{
    ReverbReport r{};
    if (in.getNumSamples() == 0 || in.getNumChannels() == 0 || fs <= 0.0)
        return r;

    juce::AudioBuffer<float> mono;
    downmixToMono (in, mono);

    r.rt60Est = estimateRT60_Schroeder (mono, fs);

    // Dryness index [0..1]: 1 very dry (short RT60), 0 wet (long RT60)
    const double wetRef = 1.5; // seconds
    r.dryness = std::clamp (1.0 - (r.rt60Est / wetRef), 0.0, 1.0);

    return r;
}
