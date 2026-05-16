#pragma once
#include <JuceHeader.h>

namespace GateKPT::Analysis {
struct AudioFileReader {
    static bool loadFileToBuffer (const juce::File& file,
                                  juce::AudioBuffer<float>& outBuffer,
                                  double& sampleRate);
};
} // namespace GateKPT::Analysis
