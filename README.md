# Voice Mirror

Projector-ready live visuals for a voice, piano, drums, and RC-505 performance rig.

## Start

Open `index.html` in a browser, choose an audio input, press **Start**, and send the browser window to the projector.

For Ableton routing later, send a voice-only or full-mix channel to a virtual audio device, then choose that device as the browser input.

## Controls

- `1`: Voice mode
- `2`: Storm mode
- `3`: Chords mode
- `4`: Grid mode
- `F`: Fullscreen

## Rig Plan

Best routing for clean vocal pitch correction:

```text
Mic -> Ableton voice track -> vocal FX / pitch correction -> RC-505 or master
Piano/drums -> RC-505
RC-505 stereo -> Ableton recording track
Ableton voice-only or master output -> Voice Mirror visuals
```

The browser app can listen to a mic, interface input, or virtual audio channel from Ableton.
