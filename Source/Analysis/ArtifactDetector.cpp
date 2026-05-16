/*
  ==============================================================================
    ArtifactDetector.cpp
    Deterministic checks:
      - clipping percent
      - DC offset (as %FS)
      - click/pop count (sudden steps)
      - intersample peak (approx 4× linear oversample)
      - dropout count (long near-zero spans)
  ==============================================================================
*/
#include <JuceHeader.h>
#include "AnalysisResult.h"
#include "ArtifactDetector.h"
#include <cstdint>

namespace
{
    inline float dbFromLin (double lin)
    {
        return (float) juce::Decibels::gainToDecibels (juce::jmax (lin, 1.0e-12));
    }
    inline double absd (double v) { return v < 0 ? -v : v; }

    // 4× linear oversample max-abs between two samples a,b (a, a+.25d, a+.5d, a+.75d, b)
    inline float maxAbsOversampled4x (float a, float b)
    {
        const double d = (double) b - (double) a;
        double m = juce::jmax (absd (a), absd (b));
        m = juce::jmax (m, absd ((double)a + 0.25 * d));
        m = juce::jmax (m, absd ((double)a + 0.50 * d));
        m = juce::jmax (m, absd ((double)a + 0.75 * d));
        return (float) m;
    }
}

namespace GateKPT::Analysis
{
ArtifactReport ArtifactDetector::analyze (const juce::AudioBuffer<float>& buf, double sampleRate)
{
    ArtifactReport r{}; // relies on your AnalysisResult.h definition

    const int chs = buf.getNumChannels();
    const int n   = buf.getNumSamples();
    if (chs == 0 || n == 0)
        return r;

    // Thresholds (tuned for typical normalized files)
    constexpr float clipThresh        = 0.9995f;   // near 0 dBFS
    constexpr float clickStepThresh   = 0.50f;     // sudden step magnitude
    constexpr int   clickRefractory   = 200;       // ignore neighbors for 200 samples
    constexpr float nearZero          = 1.0e-5f;   // for dropout detection
    const     int   dropoutMinLen     = (int) juce::jlimit (64, 32768,
                                        (int) std::round (0.020 * juce::jmax (sampleRate, 1.0))); // ~20ms

    // Accumulators
    std::int64_t totalSamples = (std::int64_t) n * chs;
    std::int64_t clipCount    = 0;
    double       meanSum      = 0.0;  // for DC (sum of |means| per channel)
    int          clickCount   = 0;
    int          dropoutCount = 0;

    // Intersample
    float maxOverAbs = 0.0f;

    for (int ch = 0; ch < chs; ++ch)
    {
        const float* d = buf.getReadPointer (ch);

        // 1) DC offset: channel mean
        double sum = 0.0;
        for (int i = 0; i < n; ++i) sum += d[i];
        const double mean = sum / (double) n;
        meanSum += std::abs (mean);

        // 2) Clipping & clicks & intersample & dropouts
        int refractory = 0;
        int runZero    = 0;

        for (int i = 0; i < n; ++i)
        {
            const float s = d[i];

            // clipping
            if (std::abs (s) >= clipThresh) ++clipCount;

            // dropout run
            if (std::abs (s) < nearZero) ++runZero; else runZero = 0;
            if (runZero == dropoutMinLen)
            {
                ++dropoutCount;
                runZero = 0; // reset so we count discrete dropouts
            }

            // clicks (step)
            if (i > 0 && refractory == 0)
            {
                const float prev = d[i - 1];
                const float step = std::abs (s - prev);
                if (step >= clickStepThresh)
                {
                    ++clickCount;
                    refractory = clickRefractory;
                }
            }
            if (refractory > 0) --refractory;

            // intersample via 4× linear between adjacent samples
            if (i > 0)
            {
                const float prev = d[i - 1];
                const float m = maxAbsOversampled4x (prev, s);
                if (m > maxOverAbs) maxOverAbs = m;
            }
        }
    }

    // Fill report
    r.clippingPercent     = totalSamples > 0 ? (100.0f * (float) ((double) clipCount / (double) totalSamples)) : 0.0f;
    r.hasClipping         = (r.clippingPercent > 0.01f); // >0.01% samples clipped

    // DC offset: average absolute mean across channels, expressed as %FS
    const double avgMeanAbs = meanSum / (double) chs;
    r.dcOffsetPercent    = (float) (std::abs (avgMeanAbs) * 100.0);
    r.hasDC              = (std::abs (avgMeanAbs) > 0.0015); // >0.15% FS DC

    r.clickPopCount      = clickCount;
    r.dropoutCount       = dropoutCount;

    // Intersample
    r.intersamplePeakDb  = dbFromLin (maxOverAbs);
    r.intersampleRisk    = (maxOverAbs > 1.0f); // >0 dBFS after oversample

    return r;
}
} // namespace GateKPT::Analysis
