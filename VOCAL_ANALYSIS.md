# GateKPT Visual Engine – Vocal Analysis & Vocoder Features

**Now playing voices and instruments with advanced spectral analysis.**

---

## What's New: Vocal-Responsive Visuals

The visual engine now detects and responds to:

### **Core Vocal Metrics**

| Metric | What It Is | Visual Effect |
|--------|-----------|---------------|
| **Pitch** | Fundamental frequency of the voice | Rotates segments, controls spiral tightness, modulates wave frequencies |
| **Pitch Confidence** | How certain we are about the pitch | Increases segment count in Kaleidoscope, affects vibrato magnitude |
| **Voiced/Unvoiced** | Is it a vowel (voiced) or consonant (unvoiced)? | Bright flashes on voiced; different spiral count on unvoiced |
| **Voice Energy** | Overall loudness in vocal range (80Hz–8kHz) | Opacity, line thickness, flash intensity |

### **Formant Detection (F1, F2, F3)**

Formants are spectral peaks that define vowel color. We detect three:

- **F1 (80–900 Hz)**: Openness of mouth (a, o, u colors)
- **F2 (800–2500 Hz)**: Front/back of tongue (e, i vs o, u)
- **F3 (2400–4000 Hz)**: Vocal quality and presence

**Visual Effect**: 
- Formants modulate wave detuning (Waves mode)
- Formants determine spiral colors (Spirals mode)
- F1 + F2 energy increases complexity and saturation

### **Spectral Centroid (Brightness)**

How "bright" or "dark" the sound is. Ranges from 0 (bass-heavy) to 1 (treble-heavy).

**Visual Effect**: 
- High brightness → tighter spirals, more defined geometry
- Low brightness → looser, more relaxed patterns

### **Vibrato & Shimmer**

- **Vibrato**: Pitch modulation (frequency wobble) - adds tremor to visuals
- **Shimmer**: Amplitude modulation (loudness wobble) - adds jitter to line thickness and opacity

**Visual Effect**:
- High vibrato → wobbly, organic rotation
- High shimmer → flickering, unstable lines (like vocal tremolo)

### **Zero Crossing Rate (ZCR)**

How many times the waveform crosses zero per frame. Indicates texture.

- Low ZCR (< 0.1): Smooth sine-like sound (vowels)
- High ZCR (> 0.3): Noisy, percussive (consonants, breath)

**Visual Effect**: Influences line smoothness and opacity

---

## Visual Modes with Vocal Responsiveness

### **1. Kaleidoscope** (Press 1)
- **Pitch** rotates the entire pattern
- **Pitch confidence** adds segments dynamically
- **Formants** control arm length and radius
- **Shimmer** makes lines wobble
- **Vibrato** adds spin variation
- **Voiced flash**: Bright rectangle pulse on vowels

**Best for**: Sustained vocal notes, chords, singing

### **2. Waves** (Press 3)
- **Pitch** controls wave frequency (higher voice = faster waves)
- **Formants** create detuning between wave layers (harmonic dissonance)
- **Voice energy** controls wave count and opacity
- **Spectral centroid** modulates amplitude

**Best for**: Lyrical vocals, flowing melodies, speech patterns

### **3. Spirals** (Press 5)
- **Pitch** controls spiral tightness and rotation speed
- **Pitch confidence** creates more spirals on strong tones
- **Spectral centroid** tightens or loosens the spiral radius
- **Vibrato** adds wobble to the path
- **Voiced/unvoiced** switches spiral count and behavior

**Best for**: Continuous singing, note transitions, vibrato passages

### **4. Orbits** (Press 2)
- Bass → orbital radius
- Mids → rotation speed
- Voice energy → point opacity

### **5. Fractals** (Press 4)
- Peak amplitude → recursion depth
- Formants → color palette selection

---

## How to Use: Seeing the Vocoder in Action

1. **Launch the app**:
   ```bash
   npm start
   ```

2. **Sing or speak into your microphone** (if available) or **press A to toggle test audio**

3. **Press Ctrl+Shift+H** to show the HUD and see vocal metrics in real-time:
   - Pitch (Hz) and confidence
   - Voiced/unvoiced status
   - Voice energy (RMS in vocal range)
   - Formant frequencies (F1, F2, F3)
   - Brightness (spectral centroid)
   - Vibrato and shimmer magnitude
   - Zero crossing rate

4. **Press 1–5** to switch modes and see how each responds differently to your voice:
   - **Mode 1 (Kaleidoscope)**: Best for sustained vowels
   - **Mode 3 (Waves)**: Best for flowing speech/melody
   - **Mode 5 (Spirals)**: Best for vibrato and dynamic control

5. **Press C/N/M/T/S** to change color palettes while singing

---

## Advanced: What the HUD Shows

```
Mode: kaleidoscope [1-5] | Color: chromatic [C/N/M/T/S]
Audio: microphone | 60 fps
───── VOCAL ANALYSIS ─────
Pitch: 440Hz (0.85) | Voiced: yes
Voice: 65% | RMS: 42% | Peak: 78%
F1: 45% | F2: 60% | F3: 25%
Brightness: 72% | Vibrato: 15% | Shimmer: 8%
ZCR: 12% | Bass: 30% | Mid: 55% | High: 15%
```

- **Pitch 440Hz**: A4 note (middle A on piano)
- **Confidence 0.85**: 85% sure about the pitch (strong tone)
- **Voiced yes**: Currently singing a vowel
- **Voice Energy 65%**: Strong presence in vocal range
- **F1/F2/F3**: Formant strengths (which vowel shape you're making)
- **Brightness 72%**: Moderately bright tone (not breathy, not dark)
- **Vibrato 15%**: Slight wobble in pitch (vibrato amount)
- **Shimmer 8%**: Minimal amplitude modulation

---

## Tips for Best Results

1. **Sing steady notes**: Pitch detection works best on sustained vowels (a, e, i, o, u)
2. **Avoid whispers**: Whispered speech is unvoiced and less visually interesting
3. **Good mic placement**: Keep the mic 4–6 inches from your mouth
4. **Try different vowels**: Each vowel has different formants, creating unique visuals
5. **Use vibrato**: Vibrato is detected and makes spirals/kaleidoscopes shimmer beautifully
6. **Consonant transitions**: Watch how the visuals shift when you move between sounds

---

## Technical Details

### Pitch Detection
- **Algorithm**: Autocorrelation on time-domain waveform
- **Range**: 80 Hz–2000 Hz (typical human voice)
- **Confidence**: Correlation coefficient (0 = uncertain, 1 = certain)

### Formant Detection
- **Method**: Spectral peak detection in three bands
- F1: 200–900 Hz (mouth opening)
- F2: 800–2500 Hz (tongue front/back)
- F3: 2400–4000 Hz (vocal tract refinement)

### Spectral Centroid
- **Definition**: Weighted average frequency
- **Range**: 0 (all bass) to 1 (all treble)
- **Use**: Indicates consonant vs vowel, bright vs dark tone

### Vibrato Detection
- **Method**: Frequency variation analysis across frames
- **Typical range**: 4–8 Hz (human vibrato rate)

### Shimmer Detection
- **Method**: Amplitude modulation detection
- **Indicates**: Vocal instability, tremolo, or roughness

---

## No Network, No Latency

- Pure local audio analysis
- Zero external dependencies
- Instant response to voice (< 50ms latency)
- Works offline on any Windows PC with a microphone

**The visuals are your voice made visible.**
