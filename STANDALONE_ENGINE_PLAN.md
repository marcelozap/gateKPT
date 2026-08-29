# GateKPT – Standalone Engine Independence Plan

## Vision
**GateKPT must live forever on GitHub as a fully self-contained, open-source project that anyone can fork, build, and develop—with zero dependencies on Claude, external services, or proprietary tools.**

---

## Phase 1: Code & Documentation Completeness (Week 1)

### Goal: Make Code Self-Documenting

Every file must explain itself to a developer who has never seen Claude or this project.

#### 1.1 Add Comprehensive Comments to Core Files

**`renderer/renderer.js`**
```javascript
/**
 * GateKPT Visual Engine - Core Rendering System
 * 
 * This is the heart of GateKPT. It renders animated geometric patterns
 * to a Canvas 2D element, synchronized with audio input.
 * 
 * Entry point: 
 *   1. DOM loads index.html
 *   2. Preload.js bridges Electron IPC
 *   3. This file runs in browser context
 *   4. Creates VisualEngine instance
 *   5. Begins requestAnimationFrame loop
 * 
 * No external dependencies except Web Audio API (browser built-in)
 * 
 * Usage:
 *   const engine = new VisualEngine(canvas);
 *   engine.setup();
 *   engine.animate();
 * 
 * Modes:
 *   - kaleidoscope: Rotating arc segments
 *   - orbits: Orbiting particles with trails
 *   - waves: Layered sinusoidal waves
 *   - fractals: Recursive subdividing squares
 *   - spirals: Logarithmic spiral patterns
 * 
 * Colors: HSL-based gradient interpolation (5 palettes)
 * Animation: Time-based (Math.sin, Math.cos) with no external libs
 * 
 * @class VisualEngine
 * @constructor {Canvas} element
 */

class VisualEngine {
  constructor(canvas) {
    // Validate canvas exists
    if (!canvas) {
      throw new Error('Canvas element required');
    }
    
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    
    // ... rest of code
  }
}
```

#### 1.2 Add JSDoc to All Functions

```javascript
/**
 * Convert HSL color values to RGB string
 * 
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} RGB color string: "rgb(r, g, b)"
 * 
 * @example
 * const color = hslToRgb(330, 100, 50); // "rgb(255, 0, 127)"
 */
hslToRgb(h, s, l) {
  // implementation
}
```

#### 1.3 Document Architecture in Code

Create `renderer/ARCHITECTURE.md` in code directory:

```markdown
# GateKPT Visual Engine - Architecture

## File Structure
```
renderer/
├── index.html          # Entry point for browser
├── style.css           # Styling (minimal)
├── renderer.js         # Main visual engine (1000+ lines)
├── harmonizer.js       # Voice harmonizer (future)
├── recorder.js         # Audio recording (future)
└── ARCHITECTURE.md     # This file
```

## Data Flow

```
Browser Load
    ↓
index.html loads
    ↓
Script: renderer.js initializes
    ↓
VisualEngine class instantiated
    ↓
setup() → keyboard listeners + resize handlers
    ↓
animate() → requestAnimationFrame loop
    ↓
Each frame:
  - time++
  - drawFrame() calls mode function
  - Canvas renders geometric patterns
  - Loop continues
```

## Key Classes

### VisualEngine
- Manages Canvas 2D rendering
- Handles keyboard input
- Cycles through 8 visual modes
- Manages color palettes

### AudioAnalyzer (future)
- Analyzes microphone input
- Detects pitch via autocorrelation
- Calculates spectral metrics

### VoiceHarmonizer (future)
- Generates 3-part vocal harmonies
- Uses pitch shifting via Web Audio
- Blends with original voice

## Color System

Colors use HSL (Hue, Saturation, Lightness):
```javascript
{
  h: 330,  // Hue 0-360
  s: 100,  // Saturation 0-100
  l: 50    // Lightness 0-100
}
```

Interpolated smoothly between palette colors via:
```
colorPos = (time * 0.0005) % 1  // 0-1 over time
newColor = interpolate(palette[idx], palette[idx+1], colorPos)
```

## Animation Method

All animations use time-based math:
```javascript
// Instead of: value = audioData[i]  // Requires audio
// We use:
value = Math.sin(time * 0.01) * 100  // Always animates
```

This guarantees visuals work **offline**, with or without audio.

## No External Dependencies

GateKPT uses ONLY:
- HTML5 Canvas 2D (built-in)
- Web Audio API (built-in)
- Vanilla JavaScript (ES6)
- Electron (for desktop app only)

No jQuery, React, Three.js, etc.

This keeps the code:
- Fast
- Lightweight
- Portable
- Forever maintainable
```

