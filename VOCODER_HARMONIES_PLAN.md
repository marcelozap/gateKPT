# GateKPT – Vocoder Harmonies & Recording System

## Overview
Add real-time voice harmonization, visualization of multiple voices, and recording capability for live performance capture.

---

## Phase 1: Voice Harmonizer (Weeks 1-2)

### Architecture
```
Input Audio (Microphone)
    ↓
Pitch Detection (Autocorrelation)
    ↓
Generate Harmonies:
  - Harmony 1: +4 semitones (major third)
  - Harmony 2: +7 semitones (perfect fifth)
  - Harmony 3: +12 semitones (octave)
    ↓
Pitch Shift Processing (Phase Vocoder)
    ↓
Mix all voices → Output
    ↓
Visualization (separate visual for each voice)
    ↓
Recording (MediaRecorder)
```

### Implementation: Harmonizer Node

Create `renderer/harmonizer.js`:

```javascript
class VoiceHarmonizer {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.analyser = this.ctx.createAnalyser();
    this.splitter = this.ctx.createChannelSplitter(2);
    
    // Pitch detection
    this.pitchDetector = new AutocorrelationPitchDetector(this.ctx);
    
    // Harmony generators (one per harmony)
    this.harmonies = [
      { semitones: 4, name: "third", gain: 0.6 },   // Major third
      { semitones: 7, name: "fifth", gain: 0.6 },   // Perfect fifth
      { semitones: 12, name: "octave", gain: 0.4 }, // Octave up
    ];
    
    // Pitch shifters (using DelayNode + LFO for phase vocoding)
    this.pitchShifters = this.harmonies.map(h => this.createPitchShifter(h.semitones));
    
    // Dry/wet mix
    this.dryGain = this.ctx.createGain();
    this.wetGain = this.ctx.createGain();
    this.outputGain = this.ctx.createGain();
    
    this.dryGain.gain.value = 0.7;  // 70% original voice
    this.wetGain.gain.value = 0.3;  // 30% harmonies
  }
  
  createPitchShifter(semitones) {
    // Simplified pitch shifter using delay + playback speed
    const shiftRatio = Math.pow(2, semitones / 12);
    
    return {
      semitones,
      ratio: shiftRatio,
      delayTime: 0.05,
      feedback: 0.4,
      // In real implementation: use Tone.js PitchShift or Web Audio pitch shifting
    };
  }
  
  analyze() {
    const pitch = this.pitchDetector.detect();
    const harmonizedFreqs = this.harmonies.map(h => ({
      ...h,
      frequency: pitch * (Math.pow(2, h.semitones / 12))
    }));
    
    return {
      fundamental: pitch,
      harmonies: harmonizedFreqs,
      confidence: this.pitchDetector.confidence
    };
  }
  
  process(inputBuffer) {
    // Apply pitch shifting to harmonies
    // Mix with dry signal
    // Output combined voice + harmonies
  }
}
```

### Integration with AudioAnalyzer

Update `renderer/renderer.js`:

```javascript
class AudioAnalyzer {
  constructor() {
    // ... existing code ...
    this.harmonizer = new VoiceHarmonizer(this.audioContext);
  }
  
  update() {
    // ... existing analysis ...
    const harmonies = this.harmonizer.analyze();
    this.harmoniesData = {
      primary: harmonies.fundamental,
      third: harmonies.harmonies[0],
      fifth: harmonies.harmonies[1],
      octave: harmonies.harmonies[2]
    };
  }
}
```

---

## Phase 2: Visualization of Harmonies (Week 2)

### Visual Representation

Add new drawing modes that show multiple voices:

#### Mode 6: Harmony Orbits (NEW)
```javascript
drawHarmonyOrbits() {
  // Each voice gets its own orbit ring with different color
  // Primary voice: bright color, center
  // Third harmony: +1 ring, offset color
  // Fifth harmony: +2 ring, different offset color
  // Octave: +3 ring, top octave color
  
  const voices = [
    { freq: this.harmoniesData.primary, color: "bright", radius: 100 },
    { freq: this.harmoniesData.third.frequency, color: "warm", radius: 150 },
    { freq: this.harmoniesData.fifth.frequency, color: "cool", radius: 200 },
    { freq: this.harmoniesData.octave.frequency, color: "light", radius: 250 },
  ];
  
  voices.forEach((voice, idx) => {
    // Draw orbit ring for each voice
    // Size/brightness modulated by voice energy
    // Color represents voice type (primary/harmony)
  });
}
```

