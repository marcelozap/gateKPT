# GateKPT Music OS Technical Roadmap

The app is a private video/audio production workstation, not a marketing surface.

## Core Value

Turn raw performance footage into platform-ready clips:

1. Import camera video and final vocal/audio.
2. Extract camera/reference audio.
3. Generate waveform envelopes.
4. Estimate vocal sync offset.
5. Nudge/verify sync against mouth movement.
6. Mix vocal and backing audio.
7. Export for LinkedIn, TikTok, YouTube, and portfolio pages.

## Current Foundation

- Avalonia desktop shell.
- Persistent local session log.
- Media path analysis workflow.
- NAudio envelope/correlation sync analyzer.
- FFmpeg extraction bridge, activated when `ffmpeg` is available on PATH.
- Toolchain status indicator.

## Next Engineering Steps

- Add native file picker buttons instead of pasted paths.
- Bundle or install FFmpeg automatically.
- Store project files, media references, offsets, and export settings.
- Draw real timeline lanes with draggable sync offset.
- Add `-100ms`, `-10ms`, `+10ms`, `+100ms` nudge controls.
- Use FFmpeg to render synced review clips.
- Add loudness measurement and normalization.
- Add vocal chain presets: clean speech, vocal performance, noisy room, car/phone recording.