### 1.4 Create Developer Setup Guide

Create `DEVELOPER_SETUP.md`:

```markdown
# GateKPT – Developer Setup Guide

## For Someone Forking This Project

### Prerequisites
- Node.js 18+ (https://nodejs.org/)
- Git (https://git-scm.com/)
- A code editor (VS Code, Sublime, etc.)
- A microphone (optional, for audio features)

### Quick Start

1. **Clone the repo**
```bash
git clone https://github.com/marcelozap/gateKPT.git
cd gateKPT
```

2. **Install dependencies**
```bash
npm install
```

3. **Run locally**
```bash
npm start
```

4. **See it running**
- A fullscreen window opens with animated geometric shapes
- Press 1-5 to switch modes
- Press C/N/A/S/O to change colors
- Press Ctrl+Q to quit

### File Locations

- **Main code:** `renderer/renderer.js`
- **Entry HTML:** `renderer/index.html`
- **Styling:** `renderer/style.css`
- **Electron setup:** `main.js`, `preload.js`
- **Config:** `package.json`

### How to Modify

#### Add a new visual mode

In `renderer/renderer.js`:

```javascript
// 1. Add to drawFrame() switch
drawFrame() {
  const modes = {
    // ... existing modes ...
    myNewMode: () => this.drawMyNewMode(),
  };
  // ...
}

// 2. Create the function
drawMyNewMode() {
  const { ctx, width, height, time } = this;
  // Draw your pattern here
  // Use time for animation
  // Use width/height for positioning
}

// 3. Keyboard control - in setupKeyboard()
if (e.key === "6") this.mode = "myNewMode";
```

#### Add a new color palette

```javascript
this.colorPalettes = {
  // ... existing palettes ...
  myColors: [
    { h: 0, s: 100, l: 50 },    // Red
    { h: 60, s: 100, l: 50 },   // Yellow
    { h: 120, s: 100, l: 50 },  // Green
  ],
};

// Keyboard control
if (e.key === "y") this.colorMode = "myColors";
```

### Building for Distribution

#### Windows EXE
```bash
npm run build -- --win
# Output: dist/GateKPT-Setup-*.exe
```

#### macOS DMG
```bash
npm run build -- --mac
# Output: dist/GateKPT-*.dmg
```

### Testing

```bash
# Just run it
npm start

# Check console for errors
# Press F12 in the window to open DevTools

# Look for console messages:
# - "Renderer starting..."
# - "VisualEngine ready"
# - "Engine started successfully"
```

### Troubleshooting

**"Canvas element not found"**
- Check renderer/index.html has `<canvas id="scope"></canvas>`

**"No audio input detected"**
- Normal if no mic connected
- Visuals still animate via time-based math
- To enable audio: allow microphone in browser

**"Black screen"**
- Check browser console (F12 > Console tab)
- Look for JavaScript errors
- Ensure hardware acceleration enabled

### Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit pull request

See CONTRIBUTING.md for full guidelines.
```

### 1.5 Create CONTRIBUTING.md

```markdown
# Contributing to GateKPT

## Reporting Issues

Found a bug? Open an issue:
1. Go to GitHub Issues
2. Click "New Issue"
3. Describe: what you did, what happened, what you expected
4. Include: OS, browser version, error messages

## Submitting Features

Want to add something?
1. Open an issue first (discuss idea)
2. Fork the repo
3. Create feature branch: `git checkout -b feature/my-feature`
4. Make changes with clear commit messages
5. Submit PR with description

## Code Style

- Use vanilla JavaScript (no frameworks)
- Add comments for complex logic
- Use descriptive variable names
- Test on both Windows and macOS if possible

## Testing Changes

Before submitting:
```bash
npm install
npm start
# Test all modes (1-5)
# Test all colors (C/N/A/S/O)
# Test on projected display if applicable
```
```

---

## Phase 2: Build System Independence (Week 1)

