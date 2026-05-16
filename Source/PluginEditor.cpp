// ===================== EMBEDDED API KEY =====================
// (Embedding in code is not recommended for prod.)
#ifndef GKPT_OPENAI_API_KEY
#define GKPT_OPENAI_API_KEY "sk-proj-REDACTED"
#endif
// ============================================================

#include <JuceHeader.h>
#include <type_traits>
#include "PluginEditor.h"
#include "PluginProcessor.h"
#include "BinaryData.h"

// Orchestrator + summary + export
#include "Analysis/AnalysisOrchestrator.h"
#include "Analysis/AnalysisResult.h"
#include "Analysis/SummaryBuilder.h"
#include "Data/JSONExporter.h"

using namespace GateKPT;

// ---- UI tokens ----
namespace UI {
    static const juce::Colour bg    { 0xFF0B0B0B };
    static const juce::Colour mint  { 0xFF28D7C6 };
    static const juce::Colour cream { 0xFFF3EEDC };
    static const juce::Colour cyan  { 0xFF3FE0D1 };
    static const juce::Colour red   { 0xFFE84C3D };
    static const juce::Colour black { 0xFF111111 };

    constexpr float outerRadius = 26.f;
    constexpr float innerRadius = 14.f;
    constexpr int   margin      = 24;
    constexpr int   headerH     = 92;

    // Left column (chat boxes) takes the working width; right is just the art area
    constexpr float leftFrac    = 0.56f;
    constexpr int   threadsH    = 32;
    constexpr int   inputH      = 120;
    constexpr int   controlsH   = 90;
}

static juce::Image loadLogo()
{
    return juce::ImageCache::getFromMemory(
        ::GateKPT::BanAllMusicRecords02_png,
        ::GateKPT::BanAllMusicRecords02_pngSize);
}

static juce::Typeface::Ptr loadTypeface()
{
    return juce::Typeface::createSystemTypefaceFor(
        ::GateKPT::MuseoModernoRegular_ttf,
        ::GateKPT::MuseoModernoRegular_ttfSize);
}

static void appendTranscriptLine (juce::TextEditor& box, const juce::String& role, const juce::String& text)
{
    auto t = juce::Time::getCurrentTime().formatted ("%Y-%m-%d %H:%M:%S");
    juce::String line;
    line << "[" << t << "] " << role << ":\n" << text << "\n\n";
    box.moveCaretToEnd();
    box.insertTextAtCaret (line);
}

// ------- SFINAE detection for optional processor methods -------
template <typename T>
struct has_startRecording {
    template <typename C> static auto test (int) -> decltype(std::declval<C&>().startRecording(std::declval<const juce::File&>()), std::true_type{});
    template <typename>   static auto test (...) -> std::false_type;
    static constexpr bool value = decltype(test<T>(0))::value;
};

template <typename T>
struct has_stopRecording {
    template <typename C> static auto test (int) -> decltype(std::declval<C&>().stopRecording(), std::true_type{});
    template <typename>   static auto test (...) -> std::false_type;
    static constexpr bool value = decltype(test<T>(0))::value;
};

template <typename T>
struct has_getLastRecordedFile {
    template <typename C> static auto test (int) -> decltype(std::declval<const C&>().getLastRecordedFile(), std::true_type{});
    template <typename>   static auto test (...) -> std::false_type;
    static constexpr bool value = decltype(test<T>(0))::value;
};

// ============================================================================

