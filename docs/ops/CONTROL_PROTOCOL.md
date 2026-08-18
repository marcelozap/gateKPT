# Voice Mirror Control Protocol

This protocol connects the DAW-side bridge plugin to the visual engine. It is designed so audio remains safe if the visual system disconnects.

## Transport

Phase 1 transport is WebSocket over localhost:

```text
ws://127.0.0.1:8787
```

The visual app connects as a client by opening:

```text
http://127.0.0.1:8765/index.html?bridge=ws://127.0.0.1:8787
```

The future DAW bridge app/plugin companion should host the WebSocket server. If the bridge is unavailable, the visualizer falls back to local browser audio input.

## Message Rate

- Target: 30 Hz.
- Minimum useful rate: 15 Hz.
- Maximum recommended rate: 60 Hz.
- Messages should be latest-state frames, not guaranteed event history.

If the receiver has not seen a bridge frame for 900 ms, it returns to local analysis mode.

## Feature Frame

All values are normalized `0.0` to `1.0` unless otherwise noted.

```json
{
  "type": "featureFrame",
  "version": 1,
  "source": "voice",
  "host": "Ableton Live",
  "sampleRate": 48000,
  "blockSize": 128,
  "timeSeconds": 123.456,
  "rms": 0.42,
  "level": 0.46,
  "peak": 0.71,
  "bass": 0.12,
  "lowMid": 0.28,
  "mid": 0.51,
  "high": 0.32,
  "air": 0.18,
  "onset": 0.83,
  "beat": true,
  "pitchHz": 220.0,
  "pitchConfidence": 0.91,
  "note": "A3",
  "midiNotes": [60, 64, 67],
  "scene": "prism",
  "palette": "auto",
  "intensity": 0.76,
  "bloom": 0.72,
  "blackout": false
}
```

## Field Definitions

- `type`: Message type. Use `featureFrame` for realtime visual control.
- `version`: Protocol version. Current version is `1`.
- `source`: Suggested values: `voice`, `master`, `drums`, `piano`, `loop`.
- `host`: Optional DAW name for diagnostics.
- `sampleRate`: DAW sample rate.
- `blockSize`: DAW audio buffer size.
- `timeSeconds`: Monotonic sender time.
- `rms`: Short-window RMS level.
- `level`: Producer-smoothed performance level. Visual engine prefers this when present.
- `peak`: Peak level.
- `bass`: Low band, roughly 35-150 Hz.
- `lowMid`: Low-mid band, roughly 150-450 Hz.
- `mid`: Mid band, roughly 450-2200 Hz.
- `high`: High band, roughly 2200-7600 Hz.
- `air`: Air band, roughly 7600-14500 Hz.
- `onset`: Transient strength.
- `beat`: Optional event flag for beat/transient hit.
- `pitchHz`: Fundamental pitch in Hz. Use `0` when unknown.
- `pitchConfidence`: Confidence from `0.0` to `1.0`.
- `note`: Optional note label.
- `midiNotes`: Active MIDI note numbers.
- `scene`: Optional visual scene command: `prism`, `aurora`, `cathedral`, `storm`, `grid`.
- `palette`: Optional palette command: `auto`, `neon`, `ember`, `ice`, `royal`.
- `intensity`: Macro performance control.
- `bloom`: Visual glow macro.
- `blackout`: Emergency output state.

## Error Handling

- Invalid JSON is ignored.
- Missing numeric fields default to current smoothed visual state.
- Unknown scene or palette values are ignored.
- Network failure must not affect DAW audio.
- The visual engine should reconnect automatically.

## Future OSC Mapping

OSC paths should mirror the JSON names:

```text
/vm/level 0.46
/vm/pitchHz 220.0
/vm/onset 0.83
/vm/midiNotes 60 64 67
/vm/scene prism
/vm/blackout 0
```

OSC is useful for TouchDesigner, Resolume, Max/MSP, lighting desks, and show-control workflows.
