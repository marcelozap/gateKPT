#include "PluginProcessor.h"
#include "PluginEditor.h"

using namespace GateKPT;

NewProjectAudioProcessor::NewProjectAudioProcessor()
: AudioProcessor (BusesProperties()
                    .withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                    .withOutput ("Output", juce::AudioChannelSet::stereo(), true))
{
    backgroundThread.startThread(); // for ThreadedWriter
}

void NewProjectAudioProcessor::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    juce::ignoreUnused (samplesPerBlock);
    currentSampleRate = (sampleRate > 0.0 ? sampleRate : 44100.0);
}

void NewProjectAudioProcessor::releaseResources()
{
    stopRecording(); // ensure writer is torn down
}

#ifndef JucePlugin_PreferredChannelConfigurations
bool NewProjectAudioProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    const auto in  = layouts.getChannelSet (true,  0);
    const auto out = layouts.getChannelSet (false, 0);

    // Allow mono/stereo in/out, and require same channel count in/out
    if (! (in == juce::AudioChannelSet::mono() || in == juce::AudioChannelSet::stereo()))
        return false;

    if (! (out == juce::AudioChannelSet::mono() || out == juce::AudioChannelSet::stereo()))
        return false;

    return in.size() == out.size();
}
#endif

void NewProjectAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi)
{
    juce::ignoreUnused (midi);
    juce::ScopedNoDenormals _;

    // Simple passthrough

    // Non-blocking write if recording
    if (auto* writer = activeWriter.load())
        writer->write (buffer.getArrayOfReadPointers(), buffer.getNumSamples());
}

juce::AudioProcessorEditor* NewProjectAudioProcessor::createEditor()
{
    return new GateKPT::NewProjectAudioProcessorEditor (*this);
}

//==============================================================================
// State
void NewProjectAudioProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    juce::ValueTree state = apvts.copyState();
    if (auto xml = state.createXml())
        copyXmlToBinary (*xml, destData);
}

void NewProjectAudioProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    if (auto xml = std::unique_ptr<juce::XmlElement> (getXmlFromBinary (data, sizeInBytes)))
        if (xml->hasTagName (apvts.state.getType()))
            apvts.replaceState (juce::ValueTree::fromXml (*xml));
}

juce::AudioProcessorValueTreeState::ParameterLayout NewProjectAudioProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;
    // Add parameters here when needed
    return { params.begin(), params.end() };
}

//==============================================================================
// Recording
void NewProjectAudioProcessor::startRecording (const juce::File& destFile)
{
    stopRecording(); // ensure clean start

    auto parent = destFile.getParentDirectory();
    parent.createDirectory();
    destFile.deleteFile(); // overwrite if exists

    lastRecordedFile = destFile;

    // Create the stream and writer (ownership flows to the WAV writer)
    if (auto fileStream = std::unique_ptr<juce::FileOutputStream> (destFile.createOutputStream()))
    {
        juce::WavAudioFormat wav;
        auto* rawStream = fileStream.release(); // pass ownership to writer

        if (auto* rawWriter = wav.createWriterFor (rawStream,
                                                   currentSampleRate,
                                                   (unsigned int) getTotalNumOutputChannels(),
                                                   24, {}, 0))
        {
            threadedWriter.reset (new juce::AudioFormatWriter::ThreadedWriter (rawWriter, backgroundThread, 32768));
            activeWriter.store (threadedWriter.get());
        }
        else
        {
            delete rawStream; // clean up if writer creation failed
        }
    }
}

void NewProjectAudioProcessor::stopRecording ()
{
    // Detach atomically so audio thread stops writing immediately
    activeWriter.store (nullptr);
    threadedWriter.reset(); // closes the underlying writer and file
}

//==============================================================================
// Factory
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new GateKPT::NewProjectAudioProcessor();
}