NewProjectAudioProcessorEditor::NewProjectAudioProcessorEditor (NewProjectAudioProcessor& p)
: juce::AudioProcessorEditor (&p),
  processor (p),
  store (GateKPT::Data::ConversationStore::getDefaultRoot())
{
    setSize (1008, 720);

    logo          = loadLogo();
    brandTypeface = loadTypeface();

    addAndMakeVisible (threadSelector);
    threadSelector.addListener (this);

    addAndMakeVisible (newThreadButton);
    newThreadButton.addListener (this);

    addAndMakeVisible (promptLabel);
    promptLabel.setInterceptsMouseClicks (false, false);
    promptLabel.setColour (juce::Label::textColourId, UI::cyan);
    promptLabel.setFont (juce::Font (18.f));

    addAndMakeVisible (promptBox);
    promptBox.setMultiLine (true);
    promptBox.setReturnKeyStartsNewLine (true);
    promptBox.setTextToShowWhenEmpty ("Type your question…", UI::cyan);

    addAndMakeVisible (recordToggle);
    recordToggle.setButtonText ("●");
    recordToggle.addListener (this);

    addAndMakeVisible (sendButton);
    sendButton.setButtonText ("➤");
    sendButton.addListener (this);

    addAndMakeVisible (answerLabel);
    answerLabel.setInterceptsMouseClicks (false, false);
    answerLabel.setColour (juce::Label::textColourId, UI::cyan);
    answerLabel.setFont (juce::Font (18.f));

    addAndMakeVisible (outputBox);
    outputBox.setMultiLine (true);
    outputBox.setReadOnly (true);
    outputBox.setScrollbarsShown (true);

    threadSelector.setColour (juce::ComboBox::backgroundColourId, UI::black);
    threadSelector.setColour (juce::ComboBox::textColourId,       UI::cyan);
    threadSelector.setColour (juce::ComboBox::outlineColourId,     UI::cream.withAlpha (0.35f));
    threadSelector.setColour (juce::ComboBox::arrowColourId,       UI::cyan);

    newThreadButton.setColour (juce::TextButton::textColourOnId,   UI::cyan);
    newThreadButton.setColour (juce::TextButton::textColourOffId,  UI::cyan);
    newThreadButton.setColour (juce::TextButton::buttonColourId,   juce::Colours::transparentBlack);
    newThreadButton.setColour (juce::TextButton::buttonOnColourId, juce::Colours::transparentBlack);

    promptBox.setColour (juce::TextEditor::backgroundColourId, UI::black);
    promptBox.setColour (juce::TextEditor::textColourId,       UI::cream);
    promptBox.setColour (juce::TextEditor::outlineColourId,    UI::cream.withAlpha (0.25f));

    outputBox.setColour (juce::TextEditor::backgroundColourId, UI::black);
    outputBox.setColour (juce::TextEditor::textColourId,       UI::cream);
    outputBox.setColour (juce::TextEditor::outlineColourId,    UI::cream.withAlpha (0.25f));

    recordToggle.setColour (juce::ToggleButton::textColourId,  UI::cream);
    sendButton  .setColour (juce::TextButton::textColourOffId, UI::cream);
    sendButton  .setColour (juce::TextButton::buttonColourId,  juce::Colours::transparentBlack);
    sendButton  .setColour (juce::TextButton::buttonOnColourId,juce::Colours::transparentBlack);

    refreshThreadList();
    if (currentThreadId.isNotEmpty())
        loadThreadIntoView (currentThreadId);
}

void NewProjectAudioProcessorEditor::resized()
{
    auto r = getLocalBounds().reduced (UI::margin);
    r.removeFromTop (UI::headerH);

    auto leftW = int (r.getWidth() * UI::leftFrac);
    auto left  = r.removeFromLeft (leftW).reduced (0, 4);
    auto right = r.reduced (12, 0); juce::ignoreUnused (right);

    auto threadsRow = left.removeFromTop (UI::threadsH);
    threadSelector.setBounds (threadsRow.removeFromLeft (threadsRow.getWidth() - 44));
    threadsRow.removeFromLeft (8);
    newThreadButton.setBounds (threadsRow);

    left.removeFromTop (8);

    auto inputArea = left.removeFromTop (UI::inputH);
    promptLabel.setBounds (inputArea.withHeight (0));
    promptBox.setBounds   (inputArea.reduced (16));

    left.removeFromTop (8);

    auto controlsArea = left.removeFromTop (UI::controlsH).reduced (16);
    const int btn = controlsArea.getHeight();
    auto row = controlsArea;
    recordToggle.setBounds (row.removeFromLeft (btn));
    row.removeFromLeft (12);
    sendButton.setBounds   (row.removeFromRight (btn));

    left.removeFromTop (8);

    answerLabel.setBounds (left.withHeight (0));
    outputBox.setBounds   (left.reduced (16));
}

