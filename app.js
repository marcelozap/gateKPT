const canvas = document.querySelector("#visualizer");
const ctx = canvas.getContext("2d", { alpha: false });
const stage = document.querySelector(".stage");
const startButton = document.querySelector("#startButton");
const fullscreenButton = document.querySelector("#fullscreenButton");
const blackoutButton = document.querySelector("#blackoutButton");
const inputSelect = document.querySelector("#inputSelect");
const modeSelect = document.querySelector("#modeSelect");
const paletteSelect = document.querySelector("#paletteSelect");
const qualitySelect = document.querySelector("#qualitySelect");
const sensitivityInput = document.querySelector("#sensitivity");
const bloomInput = document.querySelector("#bloom");
const motionInput = document.querySelector("#motion");
const noteMeter = document.querySelector("#noteMeter");
const levelMeter = document.querySelector("#levelMeter");
const beatMeter = document.querySelector("#beatMeter");
const midiMeter = document.querySelector("#midiMeter");

const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const palettes = {
  neon: [188, 324, 142, 46],
  ember: [18, 42, 355, 206],
  ice: [174, 202, 265, 112],
  royal: [266, 314, 52, 185],
};

const qualityProfiles = {
  eco: { dpr: 1, starDensity: 15000, particleLimit: 650, ribbonLimit: 12, pitchEvery: 3 },
  balanced: { dpr: 1.5, starDensity: 9500, particleLimit: 1050, ribbonLimit: 20, pitchEvery: 2 },
  ultra: { dpr: 2, starDensity: 6500, particleLimit: 1600, ribbonLimit: 30, pitchEvery: 1 },
};

const state = {
  audioContext: null,
  analyser: null,
  source: null,
  stream: null,
  frequency: null,
  waveform: null,
  level: 0,
  smoothLevel: 0,
  bass: 0,
  lowMid: 0,
  mid: 0,
  high: 0,
  air: 0,
  pitch: 0,
  note: "--",
  onset: 0,
  beatPulse: 0,
  beatCount: 0,
  lastEnergy: 0,
  adaptiveFloor: 0.08,
  adaptiveCeil: 0.55,
  hue: 190,
  chordHue: 190,
  midiNotes: new Set(),
  particles: [],
  ribbons: [],
  starfield: [],
  frameIndex: 0,
  blackout: false,
  time: 0,
  lastFrame: performance.now(),
};

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  const t = clamp((value - inMin) / Math.max(0.0001, inMax - inMin));
  return lerp(outMin, outMax, t);
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, quality().dpr);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seedStarfield();
}

function quality() {
  return qualityProfiles[qualitySelect.value] || qualityProfiles.balanced;
}

function seedStarfield() {
  const count = Math.round((window.innerWidth * window.innerHeight) / quality().starDensity);
  state.starfield = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    z: Math.random() * 1 + 0.15,
    hue: Math.random() * 360,
  }));
}

function noteFromFrequency(freq) {
  if (!freq) return "--";
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  const octave = Math.floor(midi / 12) - 1;
  return `${notes[((midi % 12) + 12) % 12]}${octave}`;
}

function hueFromMidiNotes() {
  if (!state.midiNotes.size) return state.hue;
  const pcs = [...state.midiNotes].map((note) => note % 12);
  const root = pcs[0] ?? 0;
  const hasMajor = pcs.includes((root + 4) % 12);
  const hasMinor = pcs.includes((root + 3) % 12);
  const hasSeventh = pcs.includes((root + 10) % 12) || pcs.includes((root + 11) % 12);
  const hasTension = pcs.includes((root + 1) % 12) || pcs.includes((root + 6) % 12);
  let hue = root * 30;
  if (hasMajor) hue = lerp(hue, 48, 0.4);
  if (hasMinor) hue = lerp(hue, 286, 0.48);
  if (hasSeventh) hue = lerp(hue, 330, 0.22);
  if (hasTension) hue = lerp(hue, 356, 0.5);
  return (hue + 360) % 360;
}

function activePalette() {
  if (paletteSelect.value !== "auto") return palettes[paletteSelect.value];
  const anchor = modeSelect.value === "cathedral" ? state.chordHue : state.hue;
  return [anchor, (anchor + 76) % 360, (anchor + 156) % 360, (anchor + 248) % 360];
}

