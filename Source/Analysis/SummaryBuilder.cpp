/*
  ==============================================================================
    SummaryBuilder.cpp
  ==============================================================================
*/
#include <JuceHeader.h>
#include "SummaryBuilder.h"

using namespace GateKPT::Analysis;

juce::String SummaryBuilder::makeHumanSummary (const AnalysisResult& r)
{
    juce::String s;

    // Loudness
    s << "• Loudness: "
      << juce::String (r.loudness.lufsI, 1) << " LUFS"
      << " (TP " << juce::String (r.loudness.truePeakDb, 1) << " dB"
      << "), LRA " << juce::String (r.loudness.lra, 1) << "\n";

    // Dynamics
    s << "• Dynamics: peak " << juce::String (r.dynamics.peakDbfs, 1) << " dBFS"
      << " • RMS "          << juce::String (r.dynamics.rmsDbfs,  1)
      << " • crest "        << juce::String (r.dynamics.crestDb,  1) << "\n";

    // Spectral
    s << "• Spectral: centroid " << juce::String (r.spectral.centroidHz, 0) << " Hz"
      << " • sub "     << juce::String (r.spectral.bandSub,     0) << "% / "
      << "bass "       << juce::String (r.spectral.bandBass,    0) << "% / "
      << "low-mid "    << juce::String (r.spectral.bandLowMid,  0) << "% / "
      << "high-mid "   << juce::String (r.spectral.bandHighMid, 0) << "% / "
      << "treble "     << juce::String (r.spectral.bandTreble,  0) << "%\n";

    // Stereo
    s << "• Stereo: width " << juce::String (r.stereo.widthPct, 0) << "% • corr "
      << juce::String (r.stereo.corr, 2) << " (L/R Δ "
      << juce::String (r.stereo.lrImbalanceDb, 1) << " dB)\n";

    // Tempo / Key
    s << "• Groove & Key: "
      << r.beatKey.tempoBpm << " BPM • "
      << (r.beatKey.key.isNotEmpty() ? r.beatKey.key : juce::String ("unknown"))
      << " (conf " << juce::String (r.beatKey.keyConf, 2) << ")\n";

    // Chords (first few)
    if (! r.chords.isEmpty())
    {
        s << "• Chords: ";
        const int show = juce::jmin (4, r.chords.size());
        for (int i = 0; i < show; ++i)
        {
            if (i > 0) s << " | ";
            s << r.chords.getReference (i).chord;
        }
        s << "\n";
    }

    // Instruments (top one)
    if (! r.instruments.isEmpty())
        s << "• Instruments: " << r.instruments.getReference (0).name << "\n";

    return s.trim();
}

juce::String SummaryBuilder::makeOneLiner (const AnalysisResult& r)
{
    juce::String key = (r.beatKey.key.isNotEmpty() ? r.beatKey.key : juce::String ("unknown"));
    return juce::String (r.loudness.lufsI, 1) + " LUFS • "
         + juce::String (r.beatKey.tempoBpm)   + " BPM • "
         + key + " • width " + juce::String (r.stereo.widthPct, 0) + "%";
}