#### Mode 7: Voice Spectrum (NEW)
```javascript
drawVoiceSpectrum() {
  // Vertical bars for each voice
  // Primary in center (bold)
  // Harmonies on sides (lighter)
  // Heights = voice amplitude
  // Colors = voice type
  // All animated together
}
```

#### Mode 8: Harmony Waves (NEW)
```javascript
drawHarmonyWaves() {
  // Stacked waveforms - one per voice
  // Primary wave: bold, full height
  // Harmonies: stacked above/below
  // Colors cycle through palette
  // All synchronized to pitch changes
}
```

### HUD Enhancement

Show voice information:
```
Primary Voice: 245 Hz | Confidence: 0.92
Harmony 3rd:  307 Hz | Energy: 0.6
Harmony 5th:  367 Hz | Energy: 0.55
Harmony Oct:  490 Hz | Energy: 0.4
Recording: 2:34.67 | Quality: 320kbps
```

---

## Phase 3: Real-time Recording (Week 2-3)

### Recording System

Create `renderer/recorder.js`:

```javascript
class AudioRecorder {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.chunks = [];
    this.isRecording = false;
    
    // High-quality recording
    this.mediaRecorder = null;
    this.destination = this.ctx.createMediaStreamAudioDestination();
  }
  
  start() {
    this.isRecording = true;
    this.chunks = [];
    
    const stream = this.destination.stream;
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 320000 // High quality
    });
    
    this.mediaRecorder.ondataavailable = (e) => {
      this.chunks.push(e.data);
    };
    
    this.mediaRecorder.onstop = () => {
      this.saveRecording();
    };
    
    this.mediaRecorder.start();
  }
  
  stop() {
    this.isRecording = false;
    this.mediaRecorder.stop();
  }
  
  saveRecording() {
    const blob = new Blob(this.chunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gatekpt-recording-${Date.now()}.webm`;
    a.click();
  }
  
  getRecordingTime() {
    if (!this.mediaRecorder) return "0:00.00";
    const secs = this.mediaRecorder.state === 'recording' 
      ? Math.floor(Date.now() - this.startTime) / 1000 
      : 0;
    const mins = Math.floor(secs / 60);
    const sec = (secs % 60).toFixed(2);
    return `${mins}:${sec.padStart(5, '0')}`;
  }
}
```

### Integration

Update `main.js` IPC handlers:

```javascript
ipcMain.on('startRecording', () => {
  recorder.start();
});

ipcMain.on('stopRecording', () => {
  recorder.stop();
});
```

Update `preload.js`:

```javascript
contextBridge.exposeInMainWorld('engine', {
  onStartRecording: (cb) => ipcRenderer.on('startRecording', cb),
  onStopRecording: (cb) => ipcRenderer.on('stopRecording', cb),
  startRecording: () => ipcRenderer.invoke('startRecording'),
  stopRecording: () => ipcRenderer.invoke('stopRecording'),
});
```

### Keyboard Shortcut

```javascript
// In setupKeyboard()
if (e.key === "R" || e.key === "r") {
  if (this.isRecording) {
    this.stopRecording();
    this.isRecording = false;
  } else {
    this.startRecording();
    this.isRecording = true;
  }
}
```

---

## Phase 4: Harmonizer Settings Menu (Week 3)

### Harmony Configuration

Allow users to customize:
- Number of harmonies (2-4 voices)
- Interval pattern (thirds, fifths, custom)
- Voice blend (dry/wet mix)
- Voice spacing (unison, stacked, spread)

### Keyboard Control

```
H: Open harmony settings menu
+/-: Adjust harmony blend
Shift+3: Select thirds harmony
Shift+5: Select fifths harmony
Shift+O: Select octave harmony
```

---

## Audio Quality Considerations

### Pitch Shifting Quality
- **Simple approach:** Phase vocoder using Web Audio DelayNode
- **Better approach:** Use Tone.js library (higher quality)
- **Best approach:** Use audio worklet with custom pitch shifting

```javascript
// Option 1: Tone.js PitchShift (recommended for MVP)
import Tone from 'tone';