async function listInputs() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioInputs = devices.filter((device) => device.kind === "audioinput");
  inputSelect.replaceChildren();
  audioInputs.forEach((device, index) => {
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.textContent = device.label || `Input ${index + 1}`;
    inputSelect.append(option);
  });
}

async function startAudio(deviceId = inputSelect.value) {
  if (state.stream) state.stream.getTracks().forEach((track) => track.stop());

  state.stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 1,
    },
    video: false,
  });

  if (!state.audioContext) state.audioContext = new AudioContext();
  if (state.audioContext.state === "suspended") await state.audioContext.resume();

  state.source?.disconnect();
  state.analyser = state.audioContext.createAnalyser();
  state.analyser.fftSize = 4096;
  state.analyser.smoothingTimeConstant = 0.68;
  state.frequency = new Uint8Array(state.analyser.frequencyBinCount);
  state.waveform = new Float32Array(state.analyser.fftSize);
  state.source = state.audioContext.createMediaStreamSource(state.stream);
  state.source.connect(state.analyser);

  await listInputs();
  startButton.textContent = "Running";
  stage.classList.add("hide-hud");
}

function averageBand(fromHz, toHz) {
  if (!state.analyser || !state.frequency) return 0;
  const nyquist = state.audioContext.sampleRate / 2;
  const from = Math.floor((fromHz / nyquist) * state.frequency.length);
  const to = Math.max(from + 1, Math.floor((toHz / nyquist) * state.frequency.length));
  let sum = 0;
  for (let i = from; i < to; i += 1) sum += state.frequency[i] / 255;
  return sum / (to - from);
}

function detectPitch() {
  if (!state.analyser || !state.waveform) return 0;
  state.analyser.getFloatTimeDomainData(state.waveform);
  const sampleRate = state.audioContext.sampleRate;
  let rms = 0;
  for (const sample of state.waveform) rms += sample * sample;
  rms = Math.sqrt(rms / state.waveform.length);
  if (rms < 0.014) return 0;

  const minLag = Math.floor(sampleRate / 980);
  const maxLag = Math.floor(sampleRate / 62);
  let bestLag = -1;
  let bestScore = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let score = 0;
    for (let i = 0; i < state.waveform.length - lag; i += 2) {
      score += 1 - Math.abs(state.waveform[i] - state.waveform[i + lag]);
    }
    score /= (state.waveform.length - lag) / 2;
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }

  if (bestScore < 0.77 || bestLag <= 0) return 0;
  return sampleRate / bestLag;
}

function analyzeAudio() {
  if (!state.analyser) {
    state.level = lerp(state.level, 0.16, 0.02);
    state.smoothLevel = lerp(state.smoothLevel, 0.16, 0.02);
    state.bass = lerp(state.bass, 0.12, 0.02);
    state.mid = lerp(state.mid, 0.18, 0.02);
    state.high = lerp(state.high, 0.12, 0.02);
    state.air = lerp(state.air, 0.1, 0.02);
    state.hue = (state.hue + 0.06) % 360;
    return;
  }

  state.analyser.getByteFrequencyData(state.frequency);
  const sensitivity = Number(sensitivityInput.value);
  state.bass = clamp(averageBand(35, 150) * sensitivity * 1.55);
  state.lowMid = clamp(averageBand(150, 450) * sensitivity * 1.2);
  state.mid = clamp(averageBand(450, 2200) * sensitivity * 1.18);
  state.high = clamp(averageBand(2200, 7600) * sensitivity * 1.42);
  state.air = clamp(averageBand(7600, 14500) * sensitivity * 1.8);

  const rawLevel = clamp(state.bass * 0.34 + state.lowMid * 0.18 + state.mid * 0.27 + state.high * 0.16 + state.air * 0.05);
  state.adaptiveFloor = lerp(state.adaptiveFloor, Math.min(state.adaptiveFloor, rawLevel), 0.004);
  state.adaptiveCeil = lerp(state.adaptiveCeil, Math.max(state.adaptiveCeil, rawLevel), 0.012);
  state.level = mapRange(rawLevel, state.adaptiveFloor, state.adaptiveCeil, 0, 1);
  state.smoothLevel = lerp(state.smoothLevel, state.level, 0.13);

  const energy = state.bass * 0.74 + state.high * 0.26;
  const flux = Math.max(0, energy - state.lastEnergy);
  state.onset = clamp(flux * 7.5, 0, 1);
  if (state.onset > 0.38 && state.beatPulse < 0.18) {
    state.beatPulse = 1;
    state.beatCount += 1;
  }
  state.beatPulse = Math.max(0, state.beatPulse - 0.045);
  state.lastEnergy = lerp(state.lastEnergy, energy, 0.16);

  const shouldDetectPitch = state.frameIndex % quality().pitchEvery === 0;
  const pitch = shouldDetectPitch ? detectPitch() : state.pitch;
  state.pitch = pitch ? lerp(state.pitch || pitch, pitch, 0.22) : lerp(state.pitch, 0, 0.04);
  state.note = noteFromFrequency(state.pitch);
  const pitchHue = pitch ? (Math.log2(pitch / 55) * 52 + 180) % 360 : state.chordHue;
  state.hue = lerp(state.hue, pitchHue, pitch ? 0.05 : 0.018);
  state.chordHue = lerp(state.chordHue, hueFromMidiNotes(), 0.075);

  noteMeter.textContent = state.note;
  levelMeter.textContent = `${Math.round(state.smoothLevel * 100)}%`;
  beatMeter.textContent = state.beatPulse > 0.5 ? `BEAT ${state.beatCount}` : "BEAT --";
}

