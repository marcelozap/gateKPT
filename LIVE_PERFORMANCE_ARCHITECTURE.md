# GateKPT Live Performance Architecture

This system must support a live artist workflow where the DAW records and alters the voice while visuals run on a projector. The rule is simple: visuals can fail, audio cannot.

## Core Rule

GateKPT Music OS and the visual engine must never sit in the critical audio path.

- Ableton, Logic, Pro Tools, or another DAW owns recording, monitoring, pitch correction, vocal effects, and live playback.
- GateKPT listens to a duplicate signal, control stream, or exported media reference.
- If GateKPT crashes, the music keeps running.
- If projector visuals get overloaded, blackout or drop to Eco quality before risking audio performance.

## Commercial Product Shape

The sellable version should be two cooperating products.

### 1. GateKPT Bridge

The bridge runs close to the DAW.

- Future target: JUCE VST3/AU plugin.
- Extracts pitch, loudness, frequency bands, transients, beat phase, MIDI/chord events, and section markers.
- Sends lightweight control data over local UDP/WebSocket/OSC-style messages.
- Does not render projector visuals.
- Does not process the artist's main audio path.

### 2. GateKPT Visual Engine

The visual engine owns projector and video output.

- Standalone desktop app or dedicated renderer process.
- Receives control data from the bridge or Music OS.
- Renders projector visuals, OBS capture, NDI future output, lyric pulses, waveform tunnels, camera overlays, and stage aura scenes.
- Supports Eco, Balanced, and Ultra quality modes.
- Supports instant blackout.
- Can restart independently from the DAW.

## Music OS Role

Music OS is the private production brain.

- Song workflow: drums, guitar/piano, vocals, review/export.
- Lyrics, captions, visual presets, take ratings, project notes.
- Focusrite / RC-505 routing memory.
- Live input meter and future recording capture.
- Command chat for safe actions: draft captions, sync media, queue export, update visual direction.

Music OS can preview visual direction, but the future commercial visual renderer should be separable.

## Projector Reliability

The visual system must include:

- Blackout command that works immediately.
- Quality mode that can be changed during rehearsal.
- HUD hide/show so controls do not appear on the projector.
- Frame-rate guardrails and particle limits.
- Output target awareness: projector, OBS, NDI future, recording preview.
- Clear "DAW safe" mode that reduces visual load while recording.

## Caption Safety

Captions can ruin a video if timing is wrong.

- Draft captions from lyrics first.
- Use beat-grid spacing as a first pass.
- Mark dense lines as review-needed.
- Export sidecar captions before burn-in.
- Burn captions into video only after explicit review/approval.

## Visual Quality Direction

The high-end version should feel like a real performance instrument:

- Audio-reactive movement, not random screensaver motion.
- Stage-aware colors: drums, harmony, vocals, review/export.
- Lyric-aware pulses and section transitions.
- Camera overlay mode for performance videos.
- Quality modes for weak laptops and high-end show machines.
- Presets that can be saved, recalled, and sold.

## 2D Website / 3D Desktop Split

The public `gatekpt.ai` demo should stay lightweight 2D canvas so visitors can try it instantly from LinkedIn, GitHub, or a phone.

The private GateKPT Music OS can own the heavier visual path:

- current: Avalonia 2D visual painting preview
- next: high-performance 2D renderer for richer particles/trails/export
- future: separate 3D renderer process for projector and OBS output

GateKPT Music OS should store the selected renderer path with each visual preset so the artist knows whether the current visual is safe preview, performance 2D, future 3D, or hybrid projector pipeline.

## Next Engineering Steps

- Add actual visualizer clip rendering to MP4.
- Add reviewed caption sidecar export.
- Add recording capture from the preferred Scarlett input.
- Add command planning before risky actions.
- Add a bridge protocol document shared by Music OS and the visual engine.
- Later: build a JUCE bridge plugin prototype.
