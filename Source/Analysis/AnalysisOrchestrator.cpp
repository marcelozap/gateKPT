#include "AnalysisOrchestrator.h"
#include <JuceHeader.h>


namespace GateKPT::Analysis {

void AnalysisOrchestrator::start(const juce::File& wavFile, DoneCB onDone)
{
    std::thread([wavFile, onDone]
    {
        AudioFileReader afr;
        juce::AudioBuffer<float> buf;
        double sr = 0.0;

        if (! afr.loadFileToBuffer(wavFile, buf, sr))
        {
            juce::MessageManager::callAsync([onDone]{ onDone(std::make_shared<AnalysisResult>()); });
            return;
        }

        auto r = std::make_shared<AnalysisResult>();

        // --- Core analyzers ---
        r->loudness         = LoudnessAnalyzer::analyze(buf, sr);
        r->dynamics         = DynamicsAnalyzer::analyze(buf, sr);
        r->spectral         = SpectralAnalyzer::analyze(buf, sr);
        r->stereo           = StereoImageAnalyzer::analyze(buf, sr);
        r->beatKey          = BeatKeyAnalyzer::analyze(buf, sr);
        r->artifacts        = ArtifactDetector::analyze(buf, sr);
        r->sibilancePlosive = SibilancePlosiveAnalyzer::analyze(buf, sr);
        r->reverb           = ReverbDecayAnalyzer::analyze(buf, sr);
        r->tuning           = TuningPitchAnalyzer::analyze(buf, sr);

        // --- Your existing ones ---
        r->voice       = VoiceAnalyzer::analyze(buf, sr);
        r->instruments = InstrumentAnalyzer::analyze(buf, sr);
        r->genreMood   = GenreMoodAnalyzer::classify(buf, sr);
        r->chords      = ChordAnalyzer::detect(buf, sr);

        // transcript: stub for now
        r->transcript = {};

        juce::MessageManager::callAsync([onDone, r]{ onDone(r); });
    }).detach();
}

} // namespace GateKPT::Analysis
