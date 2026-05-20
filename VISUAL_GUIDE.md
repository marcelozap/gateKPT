# GateKPT Visual Engine – Visual Modes & Control

**Philosophy**: Visuals-first, audio-optional. Beautiful generative patterns that evolve whether or not audio is playing. Audio modulates the effect when available, but never drives it.

---

## Visual Modes (Press 1–5)

### 1. **Kaleidoscope**
Rotating geometric segments with concentric arcs. Segments spiral outward; bass adds radial expansion. Hypnotic, geometric, trance-ready.

### 2. **Orbits**  
Particles orbiting in concentric rings. Each orbit rotates at a different speed. Mids control orbit expansion. Calm, cosmic, meditative.

### 3. **Waves**
Layered sinusoidal waves flowing horizontally. High frequencies modulate wave frequency and amplitude. Fluid, organic, liquid.

### 4. **Fractals**
Recursive squares subdividing into smaller squares, creating a branching tree structure. Peak modulates recursion scale. Mathematical, intricate, deep.

### 5. **Spirals**
Logarithmic spirals expanding from center. RMS modulates spiral speed. Hypnotic, energetic, focused inward.

---

## Color Palettes (Press C, N, M, T, or S)

| Key | Palette | Mood |
|-----|---------|------|
| **C** | Chromatic | Vibrant rainbow (pink, orange, gold, purple, blue) |
| **N** | Neon | Bright glowing (lime, magenta, cyan, gold, hot pink) |
| **M** | Monochrome | Dark to bright (deep navy → white) |
| **T** | Thermal | Temperature map (dark blue → red) |
| **S** | Sunset | Warm gradient (pink → orange → gold → purple → blue) |

Each mode uses these palettes differently — some cycle through colors per layer, others use them sequentially.

---

## Audio Modulation (Optional)

If audio input is available:
- **Bass**: Expands geometric/orbital elements
- **Mids**: Modulates flow and wave frequency
- **High**: Adds fine detail and fractal depth
- **Beat**: Visual pulse/flash (red border in some modes)

If audio is **not** available: Visuals still animate beautifully, time-driven. You can launch the app on a system without a microphone and it will work perfectly.

---

## Keyboard Control

| Key | Action |
|-----|--------|
| **1–5** | Cycle visual modes |
| **C, N, M, T, S** | Cycle color palettes |
| **Ctrl+Shift+H** | Toggle HUD (show/hide info) |
| **Esc** | Toggle fullscreen |
| **Ctrl+Q** | Quit |

---

## HUD (Hidden by Default)

Shows when you press **Ctrl+Shift+H**:
- Current mode name
- Current color palette
- Audio status (RMS level if connected, or "offline")
- Frame rate

Hidden HUD gives you a pure, uncluttered visual experience. Show it only to tweak settings.

---

## Design Principles

1. **Visuals over Audio**: Audio is a passenger, not the driver. The visuals stand alone.
2. **Generative, Not Responsive**: Patterns evolve on their own timeline; audio adds texture.
3. **Zero UI**: Nothing on screen by default. Keyboard-only control.
4. **Works Offline**: No microphone required. No network. Pure generative art.
5. **Fullscreen Immersion**: Borderless, cursor hidden, total visual focus.

---

## Running

```bash
npm start
```

Launches fullscreen on external display (or primary if no external). Press keys to explore modes and palettes. Press **Ctrl+Shift+H** once to see what mode you're in.

Enjoy.