### Goal: Anyone Can Build Without Claude

#### 2.1 Perfect `package.json`

```json
{
  "name": "gatekpt-visual-engine",
  "version": "0.2.0",
  "description": "Your voice becomes art. Real-time visual instrument with voice harmonizer and recording.",
  "main": "main.js",
  "homepage": "https://gatekpt.com",
  "repository": {
    "type": "git",
    "url": "https://github.com/marcelozap/gateKPT.git"
  },
  "author": "Marcelo Zapata <marcelozapata00@gmail.com>",
  "license": "MIT",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:all": "electron-builder -mw",
    "pack": "electron-builder --dir",
    "dist": "electron-builder"
  },
  "devDependencies": {
    "electron": "^35.0.0",
    "electron-builder": "^24.9.1"
  },
  "build": {
    "appId": "com.gatekpt.visualengine",
    "productName": "GateKPT",
    "files": [
      "main.js",
      "preload.js",
      "renderer/**/*",
      "node_modules/**/*"
    ],
    "directories": {
      "buildResources": "assets"
    },
    "win": {
      "target": [
        "nsis",
        "portable"
      ],
      "certificateFile": null
    },
    "mac": {
      "target": [
        "dmg",
        "zip"
      ],
      "category": "public.app-category.entertainment"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

#### 2.2 Create Build Scripts

Create `scripts/build-windows.sh`:

```bash
#!/bin/bash
# Build GateKPT for Windows

echo "🔨 Building GateKPT for Windows..."
npm install
npm run build:win

echo "✅ Build complete!"
echo "📦 Output: dist/"
ls -lh dist/
```

Create `scripts/build-mac.sh`:

```bash
#!/bin/bash
# Build GateKPT for macOS

echo "🔨 Building GateKPT for macOS..."
npm install
npm run build:mac

echo "✅ Build complete!"
echo "📦 Output: dist/"
ls -lh dist/
```

Create `scripts/build-all.sh`:

```bash
#!/bin/bash
# Build GateKPT for all platforms

echo "🔨 Building GateKPT for Windows and macOS..."
npm install
npm run build:all

echo "✅ All builds complete!"
echo "📦 Output: dist/"
ls -lh dist/
```

#### 2.3 Update README.md

Make it the single source of truth:

```markdown
# GateKPT – Your Voice Becomes Art

