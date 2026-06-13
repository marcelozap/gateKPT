# GateKPT Vocoder Performance Plan

## Goal

Make GateKPT support a Daft Punk-style performance lane:

`looping beat -> live voice -> robot/vocoder color -> screen visual -> webcam/Elgato clip`

This should feel playable, not like a DAW menu.

## Current v1

- `Robot` vocal color is available in the recorder.
- Typing `robot vocoder`, `vocoder`, `daft`, or `talkbox` renders a processed copy of the selected take.
- The original take stays safe.
- This is a vocoder-style render, not a true live carrier vocoder yet.

## Real Live Version

The true version needs three signals:

1. **Carrier**
   - A synth pad, chord, or beat loop that provides the robotic tone.
   - Later: load a loop or generate a simple carrier tone inside GateKPT.

2. **Voice**
   - Scarlett/Rode mic input.
   - GateKPT tracks voice level and formant-style movement.

3. **Control**
   - Webcam/Elgato view.
   - Hand gesture changes the effect.
   - Palm open could brighten/widen.
   - Fist could darken/compress.
   - Hand height could control mix or filter.

## Weekend Prototype

1. Record a beat or loop.
2. Record a vocal phrase.
3. Select `Robot`.
4. Render and play.
5. Screen-record GateKPT with the visual stage moving.

## Later Build

- Add a `VOCODER` live mode.
- Add a carrier loop slot.
- Add webcam preview panel.
- Add gesture detection.
- Map gesture values to:
  - wet/dry mix
  - filter brightness
  - robot amount
  - visual color intensity

## Rule

Keep this simple:

`Beat on. Voice in. Robot color. Visual moves. Clip exports.`
