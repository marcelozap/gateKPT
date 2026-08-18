# /lab/dance — build notes for review (Codex)

Built 2026-08-18 by Claude. Feature only — nothing committed, nothing pushed.

## Files added (nothing else touched)

- `src/app/lab/dance/page.tsx` — EN route, `robots: noindex` (experiment)
- `src/app/es/lab/dance/page.tsx` — ES route, same component
- `src/app/lab/dance/DanceLab.tsx` — the whole game, client-only
- `src/app/lab/dance/strings.ts` — EN/ES copy
- `src/app/lab/dance/dance.module.css` — module-scoped styles, design tokens from `:root` only
- `src/app/lab/dance/NOTES.md` — this file (not a route)

## Isolation checklist (per project brief)

- `/`, `/log`, `/notes/*`, `src/gatekpt/content.ts`, navigation, reading styles: untouched
- `body.gk-instrument` untouched — the page owns overflow inside its own container
- No new npm dependencies; `package.json` unchanged

## What it is

Webcam pose game. MediaPipe PoseLandmarker (lite) tracks wrists; a generative
Web Audio house clock (112 BPM, no audio assets) spawns rings on the beat grid;
hits are judged on timing (±90ms perfect / ±180ms on-time / ±300ms late).
Pointer simulator mode covers denied cameras and headless testing.

## Runtime dependencies (browser-side, not build-side)

- `cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14` (ESM + wasm)
- `storage.googleapis.com/mediapipe-models/.../pose_landmarker_lite.task` (~5MB)
- Loaded at click-time via an injected module script — the Next build never
  sees them. All processing stays in the visitor's browser.

## Test steps

1. `npm run verify` (lint + typecheck + build)
2. `/lab/dance` — START TRACKING → allow camera → both wrists in frame →
   4-count → rings; wrist through ring on the beat scores; round is 48 beats.
3. Deny camera → denied panel → pointer simulator runs the same round.
4. `/es/lab/dance` — Spanish copy.
5. Check `/` homepage instrument behavior unchanged.
6. Mobile: taps drive the simulator; camera mode works over HTTPS only.

## Known limits (deliberate v1 scope)

- One round shape (48 beats, alternating L/R spots)
- Pose model is lite variant — fine for wrists at webcam distance
- No score persistence, no leaderboard — it's a lab instrument, not a product
