# GateKPT Visual Engine – Architecture

**Current Phase:** 1 (Electron + Canvas 2D Scaffold with Audio Analysis)

## Project Vision

Merged the best of two approaches:
1. **Oscilloscope-Forward Aesthetic** (from standalone plan) – time-domain waveform as the readable centerpiece
2. **Advanced Audio Analysis** (from Voice Mirror) – pitch detection, transient detection, frequency analysis

## Core Components

### Audio Analysis (`AudioAnalyzer`)
- Web Audio API: `MediaStreamSource` → `AnalyserNode`
- **RMS & Peak** detection from time-domain samples
- **Pitch detection** via autocorrelation (optional FFT toggle)
- **Beat detection** via bass frequency band (>0.6 threshold)
- Frequency band analysis (bassify support for future enhancements)

### Rendering (`OscilloscopeRenderer`)
- Canvas 2D time-domain waveform as primary visual
- Optional FFT visualization (frequency bars)
- Beat-triggered red border flash
- Smoothing envelopes for RMS/peak (attack/release)
- Gain staging, persistence (phosphor decay), zoom controls
- Monochrome by default; color modes available

### Application (`GateKPTVisualEngine`)
- Electron + BrowserWindow (fullscreen on external display by default)
- IPC bridge for display picker, preset menu, HUD toggle, FFT toggle
- Preset system (JSON-based, loadable at runtime)
- 60 FPS frame-time monitoring in HUD

## File Structure

```
gatekpt-visual-engine/
├── package.json           # Electron + electron-builder config
├── main.js                # Electron main process, keyboard shortcuts
├── preload.js             # IPC context bridge
├── KEYBOARD_SHORTCUTS.md
├── ARCHITECTURE.md
└── renderer/
    ├── index.html         # Canvas + HUD + preset menu overlay
    ├── renderer.js        # Audio analysis + rendering logic
    └── style.css          # Dark theme, glassmorphism HUD
```

## Keyboard Control

- **Ctrl+Shift+H**: Toggle HUD (RMS, Peak, Hz, Frame Time)
- **Ctrl+Shift+P**: Show preset menu (Default, Wireless Safe)
- **Ctrl+Shift+D**: Show display picker (planned for Phase 4)
- **Ctrl+Shift+F**: Toggle FFT visualization
- **Esc**: Toggle fullscreen
- **Ctrl+Q**: Quit

## Presets

### Default
- gain: 1.0
- persistence: 0.2 (phosphor decay time)
- smoothing: attack=5ms, release=100ms
- zoom: 20
- monochromeMode: true
- fftEnabled: false

### Wireless Safe
Tuned for 100–300ms wireless display lag:
- persistence: 0.5 (longer afterimage to mask lag)
- smoothing: attack=10ms, release=200ms (higher smoothing to hide transients)
- monochromeMode: true (loudness color makes lag readable)
- fftEnabled: false (frequency strobe amplifies lag perception)

## Next Phases (Roadmap)

**Phase 2**: Local audio capture + live oscilloscope
- [x] Audio input from microphone/interface
- [x] RMS & peak envelope
- [x] Pitch detection (autocorrelation)
- [ ] Graceful "no input" fallback to static pattern
- [ ] 30-minute soak test (stability verification)

**Phase 3**: Bridge lane (Ableton → visual engine)
- Virtual audio router class (operator-chosen category, not a paid product)
- Ableton Master/Send routed to router input
- Engine device picker selection
- Stereo L≠R verification

**Phase 4**: Presets + projector picker + autoload
- Preset save/load (local JSON)
- Display picker UI (detect all OS displays)
- Last-used preset persistence
- Factory presets bundled in install

**Phase 5**: Soak QA + offline packaging
- 120-minute stability soak
- Offline .exe/.msi installer
- Clean-account install verification
- Code signing (optional local-trust in v0)

## Risk Register (Key Items)

| Risk | Mitigation |
|------|------------|
| Virtual router instability | Fallback to direct interface input |
| ASIO underrun under GPU load | Raise buffer to 512, cap renderer at 60fps |
| Wireless casting lag (100–300ms) | FOH audio pre-delay + Wireless Safe preset |
| Bluetooth audio sneaks onto show path | Disable on show profile, verify before each set |

## Notes

- **No network** in base plan (hard ban per spec)
- **Electron** chosen for fastest reliable path to fullscreen on Windows
- **Canvas 2D** MVP, GPU shader path (WebGL) later
- **JUCE plugin** is OPTIONAL FUTURE (macOS Ableton insert, not required for v0)
- **Show path**: Wireless (Smart View/Miracast on PC, AirPlay 2 on Mac) with FOH audio pre-delay
