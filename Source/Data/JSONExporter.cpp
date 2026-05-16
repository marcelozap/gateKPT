#include "JSONExporter.h"
#include <JuceHeader.h>

using namespace GateKPT::Analysis;

namespace
{
    static juce::var objPtr (std::unique_ptr<juce::DynamicObject> o)
    {
        return juce::var (o.release());
    }
}

namespace GateKPT::Data
{

juce::var JSONExporter::toVar (const AnalysisResult& r)
{
    auto root = std::make_unique<juce::DynamicObject>();

    // Loudness
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("lufsI",      r.loudness.lufsI);
        o->setProperty ("lufsS",      r.loudness.lufsS);
        o->setProperty ("lufsM",      r.loudness.lufsM);
        o->setProperty ("lra",        r.loudness.lra);
        o->setProperty ("truePeakDb", r.loudness.truePeakDb);
        root->setProperty ("loudness", objPtr (std::move (o)));
    }

    // Dynamics
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("peakDbfs",             r.dynamics.peakDbfs);
        o->setProperty ("rmsDbfs",              r.dynamics.rmsDbfs);
        o->setProperty ("crestDb",              r.dynamics.crestDb);
        o->setProperty ("gainRideSuggestionDb", r.dynamics.gainRideSuggestionDb);
        root->setProperty ("dynamics", objPtr (std::move (o)));
    }

    // Spectral
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("centroidHz",   r.spectral.centroidHz);
        o->setProperty ("rolloffHz",    r.spectral.rolloffHz);
        o->setProperty ("bandSub",      r.spectral.bandSub);
        o->setProperty ("bandBass",     r.spectral.bandBass);
        o->setProperty ("bandLowMid",   r.spectral.bandLowMid);
        o->setProperty ("bandHighMid",  r.spectral.bandHighMid);
        o->setProperty ("bandTreble",   r.spectral.bandTreble);
        root->setProperty ("spectral", objPtr (std::move (o)));
    }

    // Stereo
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("widthPct",      r.stereo.widthPct);
        o->setProperty ("corr",          r.stereo.corr);
        o->setProperty ("lrImbalanceDb", r.stereo.lrImbalanceDb);
        root->setProperty ("stereo", objPtr (std::move (o)));
    }

    // Beat/Key
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("tempoBpm",  r.beatKey.tempoBpm);
        o->setProperty ("tempoConf", r.beatKey.tempoConf);
        o->setProperty ("key",       r.beatKey.key);
        o->setProperty ("keyConf",   r.beatKey.keyConf);
        root->setProperty ("beatKey", objPtr (std::move (o)));
    }

    // Artifacts
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("clippingPercent",   r.artifacts.clippingPercent);
        o->setProperty ("hasClipping",       r.artifacts.hasClipping);
        o->setProperty ("dcOffsetPercent",   r.artifacts.dcOffsetPercent);
        o->setProperty ("hasDC",             r.artifacts.hasDC);
        o->setProperty ("clickPopCount",     r.artifacts.clickPopCount);
        o->setProperty ("dropoutCount",      r.artifacts.dropoutCount);
        o->setProperty ("intersamplePeakDb", r.artifacts.intersamplePeakDb);
        o->setProperty ("intersampleRisk",   r.artifacts.intersampleRisk);
        root->setProperty ("artifacts", objPtr (std::move (o)));
    }

    // Sibilance / Plosives
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("sibilanceProb",    r.sibilancePlosive.sibilanceProb);
        o->setProperty ("suggestedDeEssDb", r.sibilancePlosive.suggestedDeEssDb);
        o->setProperty ("plosiveProb",      r.sibilancePlosive.plosiveProb);
        root->setProperty ("sibilancePlosive", objPtr (std::move (o)));
    }

    // Reverb
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("rt60Est", r.reverb.rt60Est);
        o->setProperty ("dryness", r.reverb.dryness);
        root->setProperty ("reverb", objPtr (std::move (o)));
    }

    // Tuning
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("centsMedian",   r.tuning.centsMedian);
        o->setProperty ("centsSpread",   r.tuning.centsSpread);
        o->setProperty ("vibratoRateHz", r.tuning.vibratoRateHz);
        o->setProperty ("tunedToA440",   r.tuning.tunedToA440);
        root->setProperty ("tuning", objPtr (std::move (o)));
    }

    // Voice
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("genderLikelihood", r.voice.genderLikelihood);
        o->setProperty ("confidence",       r.voice.confidence);

        juce::Array<juce::var> ranges;
        for (auto& tr : r.voice.activeRanges)
        {
            auto rO = std::make_unique<juce::DynamicObject>();
            rO->setProperty ("start", tr.start);
            rO->setProperty ("end",   tr.end);
            ranges.add (objPtr (std::move (rO)));
        }
        o->setProperty ("activeRanges", juce::var (ranges));
        root->setProperty ("voice", objPtr (std::move (o)));
    }

    // Instruments
    {
        juce::Array<juce::var> arr;
        for (auto& ip : r.instruments)
        {
            auto o = std::make_unique<juce::DynamicObject>();
            o->setProperty ("name",        ip.name);
            o->setProperty ("confidence",  ip.confidence);
            o->setProperty ("presencePct", ip.presencePct);
            arr.add (objPtr (std::move (o)));
        }
        root->setProperty ("instruments", juce::var (arr));
    }

    // Genre/Mood
    {
        auto o = std::make_unique<juce::DynamicObject>();

        juce::Array<juce::var> gens;
        for (auto& g : r.genreMood.genres)
        {
            auto gO = std::make_unique<juce::DynamicObject>();
            gO->setProperty ("name",       g.name);
            gO->setProperty ("confidence", g.confidence);
            gens.add (objPtr (std::move (gO)));
        }
        o->setProperty ("genres", juce::var (gens));

        juce::Array<juce::var> moods;
        for (auto& m : r.genreMood.moods)
            moods.add (m);
        o->setProperty ("moods", juce::var (moods));

        root->setProperty ("genreMood", objPtr (std::move (o)));
    }

    // Chords
    {
        juce::Array<juce::var> arr;
        for (auto& c : r.chords)
        {
            auto o = std::make_unique<juce::DynamicObject>();
            o->setProperty ("time",       c.time);
            o->setProperty ("chord",      c.chord);
            o->setProperty ("bass",       c.bass);
            o->setProperty ("confidence", c.confidence);
            arr.add (objPtr (std::move (o)));
        }
        root->setProperty ("chords", juce::var (arr));
    }

    // Transcript
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("text", r.transcript.text);

        juce::Array<juce::var> segs;
        for (auto& s : r.transcript.segments)
        {
            auto so = std::make_unique<juce::DynamicObject>();
            so->setProperty ("start", s.start);
            so->setProperty ("end",   s.end);
            so->setProperty ("text",  s.text);
            segs.add (objPtr (std::move (so)));
        }
        o->setProperty ("segments", juce::var (segs));
        root->setProperty ("transcript", objPtr (std::move (o)));
    }

    return objPtr (std::move (root));
}

juce::String JSONExporter::toJson (const AnalysisResult& r, bool pretty)
{
    return juce::JSON::toString (toVar (r), pretty);
}

} // namespace GateKPT::Data
