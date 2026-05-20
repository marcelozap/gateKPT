# Voice Mirror Visual App Plan

The visual app is the projector-facing product. It receives musical control data from the Ableton bridge plugin, optional local audio/MIDI inputs, and performer controls, then renders a reliable live visual show.

The product promise is simple: the musician can record, sing, loop, and perform in the DAW while Voice Mirror makes the room look alive without risking the audio.

## Product Role

The visual app is not the DAW and not the audio processor.

It should:

- Render the projector visuals.
- Receive bridge data from the DAW/plugin.
- Fall back to local audio input when no bridge exists.
- Let the performer control scenes, palettes, intensity, quality, and blackout.
- Save presets and show files.
- Output to projector, OBS, NDI, or projection-mapping workflows.

It should not:

- Process the singer's live monitoring audio.
- Sit in the critical audio path.
- Require internet during a show.
- Require advanced visual software for a basic user.

For the gateKPT MacBook + PC rig, the visual app should primarily run on the PC while the MacBook runs the DAW and bridge plugin. See [MACBOOK_PC_DEPLOYMENT_PLAN.md](./MACBOOK_PC_DEPLOYMENT_PLAN.md).

## Current App

The current browser version already includes:

- Canvas 2D renderer.
- Local audio input analysis.
- MIDI note input.
- WebSocket bridge receiver using `?bridge=ws://...`.
- Five scenes: Prism, Aurora, Cathedral, Storm, Grid.
- Palette control.
- Eco/Balanced/Ultra quality modes.
- Blackout.
- Fullscreen projector output.
- Hidden HUD mode.

Current bridge launch:

```text
http://127.0.0.1:8765/index.html?bridge=ws://127.0.0.1:8787
```

## App Surfaces

### Show Output

This is what the audience sees.

Requirements:

- Fullscreen on projector/second display.
- No visible controls during performance.
- No cursor visible after idle.
- Blackout state.
- High contrast and projector-safe brightness.
- Stable frame rate.

### Control HUD

This is what the performer or tech sees.

Controls:

- Start audio.
- Fullscreen.
- Blackout.
- Input source.
- Scene.
- Palette.
- Quality.
- Sensitivity.
- Bloom.
- Motion.
- Bridge status.
- Audio/MIDI meters.

Keyboard:

- `1-5`: scenes.
- `F`: fullscreen.
- `H`: hide/show HUD.
- `B`: blackout/live.
- `Q`: quality mode.
- `[` / `]`: sensitivity.

### Setup Wizard

Needed for sellable version.

Steps:

1. Select audio source or bridge connection.
2. Confirm DAW bridge is receiving signal.
3. Select projector/display.
4. Run brightness/contrast calibration.
5. Choose default show preset.
6. Save setup.

## Input Priority

1. Ableton bridge feature frames.
2. Browser/app audio input.
3. MIDI input.
4. Idle procedural animation.

Bridge frames win for 900 ms after the latest message. If bridge data stops, the visual app returns to local analysis or idle mode.

## Render Pipeline

```text
Input frame
  -> smoothing and normalization
  -> scene state
  -> layer compositor
  -> quality limiter
  -> projector output
```

Layer order:

```text
Background gradient field
Starfield / depth
Scene layer
Ribbon trails
Voice geometry
Particles / impacts
HUD
```

Each layer should become independently switchable in preset files.

## Scene Design

### Prism

Primary use: voice-forward songs, pitch expression, intimate moments.

Driven by:

- Pitch.
- Vocal level.
- Air/high band.
- Bridge intensity.

### Aurora

Primary use: sustained vocals, ambient piano, emotional sections.

Driven by:

- Smooth vocal level.
- Midrange.
- Bloom.
- Chord hue.

### Cathedral

Primary use: piano-driven harmony and chord changes.

Driven by:

- MIDI notes.
- Chord color.
- Low-mid warmth.
- Section intensity.

### Storm

Primary use: drums, RC-505 loop impacts, breakdowns, big transitions.

Driven by:

- Bass.
- Onset.
- Beat pulse.
- High band.

### Grid

Primary use: tempo-locked electronic sections and structured parts.

Driven by:

- Bass.
- Beat/phase.
- Motion.
- Bridge scene automation.

## Quality Modes

Eco:

- Lower pixel ratio.
- Lower star density.
- Lower particle and ribbon limits.
- Lower pitch-detection frequency.
- Target: 30 fps while Ableton is recording heavily.

Balanced:

- Default mode.
- Target: stable 60 fps at 1080p on current Apple Silicon.

Ultra:

- Higher detail.
- Use only after testing on the actual show machine.
- Should support 4K or large projection surfaces only when GPU headroom exists.

## Preset System

Preset file direction:

```json
{
  "version": 1,
  "name": "Chorus Bloom",
  "scene": "aurora",
  "palette": "royal",
  "quality": "balanced",
  "sensitivity": 1.2,
  "bloom": 0.8,
  "motion": 1.1,
  "blackoutOnLoad": false,
  "layers": {
    "background": true,
    "starfield": true,
    "scene": true,
    "ribbons": true,
    "voiceGeometry": true,
    "particles": true
  },
  "projector": {
    "brightness": 1.0,
    "contrast": 1.0,
    "gamma": 1.0,
    "safeArea": 0.04
  }
}
```

Show file direction:

```json
{
  "version": 1,
  "name": "May 2026 Live Set",
  "songs": [
    {
      "title": "Opening Loop",
      "preset": "Prism Voice",
      "bridgeScene": "prism",
      "notes": "Voice-only bridge input"
    }
  ]
}
```

## Projection Features

Required:

- Fullscreen second display.
- Blackout.
- HUD hide.
- Brightness, contrast, gamma.
- Safe area.
- 720p, 1080p, 4K presets.
- Frame-rate cap.

Advanced:

- Keystone/grid calibration.
- Corner pinning.
- Test pattern.
- Multi-output support.
- NDI output.
- Spout/Syphon-style output where platform support allows.

## OBS, NDI, and Venue Workflows

Basic musician:

```text
Visual app fullscreen -> projector
```

Streamer:

```text
Visual app -> OBS Browser Source or Window Capture -> stream/record
```

Venue:

```text
Visual app -> NDI/OBS/TouchDesigner/Resolume -> projection mapper -> projector
```

Voice Mirror should integrate with venue tools rather than trying to replace every projection system.

## Packaging Plan

### Phase 1: Browser App

- Keep current app.
- Add bridge support.
- Add preset import/export.
- Add calibration overlay.
- Add performance stats.

### Phase 2: Desktop App

Package with Tauri or Electron.

Requirements:

- One-click launch.
- Built-in local web server or native renderer.
- App settings storage.
- Display selection.
- Auto-open last show.
- Crash recovery.
- Offline operation.

### Phase 3: Pro Renderer

Add WebGL/WebGPU scenes:

- GPU particles.
- Fluid trails.
- Feedback buffers.
- Bloom.
- Signed-distance geometry.
- Audio-reactive displacement.

Keep Canvas 2D as safe fallback.

## Reliability Requirements

The app must survive show conditions:

- Bridge disconnects.
- Audio input changes.
- Projector is connected after launch.
- Fullscreen exits unexpectedly.
- CPU spikes from Ableton.
- Browser/app is restarted mid-show.

Acceptance criteria:

- Blackout responds within 100 ms.
- Bridge fallback occurs within 900 ms.
- Quality mode changes do not blank the canvas.
- No memory growth over a 2-hour session.
- No frame spikes above 50 ms in Balanced mode under normal scenes.
- Visual crash does not affect DAW audio.

## Metrics and Diagnostics

Commercial app should show:

- FPS.
- Dropped frames.
- Bridge status.
- Last bridge frame age.
- Audio input level.
- MIDI status.
- Render quality.
- Output resolution.
- CPU/GPU warning if available.

Diagnostics should be visible in setup mode and hidden in show mode.

## Development Roadmap

### Milestone 1: Show-Ready Browser App

- Keep current visuals.
- Add preset import/export.
- Add calibration/test pattern.
- Add performance stats.
- Add bridge simulator for development.

### Milestone 2: Bridge Integration

- Consume `CONTROL_PROTOCOL.md` frames.
- Add reconnect UI.
- Add source selection: Bridge, Local Audio, Idle.
- Add per-source smoothing profiles.

### Milestone 3: Desktop Packaging

- Tauri/Electron app.
- Display picker.
- Local settings.
- Show file manager.

### Milestone 4: Pro Output

- OBS/NDI workflow documentation.
- Optional NDI sender.
- TouchDesigner/Resolume OSC templates.
- Projection calibration mode.

### Milestone 5: Commercial Polish

- Installer.
- Code signing.
- Demo presets.
- Onboarding.
- Beta test with real Ableton/Logic/projector rigs.