void NewProjectAudioProcessorEditor::paint (juce::Graphics& g)
{
    g.fillAll (UI::bg);

    auto outer = getLocalBounds().reduced (10).toFloat();
    g.setColour (UI::mint);
    g.drawRoundedRectangle (outer, UI::outerRadius, 6.f);

    g.setColour (UI::cream);
    juce::Font title = brandTypeface ? juce::Font (brandTypeface).withHeight (40.f).boldened()
                                     : juce::Font (40.f, juce::Font::bold);
    g.setFont (title);
    g.drawText ("gateKPT", 26, 18, 280, 48, juce::Justification::left);

    g.setFont (juce::Font (14.f));
    g.drawText ("“I dont know how to use my DAW” Don’t ever worry again.",
                28, 62, getWidth()/2, 20, juce::Justification::left);

    auto r = getLocalBounds().reduced (UI::margin);
    auto header = r.removeFromTop (UI::headerH);
    auto leftW  = int (r.getWidth() * UI::leftFrac);
    auto left   = r.removeFromLeft (leftW).reduced (0, 4);
    auto right  = r.reduced (12, 0);

    // Logo to the right of BOTH title + tagline area
    if (logo.isValid())
        g.drawImageWithin (logo,
                           right.getX(), header.getBottom() + 6,
                           right.getWidth(), 220,
                           juce::RectanglePlacement::centred);

    auto threadFrame = left.withHeight (UI::threadsH).toFloat();
    g.setColour (UI::cream.withAlpha (0.35f));
    g.drawRoundedRectangle (threadFrame.reduced (2), UI::innerRadius, 2.f);

    left.removeFromTop (UI::threadsH + 8);

    auto inputFrame = left.withHeight (UI::inputH).toFloat();
    g.setColour (UI::cream.withAlpha (0.95f));
    g.drawRoundedRectangle (inputFrame.reduced (2), UI::innerRadius, 3.f);

    left.removeFromTop (UI::inputH + 8);

    auto controlsFrame = left.withHeight (UI::controlsH).toFloat();
    g.drawRoundedRectangle (controlsFrame.reduced (2), UI::innerRadius, 3.f);

    auto recBounds  = recordToggle.getBounds().toFloat().reduced (4);
    auto sendBounds = sendButton.getBounds().toFloat().reduced (4);
    g.setColour (recordToggle.getToggleState() ? UI::black : UI::red);
    g.fillEllipse (recBounds);
    g.setColour (UI::black);
    g.fillEllipse (sendBounds);

    left.removeFromTop (UI::controlsH + 8);

    auto resultFrame = left.toFloat();
    g.drawRoundedRectangle (resultFrame.reduced (2), UI::innerRadius, 3.f);

    g.setColour (UI::cyan);
    g.setFont (juce::Font (18.f));
    g.drawFittedText ("Question from user", inputFrame.reduced (16).toNearestInt(),
                      juce::Justification::left, 1);
    g.drawFittedText ("Answer from gateKPT", resultFrame.reduced (16).toNearestInt(),
                      juce::Justification::left, 1);
}

// ============================================================================

void NewProjectAudioProcessorEditor::buttonClicked (juce::Button* b)
{
    if (b == &newThreadButton)
    {
        auto id = store.createThread ("New Thread");
        refreshThreadList();
        currentThreadId = id;
        loadThreadIntoView (currentThreadId);
        const int wantId = id.hashCode();
        threadSelector.setSelectedId (wantId, juce::dontSendNotification);
        return;
    }

    if (b == &recordToggle)
    {
        const bool on = recordToggle.getToggleState();
        recordToggle.setButtonText (on ? "■" : "●");

        if (on)
        {
            auto dir = juce::File::getSpecialLocation (juce::File::userMusicDirectory)
                       .getChildFile ("gateKPT").getChildFile ("recordings");
            dir.createDirectory();
            auto ts   = juce::Time::getCurrentTime().formatted ("%Y%m%d-%H%M%S");
            auto file = dir.getChildFile ("record-" + ts + ".wav");

            if constexpr (has_startRecording<NewProjectAudioProcessor>::value)
            {
                // FIX 1: always pass the required juce::File argument
                processor.startRecording (file);
                appendTranscriptLine (outputBox, "gateKPT", "Started recording: " + file.getFileName());
                if (currentThreadId.isNotEmpty())
                    store.appendMessage (currentThreadId, "assistant", "Started recording: " + file.getFileName());
            }
            else
            {
                appendTranscriptLine (outputBox, "gateKPT", "Recording not supported by this build.");
            }
        }
        else
        {
            if constexpr (has_stopRecording<NewProjectAudioProcessor>::value)
            {
                // FIX 2: do NOT treat void-returning function as a bool
                processor.stopRecording();
                appendTranscriptLine (outputBox, "gateKPT", "Recording stopped.");
                if (currentThreadId.isNotEmpty())
                    store.appendMessage (currentThreadId, "assistant", "Recording stopped.");
            }
            else
            {
                appendTranscriptLine (outputBox, "gateKPT", "Stop not available (no stopRecording()).");
            }
        }
        repaint();
        return;
    }

    if (b == &sendButton)
    {
        auto prompt = promptBox.getText().trim();
        if (prompt.isEmpty()) { outputBox.setText ("Enter a message first."); return; }

        if (currentThreadId.isNotEmpty())
            store.appendMessage (currentThreadId, "user", prompt);
        appendTranscriptLine (outputBox, "user", prompt);

        sendPromptToOpenAI (prompt);
        return;
    }
}

void NewProjectAudioProcessorEditor::comboBoxChanged (juce::ComboBox* c)
{
    if (c == &threadSelector)
    {
        auto metas = store.listThreads();
        auto selId = threadSelector.getSelectedId();
        for (auto& t : metas)
        {
            if (t.id.hashCode() == selId)
            {
                currentThreadId = t.id;
                loadThreadIntoView (currentThreadId);
                break;
            }
        }
    }
}

