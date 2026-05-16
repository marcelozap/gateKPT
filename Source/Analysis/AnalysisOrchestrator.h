#pragma once
#include <JuceHeader.h>
#include <functional>
#include <memory>
#include "AnalysisResult.h"

// Analyzers used by start()
#include "AudioFileReader.h"
#include "LoudnessAnalyzer.h"
#include "DynamicsAnalyzer.h"
#include "SpectralAnalyzer.h"
#include "StereoImageAnalyzer.h"
#include "BeatKeyAnalyzer.h"
#include "ArtifactDetector.h"
#include "SibilancePlosiveAnalyzer.h"
#include "ReverbDecayAnalyzer.h"
#include "TuningPitchAnalyzer.h"
#include "VoiceAnalyzer.h"
#include "InstrumentAnalyzer.h"
#include "GenreMoodAnalyzer.h"
#include "ChordAnalyzer.h"

namespace GateKPT::Analysis
{
class AnalysisOrchestrator
{
public:
    using DoneCB = std::function<void (std::shared_ptr<AnalysisResult>)>;

    explicit AnalysisOrchestrator (juce::ThreadPool& poolIn) : pool (poolIn) {}

    // Kicks off analysis on a worker thread, invokes onDone on the message thread.
    void start (const juce::File& wavFile, DoneCB onDone);

private:
    juce::ThreadPool& pool;
};
} // namespace GateKPT::Analysis
