# Malo Sound To XIV: Local Track Import

The Dance Lab can now run one offline session against Malo Sound output.
Nothing in this workflow uploads your music or copies it into the public repo.

## Prepare The Two Files

From the separate Malo Sound project, use:

1. One `analysis/<source_id>.audioanalysis.v1.json` file.
2. The matching rights-cleared MP3, WAV, or M4A file.

The JSON is the contract. Do not select a JSON file from a different track.
The browser does not compare audio bytes to the analysis, so matching the
files is a human responsibility in this first slice.

## Run A Session

1. Open `/lab/dance` locally.
2. Choose **LOAD BEAT GRID JSON** and select the `AudioAnalysisV1` file.
3. Choose **LOAD AUDIO FILE** and select the matching local audio file.
4. Confirm the panel says `READY` and the status row says `MALO`.
5. Start camera tracking or use the pointer simulator.

The lab uses the exported `beat_times` for timing, the exported BPM for the
clock display and lead choreography, and the actual audio element for its
visualizer signal. Without both files, it uses the procedural synthetic clock.

## Boundaries

- This is integration, not custom training.
- The file picker keeps inputs local to the browser session.
- No `SessionAnalysisV1` file is emitted yet.
- Do not commit raw audio, private local paths, analysis archives, or model
  weights to the GateKPT repository.
