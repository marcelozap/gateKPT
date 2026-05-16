/*
  ==============================================================================
    BeatKeyAnalyzer.cpp  (self-contained)
    - Tempo (envelope autocorrelation, 60–180 BPM folded to 70–170)
    - Key (chroma vs Krumhansl major/minor)
  ==============================================================================
*/

#include <JuceHeader.h>
#include "BeatKeyAnalyzer.h"

namespace GateKPT::Analysis
{
namespace
{
    inline double hzToMidi (double hz) noexcept
    {
        if (hz <= 0.0) return 0.0;
        return 69.0 + 12.0 * std::log2 (hz / 440.0);
    }

    inline void applyHann (float* x, int n) noexcept
    {
        if (n <= 1) return;
        const double twoPi = 2.0 * juce::MathConstants<double>::pi;
        for (int i = 0; i < n; ++i)
            x[i] *= (float) (0.5 * (1.0 - std::cos (twoPi * (double) i / (double) (n - 1))));
    }

    void downmixToMono (const juce::AudioBuffer<float>& in, juce::AudioBuffer<float>& mono)
    {
        const int n = in.getNumSamples();
        const int chs = juce::jmax (1, in.getNumChannels());
        mono.setSize (1, n, false, false, true);
        mono.clear();

        if (chs == 1) { mono.copyFrom (0, 0, in, 0, 0, n); return; }
        for (int ch = 0; ch < chs; ++ch)
            mono.addFrom (0, 0, in, ch, 0, n, 1.0f / (float) chs);
    }

    void computeRmsEnvelope (const juce::AudioBuffer<float>& mono, int frame, int hop,
                             juce::Array<float>& out)
    {
        out.clearQuick();
        const float* d = mono.getReadPointer (0);
        const int n = mono.getNumSamples();
        if (frame <= 0 || hop <= 0 || n <= 0) return;

        for (int pos = 0; pos + frame <= n; pos += hop)
        {
            double sum2 = 0.0;
            for (int i = 0; i < frame; ++i) { const float s = d[pos + i]; sum2 += (double) s * (double) s; }
            out.add ((float) std::sqrt (sum2 / (double) frame));
        }

        if (! out.isEmpty())
        {
            double mean = 0.0; for (auto v : out) mean += v; mean /= (double) out.size();
            for (int i = 0; i < out.size(); ++i) out.set (i, out[i] - (float) mean);
        }
    }

    std::pair<int, float> bestAcfLag (const juce::Array<float>& env, int minLag, int maxLag)
    {
        if (env.size() < maxLag + 2 || minLag >= maxLag) return { 0, 0.0f };

        double e0 = 0.0; for (auto v : env) e0 += (double) v * (double) v;
        if (e0 <= 1.0e-20) return { 0, 0.0f };

        int bestLag = 0; double bestVal = 0.0;

        for (int L = minLag; L <= maxLag; ++L)
        {
            double ac = 0.0; const int N = env.size() - L;
            for (int i = 0; i < N; ++i) ac += (double) env[i] * (double) env[i + L];
            const double val = ac / (std::max (1.0, (double) N) * e0);
            if (val > bestVal) { bestVal = val; bestLag = L; }
        }

        return { bestLag, (float) juce::jlimit (0.0, 1.0, bestVal * 4.0) };
    }

    void computeMeanChroma (const juce::AudioBuffer<float>& mono, double fs,
                            int fftOrder, int hop, juce::Array<float>& chroma)
    {
        chroma.clearQuick(); chroma.resize (12); for (int i=0;i<12;++i) chroma.set (i, 0.0f);
        const int fftSize = 1 << fftOrder; if (fftSize <= 0 || hop <= 0) return;

        juce::HeapBlock<float> fftData (2 * fftSize);
        juce::dsp::FFT fft (fftOrder);

        const float* x = mono.getReadPointer (0);
        const int n = mono.getNumSamples();
        int frames = 0;

        for (int pos = 0; pos + fftSize <= n; pos += hop)
        {
            std::memset (fftData.getData(), 0, sizeof(float) * (size_t) (2 * fftSize));
            std::memcpy (fftData.getData(), x + pos, sizeof(float) * (size_t) fftSize);

            applyHann (fftData.getData(), fftSize);
            fft.performFrequencyOnlyForwardTransform (fftData.getData());

            const int maxBin = fftSize / 2;
            for (int bin = 1; bin < maxBin; ++bin)
            {
                const double freq = (double) bin * fs / (double) fftSize;
                if (freq < 60.0) continue;
                const double midi = hzToMidi (freq);
                const int pc = (int) std::round (midi) % 12;
                if (pc < 0) continue;
                const float mag = juce::jmax (0.0f, fftData[bin]);
                chroma.set (pc, chroma[pc] + mag);
            }
            ++frames;
        }

        if (frames > 0)
        {
            float sum = 0.0f; for (int i=0;i<12;++i) sum += chroma[i];
            if (sum > 1.0e-6f) for (int i=0;i<12;++i) chroma.set (i, chroma[i] / sum);
        }
    }

