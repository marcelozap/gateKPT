/*
  ==============================================================================
    AnalysisResult.h
    Canonical data model for analysis metrics + helpers.
  ==============================================================================
*/
#pragma once
#include <JuceHeader.h>

namespace GateKPT::Analysis
{
struct SpectralReport
{
    float centroidHz   = 0.0f;
    float rolloffHz    = 0.0f;

    float bandSub      = 0.0f;
    float bandBass     = 0.0f;
    float bandLowMid   = 0.0f; // <-- make sure this exact name is used everywhere
    float bandHighMid  = 0.0f;
    float bandTreble   = 0.0f;

    // Newly added fields used by analyzers/suggestions
    float brightness   = 0.0f; // 0..1
    float harshness    = 0.0f; // 0..1
};
// ---------- Common small structs ----------
struct TimeRange { double start = 0.0, end = 0.0; };

// ---------- Reports ----------
struct LoudnessReport
{
    float lufsI = 0.f, lufsS = 0.f, lufsM = 0.f, lra = 0.f, truePeakDb = 0.f;
};

struct DynamicsReport
{
    float peakDbfs = 0.f, rmsDbfs = 0.f, crestDb = 0.f;
    float gainRideSuggestionDb = 0.f; // hint toward ≈ -18 dBFS RMS
};

struct StereoImageReport
{
    float widthPct = 0.f;      // 0..100
    float corr = 0.f;          // -1..+1
    float lrImbalanceDb = 0.f; // L-R average delta
    bool  monoRisk = false;    // optional flag used by UI/debug
};

struct BeatKeyReport
{
    int           tempoBpm = 0;
    float         tempoConf = 0.f;
    juce::String  key { "unknown" };
    float         keyConf = 0.f;
};

struct ArtifactReport
{
    float clippingPercent = 0.f;  bool hasClipping = false;
    float dcOffsetPercent = 0.f;  bool hasDC       = false;
    int   clickPopCount   = 0;
    int   dropoutCount    = 0;
    float intersamplePeakDb = 0.f; bool intersampleRisk = false;
};

struct SibilancePlosiveReport
{
    float sibilanceProb = 0.f;     // 0..1
    float suggestedDeEssDb = 0.f;  // recommended de-ess amount
    float plosiveProb = 0.f;       // 0..1
};

struct ReverbReport
{
    float rt60Est = 0.f;  // seconds
    float dryness = 0.f;  // 0..1 (1 = very dry)
    float wetness = 0.f;  // 0..1 (optional convenience)
    bool  roomy   = false;
};

struct TuningReport
{
    float centsMedian = 0.f;
    float centsSpread = 0.f;
    float vibratoRateHz = 0.f;
    bool  tunedToA440 = true;
};

struct VoiceReport
{
    juce::String genderLikelihood;
    double       confidence = 0.0;
    juce::Array<TimeRange> activeRanges;
};

struct InstrumentPresence
{
    juce::String name;
    double confidence = 0.0;
    double presencePct = 0.0; // % of timeline detected
};

struct GenreConf
{
    juce::String name;
    double confidence = 0.0;
};

struct GenreMoodReport
{
    juce::Array<GenreConf> genres;
    juce::StringArray      moods; // NOTE: 'moods' (not 'mood')
};

struct ChordHit
{
    double      time = 0.0;
    juce::String chord, bass;
    double      confidence = 0.0;
};

struct Transcript
{
    juce::String text;
    struct Seg { double start = 0.0, end = 0.0; juce::String text; };
    juce::Array<Seg> segments;
};

// ---------- Masking ----------
struct MaskingReport
{
    float vocalVsLeadMaskingDb = 0.f; // <0 => vocals likely masked by leads in 3k region
    float bassVsKickMaskingDb  = 0.f; // <0 => bass likely masked by kick in low band
    float broadbandMaskingPct  = 0.f; // % frames with low crest factor & hot RMS
};

// ---------- Aggregate ----------
struct AnalysisResult
{
    LoudnessReport      loudness;
    DynamicsReport      dynamics;
    SpectralReport      spectral;
    StereoImageReport   stereo;
    BeatKeyReport       beatKey;
    ArtifactReport      artifacts;
    SibilancePlosiveReport sibilancePlosive;
    ReverbReport        reverb;
    TuningReport        tuning;
    VoiceReport         voice;
    juce::Array<InstrumentPresence> instruments;
    GenreMoodReport     genreMood;
    juce::Array<ChordHit> chords;
    Transcript          transcript;
    MaskingReport       masking;    // present so JSONExporter & MaskingAnalyzer compile
};

// ---------- Helpers ----------
juce::String toDebugString (const AnalysisResult& r);
void         clampInPlace  (AnalysisResult& r);

} // namespace GateKPT::Analysis
