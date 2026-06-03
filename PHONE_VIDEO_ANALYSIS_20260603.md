# GateKPT Phone Video Analysis - 2026-06-03

## Source Files

Downloaded from Google Drive to:

`C:\Users\Green Machine\Videos\GateKPT Phone Videos`

| File | Duration | Size | Video | Audio |
| --- | ---: | ---: | --- | --- |
| IMG_2114-a.mov | 43.13s | 75.60 MB | HEVC 1920x1080 | AAC, 2ch + 4ch, 48 kHz |
| IMG_2114-b.mov | 34.44s | 63.58 MB | HEVC 1920x1080 | AAC, 2ch + 4ch, 48 kHz |
| IMG_2116-a.mov | 27.50s | 57.81 MB | HEVC 1920x1080 | AAC, 2ch + 4ch, 48 kHz |
| IMG_2116-b.mov | 21.04s | 44.37 MB | HEVC 1920x1080 | AAC, 2ch + 4ch, 48 kHz |

Optimized playback copies:

`C:\Users\Green Machine\Videos\GateKPT Optimized`

## What The Videos Show

The clips are close phone-performance videos, mostly upper body and face, with a night/window background. The instrument and RC-505 workflow are mostly off camera.

This means GateKPT should not assume the primary user view is a DAW-style track board or gear dashboard. The real use case is:

1. Play through RC-505 / Scarlett.
2. Capture clean desktop audio.
3. Keep the phone video as the performance layer.
4. Pair the clean take with the phone video.
5. Later replace or augment the plain background with visualizer/art.

## Audio Findings

The phone clips all contain strong audio.

| File | Mean Volume | Max Volume |
| --- | ---: | ---: |
| IMG_2114-a.mov | -17.5 dB | -0.0 dB |
| IMG_2114-b.mov | -16.3 dB | -0.4 dB |
| IMG_2116-a.mov | -18.1 dB | -1.2 dB |
| IMG_2116-b.mov | -17.1 dB | -0.5 dB |

Conclusion: the phone videos are not silent. The GateKPT reliability problem is the desktop capture/playback trust flow, not the source performance.

## Product Direction

GateKPT should become a simple capture-and-pair tool first.

Priority flow:

1. Confirm Scarlett signal with a real moving meter.
2. Record one clean audio take.
3. Save only if audio is non-empty and playable.
4. Play back inside GateKPT immediately.
5. Import or pick latest phone video.
6. Pair latest clean audio + phone video.
7. Export a simple review MP4.

Do not prioritize lyrics, captions, routing, looper lanes, or visual complexity until this flow is trustworthy.

## UI Implication

The main screen should look closer to Green Machine: calm terrain, few controls, clear state.

Keep only:

- Input selected
- Live signal meter
- Record / stop
- Play latest take
- Open folder
- Pair phone video
- Export review
- Command box for edit/delete/version actions

Hide everything else behind Advanced.

## Next Implementation Target

Build a "Take Review" pipeline:

1. Detect latest valid WAV take.
2. Detect latest phone video from `C:\Users\Green Machine\Videos\GateKPT Phone Videos`.
3. Show both in the UI.
4. Add `Pair latest video + latest take`.
5. Export to `C:\Users\Green Machine\Videos\GateKPT Optimized\review-YYYYMMDD-HHMMSS.mp4`.
6. Add a post-export validation step with ffprobe duration/audio checks.

