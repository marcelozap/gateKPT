# GateKPT Music OS Next Session Context

Read this first when resuming GateKPT work.

## One Sentence

GateKPT Music OS is a private Windows C#/.NET Avalonia creative recorder, visualizer, mix/export helper, and content-capture tool for Marcelo's music workflow.

## The Current North Star

Make one end-to-end loop feel trustworthy:

`open GateKPT -> record a take -> play it -> optionally mix/shape it -> capture/render a visual clip -> save/export`

Also support the longer creator loop:

`start capture -> play for 2-3 hours -> mark good moments -> stop capture -> cut clips`

Do not expand into a full DAW or camera studio until these loops are boringly reliable.

## Do Not Do

- Do not rebuild from scratch.
- Do not make a marketplace or royalty/stock system.
- Do not turn it into a generic DAW.
- Do not add lots of visible settings.
- Do not re-add confusing check-signal UX.
- Do not overexplain inside the app.
- Do not remove working recorder/export paths.
- Do not stage unrelated dirty files.

## Safe Next Work

Good next tasks:

- Clarify `MIX` result behavior and add `Open mix` if not obvious.
- Add a visible marker list for long captures.
- Add `cut all markers` for long-session exports.
- Add a tiny screen-capture state: idle/capturing/saved.
- Add command aliases: `record screen`, `stop screen`, `make visual`, `open mix`.
- Improve `VisualClipRenderService` output quality.
- Add a short `CAPTURE_WORKFLOW.md` explaining exactly how Marcelo should record a post.
- Add diagnostics around screen capture audio attachment.

Riskier tasks:

- Real webcam preview inside Avalonia.
- GPU/live rendered visual export.
- Per-track DSP mixer.
- Multi-scene operating system UI.
- iOS version.

## Current Files To Know

- `Views/RecorderWindow.axaml`: main active UI.
- `ViewModels/RecorderWindowViewModel.cs`: command wiring, recorder flow, post/video/capture commands.
- `Services/LayerRecordingService.cs`: audio recording.
- `Services/LayerMixdownService.cs`: combines WAV takes.
- `Services/VisualClipRenderService.cs`: renders selected WAV into vertical MP4 visual.
- `Services/ScreenCaptureService.cs`: starts/stops FFmpeg desktop capture.
- `Services/LongSessionClipService.cs`: cuts short clips from a long screen capture around saved markers.
- `Services/PhoneVideoWorkflowService.cs`: pairs phone video with GateKPT audio.
- `LONG_SESSION_WORKFLOW.md`: Elgato/webcam long-session command flow.

## How To Verify

Always run:

```powershell
dotnet build
```

If the executable is locked:

```powershell
Get-Process GateKPT.MusicOS -ErrorAction SilentlyContinue | Stop-Process -Force
dotnet build
```

If launching:

```powershell
Start-Process -FilePath 'C:\Users\Green Machine\Desktop\GateKPT-MusicOS\bin\Debug\net9.0\GateKPT.MusicOS.exe'
```

## Current User Mental Model

The user wants the app to feel like a creative companion/instrument:

- record fast
- no wasted testing loops
- no confusing UI
- see/hear what happened
- screen looks good enough to record as content
- app helps organize the process without becoming homework

If a feature does not help the user create, hear, see, save, mix, or export, hide it or skip it.
