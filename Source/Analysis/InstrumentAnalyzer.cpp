#include "InstrumentAnalyzer.h"
#include <JuceHeader.h>


using namespace GateKPT::Analysis;
using namespace GateKPT::Utils;

juce::Array<InstrumentPresence> InstrumentAnalyzer::analyze (const juce::AudioBuffer<float>& in, double sr)
{
    juce::Array<InstrumentPresence> out;
    if (in.getNumSamples() == 0) return out;

    // mono spectrum
    juce::AudioBuffer<float> mono (1, in.getNumSamples()); mono.clear();
    const int n = in.getNumSamples(), chs = juce::jmax (1, in.getNumChannels());
    for (int i = 0; i < n; ++i)
    {
        double s = 0.0; for (int ch = 0; ch < chs; ++ch) s += in.getReadPointer (ch)[i];
        mono.setSample (0, i, (float) (s / chs));
    }
    const int N = juce::jlimit (2048, 8192, Utils::nextPow2 (mono.getNumSamples()));
    Spectrum S; realFFTMag (mono.getReadPointer (0), N, S, WindowType::Hann);
    const double total = std::accumulate (S.mag.begin(), S.mag.end(), 0.0) + 1.0e-12;

    auto add = [&] (juce::String name, double conf)
    {
        InstrumentPresence p; p.name = std::move (name); p.confidence = (float) juce::jlimit (0.0, 1.0, conf);
        out.add (p);
    };

    const double sub  = bandEnergy (S, sr, 20,   90) / total;
    const double bass = bandEnergy (S, sr, 90,  250) / total;
    const double pres = bandEnergy (S, sr, 250, 4000) / total;
    const double air  = bandEnergy (S, sr, 8000, 20000) / total;

    // heuristics
    add ("drums",   juce::jlimit (0.0,1.0, (pres*0.7 + air*0.5)));
    add ("bass",    juce::jlimit (0.0,1.0, (sub*1.2 + bass*0.8)));
    add ("guitar",  juce::jlimit (0.0,1.0, (pres*0.6)));
    add ("piano",   juce::jlimit (0.0,1.0, (pres*0.5 + air*0.2)));
    add ("synth",   juce::jlimit (0.0,1.0, (air*0.6 + bass*0.3)));

    std::sort (out.begin(), out.end(), [] (const InstrumentPresence& a, const InstrumentPresence& b){ return a.confidence > b.confidence; });
    if (out.size() > 5) out.removeRange (5, out.size() - 5);
    return out;
}
