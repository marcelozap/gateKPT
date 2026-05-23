# GateKPT Music OS

Private native desktop app for the GateKPT music workflow.

## Stack

- C# / .NET 9
- Avalonia UI
- MVVM structure with `CommunityToolkit.Mvvm`

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

## Hardware

The app can scan active Windows audio endpoints and MIDI ports through NAudio. Use the Hardware Routing panel to save the intended studio path:

- Focusrite / Scarlett: primary mic/instrument input and monitoring output.
- RC-505 Loop Station: loop audio device if exposed over USB, plus MIDI input/output when available.
- Live input meter: start/stop a local peak meter for the preferred input without recording or transmitting audio.
- Future layer: one-click recording, RC-505 transport/scene commands, and loop capture into the project timeline.

## Song Workflow

Music OS is shaped around the normal build order:

- Drums first: tempo, groove, loop length, kick/snare feel.
- Guitar / Piano second: harmony, rhythm pocket, arrangement.
- Vocals last: melody, diction, emotion, doubles, hook clarity.
- Review / Export: rate takes, sync video, process vocal, render clips.
- Word-driven mix intent: type phrases like `warmer drums`, `less harsh guitar`, or `more intimate vocal` and the app turns them into a stage-aware processing chain.
- Lyric vault: save hooks, fragments, moods, tags, and pull the latest lyric into the active session notes.
- Visualizer module: save mode, palette, motion, lyric source, intensity, and live-meter-aware visual direction inside the project.
- Safe captions: draft lyric captions on a beat grid, defaulting to 3-beat spacing, and flag dense lines as review-needed instead of burning in bad timing.
- Command chat: type local commands like `add captions`, `sync video`, `make drums warmer`, `add vocal layers`, or `export reels`; unsafe work drafts or queues instead of forcing destructive changes.

## Direction

`gatekpt.ai` stays the public landing page for music, videos, pricing, and booking.
This app is the private workspace for media sync, vocal processing, timeline markers, export queues, production briefs, and future AI reflection.
