# Multimodal Project Sync

**Status date:** 2026-08-19  
**Purpose:** shared handoff between the XIV/GateKPT project and the separate Malo Sound project.

This is the cross-project status record. Update it only after inspecting the
relevant artifacts. Do not treat a pasted number as a public claim until the
source repository or generated artifact confirms it.

## Ownership

```text
Malo Sound: music understanding
XIV: movement understanding + synchronization + experience
LLM: explanation and coaching over structured events
```

Malo Sound owns MP3/WAV/live-audio ingestion, beat and tempo analysis, onset
and spectral features, CLAP embeddings, audio training, evaluation, and
`AudioAnalysisV1` artifacts.

XIV owns pose capture, movement features, the future custom movement model,
audio/movement alignment, the visualizer, performer experience, and
`SessionAnalysisV1`.

The repositories must remain separate. XIV consumes Malo Sound outputs through
an artifact or API; it does not copy Malo Sound source code or model weights.

## Verified State

### Malo Sound

The 2026-08-19 inspection report states:

- A 16-file `scripts/audio_ml/` bundle exists with ingestion, CLAP embedding,
  mapping, search, Gradio, deployment, `AudioAnalysisV1` schema/validator,
  deterministic baseline analysis, export, tests, and a training ledger.
- The dataset manifest has 727 rows, with 708 readable records and derived
  indexing previews. Provenance is recorded as self-owned/all-rights-reserved/
  consent-self.
- `embeddings.npz` contains 697 rows of 512-dimensional, L2-normalized
  embeddings.
- 701 `AudioAnalysisV1` documents exist. The reported validation samples were
  25/25 for schema, 10/10 for spectral sidecars, and 24/25 for CLAP references.
  One analyzed track was reported as intentionally unembedded because of a
  sub-one-second edge case. That skip should remain explicit in the manifest.
- Training ledger row 0 is a deterministic baseline. Row 1 is pretrained CLAP.
  No custom audio model, checkpoint, or training run has been verified.
- Offline analysis exists. Live-audio analysis is schema-ready but not yet
  implemented.

These numbers are an engineering status report, not public marketing copy.
Re-verify them in the Malo Sound repository before changing the counts.

### XIV/GateKPT

- The Dance Lab exists and has a beat clock, pose input, per-target timing
  judgment, procedural lead dancer, and reactive visualizer.
- The Dance Lab now accepts one local `AudioAnalysisV1` JSON plus its matching
  rights-cleared local audio file. When both are loaded, the lab displays the
  Malo BPM, routes the audio through the browser analyser, and schedules rings
  from the exported beat timestamps. The synthetic 112 BPM clock remains the
  fallback.
- The import is an offline browser adapter. It does not copy raw audio,
  private paths, Malo Sound source code, or model weights into this repository.
- The lab has not yet emitted `SessionAnalysisV1`.
- MediaPipe PoseLandmarker is pretrained. The custom movement model has not
  been trained.
- The public website is not the place to store raw audio, private videos, or
  model weights.

## Shared Contracts

`AudioAnalysisV1` must include a schema version, source reference, duration,
sample rate, BPM, beat/downbeat/onset timestamps, energy and spectral feature
references, CLAP embedding reference, confidence values, provenance, and model
versions.

`MovementAnalysisV1` must include an activity type, timestamps, pose or derived
movement features, visibility/confidence, performer/session reference, and
movement-model version.

`SessionAnalysisV1` combines both sources and must include:

- source references and consent state
- activity type
- audio and movement model versions
- aligned timestamps
- per-event offsets and confidence
- aggregate session metrics
- judgments and personal-baseline comparison

## Next Integration Slices

1. XIV emits one valid `SessionAnalysisV1` event log from the paired session.
2. A narration LLM reads that event log and produces one explanation report.
3. Live-audio input comes after the offline path is proven.
4. Custom movement or fusion training comes after reviewed labels and a
   baseline evaluation exist.

Do not retrain after every session. Collect reviewed data in batches, update a
performer's baseline immediately, and deploy a new adapter only after it beats
the existing baseline on a held-out set.

## Extension Rule

Dance is the first vertical. Keep the core activity-agnostic and use adapters
for tennis, golf, swimming, and running. Audio is required for dance and may
be optional for other activities.
