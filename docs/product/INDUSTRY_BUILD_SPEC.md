# Voice Mirror Industry Build Spec

This document describes the technical direction for turning Voice Mirror from a live visual prototype into a sellable performance product for musicians, producers, and small venues.

## Product Goal

Voice Mirror should be a performance system, not a fragile visual toy. The DAW remains responsible for audio recording, monitoring, pitch correction, effects, and loop capture. Voice Mirror listens to duplicate audio/MIDI/control streams and renders high-quality visuals for projectors, OBS, or projection mapping systems.

## Sellable Product Shape

### 1. DAW Plugin: `Voice Mirror Bridge`

Build as a JUCE plugin with VST3 and AU targets first.

Responsibilities:

- Analyze voice-only audio in the DAW.
- Extract RMS, peak, spectral bands, transient/onset, pitch, confidence, note, and formant-like features.
- Read MIDI notes/chords from piano tracks when inserted on MIDI-capable tracks.
- Expose plugin parameters for Intensity, Scene, Palette, Bloom, Motion, Blackout, and Quality.
- Send control data to the visual engine over local UDP/WebSocket/OSC.
- Never add latency to the monitoring path.
- Never require the visual engine to be running for the DAW session to work.

Do not put expensive rendering inside the plugin. A DAW plugin must remain deterministic, low-latency, and safe under recording load.

### 2. Standalone Visual Engine

Current browser app becomes the first visual engine. The commercial version should eventually ship as:

- Electron/Tauri desktop app for simple customer install.
- Browser fallback for open/prototype use.
- Optional TouchDesigner/NDI/OBS integration for advanced users.

Responsibilities:

- Render visuals at 30/60 fps with quality controls.
- Receive DAW bridge control data.
- Listen to fallback audio input if no plugin bridge is present.
- Output fullscreen to projector.
- Support NDI or OBS Browser Source workflows for production environments.
- Store presets and show files.
- Provide an emergency blackout state.

### 3. Routing Model

Recommended live path:

```text
Mic -> audio interface -> Ableton voice track
Ableton voice track -> pitch correction / vocal chain -> monitor / RC-505 / master
Ableton voice track -> Voice Mirror Bridge plugin -> local control stream
Ableton master or RC-505 mix -> recording track
Voice Mirror Visual Engine -> projector / OBS / NDI / projection mapper
```

Voice Mirror must never be inserted in a way that blocks or delays the singer's monitor path.

For the gateKPT live rig, the preferred deployment is a two-machine setup: MacBook for DAW/audio and PC for visual rendering/projector output. See [MACBOOK_PC_DEPLOYMENT_PLAN.md](../ops/MACBOOK_PC_DEPLOYMENT_PLAN.md).

## Technical Architecture

### Plugin Layer

Framework:

- JUCE for cross-platform plugin development.
- First formats: VST3 and AU.
- Later formats: standalone plugin host, LV2, possibly AAX only if there is commercial demand.

Plugin processing:

- Audio thread computes only lightweight features.
- Use lock-free queues or atomics to hand feature frames to a background/network thread.
- No memory allocation, file IO, socket writes, or logging directly inside the realtime audio callback.
- Target control frame rate: 30-60 Hz, independent from audio buffer size.
- Include a bypass-safe output path.

Feature frame:

```json
{
  "version": 1,
  "source": "voice",
  "time": 123.456,
  "rms": 0.42,
  "peak": 0.71,
  "bass": 0.12,
  "lowMid": 0.28,
  "mid": 0.51,
  "high": 0.32,
  "air": 0.18,
  "onset": 0.83,
  "pitchHz": 220.0,
  "pitchConfidence": 0.91,
  "midiNotes": [60, 64, 67],
  "scene": "prism",
  "intensity": 0.76
}
```

Transport:

- Phase 1: WebSocket on localhost for easy browser/Electron integration.
- Phase 2: OSC/UDP for TouchDesigner, Resolume, Max/MSP, and show-control compatibility.
- Phase 3: NDI metadata or video output for pro AV environments if needed.

### Visual Layer

