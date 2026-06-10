# GateKPT Music OS

> **Primary active GateKPT app.** This is the C#/.NET Avalonia desktop Music OS. Use this repo for real product functionality: looper, Focusrite/RC-505 capture, take review, captions, visual painting, autosaves, and project memory.

Public website work belongs in `C:\Users\Green Machine\Desktop\no-going-back` until `gatekpt.ai` is moved to a cleaner dedicated web repo.

GateKPT Music OS is a C#/.NET creative operating system for live-loop artists, combining RC-505 performance planning, local project memory, lyric/caption workflows, stem capture, and audio-reactive visual artwork.

It is not a toy DAW clone, generic music app, or replacement for musicianship and hardware. It sits above the creative rig as the memory, structure, visual, and production layer for artists who build songs through live performance.

## Product Direction

GateKPT Music OS helps live creators move from improvisation to finished media. It connects the structure of a song, the behavior of a live-looping rig, the memory of a project, and the visual identity of a performance into one focused artist cockpit.

Built in C#/.NET with Avalonia, it supports RC-505 cue planning, section-based song workflows, lyric and caption memory, stem capture, hardware routing notes, and audio-reactive visual painting driven by live input.

## Product Pillars

### Live Loop Workflow

Guide RC-505-based song building through sections, cue cards, layer order, and performance memory.

### Project Memory

Preserve lyrics, captures, takes, captions, routing notes, stems, visual presets, and export tasks in a unified local project file.

### Audio-Reactive Visual Artwork

Use live Focusrite/RC-505 input to generate always-on visual paintings that can become performance backdrops, video material, or stage visuals.

The public website uses a lightweight 2D browser demo. The private desktop app can evolve into the serious 2D/3D performance engine. See [VISUAL_ENGINE_3D_PLAN.md](VISUAL_ENGINE_3D_PLAN.md).

### Video-First Music Production

Support captions, lip-sync review, export planning, aspect ratios, loudness targets, and platform-ready video workflows.

### Artist Cockpit

Reduce creative overload by replacing scattered notes, DAW friction, and unfinished ideas with one focused daily operating system.

## Stack

- C# / .NET 9
- Avalonia UI
- MVVM structure with `CommunityToolkit.Mvvm`
- NAudio for Windows audio endpoints and live metering
- MIDI device discovery for hardware-aware routing
- FFmpeg / FFprobe for video extraction and MP4 review rendering

## Hardware-Aware Workflow

The app can scan active Windows audio endpoints and MIDI ports through NAudio. Use the Hardware Routing panel to save the intended studio path:

- Focusrite / Scarlett: primary mic/instrument input and monitoring output.
- RC-505 Loop Station: loop audio device if exposed over USB, plus MIDI input/output when available.
- Live input meter: start/stop a local peak meter for the preferred input without recording or transmitting audio.
- Future layer: one-click recording, RC-505 transport/scene commands, and loop capture into the project timeline.

## Live Performance Rule

GateKPT visuals should never sit in the critical audio path. The DAW records and alters the voice; GateKPT listens to a duplicate signal/control stream and drives projector visuals. If visuals fail, the music keeps running.

See [LIVE_PERFORMANCE_ARCHITECTURE.md](LIVE_PERFORMANCE_ARCHITECTURE.md).

## Section-Based Song Workflow

GateKPT Music OS is shaped around the normal build order:

- Drums first: tempo, groove, loop length, kick/snare feel.
- Guitar / piano second: harmony, rhythm pocket, arrangement.
- Vocals last: melody, diction, emotion, doubles, hook clarity.
- Built-in looper alpha: record, overdub, replace, mute/solo, play one lane, or play the whole arrangement.
- Lane readiness: see whether the song has drums, harmony bed, vocal lane, captions, routing, and export direction.
- Review / export: rate takes, sync video, process vocal, render clips.
- Lyric vault: save hooks, fragments, moods, tags, and pull the latest lyric into active session notes.
- Visual system: save mode, palette, motion, lyric source, intensity, and live-meter-aware visual direction inside the project.
- Renderer path: mark whether the current visual is an in-app 2D preview, future Skia performance renderer, standalone 3D engine, or hybrid projector pipeline.
- Projector safety: visualizer presets include quality mode, output target, blackout, and DAW-safe mode.
- Captions: draft lyric captions on a beat grid, defaulting to 3-beat spacing, and flag dense lines as review-needed instead of burning in bad timing.
- Command layer: queue local actions such as `add captions`, `sync video`, `add vocal layers`, or `export reels`; destructive work drafts or queues instead of forcing changes.
- Looper command layer: type moves such as `prime drums`, `prime vocal`, `overdub`, `replace loop`, `play arrangement`, or `stop all loops`.

## Built-In Looper Alpha

The looper is designed around a live-loop artist workflow rather than a traditional timeline:

- `Record` protects existing loops and only captures empty lanes.
- `Overdub` captures another pass/take and preserves take history for future comping.
- `Replace` intentionally overwrites the active lane.
- `Play arrangement` starts all playable recorded lanes while respecting mute/solo.
- Project memory saves looper lane state, stem paths, capture mode, take count, and take archive.

The current alpha records WAV stems from the selected Windows input through NAudio. True DAW-grade overdub mixing/comping is planned as the next deeper audio-engine layer.

## Resume Bullet

Built GateKPT Music OS, a C#/.NET Avalonia desktop creative OS for live-loop music production, combining RC-505 workflow planning, local project memory, lyric/caption management, stem capture, hardware routing, and audio-reactive visual performance tooling.

## Run

```powershell
dotnet run
```

## Media Toolchain

Video extraction and MP4 review rendering need FFmpeg and FFprobe on `PATH`.

```powershell
.\Setup-MediaTools.ps1
```

If missing, install with:

```powershell
winget install Gyan.FFmpeg
```

## Publish

```powershell
.\Publish-Windows.ps1
```

## Public / Private Boundary

`gatekpt.ai` stays the public landing page for music, videos, pricing, and booking. GateKPT Music OS is the private workspace for section planning, media sync, vocal processing, timeline markers, export queues, production briefs, and performance memory.
