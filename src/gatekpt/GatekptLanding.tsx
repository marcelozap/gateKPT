"use client";

import { motion } from "framer-motion";
import { Facebook, Ghost, Instagram, Linkedin, Square, Waves, Youtube } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type AudioStatus = "preview" | "starting" | "listening" | "demo" | "blocked" | "unsupported";
type MoodBed = {
  nodes: AudioNode[];
  oscillators: OscillatorNode[];
  gains: GainNode[];
  filters: BiquadFilterNode[];
};

const cuePath = [
  ["01", "Fire crackle", "Warm sparks"],
  ["02", "Storm", "Rain pulse"],
  ["03", "Soft chrome", "Glass shimmer"],
];

const socialChannels = [
  { name: "YouTube", href: "https://www.youtube.com/@xivzapa14", Icon: Youtube },
  { name: "Instagram", href: "https://www.instagram.com/marcelozapa14/", Icon: Instagram },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/marcelozap/", Icon: Linkedin },
  { name: "Facebook", href: "https://www.facebook.com/marcelozapa14/", Icon: Facebook },
  { name: "Snapchat", href: "https://www.snapchat.com/add/marcy35", Icon: Ghost },
];

function createNoiseSource(audioContext: AudioContext, tone: "white" | "brown" = "white") {
  const bufferLength = audioContext.sampleRate * 2;
  const buffer = audioContext.createBuffer(1, bufferLength, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;

  for (let index = 0; index < bufferLength; index += 1) {
    const white = Math.random() * 2 - 1;
    last = tone === "brown" ? (last + 0.02 * white) / 1.02 : white;
    data[index] = tone === "brown" ? last * 3.5 : white;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function buildMoodBed(audioContext: AudioContext, mood: string, destination: AudioNode): MoodBed {
  const nodes: AudioNode[] = [];
  const oscillators: OscillatorNode[] = [];
  const gains: GainNode[] = [];
  const filters: BiquadFilterNode[] = [];

  if (mood === "Fire crackle") {
    const fire = createNoiseSource(audioContext);
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    filter.type = "bandpass";
    filter.frequency.value = 1900;
    filter.Q.value = 2.2;
    gain.gain.value = 0.012;
    fire.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    fire.start();

    const sparkle = createNoiseSource(audioContext);
    const sparkleFilter = audioContext.createBiquadFilter();
    const sparkleGain = audioContext.createGain();
    sparkleFilter.type = "highpass";
    sparkleFilter.frequency.value = 3200;
    sparkleGain.gain.value = 0.006;
    sparkle.connect(sparkleFilter);
    sparkleFilter.connect(sparkleGain);
    sparkleGain.connect(destination);
    sparkle.start();
    nodes.push(fire, sparkle, filter, gain, sparkleFilter, sparkleGain);
    gains.push(gain, sparkleGain);
    filters.push(filter, sparkleFilter);
  } else if (mood === "Storm") {
    const rain = createNoiseSource(audioContext, "brown");
    const rainFilter = audioContext.createBiquadFilter();
    const rainGain = audioContext.createGain();
    rainFilter.type = "lowpass";
    rainFilter.frequency.value = 1500;
    rainGain.gain.value = 0.028;
    rain.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(destination);
    rain.start();

    const rumble = audioContext.createOscillator();
    const rumbleGain = audioContext.createGain();
    rumble.type = "sine";
    rumble.frequency.value = 38;
    rumbleGain.gain.value = 0.014;
    rumble.connect(rumbleGain);
    rumbleGain.connect(destination);
    rumble.start();
    nodes.push(rain, rumble, rainFilter, rainGain, rumbleGain);
    oscillators.push(rumble);
    gains.push(rainGain, rumbleGain);
    filters.push(rainFilter);
  } else {
    [392, 587.33, 880].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = index === 0 ? 0.0045 : 0.0022;
      oscillator.connect(gain);
      gain.connect(destination);
      oscillator.start();
      nodes.push(oscillator, gain);
      oscillators.push(oscillator);
      gains.push(gain);
    });
  }

  return { nodes, oscillators, gains, filters };
}

function TerrainSignalPreview({ activeCue }: { activeCue: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const demoIntervalRef = useRef<number | null>(null);
  const demoNodesRef = useRef<AudioNode[]>([]);
  const moodBedRef = useRef<MoodBed | null>(null);
  const demoAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastCanvasDrawRef = useRef(0);
  const lastLevelUpdateRef = useRef(0);
  const activeCueRef = useRef(activeCue);
  const smoothedSignalRef = useRef({ bass: 0.18, mid: 0.2, high: 0.16, level: 0.21 });
  const [status, setStatus] = useState<AudioStatus>("preview");
  const [level, setLevel] = useState(21);

  useEffect(() => {
    activeCueRef.current = activeCue;
  }, [activeCue]);

  const stopAudio = useCallback(() => {
    if (demoIntervalRef.current) {
      window.clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    demoNodesRef.current.forEach((node) => {
      if ("stop" in node && typeof node.stop === "function") {
        try {
          node.stop();
        } catch {
          // Already stopped.
        }
      }
    });
    demoNodesRef.current = [];
    moodBedRef.current = null;
    if (demoAudioRef.current) {
      demoAudioRef.current.pause();
      demoAudioRef.current.currentTime = 0;
      demoAudioRef.current = null;
    }
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const render = () => {
      const nowMs = performance.now();
      if (nowMs - lastCanvasDrawRef.current < 42) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      lastCanvasDrawRef.current = nowMs;

      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const ratio = window.devicePixelRatio || 1;

      if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
      }

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const analyser = analyserRef.current;
      const bins = new Uint8Array(analyser?.frequencyBinCount || 512);
      const waveBins = new Uint8Array(analyser?.fftSize || 1024);

      if (analyser) {
        analyser.getByteFrequencyData(bins);
        analyser.getByteTimeDomainData(waveBins);
      } else {
        const now = performance.now() / 1000;
        for (let index = 0; index < bins.length; index += 1) {
          bins[index] = 28 + Math.round(Math.sin(now * 0.8 + index * 0.11) * 18 + Math.sin(now * 0.32 + index * 0.03) * 14);
        }
        for (let index = 0; index < waveBins.length; index += 1) {
          waveBins[index] = 128 + Math.round(Math.sin(now * 2.1 + index * 0.08) * 24 + Math.sin(now * 0.6 + index * 0.025) * 18);
        }
      }

      const readBand = (start: number, end: number) => {
        const slice = bins.slice(start, Math.max(start + 1, end));
        return slice.reduce((sum, value) => sum + value, 0) / Math.max(1, slice.length) / 255;
      };
      const focusedBin = (position: number) => {
        // Guitar lives in a narrow part of the spectrum, so use a log-ish zoom
        // instead of spreading quiet high-frequency bins across the whole canvas.
        const zoomed = Math.pow(Math.max(0, Math.min(1, position)), 2.35);
        const index = Math.floor(zoomed * bins.length * 0.42);
        return bins[Math.max(0, Math.min(bins.length - 1, index))] / 255;
      };

      const bassRaw = readBand(0, Math.floor(bins.length * 0.08));
      const midRaw = readBand(Math.floor(bins.length * 0.08), Math.floor(bins.length * 0.34));
      const highRaw = readBand(Math.floor(bins.length * 0.34), Math.floor(bins.length * 0.78));
      const waveRms = Math.sqrt(
        waveBins.reduce((sum, value) => {
          const normalized = (value - 128) / 128;
          return sum + normalized * normalized;
        }, 0) / waveBins.length,
      );
      const signal = smoothedSignalRef.current;
      const mood = activeCueRef.current;
      const guitarColor = "#6ee7ff";
      const moodRgb = mood === "Fire crackle" ? "240, 138, 60" : mood === "Soft chrome" ? "201, 184, 255" : "110, 231, 255";
      const moodColor = mood === "Fire crackle" ? "#f08a3c" : mood === "Soft chrome" ? "#c9b8ff" : "#6ee7ff";
      signal.bass = signal.bass * 0.78 + bassRaw * 0.22;
      signal.mid = signal.mid * 0.78 + midRaw * 0.22;
      signal.high = signal.high * 0.78 + highRaw * 0.22;
      signal.level = signal.level * 0.7 + Math.min(1, waveRms * 3.4 + bassRaw * 0.55 + midRaw * 0.35) * 0.3;
      const pulse = Math.min(1, signal.level);
      const visualZoom = 1.5 + pulse * 2.8 + signal.mid * 2.2;
      let weighted = 0;
      let weight = 0;
      const guitarRange = Math.floor(bins.length * 0.42);
      for (let index = 2; index < guitarRange; index += 1) {
        const value = Math.pow(bins[index] / 255, 1.6);
        weighted += (index / guitarRange) * value;
        weight += value;
      }
      const melodyCenter = weight > 0.001 ? weighted / weight : 0.32;
      const melodyRatio = 2 ** ((Math.round(melodyCenter * 12) - 5) / 12);
      const bed = moodBedRef.current;
      const audioContext = audioContextRef.current;
      if (bed && audioContext) {
        const now = audioContext.currentTime;
        if (mood === "Soft chrome") {
          [196, 293.66, 440].forEach((base, index) => {
            bed.oscillators[index]?.frequency.setTargetAtTime(base * melodyRatio, now, 0.18);
          });
          bed.gains.forEach((gain, index) => gain.gain.setTargetAtTime(index === 0 ? 0.0036 : 0.0018, now, 0.22));
        } else if (mood === "Storm") {
          bed.oscillators[0]?.frequency.setTargetAtTime(32 + melodyCenter * 34, now, 0.28);
          bed.filters[0]?.frequency.setTargetAtTime(900 + melodyCenter * 950, now, 0.28);
        } else {
          bed.filters[0]?.frequency.setTargetAtTime(1400 + melodyCenter * 1800, now, 0.16);
          bed.filters[1]?.frequency.setTargetAtTime(2800 + melodyCenter * 2200, now, 0.16);
        }
      }
      if (nowMs - lastLevelUpdateRef.current > 180) {
        lastLevelUpdateRef.current = nowMs;
        setLevel(Math.round(pulse * 100));
      }

      ctx.clearRect(0, 0, width, height);
      const base = ctx.createLinearGradient(0, 0, width, height);
      base.addColorStop(0, mood === "Fire crackle" ? "#231207" : mood === "Soft chrome" ? "#111225" : "#102018");
      base.addColorStop(0.55, "#07100d");
      base.addColorStop(1, mood === "Storm" ? "#0b1722" : "#18160f");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      const mist = ctx.createRadialGradient(width * 0.62, height * 0.25, 10, width * 0.62, height * 0.25, width * 0.72);
      mist.addColorStop(0, `rgba(232, 225, 210, ${0.09 + pulse * 0.12})`);
      mist.addColorStop(0.42, `rgba(${moodRgb}, ${0.08 + pulse * 0.14})`);
      mist.addColorStop(1, "rgba(7, 16, 13, 0)");
      ctx.fillStyle = mist;
      ctx.fillRect(0, 0, width, height);

      if (mood === "Fire crackle") {
        for (let ember = 0; ember < 28; ember += 1) {
          const drift = (nowMs / (70 + ember * 4) + ember * 41) % height;
          const x = ((ember * 83 + Math.sin(nowMs / 1200 + ember) * 38) % width + width) % width;
          const size = 1.4 + Math.sin(nowMs / 300 + ember) * 0.8 + pulse * 2.2;
          ctx.fillStyle = `rgba(240, 138, 60, ${0.08 + pulse * 0.18})`;
          ctx.beginPath();
          ctx.arc(x, height - drift, Math.max(0.8, size), 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mood === "Storm") {
        ctx.fillStyle = `rgba(110, 231, 255, ${0.03 + signal.high * 0.07})`;
        for (let rain = 0; rain < 34; rain += 1) {
          const x = (rain * 47 + nowMs / 24) % width;
          const y = (rain * 71 + nowMs / 8) % height;
          ctx.fillRect(x, y, 1, 22 + pulse * 30);
        }
      }

      for (let line = 0; line < 8; line += 1) {
        const yBase = height * (0.2 + line * 0.082);
        const bandDrive = line < 3 ? signal.bass : line < 6 ? signal.mid : signal.high;
        ctx.beginPath();
        const samples = 180;
        for (let index = 0; index < samples; index += 1) {
          const position = index / (samples - 1);
          const x = position * width;
          const signal = focusedBin(Math.min(1, position + line * 0.012));
          const y =
            yBase +
            Math.sin(index * 0.12 + line * 0.7 + nowMs / (1800 - bandDrive * 620)) * (5 + line * 0.7 + bandDrive * 12) -
            signal * visualZoom * (13 + pulse * 20 + bandDrive * 38);
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = line % 3 === 0 ? "rgba(198,169,109,0.46)" : "rgba(232,225,210,0.16)";
        ctx.lineWidth = line % 3 === 0 ? 1.4 : 1;
        ctx.stroke();
      }

      const barCount = 28;
      const barWidth = width / barCount;
      for (let bar = 0; bar < barCount; bar += 1) {
        const binValue = focusedBin(bar / (barCount - 1));
        const barHeight = Math.max(5, Math.pow(binValue, 0.72) * (height * 0.34) + pulse * 18);
        const x = bar * barWidth + barWidth * 0.18;
        const y = height - barHeight - 18;
        ctx.fillStyle = `rgba(${moodRgb}, ${0.1 + Math.pow(binValue, 0.7) * 0.42})`;
        ctx.fillRect(x, y, Math.max(2, barWidth * 0.46), barHeight);
      }

      ctx.beginPath();
      const waveStep = Math.max(1, Math.floor(waveBins.length / 220));
      for (let index = 0; index < waveBins.length; index += waveStep) {
        const x = (index / (waveBins.length - 1)) * width;
        const waveform = (waveBins[index] - 128) / 128;
        const y =
          height * 0.55 +
          waveform * (height * (0.2 + pulse * 0.24)) -
          signal.bass * height * 0.08 +
          Math.sin(index * 0.025 + nowMs / 1400) * (4 + signal.high * 10);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.shadowBlur = 18 + pulse * 24;
      ctx.shadowColor = guitarColor;
      ctx.strokeStyle = guitarColor;
      ctx.lineWidth = 2 + pulse * 2.2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(width * 0.82, height * 0.26, 18 + signal.bass * 42, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${moodRgb}, ${0.16 + signal.bass * 0.28})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.strokeStyle = `rgba(${moodRgb}, ${0.22 + pulse * 0.28})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, width - 20, height - 20);
      ctx.strokeStyle = moodColor;
      ctx.globalAlpha = 0.14 + pulse * 0.18;
      ctx.lineWidth = 8;
      ctx.strokeRect(18, 18, width - 36, height - 36);
      ctx.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(render);
    };

    render();
  }, []);

  const stopPreview = () => {
    stopAudio();
    setStatus("preview");
  };

  const startDemo = async () => {
    try {
      setStatus("starting");
      stopAudio();
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        setStatus("demo");
        return;
      }
      const audioContext = new AudioContextClass();
      await audioContext.resume();

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.7;

      const master = audioContext.createGain();
      master.gain.value = 0.9;

      const demoAudio = new Audio("/audio/gatekpt-night-guitar-preview.mp3");
      demoAudio.loop = true;
      demoAudio.preload = "auto";
      demoAudioRef.current = demoAudio;

      const source = audioContext.createMediaElementSource(demoAudio);
      source.connect(master);
      master.connect(analyser);
      analyser.connect(audioContext.destination);
      const moodBed = buildMoodBed(audioContext, activeCueRef.current, master);
      moodBedRef.current = moodBed;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      demoNodesRef.current = [source, master, ...moodBed.nodes];
      await demoAudio.play();
      setStatus("demo");
    } catch {
      stopAudio();
      setStatus("blocked");
    }
  };

  useEffect(() => {
    draw();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [draw]);

  useEffect(() => stopAudio, [stopAudio]);

  return (
    <div className="gk-panel relative overflow-hidden rounded-[2rem]">
      <canvas ref={canvasRef} className="h-[31rem] w-full" aria-label="GateKPT sound preview" />
      <div className="absolute inset-x-5 top-5 flex flex-wrap items-center justify-between gap-3">
        <span className="gk-chip gk-chip-signal">{status === "listening" ? "Live sound" : status === "demo" ? "GateKPT guitar" : "Preview"}</span>
        <span className="gk-chip">Signal {level}%</span>
      </div>
      <div className="absolute inset-x-5 bottom-5 rounded-[1.4rem] border border-white/10 bg-[#07100d]/82 p-4 backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="gk-label text-[#6ee7ff]">Question</p>
            <p className="mt-1 text-sm font-medium leading-6 text-[#e8e1d2]/68">
              What if the room answered the guitar?
            </p>
          </div>
          {status === "listening" || status === "demo" || status === "starting" ? (
            <button type="button" onClick={stopPreview} className="gk-button-secondary">
              <Square className="h-4 w-4" />
              Stop
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={startDemo} className="gk-button-signal">
                <Waves className="h-4 w-4" />
                Play guitar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function GatekptLanding() {
  const [activeCueIndex, setActiveCueIndex] = useState(0);
  const activeCue = cuePath[activeCueIndex]?.[1] || "Drums";
  const moodClass = activeCueIndex === 0 ? "gk-mood-fire" : activeCueIndex === 1 ? "gk-mood-storm" : "gk-mood-chrome";

  return (
    <main className="min-h-screen overflow-hidden bg-[#050403] text-[#e8e1d2]">
      <section className={`gk-mood-stage ${moodClass} relative px-4 py-8 sm:px-6 lg:px-8 lg:py-10`}>
        <div className="gk-ambient" />
        <div className="relative mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.62fr_1fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c6a96d]/25 bg-[#c6a96d]/10 py-1.5 pl-1.5 pr-3 text-[11px] font-black uppercase tracking-[0.24em] text-[#c6a96d]">
              <Image src="/gatekpt-icon.png" alt="" width={28} height={28} className="rounded-full" />
              GateKPT
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
              What does sound look like?
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#e8e1d2]/72">
              Press play. Change the air around the guitar.
            </p>
            <div className="mt-6 grid max-w-xl gap-2">
              {["Hear it", "Change the room", "Watch it answer"].map((item) => (
                <div key={item} className="rounded-[1.1rem] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-black text-[#e8e1d2]/78">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#preview" className="gk-button-primary">
                Try the question
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, duration: 0.6, ease: "easeOut" }}>
            <div className="gk-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
              <div className="absolute inset-0 opacity-55 [background:radial-gradient(circle_at_28%_22%,rgba(198,169,109,0.18),transparent_26%),radial-gradient(circle_at_82%_30%,rgba(110,231,255,0.14),transparent_30%),repeating-linear-gradient(155deg,rgba(232,225,210,0.06)_0_1px,transparent_1px_34px)]" />
              <div className="relative">
                <p className="gk-label text-[#d08a56]">Answer</p>
                <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.055em]">
                  Fire. Storm. Chrome.
                </h2>
                <div className="mt-8 grid gap-3" id="preview">
                  {cuePath.map(([number, item, detail], index) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setActiveCueIndex(index)}
                      className={`flex items-center gap-4 rounded-[1.2rem] border p-4 text-left transition ${
                        activeCueIndex === index
                          ? "border-[#d08a56]/50 bg-[#d08a56]/12"
                          : "border-white/10 bg-white/[0.035] hover:border-[#d08a56]/35"
                        }`}
                    >
                      <span className="font-mono text-xs text-[#c6a96d]">{number}</span>
                      <span>
                        <span className="block text-sm font-black">{item}</span>
                        <span className="mt-1 block text-xs font-bold text-[#e8e1d2]/45">{detail}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div className={`gk-preview-world ${moodClass} relative mx-auto mt-6 max-w-7xl`}>
          <TerrainSignalPreview activeCue={activeCue} />
        </div>
        <div className="relative mx-auto mt-6 max-w-7xl">
          <div className="gk-panel flex flex-wrap items-center justify-between gap-4 rounded-[2rem] p-4 sm:p-5">
            <p className="text-xl font-black tracking-[-0.04em] text-[#e8e1d2]">XIV</p>
            <div className="flex flex-wrap gap-2">
              {socialChannels.map((item) => (
                item.href ? (
                  <a key={item.name} className="gk-social-icon-link" href={item.href} target="_blank" rel="noreferrer" aria-label={item.name} title={item.name}>
                    <item.Icon className="h-5 w-5" />
                  </a>
                ) : (
                  <span key={item.name} className="gk-social-icon-link gk-social-icon-link-muted" aria-label={item.name} title={`${item.name} link coming`}>
                    <item.Icon className="h-5 w-5" />
                  </span>
                )
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
