# gateKPT Music MacBook + PC Deployment Plan

This plan defines how to run the gateKPT/Voice Mirror music system with a MacBook and a PC without overloading the machine that is responsible for live audio.

## Core Principle

The MacBook should own the low-latency music performance. The PC should own heavy visuals, projector output, OBS/NDI, recording capture, and future visual rendering.

If one machine fails, the music should continue.

## Recommended Two-Machine Setup

```text
MacBook
  -> Ableton / Logic / MainStage
  -> vocal pitch correction and effects
  -> RC-505 / monitor / PA
  -> Voice Mirror Bridge control data
  -> network

PC
  -> Voice Mirror Visual App
  -> projector / OBS / NDI / capture
  -> optional visual recording
```

## MacBook Role

The MacBook is the performance instrument.

Responsibilities:

- Run Ableton Live, Logic, or MainStage.
- Receive mic, piano, drums, and RC-505/audio interface inputs.
- Handle vocal pitch correction, harmonies, delays, reverbs, and monitoring.
- Record the performance or stems when needed.
- Run the future `Voice Mirror Bridge` plugin.
- Send lightweight control data to the PC.

The MacBook should not:

- Render heavy visuals during a serious show unless no PC is available.
- Project the final visuals if Ableton is also recording and processing voice.
- Route browser/app audio back into the DAW.

## PC Role

The PC is the visual and production machine.

Responsibilities:

- Run Voice Mirror Visual App.
- Connect to the projector or LED/display output.
- Receive bridge frames from the MacBook over local network.
- Run OBS, NDI, TouchDesigner, Resolume, or projection mapping if needed.
- Record/stream the visual output if desired.
- Run higher visual quality modes when GPU headroom is available.

The PC should not:

- Be required for the MacBook to produce audio.
- Sit in the singer's monitor path.
- Send unstable audio back into the MacBook during performance.

## Network Plan

Use a direct Ethernet connection or a dedicated local router for shows.

Preferred:

```text
MacBook Ethernet/USB-C adapter -> dedicated router/switch -> PC Ethernet
```

Fallback:

```text
MacBook Wi-Fi -> same private network -> PC Wi-Fi/Ethernet
```

For reliability, avoid venue/public Wi-Fi.

Suggested static IPs:

```text
MacBook: 192.168.50.10
PC:      192.168.50.20
```

Bridge target:

```text
ws://192.168.50.10:8787
```

PC visual URL:

```text
http://127.0.0.1:8765/index.html?bridge=ws://192.168.50.10:8787
```

If the bridge server runs on the PC instead of the MacBook, reverse the bridge IP:

```text
ws://192.168.50.20:8787
```

## Audio Routing

MacBook live path:

```text
Mic -> audio interface -> DAW voice track
DAW voice track -> pitch correction / vocal FX
DAW output -> RC-505 / monitor / PA
RC-505 stereo -> DAW recording track, if needed
```

Visual data path:

```text
DAW voice track -> Voice Mirror Bridge plugin -> WebSocket/OSC -> PC visual app
```

Optional full-mix visual input:

```text
DAW master or RC-505 mix -> bridge plugin on master/loop track -> PC visual app
```

The PC should receive control data, not mission-critical monitor audio.

## Show Startup Checklist

1. Connect audio interface, mic, piano, drums, and RC-505 to the MacBook rig.
2. Connect MacBook and PC to the same dedicated network.
3. Start Ableton/Logic/MainStage on the MacBook.
4. Confirm vocal monitoring and pitch correction work before opening visuals.
5. Start Voice Mirror Bridge plugin/helper.
6. Start Voice Mirror Visual App on the PC.
7. Open the visual URL with the MacBook bridge IP.
8. Confirm `BRIDGE` status in the visual HUD.
9. Set PC visual quality to `Balanced`.
10. Fullscreen to projector.
11. Press `H` to hide controls.
12. Use `B` for blackout before the first song.

## Rehearsal Test Checklist

- Ableton records while visuals run for 30 minutes.
- Vocal monitoring has no added latency.
- Bridge disconnect does not affect audio.
- PC visual app reconnects after refresh/restart.
- Projector blackout works instantly.
- Quality can drop from `Balanced` to `Eco` without blanking.
- RC-505 loops continue if PC is unplugged.
- MacBook can finish a song with visuals offline.

## Single-Machine Fallback

If only the MacBook is available:

```text
MacBook -> DAW + Voice Mirror Visual App -> projector
```

Rules:

- Use `Eco` or `Balanced`, not `Ultra`.
- Close unused browser tabs and visual apps.
- Prefer bridge control data over browser mic analysis.
- Do not record high-resolution screen capture on the same MacBook during a live vocal performance.

If only the PC is available:

```text
PC -> DAW + Voice Mirror Visual App -> projector
```

Rules:

- Use a low-latency audio interface with stable ASIO drivers.
- Keep the DAW audio buffer conservative.
- Test vocal monitoring carefully before relying on it.

## Development Split

MacBook development:

- AU plugin testing.
- Logic/MainStage testing.
- Ableton Live testing.
- Low-latency vocal chain testing.
- macOS signing/notarization work.

PC development:

- Windows VST3 testing.
- Visual app performance testing.
- OBS/NDI workflows.
- Projector calibration.
- Installer testing.

Shared:

- Control protocol.
- Presets and show files.
- Documentation and onboarding.

## Release Targets

MacBook package:

- AU plugin.
- VST3 plugin.
- Bridge helper app if needed.
- Ableton/Logic templates.

PC package:

- VST3 plugin.
- Visual app.
- OBS/NDI integration docs.
- Projection setup presets.

Cross-platform:

- Same control protocol.
- Same preset file format.
- Same visual scenes.
- Same show file format.

## Safety Rules

- Audio first, visuals second.
- MacBook audio must survive PC failure.
- PC visuals must survive bridge reconnects.
- No cloud dependency for live shows.
- No visual process should be required for singing, looping, or recording.
- Always rehearse the exact machine, projector, and audio interface combination before a show.
