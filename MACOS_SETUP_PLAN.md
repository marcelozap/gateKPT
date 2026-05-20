# GateKPT – macOS Setup & Deployment Plan

## Overview
This document outlines how to run GateKPT on macOS (Intel and Apple Silicon) and prepare it for production distribution on the Mac App Store and direct download.

---

## Phase 1: Development Setup (Local Testing)

### Prerequisites
- Node.js 18+ (use `nvm` for easy switching)
- Xcode Command Line Tools: `xcode-select --install`
- An Apple Developer Account (for signing and notarization)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Code Signing (Development)
For local development on macOS, unsigned binaries work fine. Electron automatically handles this.

---

## Phase 2: Build Configuration for macOS

### Current Setup
- `package.json` already includes `electron-builder` configuration
- NSIS installer configured for Windows
- macOS needs similar configuration

### Required Updates to package.json

Add `"mac"` and `"dmg"` build configuration:

```json
{
  "build": {
    "appId": "com.gatekpt.visualengine",
    "productName": "GateKPT",
    
    "win": {
      "target": ["nsis"],
      "certificateFile": null,
      "certificatePassword": null
    },
    
    "mac": {
      "target": ["dmg", "zip"],
      "category": "public.app-category.entertainment",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "./entitlements.mac.plist",
      "entitlementsInherit": "./entitlements.mac.plist",
      "icon": "./assets/icon.icns"
    },
    
    "dmg": {
      "contents": [
        {
          "x": 130,
          "y": 220,
          "type": "file"
        },
        {
          "x": 410,
          "y": 220,
          "type": "link",
          "path": "/Applications"
        }
      ],
      "window": {
        "width": 540,
        "height": 380
      }
    }
  }
}
```

### Create Entitlements File

Create `entitlements.mac.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <false/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
    <key>com.apple.security.device.audio-input</key>
    <true/>
    <key>com.apple.security.device.microphone</key>
    <true/>
</dict>
</plist>
```

---

## Phase 3: Building for macOS

### Build Unsigned (Development)

```bash
# Build DMG and ZIP for distribution testing
npm run build -- --mac
```

Output: `dist/GateKPT-*.dmg` and `dist/GateKPT-*.zip`

### Build Signed & Notarized (Production)

#### Step 1: Set Up Code Signing Certificate

1. Open Keychain Access
2. Generate a certificate signing request (CSR) via Keychain Access → Certificate Assistant
3. Upload to Apple Developer account
4. Download the certificate and double-click to install

#### Step 2: Configure Build Environment

```bash
# Store certificate identity
export CSC_NAME="Developer ID Application: Your Name (XXXXXXXXXX)"

# Build with signing
npm run build -- --mac --publish never
```

#### Step 3: Notarization (Apple Server Verification)

```bash
# Store App-specific password from https://appleid.apple.com/account/security
export APPLEID="your-apple-id@example.com"
export APPLEIDPASS="xxxx-xxxx-xxxx-xxxx"

# Trigger notarization during build
npm run build -- --mac --publish always
```

---

## Phase 4: Testing on macOS

### Test Distribution Package

1. Download the DMG from releases
2. Mount: Double-click `GateKPT-*.dmg`
3. Drag `GateKPT.app` to Applications folder
4. Launch from Applications or Spotlight

### Test Microphone Input

```bash
# Verify audio input works
# System Preferences → Security & Privacy → Microphone → Ensure GateKPT is listed
```

### Test on Apple Silicon

If building on Intel:
```bash
# Install universal build support
npm install --save-dev electron-builder@latest

# Build universal binary (runs on both Intel and Apple Silicon)
npm run build -- --mac -m universal
```

---

## Phase 5: Hardware Optimization

### For External Display (Projector)

#### macOS Method 1: AirPlay (Wireless)
```javascript
// In main.js, detect and use AirPlay displays
const { screen } = require('electron');
const displays = screen.getAllDisplays();
console.log(displays); // Lists all displays including AirPlay receivers
```

#### macOS Method 2: HDMI/USB-C
- Connect projector via USB-C or HDMI-to-USB-C adapter
- System Preferences → Displays → Arrangement
- Electron will detect as secondary display

#### macOS Method 3: Wireless Display (Miracast on Mac)
- System Preferences → Control Center → AirPlay Receiver (if available)
- Or use third-party apps: Reflector 4, AnyToDMG

### Window Placement Code

```javascript
// In main.js, auto-detect projector and move window
const { screen } = require('electron');

function moveToProjector() {
  const displays = screen.getAllDisplays();
  const projectorDisplay = displays.find(d => d.id !== screen.getPrimaryDisplay().id);
  
  if (projectorDisplay) {
    mainWindow.setPosition(
      projectorDisplay.bounds.x,
      projectorDisplay.bounds.y
    );
    mainWindow.setSize(
      projectorDisplay.bounds.width,
      projectorDisplay.bounds.height
    );
    mainWindow.setFullScreen(true);
  }
}

// Call on app ready
app.on('ready', moveToProjector);
```

---

## Phase 6: Ableton Live Integration

See `ABLETON_INTEGRATION.md` for full setup.

Quick Start:
1. GateKPT listens for audio via Web Audio API
2. Route Ableton output → System Audio Input
3. GateKPT analyzes and visualizes real-time

---

## Distribution Channels

### macOS App Store
1. Register bundle ID with Apple (com.gatekpt.visualengine)
2. Set up App Store Connect
3. Submit notarized build
4. Review takes 1-3 days
5. Publish

### Direct Download (gateKPT GitHub)
1. Sign and notarize build
2. Upload to GitHub Releases
3. Users download and launch (auto-handled by macOS)

### Homebrew (Optional)
```bash
# Create formula for easy install
brew tap marcelozap/gatekpt
brew install gatekpt
```

---

## Architecture Differences: Windows vs macOS

| Feature | Windows | macOS |
|---------|---------|-------|
| Audio Input | Web Audio API (Direct) | Web Audio API (Direct) |
| Display Detection | `electron-screen` | `screen.getAllDisplays()` |
| Full Screen | Works with multi-monitor | Works with Spaces |
| Keyboard Hooks | Global (1-5, C/N/A/S/O) | Global (needs permissions) |
| Code Signing | Optional (unless Store) | Required (Gatekeeper) |
| Notarization | N/A | Required (macOS 10.15+) |

---

## Troubleshooting on macOS

### "GateKPT cannot be opened because the developer cannot be verified"
→ System Preferences → Security & Privacy → Open Anyway (first time)

### Microphone Not Working
→ System Preferences → Security & Privacy → Microphone → Enable GateKPT

### Audio Routing from Ableton Not Detected
→ Use **Soundflower** or **BlackHole** virtual audio device
→ See ABLETON_INTEGRATION.md

### Build Fails on Apple Silicon
→ Ensure `npm` version is current: `npm install -g npm@latest`
→ Clear cache: `npm cache clean --force`
→ Rebuild: `npm run build -- --mac -m universal`

---

## Next Steps

1. **Immediate**: Test build on Intel Mac (if available)
2. **Week 1**: Set up developer certificate and notarization
3. **Week 2**: Build and sign for distribution
4. **Week 3**: Test in real-world setup (with projector + Ableton)
5. **Week 4**: Publish to GitHub and Mac App Store

---

## Contact & Support

- GitHub Issues: https://github.com/marcelozap/gateKPT/issues
- Discussions: https://github.com/marcelozap/gateKPT/discussions