const pitchShift = new Tone.PitchShift({
  pitch: 4  // +4 semitones
});

inputSignal.connect(pitchShift);
pitchShift.toDestination();
```

### Latency
- Target: < 100ms total latency (microphone → harmonizer → output)
- Achievable: 40-60ms with optimized setup
- Recording: Independent buffer (no latency impact)

### CPU Usage
- Per-harmony: ~5-10% CPU
- 4 voices total: ~20-30% CPU
- Recording: +5% CPU
- Total system impact: 25-35% CPU (acceptable)

---

## File Structure

```
gatekpt-visual-engine/
├── renderer/
│   ├── renderer.js          (enhanced with 3 new modes)
│   ├── harmonizer.js        (NEW - voice harmonizer)
│   ├── recorder.js          (NEW - audio recording)
│   └── ...
├── main.js                  (IPC handlers for recording)
├── preload.js               (expose recording APIs)
└── ...
```

---

## Testing Checklist

### Phase 1: Harmonizer
- [ ] Pitch detection works (0-2000 Hz range)
- [ ] Harmonies generate correctly (±4, ±7, ±12 semitones)
- [ ] Audio quality acceptable (no artifacts)
- [ ] CPU usage < 30%

### Phase 2: Visualization
- [ ] Modes 6-8 render smoothly (60+ FPS)
- [ ] Harmony colors distinct and beautiful
- [ ] HUD shows voice information correctly
- [ ] Colors change with harmony intervals

### Phase 3: Recording
- [ ] Record button toggles (R key)
- [ ] Timer counts up correctly
- [ ] Audio saves to file on stop
- [ ] Recording quality is high (320kbps+)

### Phase 4: Settings
- [ ] Harmony menu opens
- [ ] Settings adjust voice blend
- [ ] Changes apply in real-time
- [ ] Settings persist between sessions

---

## Dependencies to Add

```json
{
  "dependencies": {
    "tone": "^14.8.49",      // Audio synthesis and processing
    "pitchfinder": "^2.1.1"  // Alternative pitch detection
  }
}
```

### Installation
```bash
npm install tone pitchfinder
```

---

## Keyboard Control Reference (Updated)

| Key | Action |
|-----|--------|
| **1-5** | Switch visual modes |
| **6-8** | Switch harmony visualization modes (NEW) |
| **C/N/A/S/O** | Switch color palettes |
| **H** | Open harmony settings (NEW) |
| **+/-** | Adjust harmony blend (NEW) |
| **R** | Start/stop recording (NEW) |
| **A** | Toggle test audio |
| **Ctrl+Shift+H** | Toggle HUD |
| **Esc** | Toggle fullscreen |
| **Ctrl+Q** | Quit |

---

## Integration with Ableton

For full Ableton + GateKPT + Harmonizer workflow:

1. **Route audio:** Ableton → Soundflower/VB-Audio → GateKPT
2. **Record in GateKPT:** Capture harmonized performance (R key)
3. **Or record in Ableton:** Use harmonized output as new track
4. **Display on projector:** Full GateKPT window fullscreen
5. **Performance:** Real-time harmonies + visuals + recording

---

## Performance Timeline

### MVP (Minimum Viable Product)
- **Target:** 2-3 weeks
- **Includes:** Harmonizer, 1 new visualization mode, basic recording
- **Quality:** Works well for live performance

### v1.0
- **Target:** 1 month
- **Includes:** All phases above + settings menu
- **Quality:** Production-ready, App Store submittable

### v1.5+
- **Future:** Custom harmonizer chains, effects, multi-track recording

---

## Success Criteria

✅ **You can:**
1. Sing into microphone
2. Hear automatic 3-voice harmonies
3. See harmonies visualized on screen (different colors/rings)
4. Record everything to audio file
5. Display on projector while singing + playing instruments
6. All with < 50ms latency

---

## Resources

- **Tone.js Docs:** https://tonejs.org/
- **Web Audio API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **MediaRecorder API:** https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- **Pitch Detection:** https://github.com/cwilso/PitchDetect

---

**This plan will transform GateKPT into a full vocal harmonizer + visual instrument + recording system.**
