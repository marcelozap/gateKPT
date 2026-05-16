#pragma once
#include <JuceHeader.h>

namespace GateKPT::Data {

struct Message
{
    juce::Time   ts;
    juce::String role;  // "user" | "assistant"
    juce::String text;
};

struct ThreadMeta
{
    juce::String id;
    juce::String name;
    juce::Time   createdAt;
};

class ConversationStore
{
public:
    static juce::File    getDefaultRoot();
    static juce::String  makeId();

    explicit ConversationStore (juce::File rootDir);

    juce::File           threadFile (const juce::String& id) const;

    juce::String         createThread (const juce::String& name);
    juce::Array<ThreadMeta> listThreads () const;
    bool                 renameThread (const juce::String& id, const juce::String& newName);
    bool                 deleteThread (const juce::String& id);

    juce::Array<Message> loadThread (const juce::String& id) const;
    bool                 appendMessage (const juce::String& id,
                                        const juce::String& role,
                                        const juce::String& text);

    static juce::var     toVar   (const Message& m);
    static bool          fromVar (const juce::var& v, Message& m);

private:
    juce::File root;
    JUCE_LEAK_DETECTOR (ConversationStore)
};

} // namespace GateKPT::Data
