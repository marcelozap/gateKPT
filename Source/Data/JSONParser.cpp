#include <JuceHeader.h>
#include "JSONExporter.h"

using namespace GateKPT::Analysis;

namespace
{
    static juce::var toVarPtr (std::unique_ptr<juce::DynamicObject> o) { return juce::var (o.release()); }
}

namespace GateKPT::Data
{
juce::var JSONExporter::toVar (const AnalysisResult& r)
{
    auto root = std::make_unique<juce::DynamicObject>();

    // loudness
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("lufsI", r.loudness.lufsI);
        o->setProperty ("lufsS", r.loudness.lufsS);
        o->setProperty ("lufsM", r.loudness.lufsM);
        o->setProperty ("lra",   r.loudness.lra);
        o->setProperty ("truePeakDb", r.loudness.truePeakDb);
        root->setProperty ("loudness", toVarPtr (std::move (o)));
    }

    // dynamics
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("peakDbfs", r.dynamics.peakDbfs);
        o->setProperty ("rmsDbfs",  r.dynamics.rmsDbfs);
        o->setProperty ("crestDb",  r.dynamics.crestDb);
        o->setProperty ("gainRideSuggestionDb", r.dynamics.gainRideSuggestionDb);
        root->setProperty ("dynamics", toVarPtr (std::move (o)));
    }

    // spectral
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("centroidHz", r.spectral.centroidHz);
        o->setProperty ("rolloffHz",  r.spectral.rolloffHz);
        o->setProperty ("bandSub",    r.spectral.bandSub);
        o->setProperty ("bandBass",   r.spectral.bandBass);
        o->setProperty ("bandLowMid", r.spectral.bandLowMid);
        o->setProperty ("bandHighMid",r.spectral.bandHighMid);
        o->setProperty ("bandTreble", r.spectral.bandTreble);
        root->setProperty ("spectral", toVarPtr (std::move (o)));
    }

    // stereo
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("widthPct",      r.stereo.widthPct);
        o->setProperty ("corr",          r.stereo.corr);
        o->setProperty ("lrImbalanceDb", r.stereo.lrImbalanceDb);
        root->setProperty ("stereo", toVarPtr (std::move (o)));
    }

    // beatKey
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("tempoBpm", r.beatKey.tempoBpm);
        o->setProperty ("tempoConf", r.beatKey.tempoConf);
        o->setProperty ("key",      r.beatKey.key);
        o->setProperty ("keyConf",  r.beatKey.keyConf);
        root->setProperty ("beatKey", toVarPtr (std::move (o)));
    }

    // artifacts
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
        root->setProperty ("artifacts", toVarPtr (std::move (o)));
    }

    // sibilance / plosive
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("sibilanceProb",    r.sibilancePlosive.sibilanceProb);
        o->setProperty ("suggestedDeEssDb", r.sibilancePlosive.suggestedDeEssDb);
        o->setProperty ("plosiveProb",      r.sibilancePlosive.plosiveProb);
        root->setProperty ("sibilancePlosive", toVarPtr (std::move (o)));
    }

    // reverb
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("rt60Est", r.reverb.rt60Est);
        o->setProperty ("dryness", r.reverb.dryness);
        root->setProperty ("reverb", toVarPtr (std::move (o)));
    }

    // tuning
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("centsMedian",   r.tuning.centsMedian);
        o->setProperty ("centsSpread",   r.tuning.centsSpread);
        o->setProperty ("vibratoRateHz", r.tuning.vibratoRateHz);
        o->setProperty ("tunedToA440",   r.tuning.tunedToA440);
        root->setProperty ("tuning", toVarPtr (std::move (o)));
    }

    // voice
    {
        auto o = std::make_unique<juce::DynamicObject>();
        o->setProperty ("genderLikelihood", r.voice.genderLikelihood);
        o->setProperty ("confidence",       r.voice.confidence);

        juce::Array<juce::var> ranges;
        for (auto& tr : r.voice.activeRanges)
        {
            auto ro = std::make_unique<juce::DynamicObject>();
            ro->setProperty ("start", tr.start);
            ro->setProperty ("end",   tr.end);
            ranges.add (toVarPtr (std::move (ro)));
        }
        o->setProperty ("activeRanges", juce::var (ranges));
        root->setProperty ("voice", toVarPtr (std::move (o)));
    }

    // instruments
    {
        juce::Array<juce::var> arr;
        for (auto& ip : r.instruments)
        {
            auto o = std::make_unique<juce::DynamicObject>();
            o->setProperty ("name",        ip.name);
            o->setProperty ("confidence",  ip.confidence);
            o->setProperty ("presencePct", ip.presencePct);
            arr.add (toVarPtr (std::move (o)));
        }
        root->setProperty ("instruments", juce::var (arr));
    }

    // genre/mood
    {
        auto o = std::make_unique<juce::DynamicObject>();

        juce::Array<juce::var> gens;
        for (auto& g : r.genreMood.genres)
        {
            auto go = std::make_unique<juce::DynamicObject>();
            go->setProperty ("name", g.name);
            go->setProperty ("confidence", g.confidence);
            gens.add (toVarPtr (std::move (go)));
        }
        o->setProperty ("genres", juce::var (gens));

        juce::Array<juce::var> moods;
        for (auto& m : r.genreMood.moods) moods.add (m);
        o->setProperty ("moods", juce::var (moods));

        root->setProperty ("genreMood", toVarPtr (std::move (o)));
    }

    // chords
    {
        juce::Array<juce::var> arr;
        for (auto& c : r.chords)
        {
            auto o = std::make_unique<juce::DynamicObject>();
            o->setProperty ("time",       c.time);
            o->setProperty ("chord",      c.chord);
            o->setProperty ("bass",       c.bass);
            o->setProperty ("confidence", c.confidence); // <- correct field
            arr.add (toVarPtr (std::move (o)));
        }
        root->setProperty ("chords", juce::var (arr));
    }

    // transcript
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
            segs.add (toVarPtr (std::move (so)));
        }
        o->setProperty ("segments", juce::var (segs));
        root->setProperty ("transcript", toVarPtr (std::move (o)));
    }

    return toVarPtr (std::move (root));
}

juce::String JSONExporter::toJson (const AnalysisResult& r, bool pretty)
{
    return juce::JSON::toString (toVar (r), pretty);
}
} // namespace GateKPT::Data