    void getKeyProfileMajor (float p[12])
    {
        const float raw[12] = { 6.35f, 2.23f, 3.48f, 2.33f, 4.38f, 4.09f, 2.52f, 5.19f, 2.39f, 3.66f, 2.29f, 2.88f };
        float sum = 0.0f; for (float v : raw) sum += v; for (int i=0;i<12;++i) p[i] = raw[i] / sum;
    }
    void getKeyProfileMinor (float p[12])
    {
        const float raw[12] = { 6.33f, 2.68f, 3.52f, 5.38f, 2.60f, 3.53f, 2.54f, 4.75f, 3.98f, 2.69f, 3.34f, 3.17f };
        float sum = 0.0f; for (float v : raw) sum += v; for (int i=0;i<12;++i) p[i] = raw[i] / sum;
    }

    inline void rotate12 (const float in[12], int k, float out[12])
    {
        for (int i=0;i<12;++i) out[(i+k)%12] = in[i];
    }
    inline float dot12 (const float* a, const float* b)
    {
        float s=0.0f; for (int i=0;i<12;++i) s += a[i]*b[i]; return s;
    }
    inline juce::String pcName (int pc)
    {
        static const char* n[12] = { "C","C#","D","D#","E","F","F#","G","G#","A","A#","B" };
        return juce::String (n[(pc%12+12)%12]);
    }
} // anonymous

BeatKeyReport BeatKeyAnalyzer::analyze (const juce::AudioBuffer<float>& in, double sr)
{
    BeatKeyReport r{};
    if (in.getNumSamples() == 0 || in.getNumChannels() == 0 || sr <= 0.0) return r;

    juce::AudioBuffer<float> mono;
    downmixToMono (in, mono);

    // Tempo
    {
        const int frame = (int) std::round (0.200 * sr);
        const int hop   = juce::jmax (1, (int) std::round (0.100 * sr));
        juce::Array<float> env;
        computeRmsEnvelope (mono, frame, hop, env);

        if (env.size() >= 64)
        {
            const double envRate = sr / (double) hop;
            const double minBPM = 60.0, maxBPM = 180.0;
            const int maxLag = (int) std::round ((envRate * 60.0) / minBPM);
            const int minLag = juce::jmax (1, (int) std::round ((envRate * 60.0) / maxBPM));

            auto [lag, conf] = bestAcfLag (env, minLag, maxLag);
            if (lag > 0)
            {
                double period = (double) lag / envRate;
                int bpm = (int) std::round (60.0 / juce::jmax (1.0e-6, period));
                while (bpm > 170) bpm /= 2;
                while (bpm < 70 && bpm > 0) bpm *= 2;
                r.tempoBpm  = bpm;
                r.tempoConf = conf;
            }
        }
    }

    // Key
    {
        juce::Array<float> chroma;
        const int fftOrder = 11; // 2048
        const int hop      = (int) std::round (0.050 * sr);
        computeMeanChroma (mono, sr, fftOrder, hop, chroma);

        if (chroma.size() == 12)
        {
            float maj[12], min[12], tmp[12];
            getKeyProfileMajor (maj);
            getKeyProfileMinor (min);

            float bestScore = -1.0f; int bestPc = 0; bool bestMinor = false;

            for (int tonic = 0; tonic < 12; ++tonic)
            {
                rotate12 (maj, tonic, tmp);
                const float sMaj = dot12 (tmp, chroma.getRawDataPointer());
                if (sMaj > bestScore) { bestScore = sMaj; bestPc = tonic; bestMinor = false; }

                rotate12 (min, tonic, tmp);
                const float sMin = dot12 (tmp, chroma.getRawDataPointer());
                if (sMin > bestScore) { bestScore = sMin; bestPc = tonic; bestMinor = true; }
            }

            r.key     = pcName (bestPc) + juce::String (bestMinor ? " minor" : " major");
            r.keyConf = juce::jlimit (0.0f, 1.0f, bestScore * 4.0f);
        }
        else { r.key = "unknown"; r.keyConf = 0.0f; }
    }

    return r;
}
} // namespace GateKPT::Analysis
