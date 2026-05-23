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
- Native media file picker workflow.
- Media metadata inspection with FFprobe fallback.
- NAudio envelope/correlation sync analyzer.
- FFmpeg extraction bridge, activated when `ffmpeg` is available on PATH.
- Toolchain status indicator.
- Review clip render workflow with platform presets.
- Export queue, export history, timeline markers, and production brief snapshots.
- Vocal processing presets for clean vocal, spoken clarity, music performance, and dry sync.
- Windows audio endpoint and MIDI port discovery for Focusrite / RC-505 routing.
- Live input peak meter for the preferred Focusrite / RC-505 input.
- Song workflow path: drums, guitar/piano, vocals, review/export.
- Word-driven mix intent parser for stage-aware filter suggestions.
- Lyric vault for hooks, fragments, tags, moods, and song ideas.
- Visualizer preset module for stage-aware lyric/audio visuals.
- Safe caption drafts with beat-grid timing and review-needed flags.

## Next Engineering Steps

- Bundle or install FFmpeg automatically.
- Add recording capture from preferred input into the project library.
- Add stage-specific recording lanes and file naming.
- Translate mix intent into actual FFmpeg/NAudio render chains per track.
- Add lyric search, rhyme clusters, and section labels.
- Render visualizer clips to MP4 using audio energy and lyric timing.
- Burn only reviewed captions into video exports; otherwise export sidecar SRT.
- Add RC-505 MIDI transport/loop commands once device mapping is confirmed.
- Draw real timeline lanes with draggable sync offset.
- Add loudness measurement before and after render.
- Add waveform timeline zoom and marker snapping.
- Add take rating and A/B comparison.
- Add caption/transcript generation.
- Add export queue progress, cancellation, and retry.
- Add bundled FFmpeg discovery so the app does not depend only on `PATH`.
