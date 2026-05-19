# Voice Mirror Rig Setup

## Goal

Keep the voice separate before it hits the RC-505 loops, then use that voice-only signal for pitch correction, vocal effects, and voice-driven visuals.

## Best Signal Flow

```text
Mic
  -> audio interface input 1
  -> Ableton voice track
  -> pitch correction / vocal effects
  -> RC-505 input or Ableton master

Electric piano
  -> RC-505 or audio interface input 2

Drums
  -> RC-505 or audio interface input 3/4

RC-505 stereo output
  -> Ableton recording track

Ableton voice-only send or master send
  -> Voice Mirror visual input
  -> projector
```

## Ableton Tracks

1. `VOICE IN`
   - Audio From: mic input
   - Monitor: In
   - Effects: pitch correction, gate, compressor, delay, reverb
   - Send: to visuals or virtual audio device

2. `RC-505 LOOP MIX`
   - Audio From: RC-505 stereo USB or interface inputs
   - Monitor: In
   - Record Arm: on when capturing the performance

3. `PIANO MIDI`
   - MIDI From: electric piano, if available
   - Monitor: In
   - Use this to drive chord colors in visuals

4. `DRUM TRIGGER`
   - Audio From: drum input or RC-505 mix
   - Use this for flashes, impacts, and stutter visuals

## Visual Routing

The visualizer can listen to:

- A microphone input
- An audio interface input
- A virtual audio device carrying Ableton audio
- The RC-505 USB audio input, if exposed to the browser

For the cleanest voice visuals, route the `VOICE IN` track to a virtual audio device and choose that as the input in Voice Mirror.

For full-room energy visuals, route Ableton master or the RC-505 stereo mix instead.

## Launch

From this folder:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8765/index.html
```

Press **Start**, choose the input, and use **Fullscreen** for the projector.

## Performance Map

- Voice pitch: ring color and note meter
- Voice loudness: ring size, brightness, bloom
- Bass/drum energy: particle impacts and screen pulses
- High frequencies: sparks and sharp movement
- Piano MIDI notes: chord palette and column mode
- Keys `1` to `4`: change visual worlds
- Key `F`: fullscreen