void NewProjectAudioProcessorEditor::refreshThreadList()
{
    threadSelector.clear();
    auto metas = store.listThreads();

    if (metas.isEmpty())
    {
        currentThreadId = store.createThread ("Thread 1");
        metas = store.listThreads();
    }

    for (auto& t : metas)
    {
        const int itemId = t.id.hashCode();
        threadSelector.addItem (t.name.isNotEmpty() ? t.name : t.id, itemId);
        currentThreadId = t.id;
    }

    threadSelector.setSelectedId (currentThreadId.hashCode(), juce::dontSendNotification);
}

void NewProjectAudioProcessorEditor::loadThreadIntoView (const juce::String& id)
{
    auto msgs = store.loadThread (id);

    juce::String transcript;
    for (auto& m : msgs)
    {
        auto t = m.ts.formatted ("%Y-%m-%d %H:%M:%S");
        juce::String role = (m.role == "assistant" ? "gateKPT" : "user");
        transcript << "[" << t << "] " << role << ":\n" << m.text << "\n\n";
    }

    outputBox.setText (transcript);
    outputBox.moveCaretToEnd();
}

// ============================================================================

juce::String NewProjectAudioProcessorEditor::getApiKey() const
{
    return juce::String (GKPT_OPENAI_API_KEY);
}

void NewProjectAudioProcessorEditor::sendPromptToOpenAI (const juce::String& promptText)
{
    auto key = getApiKey();
    if (key.isEmpty())
    {
        appendTranscriptLine (outputBox, "gateKPT", "No API key set in GKPT_OPENAI_API_KEY.");
        return;
    }

    appendTranscriptLine (outputBox, "gateKPT", "Sending…");

    std::thread ([this, key, promptText]
    {
        auto* root = new juce::DynamicObject();
        root->setProperty ("model", "gpt-4o-mini");
        juce::Array<juce::var> messages;
        {
            auto* m = new juce::DynamicObject();
            m->setProperty ("role", "user");
            m->setProperty ("content", promptText);
            messages.add (juce::var (m));
        }
        root->setProperty ("messages", juce::var (messages));
        const juce::String body = juce::JSON::toString (juce::var (root));

        juce::URL url ("https://api.openai.com/v1/chat/completions");
        const juce::String extraHeaders =
            "Content-Type: application/json\r\n"
            "Authorization: Bearer " + key + "\r\n";

        // Use classic overload to avoid InputStreamOptions builder mismatch.
        std::unique_ptr<juce::InputStream> in (
            url.withPOSTData (body)
               .createInputStream (true, nullptr, nullptr, extraHeaders, 15000)
        );

        juce::String result = in ? in->readEntireStreamAsString() : "Network error";

        juce::MessageManager::callAsync ([this, result]
        {
            appendTranscriptLine (outputBox, "gateKPT", result);
            if (currentThreadId.isNotEmpty())
                store.appendMessage (currentThreadId, "assistant", result);
        });
    }).detach();
}

// ============================================================================

void NewProjectAudioProcessorEditor::onStopClicked()
{
    if constexpr (has_stopRecording<NewProjectAudioProcessor>::value)
        processor.stopRecording(); // void; don't put inside an if()

    juce::File wav;
    if constexpr (has_getLastRecordedFile<NewProjectAudioProcessor>::value)
        wav = processor.getLastRecordedFile();

    if (! wav.existsAsFile())
    {
        appendTranscriptLine (outputBox, "gateKPT", "No recording found to analyze.");
        return;
    }

    orchestrator.start (wav, [this, wav](std::shared_ptr<GateKPT::Analysis::AnalysisResult> r)
    {
        latestResult = r;

        const auto json    = GateKPT::Data::JSONExporter::toJson (*r, true);
        const auto summary = GateKPT::Analysis::SummaryBuilder::makeHumanSummary (*r);

        appendTranscriptLine (outputBox, "gateKPT", "Analysis complete:\n" + summary);
        if (currentThreadId.isNotEmpty())
            store.appendMessage (currentThreadId, "assistant", "Analysis complete:\n" + summary);
    });
}

void NewProjectAudioProcessorEditor::onSendClicked()
{
    juce::String preface;
    if (latestResult)
    {
        const auto summary = GateKPT::Analysis::SummaryBuilder::makeHumanSummary (*latestResult);
        preface = "Summary of the latest recording:\n" + summary;
    }

    if (preface.isNotEmpty())
        appendTranscriptLine (outputBox, "gateKPT", preface);
}
