#pragma once
#include <JuceHeader.h>
#include <thread>
#include "PluginProcessor.h"

// Analysis
#include "Analysis/AudioFileReader.h"
#include "Analysis/TechnicalAnalyzer.h"
#include "Analysis/AnalysisOrchestrator.h"
#include "Analysis/SummaryBuilder.h"   // now lives under Analysis

// Data
#include "Data/ConversationStore.h"
#include "Data/JSONExporter.h"
// If you need parsing back into structs: #include "Data/JSONParser.h"


namespace GateKPT {

class NewProjectAudioProcessorEditor : public juce::AudioProcessorEditor,
                                       private juce::Button::Listener,
                                       private juce::ComboBox::Listener
{
public:
    explicit NewProjectAudioProcessorEditor (NewProjectAudioProcessor&);
    ~NewProjectAudioProcessorEditor() override = default;

    void paint   (juce::Graphics&) override;
    void resized() override;

private:
    // Listeners
    void buttonClicked (juce::Button* b) override;
    void comboBoxChanged (juce::ComboBox* c) override;

    // helpers
    juce::String getApiKey() const;
    void sendPromptToOpenAI (const juce::String& promptText);

    // thread helpers
    void refreshThreadList();
    void loadThreadIntoView (const juce::String& id);

    void onStopClicked();     // hook this to your Stop button
    void onSendClicked();     // your existing send handler
    NewProjectAudioProcessor& processor;
    
     juce::ThreadPool analysisPool { 2 };
    GateKPT::Analysis::AnalysisOrchestrator orchestrator { analysisPool };
    std::shared_ptr<GateKPT::Analysis::AnalysisResult> latestResult;


    // Branding
    juce::Image         logo;
    juce::Typeface::Ptr brandTypeface;

    // Thread UI
    juce::ComboBox      threadSelector;
    juce::TextButton    newThreadButton { "+" };
    juce::String        currentThreadId;
    GateKPT::Data::ConversationStore store;

    // UI (3 boxes)
    juce::Label      promptLabel { {}, "Question from user" };
    juce::TextEditor promptBox;

    juce::ToggleButton recordToggle { "●" };
    juce::TextButton   sendButton   { "➤" };

    juce::Label      answerLabel { {}, "Answer from gateKPT" };
    juce::TextEditor outputBox;

    // Audio storage for analysis preview
    juce::AudioBuffer<float> loadedBuffer;
    double loadedSampleRate = 0.0;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (NewProjectAudioProcessorEditor)
};

} // namespace GateKPT