function spawnParticles(width, height) {
  const motion = Number(motionInput.value);
  const count = Math.floor(1 + state.onset * 44 + state.air * 7);
  const cx = width / 2;
  const cy = height / 2;
  const palette = activePalette();

  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const ring = 38 + Math.random() * Math.min(width, height) * (0.08 + state.smoothLevel * 0.24);
    const speed = (1.2 + Math.random() * 9 + state.onset * 22) * motion;
    state.particles.push({
      x: cx + Math.cos(angle) * ring,
      y: cy + Math.sin(angle) * ring,
      vx: Math.cos(angle) * speed + Math.sin(state.time + i) * state.mid * 2,
      vy: Math.sin(angle) * speed - state.bass * 4,
      size: 0.8 + Math.random() * 4.5 + state.level * 10,
      life: 1,
      hue: palette[Math.floor(Math.random() * palette.length)] + Math.random() * 24 - 12,
    });
  }

  const limit = quality().particleLimit;
  if (state.particles.length > limit) state.particles.splice(0, state.particles.length - limit);
}

function spawnRibbon(width, height) {
  if (state.ribbons.length > quality().ribbonLimit) state.ribbons.shift();
  const palette = activePalette();
  state.ribbons.push({
    phase: Math.random() * Math.PI * 2,
    amp: 26 + state.mid * 180,
    y: height * (0.25 + Math.random() * 0.5),
    hue: palette[Math.floor(Math.random() * palette.length)],
    life: 1,
  });
}

