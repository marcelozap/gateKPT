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
- Future layer: live meters, one-click recording, RC-505 transport/scene commands, and loop capture into the project timeline.

## Direction

`gatekpt.ai` stays the public landing page for music, videos, pricing, and booking.
This app is the private workspace for media sync, vocal processing, timeline markers, export queues, production briefs, and future AI reflection.
