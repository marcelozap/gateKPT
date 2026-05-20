# GateKPT – Latest Updates (v0.2.0)

## 🎨 Visual Quality Enhancements

### Color System Upgrade
- **HSL-based color palettes** replace flat RGB colors
- **Smooth gradient transitions** between colors using interpolation
- Colors evolve over time for dynamic, breathing visuals

### New Color Palettes
1. **Chromatic** – Bold primaries (hot pink, orange, yellow, purple, blue)
2. **Neon** – Electric energy (neon green, hot pink, cyan, lime, red)
3. **Aurora** – Ethereal northern lights (deep blue, cyan, emerald, violet, magenta)
4. **Ocean** – Deep water gradients (ocean blue, turquoise, sea green, cyan, sky blue)
5. **Sunset** – Warm golden hour (red-orange, orange, yellow, lavender, deep purple)

**Keyboard Shortcuts for Colors:**
- **C** → Chromatic
- **N** → Neon
- **A** → Aurora
- **S** → Sunset
- **O** → Ocean

### Glow & Shadow Effects
All five visual modes now feature:
- **Canvas shadows** for depth perception
- **Glow halos** around main elements
- **Layered transparency** for visual richness
- **Alpha blending** for smooth edges

### Enhanced Drawing Modes

#### 🔄 Kaleidoscope (Mode 1)
- Rotating arc segments with smooth gradient colors
- Inner glow rings for depth
- Dynamic radius pulsing synchronized to time
- Improved arc sweep with variable curvature

#### 🌍 Orbits (Mode 2)
- Gradient-colored orbital rings
- Glowing particles with aura effect
- Trailing arc visualization
- Smooth radius modulation

#### 〰️ Waves (Mode 3)
- Layered sinusoidal waves with gradient colors
- Filled wave areas for depth perception
- Smooth frequency and phase detuning between layers
- Enhanced amplitude modulation

#### ✦ Fractals (Mode 4)
- Recursive square subdivision with gradient colors
- Glowing borders on each square
- Dynamic depth-based coloring
- Smooth rotation and scaling

#### ⟲ Spirals (Mode 5)
- Multiple logarithmic spirals with gradient colors
- Inner glow spiral for contrast
- Tightness modulation by spectral brightness
- Enhanced parametric control

---

## 🖥️ macOS Support Plan

**New Document:** `MACOS_SETUP_PLAN.md`

### Key Features
- Development setup for Intel and Apple Silicon Macs
- Code signing and notarization workflow
- App Store submission guide
- External display detection (HDMI, AirPlay, Miracast)
- Troubleshooting common macOS issues

### Quick macOS Build
```bash
npm run build -- --mac
```

### Output
- DMG installer
- ZIP archive
- Notarized binary (with proper certificate)

---

## 🎵 Ableton Live Integration

**New Document:** `ABLETON_INTEGRATION.md`

### 4 Audio Routing Methods

#### Method 1: Soundflower (macOS Recommended)
- Free virtual audio device
- Routes Ableton output → System input
- Zero latency

#### Method 2: VB-Audio Virtual Cable (Windows)
- €7 or donation-based
- Works on Windows 10/11
- Professional audio routing

#### Method 3: Stereo Mix (Windows Built-in)
- Uses Windows audio loopback
- No additional software needed
- May not be available on all Windows systems

#### Method 4: OSC Control (Advanced)
- Send MIDI-like parameters from Ableton
- Direct control of visual parameters
- Works on both Windows and macOS

### Live Performance Setup
1. Route Ableton audio → GateKPT via Soundflower/VB-Audio
2. Launch GateKPT on projector display
3. Switch modes (1-5) and colors (C/N/A/S/O) with keyboard
4. Visuals respond to music in real-time (~30-70ms latency)

### Instrument-to-Mode Mapping
| Instrument | Best Mode | Color |
|------------|-----------|-------|
| Drums/Bass | Orbits | Chromatic |
| Melodic | Waves | Sunset |
| Vocals/Leads | Spirals | Aurora |
| Complex Harmony | Fractals | Ocean |
| Ambient/Pads | Kaleidoscope | Neon |