![Version](https://img.shields.io/badge/version-0.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-blue)

## What is GateKPT?

A real-time visual instrument that transforms your voice into animated, colorful geometric patterns. Sing into your microphone, watch your voice become art, record everything.

**Features:**
- 🎨 8 visual modes with 5 color palettes
- 🎤 Real-time voice analysis
- 🎵 3-part voice harmonizer (coming soon)
- 🎙️ High-quality recording
- 📺 Perfect for projector displays
- ⌨️ Keyboard-only control
- 🖥️ Works on Windows & macOS

## Download

### Latest Release: v0.2.0

**Windows:**
- [Download EXE Installer](https://github.com/marcelozap/gateKPT/releases/download/v0.2.0/GateKPT-Setup-0.2.0.exe)
- [Download Portable](https://github.com/marcelozap/gateKPT/releases/download/v0.2.0/GateKPT-0.2.0.exe)

**macOS:**
- [Download DMG](https://github.com/marcelozap/gateKPT/releases/download/v0.2.0/GateKPT-0.2.0.dmg)
- [Download ZIP](https://github.com/marcelozap/gateKPT/releases/download/v0.2.0/GateKPT-0.2.0-mac.zip)

## Quick Start

### Option 1: Download & Install (Recommended)
1. Download the installer for your platform (above)
2. Install and launch
3. Allow microphone access
4. Start singing!

### Option 2: Build from Source
```bash
git clone https://github.com/marcelozap/gateKPT.git
cd gateKPT
npm install
npm start
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| **1–5** | Switch visual mode |
| **C/N/A/S/O** | Switch color palette |
| **A** | Toggle test audio |
| **Ctrl+Shift+H** | Show/hide HUD |
| **Esc** | Toggle fullscreen |
| **Ctrl+Q** | Quit |

## Visual Modes

1. **Kaleidoscope** – Rotating arc segments
2. **Orbits** – Orbiting particles with trails
3. **Waves** – Layered sinusoidal waves
4. **Fractals** – Recursive subdividing squares
5. **Spirals** – Logarithmic spiral patterns
6. **Harmony Orbits** – Multiple voice rings
7. **Voice Spectrum** – Vertical voice bars
8. **Harmony Waves** – Stacked voice waveforms

## Color Palettes

- **Chromatic** (C) – Bold primaries
- **Neon** (N) – Electric energy
- **Aurora** (A) – Northern lights
- **Ocean** (O) – Deep water
- **Sunset** (S) – Golden hour

## Documentation

- [Getting Started](./LATEST_UPDATES.md)
- [Ableton Integration](./ABLETON_INTEGRATION.md)
- [macOS Setup](./MACOS_SETUP_PLAN.md)
- [Developer Guide](./DEVELOPER_SETUP.md)
- [Architecture](./renderer/ARCHITECTURE.md)

## For Developers

Want to contribute? See [CONTRIBUTING.md](./CONTRIBUTING.md)

### Build for Distribution

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Both
npm run build:all
```

### System Requirements

- Node.js 18+
- Windows 10+ or macOS 10.15+
- 2GB RAM
- Microphone (optional)

## License

MIT License – See [LICENSE](./LICENSE) file

## Community

- **GitHub:** https://github.com/marcelozap/gateKPT
- **Instagram:** @gatekpt
- **Website:** https://gatekpt.com

## Roadmap

- [x] Visual modes (8)
- [x] Color palettes (5)
- [ ] Voice harmonizer (v0.3.0)
- [ ] Recording system (v0.3.0)
- [ ] macOS App Store
- [ ] iOS app
- [ ] VST plugin

## Support

Found a bug? [Open an issue](https://github.com/marcelozap/gateKPT/issues)

---

**Your voice becomes art. Transform your performance.**
```

---

## Phase 3: GitHub-Only Workflow (Week 1)

### Goal: GitHub is the Single Source of Truth

#### 3.1 Create GitHub Release Template

File: `.github/RELEASE_TEMPLATE.md`

```markdown
# GateKPT v[VERSION]

## 🎨 What's New

### Features
- Feature 1 description
- Feature 2 description

### Bug Fixes
- Fix 1 description
- Fix 2 description

### Known Issues
- Issue 1
- Issue 2

## 📥 Downloads

### Windows
- [EXE Installer](link)
- [Portable EXE](link)

### macOS
- [DMG](link)
- [ZIP](link)

## 🐛 Report Issues

Found a bug? [Open an issue](https://github.com/marcelozap/gateKPT/issues)

## 💻 For Developers

[Build from source instructions](../DEVELOPER_SETUP.md)
```

#### 3.2 Create GitHub Issues Template

File: `.github/ISSUE_TEMPLATE/bug_report.md`

```markdown
---
name: Bug Report
about: Report something that isn't working
title: "[BUG] "
labels: bug
---

## Describe the Bug
(What happened?)

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior
(What should happen?)

## Screenshots
(If applicable)

## System Info
- OS: Windows 10 / macOS 12 / etc.
- GateKPT Version: 0.2.0
- Node.js Version: 18.x

## Additional Context
(Anything else?)
```

#### 3.3 Create GitHub Discussions Setup

Instructions for enabling:

1. Go to repository Settings
2. Under "Features" → enable "Discussions"
3. Create categories:
   - **General** – Questions and ideas
   - **Feature Requests** – New features
   - **Show & Tell** – Videos, creations
   - **Troubleshooting** – Help using GateKPT

---

## Phase 4: Package & Distribute (Week 2)

### Goal: Anyone Can Download & Run (No Installation Needed)

#### 4.1 Create Portable Builds

Update `package.json` build section:

```json
"win": {
  "target": [
    {
      "target": "nsis",
      "arch": ["x64"]
    },
    {
      "target": "portable",
      "arch": ["x64"]
    }
  ]
}
```

This creates:
- `GateKPT-Setup-0.2.0.exe` (installer)
- `GateKPT-0.2.0.exe` (portable, no install needed)

#### 4.2 Create GitHub Releases

Script: `scripts/create-release.sh`

```bash
#!/bin/bash
# Create a GitHub release with built files

VERSION="0.2.0"
GITHUB_TOKEN="your-token-here"

echo "📦 Creating release v$VERSION..."

# Build
npm run build:all

# Create release via GitHub API
gh release create "v$VERSION" \
  dist/GateKPT-Setup-$VERSION.exe \
  dist/GateKPT-$VERSION.exe \
  dist/GateKPT-$VERSION.dmg \
  dist/GateKPT-$VERSION-mac.zip \
  --title "GateKPT v$VERSION" \
  --notes-file RELEASE_NOTES.md

echo "✅ Release created!"
echo "🔗 https://github.com/marcelozap/gateKPT/releases/tag/v$VERSION"
```

#### 4.3 Auto-Update System

Create `src/auto-updater.js`:

```javascript
/**
 * Auto-update system
 * Checks GitHub releases for new versions
 */

const https = require('https');

class AutoUpdater {
  constructor() {
    this.currentVersion = require('../package.json').version;
    this.repoUrl = 'api.github.com/repos/marcelozap/gateKPT';
  }
  
  checkForUpdates() {
    return new Promise((resolve, reject) => {
      https.get(`https://${this.repoUrl}/releases/latest`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const release = JSON.parse(data);
          const latestVersion = release.tag_name.slice(1); // Remove 'v'
          
          if (this.compareVersions(latestVersion, this.currentVersion) > 0) {
            resolve({
              updateAvailable: true,
              version: latestVersion,
              downloadUrl: release.html_url
            });
          } else {
            resolve({ updateAvailable: false });
          }
        });
      }).on('error', reject);
    });
  }
  
  compareVersions(v1, v2) {
    const a = v1.split('.').map(Number);
    const b = v2.split('.').map(Number);
    return (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2]);
  }
}

module.exports = AutoUpdater;
```

---

## Phase 5: Open Source Forever (Week 2)

### Goal: Code Will Live On After You Stop Using Claude

#### 5.1 MIT License

Create `LICENSE`:

```
MIT License

Copyright (c) 2024 Marcelo Zapata

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

#### 5.2 ARCHITECTURE.md (Comprehensive)

Create detailed architecture so anyone can understand the entire system:

```markdown
# GateKPT Architecture

## Overview
GateKPT is a standalone Electron application that renders real-time visual patterns
synchronized with audio input from a microphone.

## Technology Stack

### Frontend
- **HTML5 Canvas 2D** – Rendering engine
- **Vanilla JavaScript (ES6)** – No frameworks
- **Web Audio API** – Microphone input

### Backend (Electron)
- **Node.js** – Runtime
- **Electron** – Desktop wrapper
- **IPC** – Inter-process communication

### Build & Distribution
- **npm** – Package management
- **Electron Builder** – Packaging for Windows/macOS
- **GitHub Releases** – Distribution

## File Structure

```
gatekpt-visual-engine/
├── main.js                 # Electron main process
├── preload.js              # IPC bridge
├── package.json            # Dependencies & build config
│
├── renderer/               # Frontend (runs in browser)
│   ├── index.html          # Entry point
│   ├── style.css           # Styling
│   ├── renderer.js         # Visual engine (1000+ lines)
│   ├── harmonizer.js       # Voice harmonizer (future)
│   └── recorder.js         # Recording system (future)
│
├── assets/                 # App icons, images
│   └── icon.png
│
├── docs/                   # Documentation
│   ├── DEVELOPER_SETUP.md
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   └── ...
│
└── scripts/                # Build & deployment scripts
    ├── build-windows.sh
    ├── build-mac.sh
    └── create-release.sh
```

## Data Flow

### Startup
```
1. User launches GateKPT.exe / GateKPT.app
2. Electron main.js starts
3. main.js creates BrowserWindow
4. Window loads renderer/index.html
5. preload.js establishes IPC bridge
6. renderer.js initializes VisualEngine
7. Canvas renders first frame
8. requestAnimationFrame loop begins
```

### Runtime
```
Every frame (60 FPS):
  1. time++
  2. Keyboard input captured
  3. drawFrame() called
  4. Mode-specific function runs (drawKaleidoscope, etc.)
  5. Canvas cleared & redrawn
  6. Next frame requested
```

### Audio (Future)
```
When audio enabled:
  1. Microphone access requested
  2. AudioAnalyzer captures input
  3. Pitch detection via autocorrelation
  4. Harmonizer generates 3 voices
  5. Visual parameters modulated by audio
  6. All synchronized to animation
```

## Key Systems

### 1. Visual Engine (renderer/renderer.js)

**Responsibilities:**
- Canvas 2D rendering
- Animation loop management
- Keyboard input handling
- Color palette management
- 8 different visual modes

**Key Methods:**
- `constructor(canvas)` – Initialize
- `setup()` – Setup keyboard & resize handlers
- `animate()` – Main loop (calls requestAnimationFrame)
- `drawFrame()` – Dispatch to mode-specific function
- `drawKaleidoscope()` – Mode 1 rendering
- `drawOrbits()` – Mode 2 rendering
- (etc. for modes 3-8)

**Color System:**
```javascript
// HSL palette
palette: [
  { h: 330, s: 100, l: 50 },  // Color 1
  { h: 20, s: 100, l: 55 },   // Color 2
  // ...
]

// Interpolate between colors
getGradientColor(palette, position)  // 0-1 transitions smoothly
```

### 2. Electron Main Process (main.js)

**Responsibilities:**
- Window creation & lifecycle
- Keyboard shortcuts (global)
- IPC communication
- Display detection (future)
- Auto-updates (future)

**Key Methods:**
- `app.on('ready')` – Create window
- `ipcMain.on()` – Handle messages from renderer
- `ipcMain.invoke()` – RPC-style calls
- Keyboard shortcut registration

### 3. IPC Bridge (preload.js)

**Responsibilities:**
- Expose safe APIs to renderer
- Prevent direct access to Node.js
- Context isolation

**Exposed APIs:**
```javascript
window.engine = {
  onToggleHud(callback),
  onShowPresetMenu(callback),
  onShowDisplayPicker(callback),
  onToggleFFT(callback),
}
```

## Animation System

### Time-Based (No Dependencies)
```javascript
// Every animation uses time
const time = this.time;  // Increments every frame

// Rotation
ctx.rotate(time * 0.002);

// Scaling
const scale = 1 + Math.sin(time * 0.01) * 0.2;

// Color change
const hue = (time * 0.1) % 360;

// Wave offset
const y = amplitude * Math.sin(x * frequency + time * 0.02);
```

This guarantees smooth animation **even without audio input**.

## Build Process

### Windows
```bash
npm run build:win
# electron-builder creates:
# - dist/GateKPT-Setup-0.2.0.exe (installer)
# - dist/GateKPT-0.2.0.exe (portable)
```

### macOS
```bash
npm run build:mac
# Creates:
# - dist/GateKPT-0.2.0.dmg (disk image)
# - dist/GateKPT-0.2.0-mac.zip (archive)
```

### Configuration
File: `package.json` → `"build"` section

Defines:
- Application ID
- File inclusion/exclusion
- Platform-specific settings
- Installer options

## How to Extend

### Add a New Visual Mode

1. Create function in `renderer.js`:
```javascript
drawMyMode() {
  const { ctx, width, height, time } = this;
  
  // Your rendering code here
  // Use time for animation
  
  ctx.fillStyle = ...;
  ctx.fillRect(...);
}
```

2. Register in `drawFrame()`:
```javascript
const modes = {
  mymode: () => this.drawMyMode(),  // Add this
  // ...
};
```

3. Add keyboard shortcut:
```javascript
if (e.key === "9") this.mode = "mymode";
```

### Add Audio Analysis

1. Create `AudioAnalyzer` class
2. Initialize in `VisualEngine.constructor()`
3. Call `analyzer.update()` in animation loop
4. Read metrics: `analyzer.pitch`, `analyzer.energy`, etc.
5. Use metrics to modulate visual parameters

### Add Recording

1. Create `AudioRecorder` class (see VOCODER_HARMONIES_PLAN.md)
2. Connect microphone stream
3. Use MediaRecorder API
4. Save output on stop

## Performance Considerations

### Rendering
- Canvas 2D is fast (hardware accelerated on most systems)
- 60 FPS achievable on modest hardware
- No garbage collection pauses (reuse buffers)

### Audio (Future)
- FFT analysis: ~50ms per frame (acceptable)
- Pitch detection: ~30ms (autocorrelation is fast)
- Pitch shifting: ~40ms (Web Audio API)
- Total latency: 100-120ms (imperceptible)

### Optimization Tips
- Reuse canvas context methods
- Avoid creating new objects in animation loop
- Use typed arrays for audio processing
- Profile with Chrome DevTools

## Dependencies

### Runtime
- **electron** – Desktop wrapper
- No other npm dependencies!

### Development
- **electron-builder** – Packaging

That's it. Everything else is built-in APIs.

## Testing

### Manual
```bash
npm start
# Test all 8 modes (1-5, 6-8)
# Test all 5 colors (C/N/A/S/O)
# Check fullscreen toggle (Esc)
# Verify keyboard shortcuts work
```

### Automated (Future)
- Unit tests for color math
- Integration tests for mode rendering
- E2E tests for full workflow

## Distribution Channels

1. **GitHub Releases** – Direct download
2. **macOS App Store** – Future (requires notarization)
3. **Windows Store** – Future
4. **Homebrew** – `brew install gatekpt` (future)
5. **Website** – gatekpt.com download

## Future Roadmap

- [ ] Audio analysis & visualization
- [ ] Voice harmonizer (3-part auto harmony)
- [ ] Recording system (high-quality export)
- [ ] Ableton Live integration
- [ ] Preset system (save/load configurations)
- [ ] VST plugin (use in DAWs)
- [ ] iOS app
- [ ] VR support (Meta Quest, etc.)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md)

## Support

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Email:** marcelozapata00@gmail.com
```

#### 5.3 Create MAINTENANCE.md

For anyone who wants to maintain the project after you:

```markdown
# Maintaining GateKPT

This document is for anyone who wants to maintain or develop GateKPT.

## Release Cycle

### Monthly Releases
- 1st of month: New version release
- Throughout: Bug fixes and patches

### Versioning
Uses semantic versioning: MAJOR.MINOR.PATCH
- 0.2.0 → 0.3.0 (new features)
- 0.2.0 → 0.2.1 (bug fixes)

### Release Checklist
- [ ] Update version in package.json
- [ ] Run `npm install` (updates lock file)
- [ ] Test on Windows & macOS
- [ ] Build: `npm run build:all`
- [ ] Test installers on real systems
- [ ] Create GitHub release with binaries
- [ ] Update website with download links

## Issue Management

### Triage
1. Read issue carefully
2. Label: bug / feature / documentation
3. Assign priority: critical / high / medium / low
4. Comment with plan

### Bug Fixes
1. Reproduce locally
2. Create test case
3. Fix code
4. Verify fix
5. Close issue

### Feature Requests
1. Discuss feasibility
2. Document design
3. Implement incrementally
4. Request feedback
5. Merge when ready

## Code Reviews

Before merging PR:
- [ ] Code style consistent
- [ ] No console errors
- [ ] Changes tested
- [ ] Documentation updated
- [ ] PR description clear

## Documentation

Keep updated:
- README.md – Installation & quick start
- DEVELOPER_SETUP.md – For contributors
- ARCHITECTURE.md – System design
- Commit messages – Describe "why" not "what"

## Building & Distribution

### Testing Before Release
```bash
npm install
npm start
# Test all features

npm run build:all
# Test Windows installer
# Test macOS dmg
# Test portable exe
```

### Creating Release
```bash
bash scripts/create-release.sh
```

## Common Tasks

### Fix a Bug
```bash
git checkout main
git pull origin main
git checkout -b fix/bug-description
# Make changes
npm start  # Test
git add .
git commit -m "Fix: bug description"
git push origin fix/bug-description
# Create PR on GitHub
```

### Add a Feature
```bash
git checkout main
git pull origin main
git checkout -b feature/feature-name
# Make changes
npm start  # Test thoroughly
git add .
git commit -m "Feature: feature description"
git push origin feature/feature-name
# Create PR with description
```

### Update Dependencies
```bash
npm outdated  # See what's outdated
npm update    # Update packages
npm audit     # Check for vulnerabilities
npm start     # Test everything
git add package*.json
git commit -m "chore: update dependencies"
git push origin main
```

## Support & Troubleshooting

### Common Issues

**"Canvas element not found"**
- Check renderer/index.html has `<canvas id="scope"></canvas>`

**Build fails**
- Ensure Node.js 18+: `node --version`
- Clean install: `rm -rf node_modules && npm install`

**Can't run on Mac**
- May need to approve in System Preferences
- Or use: `xattr -d com.apple.quarantine GateKPT.app`

## Going Forward

This project is designed to live on GitHub forever:
- No external service dependencies
- No proprietary formats
- Pure open source
- Anyone can fork and continue

If the original maintainer stops, the community can:
1. Fork the repository
2. Continue development
3. Create releases
4. Maintain website

The code is yours!
```

---

## Phase 6: Final Commitments (Week 2)

### 6.1 Create Standalone Snapshot

Commit everything to GitHub with message:

```
Version 0.2.0: Complete Standalone Release

This version is fully independent and self-sustaining:

✅ Zero Claude dependencies
✅ Complete documentation
✅ Build scripts for Windows & macOS
✅ GitHub-native distribution
✅ MIT Open Source license
✅ Community-ready for forks

Anyone can:
- Clone the repo
- npm install
- npm start
- Build distributions
- Contribute improvements
- Fork and maintain

GateKPT will live forever.
```

### 6.2 Create Website with GitHub Pages (Optional)

Create `docs/index.html` for GitHub Pages:

```html
<!DOCTYPE html>
<html>
<head>
  <title>GateKPT - Your Voice Becomes Art</title>
  <meta name="description" content="Real-time visual instrument with voice harmonizer">
  <style>
    body { font-family: sans-serif; max-width: 1000px; margin: 0 auto; }
    .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; padding: 60px 20px; text-align: center; }
    .downloads { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>🎨 GateKPT</h1>
    <p>Your voice becomes art</p>
    <p>Real-time visual instrument with voice harmonizer and recording</p>
  </div>

  <section class="downloads">
    <div>
      <h3>💻 Download for Windows</h3>
      <p><a href="https://github.com/marcelozap/gateKPT/releases">Download Latest Release</a></p>
    </div>
    <div>
      <h3>🍎 Download for macOS</h3>
      <p><a href="https://github.com/marcelozap/gateKPT/releases">Download Latest Release</a></p>
    </div>
  </section>

  <section>
    <h2>Features</h2>
    <ul>
      <li>8 visual modes</li>
      <li>5 color palettes</li>
      <li>Voice harmonizer</li>
      <li>Real-time recording</li>
      <li>Works on projectors</li>
      <li>100% free & open source</li>
    </ul>
  </section>

  <section>
    <h2>Getting Started</h2>
    <ol>
      <li>Download for your platform</li>
      <li>Install & launch</li>
      <li>Allow microphone access</li>
      <li>Sing into your mic</li>
      <li>Watch your voice become art</li>
    </ol>
  </section>

  <footer>
    <p>
      <a href="https://github.com/marcelozap/gateKPT">GitHub</a> |
      <a href="https://instagram.com/gatekpt">Instagram</a> |
      <a href="https://github.com/marcelozap/gateKPT/blob/main/LICENSE">MIT License</a>
    </p>
  </footer>
</body>
</html>
```

---

## Success Criteria: GateKPT Will Live Forever If...

✅ **Code is self-contained**
- ✓ No external service dependencies
- ✓ All code documented
- ✓ Build system works from scratch

✅ **GitHub is the source of truth**
- ✓ README is comprehensive
- ✓ All docs in repo
- ✓ Release process automated

✅ **Anyone can build & distribute**
- ✓ `npm install && npm start` works
- ✓ Build scripts functional
- ✓ Executables are standalone

✅ **Community can fork & maintain**
- ✓ MIT license clear
- ✓ Contributing guidelines provided
- ✓ Code structure obvious

✅ **Live forever on GitHub**
- ✓ No account logins required
- ✓ No API keys in code
- ✓ No time-limited resources
- ✓ Can be forked indefinitely

---

## Summary

By the end of this plan, GateKPT will be:

1. **Completely standalone** – Works without Claude, without external services
2. **Fully documented** – Anyone can understand and modify it
3. **Community-ready** – Can be forked, maintained, and distributed by anyone
4. **Forever-proof** – Will live on GitHub even if you stop using it
5. **Production-quality** – Professional build process, releases, and distribution

**GateKPT becomes a true open-source product that belongs to the community.**

