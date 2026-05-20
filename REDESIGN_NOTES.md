# GateKPT Visual Engine – Redesign: Visuals-First Edition

## What Changed

### **Before: Audio-Responsive**
- Oscilloscope time-domain waveform was the centerpiece
- All visuals were driven by audio (RMS, peak, frequency)
- Required audio input to be visually interesting
- Could not run beautiful without a microphone

### **Now: Visual-First, Audio-Modulated**
- 5 generative visual modes with independent temporal evolution
- Audio modulates parameters (optional enhancement, not requirement)
- Stunning patterns whether or not audio is playing
- Can be used as pure visual art installation or live VJ tool

---

## New Visual Modes

| Mode | Concept | Tech |
|------|---------|------|
| **Kaleidoscope** | Rotating hexagonal/radial arcs | Trig + concentric scaling |
| **Orbits** | Particles in concentric circular paths | Parametric circles + positional particles |
| **Waves** | Layered sinusoidal flow | Multiple sine waves with phase offset |
| **Fractals** | Recursive square subdivision | Tree recursion with rotation |
| **Spirals** | Logarithmic spiral expansions | Polar coordinates, parameterized spirals |

---

## Audio Role (Refactored)

Audio is now a **modulation layer**, not the driver:

- **Bass (0–250 Hz)** → Expands geometric elements, increases orbit radius, modulates fractal scale
- **Mids (250 Hz–2 kHz)** → Controls wave frequency, orbit speed, spiral rate
- **High (2 kHz+)** → Adds fine fractal detail, modulates amplitude
- **Beat** → Visual pulse (red flash border)
- **RMS (overall level)** → Spiral rotation speed

If audio is **off/unavailable**: Everything still animates perfectly, just time-driven with fixed parameters.

---

## Minimal UI Strategy

**Zero UI by default:**
- Canvas takes full screen
- Cursor hidden
- No buttons, sliders, menus

**Keyboard-only control:**
- **1–5** to cycle modes
- **C/N/M/T/S** to cycle color palettes
- **Ctrl+Shift+H** to toggle HUD (one-line status overlay)
- **Esc** to toggle fullscreen
- **Ctrl+Q** to quit

**Rationale**: VJ/performance tool mentality. Operators know their keyboard. Visuals stay pure and uncluttered.

---

## Color Palette Redesign

Each palette has 5–6 colors chosen for cohesion and vibrancy:

- **Chromatic** (classic): Pink, orange, gold, purple, blue (emotional range)
- **Neon**: Lime, magenta, cyan, gold, hot pink (club/rave energy)
- **Monochrome**: Dark navy → bright white (minimal, elegant, stark)
- **Thermal**: Dark blue → bright red (scientific, temperature-like)
- **Sunset**: Pink → orange → gold → purple → blue (natural, warm)

Modes apply palettes differently:
- **Kaleidoscope**: Cycles color per segment
- **Orbits**: Color per orbit ring
- **Waves**: Color per wave layer
- **Fractals**: Color per recursion depth
- **Spirals**: Color per spiral

---

## Performance & Reliability

- **Canvas 2D MVP**: Fast, reliable, minimal CPU/GPU stress
- **Frame cap**: 60 FPS (can lower for battery/thermal management)
- **Graceful fallback**: Visual-only if audio unavailable
- **No network**: Pure local execution
- **Offline-ready**: Works on a system with no internet, no audio input, nothing but Electron

---

## Next Steps (Phase 2+)

1. **Audio Device Picker UI** (Phase 4): Allow operator to select input device
2. **Preset Save/Load**: Store custom color/mode combinations
3. **Advanced Palettes**: Let users upload custom color arrays
4. **Shader Path**: Port hot visuals to WebGL for GPU acceleration
5. **MIDI Input** (optional): Allow MIDI to trigger mode/palette changes

---

## Design Philosophy

> Visuals are the medium. Audio is a guest that can sit in the corner and add texture.
> 
> This tool should be beautiful whether or not it's connected to anything.
> 
> The operator should feel like a VJ, not someone watching a visualization of a waveform.

---

## Running the New Version

```bash
cd C:\Users\Green Machine\Desktop\gatekpt-visual-engine
npm start
```

- Launches fullscreen
- Shows pure, uncluttered visuals
- Press 1–5 to explore modes
- Press C/N/M/T/S to cycle colors
- Press Ctrl+Shift+H to see current mode name (overlay text, minimal)
- Ctrl+Q to quit
