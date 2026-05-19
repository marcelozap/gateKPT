const canvas = document.querySelector("#visualizer");
const ctx = canvas.getContext("2d", { alpha: false });
const startButton = document.querySelector("#startButton");
const fullscreenButton = document.querySelector("#fullscreenButton");
const inputSelect = document.querySelector("#inputSelect");
const modeSelect = document.querySelector("#modeSelect");
const sensitivityInput = document.querySelector("#sensitivity");
const bloomInput = document.querySelector("#bloom");
const noteMeter = document.querySelector("#noteMeter");
const levelMeter = document.querySelector("#levelMeter");
const midiMeter = document.querySelector("#midiMeter");

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
  mid: 0,
  high: 0,
  pitch: 0,
  note: "--",
  onset: 0,
  lastEnergy: 0,
  hue: 190,
  midiNotes: new Set(),
  chordHue: 190,
  particles: [],
  ribbons: [],
  time: 0,
};

const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
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
  const hasTension = pcs.includes((root + 1) % 12) || pcs.includes((root + 6) % 12) || pcs.includes((root + 10) % 12);
  let hue = root * 30;
  if (hasMajor) hue = lerp(hue, 52, 0.45);
  if (hasMinor) hue = lerp(hue, 286, 0.45);
  if (hasTension) hue = lerp(hue, 344, 0.5);
  return (hue + 360) % 360;
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
  if (state.stream) {
    state.stream.getTracks().forEach((track) => track.stop());
  }

  const constraints = {
    audio: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: false,
  };

  state.stream = await navigator.mediaDevices.getUserMedia(constraints);
  if (!state.audioContext) {
    state.audioContext = new AudioContext();
  }
  if (state.audioContext.state === "suspended") {
    await state.audioContext.resume();
  }

  state.source?.disconnect();
  state.analyser = state.audioContext.createAnalyser();
  state.analyser.fftSize = 4096;
  state.analyser.smoothingTimeConstant = 0.74;
  state.frequency = new Uint8Array(state.analyser.frequencyBinCount);
  state.waveform = new Float32Array(state.analyser.fftSize);
  state.source = state.audioContext.createMediaStreamSource(state.stream);
  state.source.connect(state.analyser);

  await listInputs();
  startButton.textContent = "Running";
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
  if (rms < 0.018) return 0;

  const minLag = Math.floor(sampleRate / 900);
  const maxLag = Math.floor(sampleRate / 70);
  let bestLag = -1;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    for (let i = 0; i < state.waveform.length - lag; i += 1) {
      correlation += state.waveform[i] * state.waveform[i + lag];
    }
    correlation /= state.waveform.length - lag;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  if (bestCorrelation < 0.0035 || bestLag <= 0) return 0;
  return sampleRate / bestLag;
}

function analyzeAudio() {
  if (!state.analyser) return;
  state.analyser.getByteFrequencyData(state.frequency);

  const sensitivity = Number(sensitivityInput.value);
  state.bass = clamp(averageBand(40, 160) * sensitivity * 1.35);
  state.mid = clamp(averageBand(180, 2200) * sensitivity * 1.1);
  state.high = clamp(averageBand(2400, 9500) * sensitivity * 1.4);
  state.level = clamp((state.bass * 0.34 + state.mid * 0.44 + state.high * 0.22) * 1.28);
  state.smoothLevel = lerp(state.smoothLevel, state.level, 0.14);

  const energy = state.bass * 0.65 + state.high * 0.35;
  state.onset = clamp((energy - state.lastEnergy) * 6, 0, 1);
  state.lastEnergy = lerp(state.lastEnergy, energy, 0.12);

  const pitch = detectPitch();
  state.pitch = pitch ? lerp(state.pitch || pitch, pitch, 0.18) : lerp(state.pitch, 0, 0.05);
  state.note = noteFromFrequency(state.pitch);
  state.hue = lerp(state.hue, pitch ? (Math.log2(pitch / 55) * 56 + 180) % 360 : state.chordHue, 0.035);
  state.chordHue = lerp(state.chordHue, hueFromMidiNotes(), 0.08);

  noteMeter.textContent = state.note;
  levelMeter.textContent = `${Math.round(state.smoothLevel * 100)}%`;
}

function spawnParticles(width, height) {
  const count = Math.floor(2 + state.onset * 26 + state.high * 5);
  const centerX = width / 2;
  const centerY = height / 2;
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 8 + state.onset * 18;
    state.particles.push({
      x: centerX + Math.cos(angle) * (40 + Math.random() * width * 0.18),
      y: centerY + Math.sin(angle) * (40 + Math.random() * height * 0.18),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1 + Math.random() * 4 + state.level * 8,
      life: 1,
      hue: (state.hue + Math.random() * 80 - 40 + state.chordHue * 0.2) % 360,
    });
  }
  if (state.particles.length > 1100) state.particles.splice(0, state.particles.length - 1100);
}

