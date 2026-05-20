# GateKPT Visual Engine – The Voice Vocoder

A **visual vocoder**: your voice becomes a moving, breathing visual instrument in real-time.

## Quick Start

```bash
cd C:\Users\Green Machine\Desktop\gatekpt-visual-engine
npm start
```

**Sing into your microphone.** The visuals respond instantly to:
- Pitch and vibrato
- Vocal timbre (formants)
- Voice energy and dynamics
- Spectral brightness
- Vocal texture (shimmer)

## What You Control

| Key | Action |
|-----|--------|
| **1–5** | Switch visual modes |
| **C/N/M/T/S** | Cycle color palettes |
| **A** | Toggle test audio (sine/triangle/square tones) |
| **Ctrl+Shift+H** | Show/hide analysis HUD |
| **Esc** | Toggle fullscreen |
| **Ctrl+Q** | Quit |

## What Gets Detected

Each mode responds differently to these vocal metrics:

### **Pitch & Vibrato**
- Measured in Hz (80–2000 Hz range)
- Confidence score (0–1)
- Vibrato magnitude (wiggle in the pitch)
- Controls: rotation speed, segment count, spiral tightness

### **Formants (F1, F2, F3)**
- Which vowel you're singing (a, e, i, o, u each has different formants)
- Controls: wave detuning, spiral colors, geometric complexity

### **Voice Energy**
- Overall loudness in vocal range
- Controls: opacity, line thickness, flash intensity

### **Spectral Brightness**
- How treble-heavy or bass-heavy your tone is
- Controls: spiral tightness, geometric sharpness

### **Vibrato & Shimmer**
- Vibrato: wobble in pitch (natural singing technique)
- Shimmer: wobble in amplitude (vocal tremolo)
- Controls: rotation wobble, line thickness jitter

### **Voiced vs Unvoiced**
- Vowels (a, e, i, o, u) = voiced (smooth sine-like)
- Consonants (k, s, t) = unvoiced (noisy)
- Controls: flash color/size, pattern count

## Best Modes for Vocals

| Mode | Best For |
|------|----------|
| **Kaleidoscope (1)** | Sustained vowels, chords, power notes |
| **Waves (3)** | Speech, flowing melody, phrasing |
| **Spirals (5)** | Vibrato, continuous singing, transitions |
| **Orbits (2)** | Bass/percussion, rhythm instruments |
| **Fractals (4)** | Complex harmonics, harmonic richness |

## Try This First

1. Launch the app
2. Press **1** (Kaleidoscope mode)
3. Press **C** (Chromatic colors)
4. Sing "ahhhhh" and hold a note for 4 seconds
5. Watch the segments spin and expand with your vibrato
6. Press **Ctrl+Shift+H** to see pitch, formants, and vibrato metrics
7. Switch to **3** (Waves) and speak some words — watch wave patterns respond to consonants
8. Try **5** (Spirals) and sing a scale up and down — watch the spiral tightness follow your pitch

## Test Audio (No Mic Needed)

Press **A** to toggle test audio. Three synthetic tones play (bass, mid, high) with frequency sweeps. Watch the visuals respond even without a microphone. Great for:
- Testing the visuals
- Learning which modes you like
- Demo without audio input

## Under the Hood

- **FFT size**: 4096 (high resolution frequency analysis)
- **Autocorrelation**: Pitch detection on time-domain waveform
- **Formant bands**: F1 (200–900Hz), F2 (800–2500Hz), F3 (2400–4000Hz)
- **Spectral centroid**: Weighted average frequency (brightness)
- **Zero crossing rate**: Consonant vs vowel detection
- **Vibrato/shimmer**: Frequency and amplitude modulation detection
- **Latency**: < 50ms (imperceptible)

## Files

```
gatekpt-visual-engine/
├── README_VOCODER.md          ← You are here
├── VOCAL_ANALYSIS.md          ← Detailed metric explanations
├── VISUAL_GUIDE.md            ← Mode descriptions
├── renderer/renderer.js       ← AudioAnalyzer + vocal detection
└── ... (other files)
```

---

**Turn on, sing, watch your voice become visible.**

No network. No latency. Pure local audio → visual magic.
