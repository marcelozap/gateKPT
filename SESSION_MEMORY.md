# GateKPT Music OS Session Memory

Last updated: 2026-06-12

## Product Identity

GateKPT Music OS is Marcelo's private creative operating system for making music faster, saving history, learning taste, and turning strong takes into visuals/posts when ready.

Core loop:

`create fast -> save history -> learn taste -> choose better -> export when ready`

It is not a generic DAW, marketplace, AI music generator, or content hustle dashboard. Creation is the core. Content is the export.

## Current Working App

Local repo:

`C:\Users\Green Machine\Desktop\GateKPT-MusicOS`

Current executable:

`C:\Users\Green Machine\Desktop\GateKPT-MusicOS\bin\Debug\net9.0\GateKPT.MusicOS.exe`

Primary active screen:

`Views/RecorderWindow.axaml`

Primary active view model:

`ViewModels/RecorderWindowViewModel.cs`

## What Works

- Scarlett/GateKPT audio recording works after earlier recorder fixes.
- Takes save as `.wav` files under the GateKPT Recorder music folders.
- Session folders exist for saved takes.
- The top recorder controls are now clearer: `REC`, `STOP`, `PLAY`, `MIX`, `FILES`.
- `MIX` combines session takes into one auto-leveled WAV via `LayerMixdownService`.
- Command box can stage/run simple commands like warmer, room, delete, mix, post, visual clip, start capture, stop capture.
- Vocal color presets exist: Chrome, Silk, Luna, Cloud, Clean.
- Visual MP4 fallback exists: selected WAV take can render to a vertical 9:16 MP4 through `VisualClipRenderService`.
- Phone-video replacement flow exists through `PhoneVideoWorkflowService`.
- Screen capture commands exist through `ScreenCaptureService`.
- FFmpeg is installed and desktop capture smoke-tested successfully.

## Important Commands

Build:

```powershell
dotnet build
```

Run:

```powershell
Start-Process -FilePath 'C:\Users\Green Machine\Desktop\GateKPT-MusicOS\bin\Debug\net9.0\GateKPT.MusicOS.exe'
```

Stop app before build if exe is locked:

```powershell
Get-Process GateKPT.MusicOS -ErrorAction SilentlyContinue | Stop-Process -Force
```

Push pattern used for this repo:

```powershell
git push origin master
git push origin HEAD:gatekpt-musicos-desktop
```

## Current Feature State

### Recorder

Useful and real enough to keep building around. Keep it simple. The user hated confusing preflight/check-signal flows. Do not reintroduce bulky setup panels.

Preferred flow:

`REC -> play/sing -> STOP -> PLAY -> shape/mix/export`

### Mix

`MIX` currently means quick bounce/stack:

- Uses saved WAV takes in the session.
- Auto-levels them.
- Creates one combined WAV.
- It is not a full DAW mixer yet.

### Visuals

The desired visual direction is random abstract art that flows like water into pools of color. Avoid:

- stock chart lines
- EQ bars
- finance dashboard DNA
- nervous waveform oscillation
- bronze/rusted robot look
- Miami Vice/cocaine beach look

Preferred visual language:

- Florida night colors
- motel warmth without writing "Florida night" everywhere
- black, teal, amber, cream, dusty magenta/violet
- abstract pools, glass, soft chrome, slow motion
- screen as a visual instrument

### Screen Capture

Command box supports:

- `start capture`
- `stop capture`
- `open captures`
- `clip this`
- `clip last`
- `open clips`

This records the desktop using FFmpeg `gdigrab`. If the Windows Camera app is visible on top, it is captured too. Audio attachment may depend on DirectShow accepting the selected device name.

### Long Sessions

New direction: long recording is a separate workflow from short takes.

Goal:

`start capture -> play for 2-3 hours -> mark moments -> stop capture -> cut clips`

Use:

- `clip this` while recording to drop a marker.
- `clip this chorus` or `clip this guitar idea` to label the marker.
- `clip last` after stopping to cut a short MP4 around the latest marker.

Files:

- Long captures: `C:\Users\Green Machine\Videos\GateKPT Screen Captures`
- Marker sidecars: `*.markers.txt` next to the long capture.
- Short clips: `C:\Users\Green Machine\Videos\GateKPT Screen Clips`

Elgato/webcam plan: show the camera preview on the GateKPT screen, start a long capture, drop markers while performing, then cut clips after. Do not add a big camera UI until this loop is reliable.

### Post Clip

`post clip` / `visual clip` path:

- If phone video exists, pair it with selected GateKPT audio.
- If no phone video exists, render a vertical visual MP4 from the selected WAV.

## Dirty Files Note

There are often unrelated dirty/untracked files in this repo. Do not clean, revert, or stage unrelated files unless explicitly asked.

Recently observed unrelated dirty items:

- `GateKPT.MusicOS.csproj`
- `README.md`
- `Views/MainWindow.axaml`
- `automation-assets/`
- `docs/job-search/`

## Next Best Build Direction

Next practical milestones:

1. Make screen capture easier to understand inside the UI without adding clutter.
2. Improve visual MP4 output so it looks closer to the live GateKPT stage.
3. Add a simple visible capture status for screen recording.
4. Make `MIX` output easier to find/play after export.
5. Eventually add real camera preview/composition, but do not do that before the screen-capture workflow is stable.

## User Preferences

- Less words, more action.
- Avoid corporate/default app language.
- Avoid too many buttons.
- Keep the app personal, familiar, and artist-first.
- Do not make the UI feel like a DAW clone or admin dashboard.
- Build concrete working loops before polishing huge feature worlds.