function drawBackground(width, height) {
  const bloom = Number(bloomInput.value);
  const palette = activePalette();
  const baseHue = palette[0];
  const pulse = state.beatPulse * 9 + state.smoothLevel * 10;
  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.52, 0, width * 0.5, height * 0.52, Math.max(width, height) * 0.78);
  gradient.addColorStop(0, `hsl(${baseHue}, 96%, ${8 + pulse}%)`);
  gradient.addColorStop(0.42, `hsl(${palette[1]}, 84%, ${4 + bloom * 7 + state.mid * 7}%)`);
  gradient.addColorStop(0.72, `hsl(${palette[2]}, 80%, ${3 + state.bass * 5}%)`);
  gradient.addColorStop(1, "#02040a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 3; i += 1) {
    ctx.globalAlpha = 0.08 + bloom * 0.12 + state.smoothLevel * 0.08;
    ctx.fillStyle = `hsl(${palette[i + 1]}, 100%, 58%)`;
    ctx.beginPath();
    ctx.ellipse(
      width * (0.16 + i * 0.34 + Math.sin(state.time * 0.11 + i) * 0.035),
      height * (0.18 + i * 0.22 + Math.cos(state.time * 0.13 + i) * 0.05),
      width * (0.12 + state.mid * 0.22),
      height * (0.1 + state.high * 0.18),
      state.time * (0.12 + i * 0.03),
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();
}

function drawStarfield(width, height) {
  const palette = activePalette();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const star of state.starfield) {
    const drift = Number(motionInput.value) * (0.15 + state.bass * 2.2);
    star.y += drift * star.z;
    star.x += Math.sin(state.time * 0.4 + star.y * 0.01) * state.mid * star.z;
    if (star.y > height + 10) {
      star.y = -10;
      star.x = Math.random() * width;
    }
    ctx.globalAlpha = 0.14 + state.air * 0.6;
    ctx.fillStyle = `hsl(${palette[Math.floor(star.z * palette.length) % palette.length]}, 100%, 76%)`;
    ctx.fillRect(star.x, star.y, 1.1 + star.z * 1.8 + state.beatPulse * 3, 1.1 + star.z * 1.8 + state.beatPulse * 3);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawPrism(width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const palette = activePalette();
  const sides = 7;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(state.time * 0.08 * Number(motionInput.value));
  ctx.globalCompositeOperation = "lighter";
  for (let layer = 0; layer < 9; layer += 1) {
    const radius = Math.min(width, height) * (0.08 + layer * 0.043 + state.smoothLevel * 0.11 + state.beatPulse * 0.025);
    ctx.beginPath();
    for (let i = 0; i <= sides; i += 1) {
      const angle = (i / sides) * Math.PI * 2 + layer * 0.08;
      const bend = Math.sin(angle * 3 + state.time * (1.2 + state.high * 4)) * (12 + state.mid * 60);
      const x = Math.cos(angle) * (radius + bend);
      const y = Math.sin(angle) * (radius + bend * 0.72);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `hsla(${palette[layer % palette.length]}, 100%, ${58 + layer * 2}%, ${0.18 + state.smoothLevel * 0.25})`;
    ctx.lineWidth = 1.1 + layer * 0.18 + state.level * 4;
    ctx.stroke();
  }
  ctx.restore();
}

function drawAurora(width, height) {
  const palette = activePalette();
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let band = 0; band < 8; band += 1) {
    const yBase = height * (0.18 + band * 0.085);
    const amp = 34 + state.mid * 150 + band * 5;
    ctx.beginPath();
    ctx.moveTo(-20, yBase);
    for (let x = -20; x <= width + 20; x += 18) {
      const y = yBase
        + Math.sin(x * 0.006 + state.time * (0.55 + state.high * 2) + band) * amp
        + Math.sin(x * 0.018 - state.time * 0.7 + band * 1.7) * amp * 0.34;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width + 20, height);
    ctx.lineTo(-20, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, yBase - amp, 0, yBase + amp * 5);
    grad.addColorStop(0, `hsla(${palette[band % palette.length]}, 100%, 62%, ${0.1 + state.smoothLevel * 0.22})`);
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.restore();
}

function drawCathedral(width, height) {
  const palette = activePalette();
  const columns = 12;
  const gap = 6;
  const colWidth = width / columns;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < columns; i += 1) {
    const active = [...state.midiNotes].some((note) => note % 12 === i);
    const h = height * (active ? 0.42 + state.mid * 0.52 : 0.16 + state.high * 0.14);
    const x = i * colWidth + gap;
    const y = height - h;
    const hue = (i * 30 + state.chordHue * 0.48) % 360;
    const grad = ctx.createLinearGradient(0, y, 0, height);
    grad.addColorStop(0, `hsla(${hue}, 100%, 70%, ${active ? 0.72 : 0.22})`);
    grad.addColorStop(0.55, `hsla(${palette[(i + 1) % palette.length]}, 100%, 44%, ${active ? 0.34 : 0.08})`);
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, colWidth - gap * 2, h);

    ctx.strokeStyle = `hsla(${hue}, 100%, 78%, ${active ? 0.7 : 0.16})`;
    ctx.lineWidth = active ? 2.4 + state.beatPulse * 7 : 1;
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.quadraticCurveTo(x + colWidth * 0.5, y - h * 0.22, x + colWidth - gap * 2, height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStorm(width, height) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const palette = activePalette();
  const rows = 48;
  for (let i = 0; i < rows; i += 1) {
    const y = (i / rows) * height;
    const wave = Math.sin(i * 0.7 + state.time * 2.2) * width * 0.035 * (1 + state.mid);
    const thickness = 1 + state.high * 8 + (i % 5 === 0 ? state.onset * 15 : 0);
    ctx.strokeStyle = `hsla(${palette[i % palette.length] + i * 3}, 100%, 62%, ${0.05 + state.level * 0.26})`;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(-20, y + wave);
    for (let x = 0; x <= width + 20; x += 28) {
      const offset = Math.sin(x * 0.012 + i * 0.32 + state.time * (1 + state.bass * 4)) * (16 + state.bass * 78);
      ctx.lineTo(x, y + wave + offset);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawGrid(width, height) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(Math.sin(state.time * 0.24) * 0.05);
  ctx.globalCompositeOperation = "lighter";
  const palette = activePalette();
  const spacing = 44 - state.smoothLevel * 16;
  const depth = 1 + state.bass * 1.25 + state.beatPulse * 0.45;
  ctx.lineWidth = 1 + state.high * 4.5;
  for (let x = -width; x <= width; x += spacing) {
    ctx.strokeStyle = `hsla(${palette[Math.abs(Math.round(x / spacing)) % palette.length]}, 100%, 66%, ${0.07 + state.level * 0.24})`;
    ctx.beginPath();
    ctx.moveTo(x * depth, -height);
    ctx.lineTo(x / depth, height);
    ctx.stroke();
  }
  for (let y = -height; y <= height; y += spacing) {
    ctx.strokeStyle = `hsla(${palette[Math.abs(Math.round(y / spacing) + 1) % palette.length]}, 100%, 66%, ${0.05 + state.level * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(-width, y * depth);
    ctx.lineTo(width, y / depth);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVoiceRings(width, height) {
  const rings = 8;
  const cx = width / 2;
  const cy = height / 2;
  const palette = activePalette();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let r = 0; r < rings; r += 1) {
    const radius = Math.min(width, height) * (0.065 + r * 0.052 + state.smoothLevel * 0.12 + state.beatPulse * 0.015);
    const wobble = 14 + state.mid * 92 + r * 7;
    ctx.beginPath();
    for (let i = 0; i <= 260; i += 1) {
      const angle = (i / 260) * Math.PI * 2;
      const wave = Math.sin(angle * (3 + r) + state.time * (1.15 + state.high * 4.2)) * wobble;
      const pulse = Math.sin(angle * 13 + state.time * 1.8 + r) * state.air * 48;
      const x = cx + Math.cos(angle) * (radius + wave + pulse);
      const y = cy + Math.sin(angle) * (radius + wave * 0.72 + pulse);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = `hsla(${palette[r % palette.length] + r * 9}, 100%, ${58 + r * 3}%, ${0.14 + state.smoothLevel * 0.25})`;
    ctx.lineWidth = 1.2 + state.smoothLevel * 5 + r * 0.2 + state.beatPulse * 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawRibbons(width) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const ribbon of state.ribbons) {
    ribbon.life -= 0.006;
    ribbon.phase += 0.012 * Number(motionInput.value);
    ctx.globalAlpha = clamp(ribbon.life) * (0.16 + state.level * 0.42);
    ctx.strokeStyle = `hsl(${ribbon.hue}, 100%, 64%)`;
    ctx.lineWidth = 1.5 + state.smoothLevel * 8;
    ctx.beginPath();
    ctx.moveTo(-30, ribbon.y);
    for (let x = -30; x <= width + 30; x += 24) {
      const y = ribbon.y
        + Math.sin(x * 0.008 + ribbon.phase + state.time * 0.7) * ribbon.amp
        + Math.sin(x * 0.024 - state.time) * ribbon.amp * 0.28;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  state.ribbons = state.ribbons.filter((ribbon) => ribbon.life > 0);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawParticles() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const particle of state.particles) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.985;
    particle.vy *= 0.986;
    particle.life -= 0.011 + state.air * 0.014;
    ctx.globalAlpha = clamp(particle.life) * (0.32 + state.level * 0.58);
    ctx.fillStyle = `hsl(${particle.hue}, 100%, 64%)`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * clamp(particle.life), 0, Math.PI * 2);
    ctx.fill();
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawIdleMessage(width, height) {
  if (state.analyser) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
  ctx.font = "800 28px Inter, system-ui, sans-serif";
  ctx.fillText("Voice Mirror", width / 2, height / 2 - 20);
  ctx.fillStyle = "rgba(248, 250, 252, 0.58)";
  ctx.font = "600 15px Inter, system-ui, sans-serif";
  ctx.fillText("Choose an input, press Start, then send this window to the projector", width / 2, height / 2 + 18);
  ctx.restore();
}

function drawFrame(now = performance.now()) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dt = Math.min(0.05, (now - state.lastFrame) / 1000);
  state.lastFrame = now;
  state.time += dt * 60;
  state.frameIndex += 1;

  analyzeAudio();
  if (state.blackout) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    requestAnimationFrame(drawFrame);
    return;
  }
  drawBackground(width, height);
  drawStarfield(width, height);

  if (state.onset > 0.08 || state.level > 0.22) spawnParticles(width, height);
  if (state.onset > 0.32 || (state.ribbons.length < Math.min(5, quality().ribbonLimit) && Math.random() < 0.02)) spawnRibbon(width, height);

  const mode = modeSelect.value;
  if (mode === "prism") drawPrism(width, height);
  if (mode === "aurora") drawAurora(width, height);
  if (mode === "cathedral") drawCathedral(width, height);
  if (mode === "storm") drawStorm(width, height);
  if (mode === "grid") drawGrid(width, height);
  drawRibbons(width);
  drawVoiceRings(width, height);
  drawParticles();
  drawIdleMessage(width, height);

  requestAnimationFrame(drawFrame);
}

async function setupMidi() {
  if (!navigator.requestMIDIAccess) {
    midiMeter.textContent = "MIDI off";
    return;
  }
  try {
    const access = await navigator.requestMIDIAccess();
    const updateMidiLabel = () => {
      midiMeter.textContent = state.midiNotes.size ? [...state.midiNotes].map((n) => notes[n % 12]).join(" ") : "MIDI --";
    };
    access.inputs.forEach((input) => {
      input.onmidimessage = (event) => {
        const [status, note, velocity] = event.data;
        const type = status & 0xf0;
        if (type === 0x90 && velocity > 0) state.midiNotes.add(note);
        if (type === 0x80 || (type === 0x90 && velocity === 0)) state.midiNotes.delete(note);
        updateMidiLabel();
      };
    });
    access.onstatechange = setupMidi;
    updateMidiLabel();
  } catch {
    midiMeter.textContent = "MIDI off";
  }
}

startButton.addEventListener("click", async () => {
  try {
    await startAudio();
  } catch (error) {
    startButton.textContent = "Blocked";
    console.error(error);
  }
});

inputSelect.addEventListener("change", () => {
  if (state.analyser) startAudio(inputSelect.value);
});

fullscreenButton.addEventListener("click", () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});

blackoutButton.addEventListener("click", () => {
  state.blackout = !state.blackout;
  stage.classList.toggle("blackout", state.blackout);
  blackoutButton.textContent = state.blackout ? "Live" : "Blackout";
});

qualitySelect.addEventListener("change", resize);

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
  const modes = ["prism", "aurora", "cathedral", "storm", "grid"];
  if (event.key >= "1" && event.key <= "5") modeSelect.value = modes[Number(event.key) - 1];
  if (event.key.toLowerCase() === "f") fullscreenButton.click();
  if (event.key.toLowerCase() === "h") stage.classList.toggle("hide-hud");
  if (event.key.toLowerCase() === "b") blackoutButton.click();
  if (event.key.toLowerCase() === "q") {
    const values = ["eco", "balanced", "ultra"];
    qualitySelect.value = values[(values.indexOf(qualitySelect.value) + 1) % values.length];
    resize();
  }
  if (event.key === "[") sensitivityInput.value = Math.max(Number(sensitivityInput.min), Number(sensitivityInput.value) - 0.05).toFixed(2);
  if (event.key === "]") sensitivityInput.value = Math.min(Number(sensitivityInput.max), Number(sensitivityInput.value) + 0.05).toFixed(2);
});

resize();
listInputs().catch(() => {});
setupMidi();
drawFrame();
