# Voice Mirror

Projector-ready live visuals for a voice, piano, drums, and RC-505 performance rig. It is built to sit beside Ableton, listen to a voice-only send or the full performance mix, and turn pitch, dynamics, MIDI chords, and drum energy into cinematic movement.

## Start

Open `index.html` in a browser, choose an audio input, press **Start**, and send the browser window to the projector.

For Ableton routing later, send a voice-only or full-mix channel to a virtual audio device, then choose that device as the browser input.

Recommended local launch:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8765/index.html`.

## Controls

- `1`: Prism
- `2`: Aurora
- `3`: Cathedral
- `4`: Storm
- `5`: Grid
- `F`: Fullscreen
- `H`: Hide/show the HUD
- `[` / `]`: Sensitivity down/up

## Production Features

- Adaptive gain mapping so quiet vocals and loud loop sections both produce movement
- Pitch tracking for note display and voice color
- MIDI piano note tracking for harmonic palettes
- Drum/transient detection for screen hits, particles, and beat pulses
- Five visual worlds designed for projector use
- Palette selector for auto, neon, ember, ice, and royal color systems
- Motion, bloom, and sensitivity controls for different rooms and projectors

## Rig Plan

Best routing for clean vocal pitch correction:

```text
Mic -> Ableton voice track -> vocal FX / pitch correction -> RC-505 or master
Piano/drums -> RC-505
RC-505 stereo -> Ableton recording track
Ableton voice-only or master output -> Voice Mirror visuals
```

The browser app can listen to a mic, interface input, or virtual audio channel from Ableton.
