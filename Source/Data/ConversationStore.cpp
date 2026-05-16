/*
  ==============================================================================

    ConversationStore.cpp

  ==============================================================================
*/
#include "ConversationStore.h"
#include <JuceHeader.h>

namespace GateKPT::Data
{

// Helpers
static juce::String isoNow()  { return juce::Time::getCurrentTime().toISO8601 (true); }
static juce::Time   parseIso (const juce::String& s) { return juce::Time::fromISO8601 (s); }

juce::File ConversationStore::getDefaultRoot()
{
    auto base = juce::File::getSpecialLocation (juce::File::userMusicDirectory)
                  .getChildFile ("gateKPT").getChildFile ("conversations");
    base.createDirectory();
    return base;
}

juce::String ConversationStore::makeId()
{
    // timestamp + random suffix
    auto t   = juce::Time::getCurrentTime().formatted ("%Y-%m-%dT%H-%M-%SZ");
    auto rnd = juce::String::toHexString (juce::Random::getSystemRandom().nextInt64());
    return t + "-" + rnd;
}

ConversationStore::ConversationStore (juce::File rootDir) : root (std::move (rootDir))
{
    root.createDirectory();
}

juce::File ConversationStore::threadFile (const juce::String& id) const
{
    return root.getChildFile (id + ".json");
}

juce::String ConversationStore::createThread (const juce::String& name)
{
    auto id = makeId();

    auto* obj = new juce::DynamicObject();
    obj->setProperty ("id",        id);
    obj->setProperty ("name",      name);
    obj->setProperty ("createdAt", isoNow());
    obj->setProperty ("messages",  juce::Array<juce::var>());

    auto file = threadFile (id);
    file.replaceWithText (juce::JSON::toString (juce::var (obj), true));
    return id;
}

juce::Array<ThreadMeta> ConversationStore::listThreads() const
{
    juce::Array<ThreadMeta> out;

    auto files = root.findChildFiles (juce::File::findFiles, false, "*.json");
    for (auto f : files)
    {
        auto v = juce::JSON::parse (f);
        if (! v.isObject()) continue;
        auto* o = v.getDynamicObject();

        ThreadMeta t;
        t.id        = o->getProperty ("id").toString();
        t.name      = o->getProperty ("name").toString();
        t.createdAt = parseIso (o->getProperty ("createdAt").toString());
        out.add (t);
    }

    // Sort by createdAt ascending
    std::sort (out.begin(), out.end(), [] (const ThreadMeta& a, const ThreadMeta& b)
    {
        return a.createdAt < b.createdAt;
    });

    return out;
}

bool ConversationStore::renameThread (const juce::String& id, const juce::String& newName)
{
    auto f = threadFile (id);
    auto v = juce::JSON::parse (f);
    if (! v.isObject()) return false;
    v.getDynamicObject()->setProperty ("name", newName);
    return f.replaceWithText (juce::JSON::toString (v, true));
}

bool ConversationStore::deleteThread (const juce::String& id)
{
    return threadFile (id).deleteFile();
}

juce::Array<Message> ConversationStore::loadThread (const juce::String& id) const
{
    juce::Array<Message> out;

    auto f = threadFile (id);
    auto v = juce::JSON::parse (f);
    if (! v.isObject()) return out;

    auto* o = v.getDynamicObject();
    auto msgs = o->getProperty ("messages");

    if (msgs.isArray())
    {
        for (auto& mv : *msgs.getArray())
        {
            Message m;
            if (fromVar (mv, m))
                out.add (m);
        }
    }
    return out;
}

juce::var ConversationStore::toVar (const Message& m)
{
    auto* o = new juce::DynamicObject();
    o->setProperty ("ts",   m.ts.toISO8601 (true));
    o->setProperty ("role", m.role);
    o->setProperty ("text", m.text);
    return juce::var (o);
}

bool ConversationStore::fromVar (const juce::var& v, Message& m)
{
    if (! v.isObject()) return false;
    auto* o = v.getDynamicObject();
    m.ts   = parseIso (o->getProperty ("ts").toString());
    m.role = o->getProperty ("role").toString();
    m.text = o->getProperty ("text").toString();
    return true;
}

bool ConversationStore::appendMessage (const juce::String& id, const juce::String& role, const juce::String& text)
{
    auto f = threadFile (id);
    auto v = juce::JSON::parse (f);
    if (! v.isObject()) return false;

    auto* o = v.getDynamicObject();
    auto msgsVar = o->getProperty ("messages");
    juce::Array<juce::var> msgs = msgsVar.isArray() ? *msgsVar.getArray() : juce::Array<juce::var>();

    Message m { juce::Time::getCurrentTime(), role, text };
    msgs.add (toVar (m));
    o->setProperty ("messages", msgs);

    return f.replaceWithText (juce::JSON::toString (v, true));
}

} // namespace GateKPT::Data
