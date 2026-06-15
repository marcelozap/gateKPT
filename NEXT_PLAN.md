# GateKPT Music OS - Current Build Plan

GateKPT is the private studio surface: record sound, save usable takes, shape copies, mix a session into one WAV, and make the screen worth recording.

Design law:
- Less words.
- Fewer buttons.
- One main recorder surface.
- No second audio capture on the Scarlett while recording.
- The screen should feel like a living instrument, not a dashboard.

## Current State

Shipped and pushed:

- RecorderWindow is the active cockpit.
- Recording saves into session folders under `Music/GateKPT Recorder/takes/<session>`.
- Capture lanes exist: Loop, Guitar, Vocal, Drums, Keys, Idea.
- New take filenames are numbered by lane, like `guitar-01-YYYYMMDD-HHMMSS.wav`.
- Each saved playable WAV now gets hidden metadata in `.gatekpt/`, so the visible take folder stays clean.
- Play runs the selected/latest take.
- Mix combines usable session takes into one WAV.
- Files opens the current recording folder.
- GateKPT monitor is stopped automatically before recording so the recorder owns the input.
- Command box can shape safe copies, delete last, mix, stage/view, and answer simple GateKPT questions.
- Screen capture lane exists: Screen, Pin, Cut, In, Scan, Out.
- Visual stage reacts while recording and while playing saved WAV envelopes.

## Hard Audio Rule

Never open a second live input capture on the Scarlett while recording.

The pre-record visual meter caused device contention before. Keep pre-record metering disabled unless the recorder itself owns and shares the audio stream.

## What Still Needs Real Work

1. Audio quality
   - Current path is good enough for sketches/content, not Logic/Pro Tools quality.
   - Need cleaner input channel handling for Scarlett input 1.
   - Need better saved-take metadata: backend, channel, sample rate, peak, RMS.
   - Need a better final render path later, ideally 24-bit or higher-quality WAV.

2. Visual engine
   - Current stage is alive, but still too line-heavy.
   - Need fewer chart-like lines and more flowing depth/pools/3D forms.
   - Audio should drive the whole room, not just one visible layer.

3. Mix workflow
   - Mix works, but needs a clearer mental model:
   - Pick center take.
   - Blend session takes around it.
   - Export one named WAV.
   - A/B compare two takes.

4. Screen/video workflow
   - Current screen capture is a starting point.
   - Next useful version: record long session, pin moments, cut clips.
   - Later: Elgato/webcam guide or preview, but only if it does not destabilize audio.

## Next Safe Build Order

1. Add input-channel preference for Scarlett input 1.
2. Improve visual stage motion without touching audio capture.
3. Add center-take mix selection.
4. Add A/B take compare.
5. Add screen capture clip review.

## Tomorrow Test

One short test only:

1. Select `Guitar`.
2. Press the record disc.
3. Play 10 seconds.
4. Stop/save.
5. Press Play.
6. Press Mix only if there are two or more takes.

If playback sounds wrong, save the take and check the diagnostics instead of repeating ten times.
