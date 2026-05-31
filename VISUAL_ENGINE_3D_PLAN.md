# GateKPT 3D Visual Engine Plan

GateKPT should use two visualizer tiers.

## Public Website Tier

`gatekpt.ai` uses a lightweight 2D browser canvas demo.

- starts only after user action
- uses local microphone analysis only
- no upload, backend, AI call, or private project data
- works for LinkedIn, GitHub, phones, and casual visitors
- proves the idea without requiring install

This tier should stay simple and fast.

## Private MusicOS Tier

GateKPT MusicOS can evolve into a serious 2D/3D performance renderer.

The private app owns:

- Focusrite / RC-505 routing memory
- looper-first song workflow
- lyrics, captions, project memory, takes, exports
- visual presets and stage direction
- safety controls: blackout, DAW-safe mode, quality mode

The visual engine should never sit in the critical audio path. It listens to duplicated audio or control data and can fail without stopping the show.

## Renderer Path

The app now tracks a renderer path inside visualizer settings:

- `2D Avalonia preview`: safe in-app planning and screenshots
- `2D Skia performance`: next richer 2D path for particles, trails, and exportable paintings
- `3D standalone engine`: future GPU-backed renderer in a separate process
- `Hybrid projector pipeline`: MusicOS controls scenes while a dedicated renderer owns projector/OBS output

## Recommended Build Order

1. Keep Avalonia visual painting as the stable preview.
2. Add SkiaSharp or another high-performance 2D renderer for richer local visuals.
3. Define a renderer-control protocol:
   - energy
   - transient strength
   - dominant pitch / note estimate
   - song section
   - selected palette
   - lyric fragment
   - blackout / quality / output target
4. Prototype a separate renderer process.
5. Add 3D scenes only after the control protocol and safety commands are stable.

## 3D Safety Rules

- Audio and recording stay in the DAW or MusicOS capture layer.
- 3D renderer is restartable.
- Blackout must be instant.
- Quality mode must be switchable during rehearsal.
- The app must clearly show whether it is using preview, performance 2D, or future 3D.
- Public website demo remains 2D and optional.

## Product Language

Public site:

> Try a lightweight browser demo.

Private app:

> Build the real performance artwork from your rig.

This keeps the website accessible and the desktop app powerful.