function drawBackground(width, height) {
  const bloom = Number(bloomInput.value);
  const baseHue = modeSelect.value === "chords" ? state.chordHue : state.hue;
  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.7);
  gradient.addColorStop(0, `hsl(${baseHue}, 95%, ${8 + state.smoothLevel * 12}%)`);
  gradient.addColorStop(0.48, `hsl(${(baseHue + 90) % 360}, 80%, ${4 + bloom * 5}%)`);
  gradient.addColorStop(1, "#02040a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.13 + bloom * 0.18;
  ctx.fillStyle = `hsl(${(baseHue + 180) % 360}, 100%, 58%)`;
  ctx.beginPath();
  ctx.ellipse(width * 0.12, height * 0.18, width * (0.18 + state.mid * 0.2), height * 0.12, state.time * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `hsl(${(baseHue + 320) % 360}, 95%, 58%)`;
  ctx.beginPath();
  ctx.ellipse(width * 0.88, height * 0.78, width * (0.16 + state.high * 0.26), height * 0.16, -state.time * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawVoiceRings(width, height) {
  const rings = 7;
  const cx = width / 2;
  const cy = height / 2;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let r = 0; r < rings; r += 1) {
    const radius = Math.min(width, height) * (0.07 + r * 0.055 + state.smoothLevel * 0.12);
    const wobble = 18 + state.mid * 80 + r * 8;
    ctx.beginPath();
    for (let i = 0; i <= 220; i += 1) {
      const angle = (i / 220) * Math.PI * 2;
      const wave = Math.sin(angle * (3 + r) + state.time * (1.2 + state.high * 4)) * wobble;
      const pulse = Math.sin(angle * 11 + state.time * 1.8 + r) * state.high * 36;
      const x = cx + Math.cos(angle) * (radius + wave + pulse);
      const y = cy + Math.sin(angle) * (radius + wave * 0.72 + pulse);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = `hsla(${(state.hue + r * 28) % 360}, 100%, ${58 + r * 3}%, ${0.16 + state.smoothLevel * 0.22})`;
    ctx.lineWidth = 1.2 + state.smoothLevel * 5 + r * 0.24;
    ctx.stroke();
  }
  ctx.restore();
}

function drawStorm(width, height) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const rows = 42;
  for (let i = 0; i < rows; i += 1) {
    const y = (i / rows) * height;
    const wave = Math.sin(i * 0.7 + state.time * 2) * width * 0.04 * (1 + state.mid);
    const thickness = 1 + state.high * 7 + (i % 5 === 0 ? state.onset * 14 : 0);
    ctx.strokeStyle = `hsla(${(state.chordHue + i * 5 + state.time * 18) % 360}, 100%, 62%, ${0.05 + state.level * 0.25})`;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(-20, y + wave);
    for (let x = 0; x <= width + 20; x += 30) {
      const offset = Math.sin(x * 0.012 + i * 0.32 + state.time * (1 + state.bass * 4)) * (16 + state.bass * 72);
      ctx.lineTo(x, y + wave + offset);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawChordColumns(width, height) {
  const columns = 12;
  const gap = 5;
  const colWidth = width / columns;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < columns; i += 1) {
    const active = [...state.midiNotes].some((note) => note % 12 === i);
    const heightScale = active ? 0.48 + state.mid * 0.5 : 0.14 + state.high * 0.16;
    const x = i * colWidth + gap;
    const h = height * heightScale;
    const y = height - h;
    const hue = (i * 30 + state.chordHue * 0.5) % 360;
    const grad = ctx.createLinearGradient(0, y, 0, height);
    grad.addColorStop(0, `hsla(${hue}, 100%, 68%, ${active ? 0.68 : 0.24})`);
    grad.addColorStop(1, `hsla(${(hue + 80) % 360}, 100%, 42%, 0.04)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, colWidth - gap * 2, h);
  }
  ctx.restore();
}

function drawGrid(width, height) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(Math.sin(state.time * 0.24) * 0.04);
  ctx.globalCompositeOperation = "lighter";
  const spacing = 42 - state.smoothLevel * 14;
  const depth = 1 + state.bass * 0.9;
  ctx.strokeStyle = `hsla(${state.hue}, 100%, 66%, ${0.08 + state.level * 0.2})`;
  ctx.lineWidth = 1 + state.high * 4;
  for (let x = -width; x <= width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x * depth, -height);
    ctx.lineTo(x / depth, height);
    ctx.stroke();
  }
  for (let y = -height; y <= height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(-width, y * depth);
    ctx.lineTo(width, y / depth);
    ctx.stroke();
  }
  ctx.restore();
}

function drawParticles() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const particle of state.particles) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    particle.life -= 0.012 + state.high * 0.012;
    ctx.globalAlpha = clamp(particle.life) * (0.32 + state.level * 0.55);
    ctx.fillStyle = `hsl(${particle.hue}, 100%, 62%)`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * clamp(particle.life), 0, Math.PI * 2);
    ctx.fill();
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawFrame() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  state.time += 1 / 60;
  analyzeAudio();
  drawBackground(width, height);

  if (state.onset > 0.08 || state.level > 0.18) spawnParticles(width, height);

  const mode = modeSelect.value;
  if (mode === "storm") drawStorm(width, height);
  if (mode === "chords") drawChordColumns(width, height);
  if (mode === "grid") drawGrid(width, height);
  drawVoiceRings(width, height);
  drawParticles();

  if (!state.analyser) {
    ctx.fillStyle = "rgba(248, 250, 252, 0.84)";
    ctx.font = "700 24px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Choose input and press Start", width / 2, height / 2);
  }

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

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  const modes = ["voice", "storm", "chords", "grid"];
  if (event.key >= "1" && event.key <= "4") modeSelect.value = modes[Number(event.key) - 1];
  if (event.key.toLowerCase() === "f") fullscreenButton.click();
});

resize();
listInputs().catch(() => {});
setupMidi();
drawFrame();
