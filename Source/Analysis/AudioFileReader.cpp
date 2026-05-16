#include "AudioFileReader.h"
#include <JuceHeader.h>

using namespace GateKPT::Analysis;

bool AudioFileReader::loadFileToBuffer (const juce::File& file,
                                        juce::AudioBuffer<float>& outBuffer,
                                        double& outSampleRate)
{
    if (! file.existsAsFile()) return false;

    juce::AudioFormatManager fm;
    fm.registerBasicFormats();

    std::unique_ptr<juce::AudioFormatReader> reader (fm.createReaderFor (file));
    if (! reader) return false;

    const int numCh = (int) juce::jmin (reader->numChannels, (unsigned int) 2);

    const juce::int64 tenMinutesFrames = (juce::int64) (10.0 * 60.0 * reader->sampleRate);
    const juce::int64 framesToRead     = juce::jmin (reader->lengthInSamples, tenMinutesFrames);

    const int length = (int) framesToRead;

    outBuffer.setSize (numCh, length, false, false, true);

    if (! reader->read (&outBuffer, 0, length, 0, true, true))
        return false;

    outSampleRate = reader->sampleRate;
    return true;
}