Rendering:

- Continue Canvas 2D for fast iteration.
- Add WebGL/WebGPU renderer when visuals require shader quality, fluid fields, particles at scale, or high-resolution projector output.
- Decouple analysis receive rate from render rate.
- Use quality presets for projector/laptop reliability.

Visual scenes:

- Prism: vocal pitch and intensity geometry.
- Aurora: sustained vocals, pads, ambience.
- Cathedral: piano MIDI/harmony columns.
- Storm: drums/transients/RC-505 impact.
- Grid: tempo/phase/transport feel.

Production controls:

- Blackout.
- HUD hide.
- Quality mode.
- Scene lock.
- MIDI learn.
- Preset save/load.
- Panic reset.

### Synchronization

Ableton Link should be considered for tempo/beat/phase sync between Ableton-aware apps. MIDI clock can be a fallback, but Link is better for multi-application tempo sync when available.

The product should support:

- Free-running visual response from audio features.
- Tempo-locked animation when Link/MIDI clock is available.
- Manual tap tempo fallback.

### Projection and Broadcast

For basic users:

- Fullscreen output to a second display/projector.

For streamers and venues:

- OBS Browser Source.
- NDI output or NDI-compatible app pipeline.
- TouchDesigner or projection mapping handoff.

Projection-specific requirements:

- High contrast mode.
- Safe-area HUD that can be hidden.
- Blackout.
- Gamma/brightness controls.
- Resolution presets: 720p Eco, 1080p Balanced, 4K Ultra.
- Frame-rate cap: 30/60 fps.

## Product Quality Bar

### Realtime Safety

- Audio must continue if visuals crash.
- Plugin must not allocate or block in realtime processing.
- Network dropouts must not affect audio.
- Visual engine must reconnect automatically.
- All visual inputs should be smoothed to prevent jitter.

### Performance Targets

- Plugin added latency: 0 samples preferred.
- Plugin CPU: under 2-3% on a current Mac for analysis-only use.
- Visual engine: stable 60 fps at 1080p Balanced on Apple Silicon.
- Visual engine: stable 30 fps Eco while Ableton records multi-track audio.
- Startup time: under 5 seconds to usable projector output.

### Commercial UX

- One installer.
- First-run setup wizard.
- Ableton/Logic/Reaper templates.
- Preset packs for performance styles.
- Built-in routing test tone and mic test.
- Crash-safe settings restore.
- Clear “DAW audio is safe” design.

## Development Roadmap

### Phase 1: Pro Prototype

- Keep browser visualizer.
- Add WebSocket control receiver.
- Add saved presets.
- Add calibration screen.
- Add audio input diagnostics.

### Phase 2: DAW Bridge Plugin

- Create JUCE project.
- Build VST3/AU bridge plugin.
- Implement analysis features and local WebSocket/OSC output.
- Test in Ableton and Logic.
- Provide Ableton template.

### Phase 3: Commercial Visual Engine

- Package app with Electron or Tauri.
- Add preset manager and show files.
- Add optional NDI/OBS workflows.
- Add performance monitor and dropped-frame indicator.

### Phase 4: Sellable Release

- Code signing and notarization for macOS.
- Windows build and installer.
- Licensing or activation.
- Documentation, demo videos, onboarding.
- Beta testing with musicians using real DAW/projector rigs.

## Research Notes

- JUCE is the most practical starting framework because it can build VST3 and AU plugins from one C++ codebase.
- VST3 separates processor and controller concepts, so the plugin should keep analysis and UI/control concerns cleanly separated.
- AU support matters for Logic users on macOS.
- Ableton Link is useful for tempo, beat, and phase synchronization between apps.
- MIDI/MIDI 2.0 matters for piano/chord control, but MIDI 1.0 compatibility should remain the default customer path.
- BlackHole or similar virtual audio routing can be used for free Mac routing during early testing, but the commercial system should prefer plugin-to-visual control data over routing audio into a browser.
- TouchDesigner and OBS/NDI matter for high-end venue and projection workflows, but should be optional integrations, not required for a new user.
