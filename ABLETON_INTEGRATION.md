# GateKPT + Ableton Live Integration

## Overview
Route live audio from Ableton Live into GateKPT to visualize your music production in real-time.

---

## Method 1: System Audio Routing (Recommended for Mac)

### Setup
1. Install **Soundflower** (free) or **BlackHole** (free)
   - Soundflower: https://github.com/mattingalls/Soundflower
   - BlackHole: https://existential.audio/blackhole/

2. In Ableton Live:
   - Preferences → Audio/MIDI → Output Device → Select "Soundflower (2ch)"
   - Or Output Device → "BlackHole (16ch)"

3. In macOS System Settings:
   - Sound → Output → "Soundflower" (you'll need to hear it too)
   - Sound → Input → "Soundflower" (for other apps)

4. In GateKPT:
   - Microphone will receive Soundflower audio automatically
   - Press **A** to activate test audio (if no audio detected)

### Result
- Ableton output → Soundflower → macOS Audio Input
- GateKPT analyzes via Web Audio API
- Visuals respond to live music production

---

## Method 2: System Audio Routing (Windows)

### Setup Option A: VB-Audio Virtual Cable

1. Download **VB-Audio Virtual Cable** (€7 or donation)
   - https://vb-audio.com/Cable/

2. In Ableton Live:
   - Preferences → Audio/MIDI → Output Device → "CABLE Output"

3. In Windows Sound Settings:
   - Recording Devices → "CABLE Output (VB-Audio Virtual Cable)"
   - Set as Default Device

4. In GateKPT:
   - Web Audio API will use default recording device
   - Microphone input will receive CABLE Output

### Setup Option B: Stereo Mix (Built-in, if available)

1. In Windows Sound Settings:
   - Recording Devices → Right-click → Show Disabled Devices
   - Enable "Stereo Mix" or "What U Hear"

2. In Ableton Live:
   - Routes to system audio (which includes Stereo Mix)

3. In GateKPT:
   - Microphone input = Stereo Mix

### Result
- Ableton → VB-Audio Cable/Stereo Mix → GateKPT
- Real-time synchronized visuals

---

## Method 3: OSC Control (For MIDI-like Control)

### Advanced: Send Pitch/Energy via OSC

If you want more direct control (rather than analyzing audio), use OSC to send parameters:

1. Install **Max for Live** (part of Ableton Live Suite) or use OSC.io

2. Create a Max device that outputs:
   ```
   /gatekpt/pitch [float: Hz]
   /gatekpt/energy [float: 0-1]
   /gatekpt/brightness [float: 0-1]
   /gatekpt/vibrato [float: 0-1]
   ```

3. In GateKPT, add OSC listener (requires code update):
   ```javascript
   // In renderer.js - add OSC support
   const OSC = require('osc');
   const udpPort = new OSC.UDPPort({
     localAddress: "127.0.0.1",
     localPort: 3333
   });
   
   udpPort.on('message', (msg) => {
     if (msg.address === '/gatekpt/pitch') {
       this.pitch = msg.args[0].value;
     }
     if (msg.address === '/gatekpt/energy') {
       this.energy = msg.args[0].value;
     }
   });
   ```

4. In Ableton, send OSC messages to `127.0.0.1:3333`

---

## Method 4: MIDI Control (Keyboard/Controller Input)

Route MIDI from Ableton to GateKPT:

1. In Ableton:
   - Map MIDI controls to send data
   - Or use MIDI loopback to control GateKPT

2. In GateKPT (requires code update):
   ```javascript
   // In preload.js or renderer.js
   const WebMidi = require('webmidi');
   
   WebMidi.onEnabled(() => {
     const input = WebMidi.inputs[0]; // First MIDI input
     input.addListener('noteon', (e) => {
       this.noteFrequency = this.midiToFreq(e.note.number);
     });
   });
   ```

3. Result:
   - MIDI notes from Ableton → GateKPT geometry responds
   - Less analysis, more direct control

---

## Workflow: Live Performance Setup

### Before the Show
1. Launch GateKPT
2. Set output resolution (fits your projector)
3. Select favorite visual mode (1-5) and color (C/N/A/S/O)
4. Confirm microphone is receiving Soundflower/CABLE output
5. Test with a song: Press **Play** in Ableton

### During Performance
- GateKPT runs fullscreen on projector/display
- Keyboard shortcuts available (1-5 for modes, C/N/A/S/O for colors)
- Press **Ctrl+Shift+H** to toggle HUD if needed
- Audio from Ableton plays through speakers/monitors
- Visuals respond in real-time

### Quick Mode Switching
- Press **1** for Kaleidoscope (good for drums/bass)
- Press **3** for Waves (good for melodic content)
- Press **5** for Spirals (good for vocals/leads)

---

## Audio Latency & Sync

### Expected Latency
- Web Audio API: ~20-50ms (imperceptible)
- Virtual audio routing: +10-20ms
- Total: ~30-70ms (not noticeable for visuals)

### If Visuals Feel Out of Sync
1. Reduce Ableton buffer size: Preferences → Audio/MIDI → Buffer Size → 256 or lower
2. Reduce GateKPT FFT size (in code): `fftSize = 2048` → `fftSize = 1024`
3. Disable unnecessary effects in Ableton

---

## Troubleshooting

### "No Microphone Input in GateKPT"

**Windows:**
1. Check Windows Sound Settings → Recording Devices
2. Ensure VB-Audio Cable or Stereo Mix is default
3. Test in Settings: right-click device → Test microphone

**Mac:**
1. System Settings → Privacy & Security → Microphone
2. Ensure GateKPT is enabled
3. Soundflower installed and selected as system input

**Both:**
- Close and reopen GateKPT after changing audio settings
- Check browser console: Press **F12** → Console
- Look for "AudioContext: Microphone access denied"

### "Audio Routing Not Working in Ableton"

1. In Ableton Preferences → Audio/MIDI:
   - Check Output Device is set correctly
   - Check "Hardware Input" is blank (we're using system output)

2. Test by opening another app (like Audacity):
   - Audacity → Transport → Start Monitoring
   - Should hear Ableton audio through Soundflower

### "Visuals Not Responding to Music"

1. Press **A** to toggle test audio → should see animated patterns
2. If test audio works but Ableton doesn't:
   - Check volume levels (Ableton output vs system input levels)
   - Increase Ableton master volume
   - Check if GateKPT is receiving any audio (HUD shows RMS > 0)

---

## Advanced: Custom Audio Analysis

GateKPT currently analyzes:
- **Pitch** (fundamental frequency, 80–2000 Hz)
- **Formants** (F1, F2, F3 for vowel detection)
- **Spectral Centroid** (brightness of tone)
- **RMS Energy** (overall loudness)
- **Zero Crossing Rate** (consonant/vowel detection)
- **Vibrato & Shimmer** (modulation effects)

You can add custom analysis by editing `renderer.js` and listening to specific frequency bands:

```javascript
// Example: React to specific instrument frequencies
const bassEnergy = analyser.getByteFrequencyData()[0]; // ~60-250 Hz
const snareEnergy = analyser.getByteFrequencyData()[50]; // ~2-4 kHz
const cymbalEnergy = analyser.getByteFrequencyData()[200]; // ~8-16 kHz

// Then use these to modulate your visuals
this.kaleidoscopeSegments = Math.floor(3 + bassEnergy / 50);
```

---

## Best Practices

✅ **Do:**
- Use high-quality audio routing (minimize CPU load)
- Reduce effects in Ableton while performing
- Test audio setup before live performance
- Use fullscreen mode for cleaner visuals

❌ **Don't:**
- Run GateKPT and Ableton on same output (will feedback)
- Use low audio buffer sizes if your computer can't handle it
- Switch audio devices mid-performance (causes audio drop)
- Max out system volume (can distort visuals)

---

## Examples: Music + Visuals Pairing

| Genre | Mode | Color | Notes |
|-------|------|-------|-------|
| Techno/House | Orbits or Spirals | Neon | High energy, fast rotation |
| Ambient | Waves | Ocean or Aurora | Smooth, flowing, ethereal |
| Hip-Hop/Trap | Kaleidoscope | Chromatic | Responds to snare hits |
| Indie/Vocal | Waves or Fractals | Sunset | Good for melodic content |
| Experimental | Fractals | Chromatic | Complex, evolving patterns |

---

## Future: Direct Ableton Link

Planned for future versions:
- Ableton Link support (for tempo sync across devices)
- MIDI Note visualization
- Custom LUA scripting in Ableton to control GateKPT parameters

---

## Support

- GitHub Issues: https://github.com/marcelozap/gateKPT/issues
- Discussions: https://github.com/marcelozap/gateKPT/discussions
- Audio Setup Help: https://github.com/marcelozap/gateKPT/discussions/audio-setup
