# Voice Mirror Visual Engine Technical Design

The visual engine receives musical control data and renders projector-safe visuals. It must be beautiful, but reliability is the commercial feature.

## Current Engine

The current version is a browser Canvas 2D renderer with:

- Local audio fallback.
- MIDI note input.
- WebSocket bridge input using `?bridge=ws://...`.
- Five scenes.
- Quality modes.
- Blackout.
- Fullscreen projector output.

## Input Priority

1. Bridge feature frames from DAW/plugin.
2. Browser audio input.
3. Idle procedural animation.

Bridge frames win for 900 ms after the latest message. If the bridge stops, the engine returns to local audio or idle mode.

## Renderer Layers

```text
Background gradient field
Starfield depth layer
Scene layer: Prism/Aurora/Cathedral/Storm/Grid
Ribbon layer
Voice ring layer
Particle layer
HUD layer
```

Each layer should be independently switchable in future preset files.

## Quality Modes

Eco:

- Lower device pixel ratio.
- Lower star density.
- Lower particle/ribbon limits.
- Lower pitch-detection frequency.
- Target: 30 fps while DAW is under load.

Balanced:

- Default.
- Target: 60 fps at 1080p on current Apple Silicon.

Ultra:

- Higher density and detail.
- Use only after rehearsal on the actual machine.

## Commercial Engine Roadmap

### Browser Prototype

- Keep for development and user testing.
- Good for OBS Browser Source.
- Good for quick projector output.

### Desktop App

Package with Electron or Tauri.

Requirements:

- One-click launch.
- Built-in local WebSocket receiver.
- Preset save/load.
- Monitor/projector selection.
- Crash-safe config.
- Performance meter.
- Frame-rate cap.

### Shader Renderer

Move high-end visuals to WebGL/WebGPU when needed.

Shader candidates:

- Fluid fields.
- Signed-distance geometry.
- GPU particles.
- Feedback trails.
- Bloom/post-processing.
- Audio-reactive displacement.

## Projection Requirements

- Fullscreen second display support.
- Blackout.
- Gamma and brightness controls.
- High-contrast mode.
- Safe control HUD.
- Hidden HUD during performance.
- 720p/1080p/4K presets.
- No required internet access.

## OBS/NDI/TouchDesigner Path

Basic:

- Browser fullscreen to projector.

Streamer:

- OBS Browser Source.

Venue:

- NDI output or capture.
- TouchDesigner/Resolume receives OSC or NDI.
- Projection mapping happens downstream.

Voice Mirror should not try to replace every pro visual tool. It should generate musical control and strong visuals, then integrate cleanly.

## Preset File Direction

Future preset:

```json
{
  "version": 1,
  "name": "Chorus Bloom",
  "scene": "aurora",
  "palette": "royal",
  "quality": "balanced",
  "bloom": 0.8,
  "motion": 1.1,
  "sensitivity": 1.2,
  "layers": {
    "starfield": true,
    "ribbons": true,
    "particles": true
  }
}
```

## Reliability Tests

- Visual engine runs for 2 hours without memory growth.
- Bridge reconnects after plugin/helper restart.
- Blackout works instantly.
- HUD hide works before/after fullscreen.
- Quality mode changes do not crash or blank the canvas.
- No frame spikes above 50 ms in Balanced mode during normal scenes.