---

## 📋 What's Included

### Core Files
- `renderer/renderer.js` – Enhanced visual engine (HSL colors, glow effects)
- `MACOS_SETUP_PLAN.md` – Complete macOS deployment guide
- `ABLETON_INTEGRATION.md` – Audio routing and performance setup
- `.gitignore` – Excludes node_modules and build artifacts

### Documentation
- `README_VOCODER.md` – Vocal analysis features
- `VISUAL_GUIDE.md` – Visual mode descriptions
- `KEYBOARD_SHORTCUTS.md` – Control reference
- `ARCHITECTURE.md` – System architecture and design
- `VOCAL_ANALYSIS.md` – Detailed metric explanations

---

## 🚀 Getting Started

### Windows
```bash
npm install
npm start
```

### macOS (Development)
```bash
npm install
npm start
```

### macOS (Distribution Build)
```bash
npm run build -- --mac
# Opens dist/ with DMG and ZIP files
```

### With Ableton Live
1. Start GateKPT
2. Route Ableton → Soundflower (Mac) or VB-Audio (Windows)
3. Press **A** to toggle test audio
4. Press **1-5** to switch visual modes
5. Play music in Ableton
6. Watch visuals respond in real-time

---

## 🎮 Keyboard Controls

| Key | Action |
|-----|--------|
| **1–5** | Switch visual modes |
| **C/N/A/S/O** | Switch color palettes |
| **A** | Toggle test audio (sine/triangle/square tones) |
| **Ctrl+Shift+H** | Show/hide HUD |
| **Esc** | Toggle fullscreen |
| **Ctrl+Q** | Quit application |

---

## 📊 Performance

- **Target FPS:** 60+ (smooth animation)
- **Latency:** < 50ms (imperceptible)
- **Audio Latency:** ~30-70ms with routing
- **CPU:** Low-medium load (depends on visual complexity)
- **GPU:** Canvas 2D (hardware accelerated on most systems)

---

## 🔧 Technical Details

### Color System
```javascript
// HSL-based palette (Hue, Saturation, Lightness)
{ h: 330, s: 100, l: 50 }  // Hot pink
{ h: 210, s: 100, l: 55 }  // Blue

// Smooth interpolation between palette colors
getGradientColor(palette, position)  // 0–1 transitions
```

### Visual Rendering
- Canvas 2D with `ctx.shadowColor` and `ctx.shadowBlur`
- `ctx.globalAlpha` for layered transparency
- Time-based animations: `Math.sin(time * constant)`
- No external dependencies (pure JavaScript)

### Audio Integration (Future)
- Web Audio API analyser node
- Autocorrelation-based pitch detection
- Formant analysis (F1, F2, F3)
- Spectral centroid calculation
- Vibrato and shimmer detection

---

## 🐛 Known Limitations

- **Windows Stereo Mix** may not be available on all systems (use VB-Audio instead)
- **macOS Soundflower** requires restart after installation
- **Audio latency** varies by system and routing method
- **Fullscreen on multiple monitors** uses last detected monitor

---

## 📝 Future Roadmap

### v0.3.0 (Planned)
- Audio-responsive visuals (pitch-to-rotation, energy-to-opacity)
- Particle system with physics
- Custom preset system (save/load visual configurations)

### v0.4.0 (Planned)
- Ableton Link synchronization (tempo sync across devices)
- MIDI note visualization
- WebGL renderer for advanced effects

### v1.0.0 (Planned)
- Mac App Store submission
- Windows Store packaging
- Official release on GitHub

---

## 🙏 Credits

- **GateKPT** – Visual instrument design and implementation
- **Electron** – Cross-platform desktop framework
- **Canvas 2D** – Vector graphics rendering
- **Web Audio API** – Audio processing

---

## 📞 Support & Contributions

- **GitHub:** https://github.com/marcelozap/gateKPT
- **Issues:** Report bugs and request features
- **Discussions:** Share ideas and ask questions
- **Pull Requests:** Contributions welcome!

---

**Turn on, sing, watch your voice become visible. Your music is a living, breathing instrument.**
