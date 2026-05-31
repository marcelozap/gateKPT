"use client";

import { motion } from "framer-motion";
import { Archive, Cable, Film, Mic, Mountain, Route, Sparkles, Square, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type AudioStatus = "preview" | "starting" | "listening" | "demo" | "blocked" | "unsupported";

const productSections: Array<[string, string, LucideIcon, string]> = [
  ["Record", "Save the idea before it disappears.", Mic, "Start"],
  ["Shape", "Type what you want: warmer, raw, louder, brighter.", Sparkles, "Change"],
  ["See", "Turn sound into motion and color.", Waves, "Visual"],
  ["Organize", "Keep takes and parts easy to find.", Cable, "Keep"],
  ["Share", "Prepare a demo, clip, or folder.", Archive, "Finish"],
];

const cuePath = [
  ["01", "Drums", "Pulse"],
  ["02", "Guitar", "Movement"],
  ["03", "Keys", "Room"],
  ["04", "Vocal", "Line"],
  ["05", "Extra", "Hook"],
];

function TerrainSignalPreview({ activeCue }: { activeCue: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const demoIntervalRef = useRef<number | null>(null);
  const demoNodesRef = useRef<AudioNode[]>([]);
  const lastCanvasDrawRef = useRef(0);
  const lastLevelUpdateRef = useRef(0);
  const [status, setStatus] = useState<AudioStatus>("preview");
  const [level, setLevel] = useState(21);

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
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
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
      const bins = new Uint8Array(analyser?.frequencyBinCount || 128);

      if (analyser) {
        analyser.getByteFrequencyData(bins);
      } else {
        const now = performance.now() / 1000;
        for (let index = 0; index < bins.length; index += 1) {
          bins[index] = 28 + Math.round(Math.sin(now * 0.8 + index * 0.11) * 18 + Math.sin(now * 0.32 + index * 0.03) * 14);
        }
      }

      const average = bins.reduce((sum, value) => sum + value, 0) / bins.length;
      const pulse = Math.min(1, average / 165);
      if (nowMs - lastLevelUpdateRef.current > 180) {
        lastLevelUpdateRef.current = nowMs;
        setLevel(Math.round(pulse * 100));
      }

      ctx.clearRect(0, 0, width, height);
      const base = ctx.createLinearGradient(0, 0, width, height);
      base.addColorStop(0, "#102018");
      base.addColorStop(0.55, "#07100d");
      base.addColorStop(1, "#18160f");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      const mist = ctx.createRadialGradient(width * 0.62, height * 0.25, 10, width * 0.62, height * 0.25, width * 0.72);
      mist.addColorStop(0, `rgba(232, 225, 210, ${0.09 + pulse * 0.12})`);
      mist.addColorStop(0.42, `rgba(146, 191, 179, ${0.08 + pulse * 0.12})`);
      mist.addColorStop(1, "rgba(7, 16, 13, 0)");
      ctx.fillStyle = mist;
      ctx.fillRect(0, 0, width, height);

      for (let line = 0; line < 8; line += 1) {
        const yBase = height * (0.24 + line * 0.076);
        ctx.beginPath();
        for (let index = 0; index < bins.length; index += 1) {
          const x = (index / (bins.length - 1)) * width;
          const signal = bins[(index + line * 5) % bins.length] / 255;
          const y = yBase + Math.sin(index * 0.08 + line * 0.7 + nowMs / 2400) * (7 + line * 0.8) - signal * (10 + pulse * 22);
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = line % 3 === 0 ? "rgba(198,169,109,0.46)" : "rgba(232,225,210,0.16)";
        ctx.lineWidth = line % 3 === 0 ? 1.4 : 1;
        ctx.stroke();
      }

      ctx.beginPath();
      for (let index = 0; index < bins.length; index += 1) {
        const x = (index / (bins.length - 1)) * width;
        const y = height * 0.63 + Math.sin(index * 0.09 + nowMs / 900) * 16 - (bins[index] / 255) * 78;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.shadowBlur = 18 + pulse * 24;
      ctx.shadowColor = "#92bfb3";
      ctx.strokeStyle = "#92bfb3";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(render);
    };

    render();
  }, []);

  const startMic = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }

      setStatus("starting");
      stopAudio();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      await audioContext.resume();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.86;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setStatus("listening");
    } catch {
      stopAudio();
      setStatus("blocked");
    }
  };

  const stopMic = () => {
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
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;

      const master = audioContext.createGain();
      master.gain.value = 0.055;
      master.connect(analyser);
      analyser.connect(audioContext.destination);

      const kick = audioContext.createOscillator();
      const kickGain = audioContext.createGain();
      kick.type = "sine";
      kick.frequency.value = 72;
      kickGain.gain.value = 0.0001;
      kick.connect(kickGain);
      kickGain.connect(master);

      const guitar = audioContext.createOscillator();
      const guitarGain = audioContext.createGain();
      guitar.type = "triangle";
      guitar.frequency.value = 196;
      guitarGain.gain.value = 0.028;
      guitar.connect(guitarGain);
      guitarGain.connect(master);

      const air = audioContext.createOscillator();
      const airGain = audioContext.createGain();
      air.type = "sine";
      air.frequency.value = 392;
      airGain.gain.value = 0.014;
      air.connect(airGain);
      airGain.connect(master);

      kick.start();
      guitar.start();
      air.start();

      let step = 0;
      const notes = [196, 220, 247, 294, 247, 220, 196, 165];
      demoIntervalRef.current = window.setInterval(() => {
        const now = audioContext.currentTime;
        const note = notes[step % notes.length];
        guitar.frequency.setTargetAtTime(note, now, 0.025);
        air.frequency.setTargetAtTime(note * 2, now, 0.04);

        kickGain.gain.cancelScheduledValues(now);
        kickGain.gain.setValueAtTime(0.24, now);
        kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        kick.frequency.setValueAtTime(step % 4 === 0 ? 78 : 62, now);
        kick.frequency.exponentialRampToValueAtTime(42, now + 0.16);
        step += 1;
      }, 260);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      demoNodesRef.current = [kick, guitar, air];
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
        <span className="gk-chip">{status === "listening" ? "Live sound" : status === "demo" ? "Demo loop" : "Preview"}</span>
        <span className="gk-chip">Signal {level}%</span>
      </div>
      <div className="absolute inset-x-5 bottom-5 rounded-[1.4rem] border border-white/10 bg-[#07100d]/82 p-4 backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="gk-label text-[#c6a96d]">Sound preview</p>
            <p className="mt-1 text-sm font-medium leading-6 text-[#e8e1d2]/68">
              Website preview only. Active cue: {activeCue}.
            </p>
          </div>
          {status === "listening" || status === "demo" || status === "starting" ? (
            <button type="button" onClick={stopMic} className="gk-button-secondary">
              <Square className="h-4 w-4" />
              Stop
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={startDemo} className="gk-button-primary">
                <Waves className="h-4 w-4" />
                Play sample
              </button>
              <button type="button" onClick={startMic} className="gk-button-secondary">
                <Mic className="h-4 w-4" />
                Use mic visualizer
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

  return (
    <main className="min-h-screen overflow-hidden bg-[#06111c] text-[#e8e1d2]">
      <section className="relative px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="gk-ambient" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c6a96d]/25 bg-[#c6a96d]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-[#c6a96d]">
              <Mountain className="h-3.5 w-3.5" />
              Custom music tool
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
              Make music feel easier.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#e8e1d2]/72">
              GateKPT is a custom music tool for people who want to create without getting buried in complicated software.
            </p>
            <div className="mt-6 grid max-w-xl grid-cols-3 gap-2">
              {["Play", "Record", "Shape"].map((item) => (
                <div key={item} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.16em] text-[#e8e1d2]/60">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#preview" className="gk-button-primary">
                Try demo
              </a>
              <a href="#tracks" className="gk-button-secondary">
                See tracks
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, duration: 0.6, ease: "easeOut" }}>
            <div className="gk-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
              <div className="absolute inset-0 opacity-55 [background:radial-gradient(circle_at_28%_22%,rgba(198,169,109,0.18),transparent_26%),radial-gradient(circle_at_82%_30%,rgba(146,191,179,0.14),transparent_30%),repeating-linear-gradient(155deg,rgba(232,225,210,0.06)_0_1px,transparent_1px_34px)]" />
              <div className="relative">
                <p className="gk-label text-[#92bfb3]">The idea</p>
                <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.055em]">
                  Make first. Learn as you go.
                </h2>
                <div className="mt-8 grid gap-3">
                  {["Press record", "Say the change", "Save the version"].map((item, index) => (
                    <div key={item} className="flex items-center gap-4 rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-4">
                      <span className="font-mono text-xs text-[#c6a96d]">0{index + 1}</span>
                      <span className="text-sm font-black">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="preview" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.7fr_1fr] lg:items-stretch">
          <div className="gk-panel flex flex-col justify-between p-6 sm:p-8">
            <div>
              <p className="gk-label text-[#c6a96d]">Try it</p>
              <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.055em]">
                Play with sound.
              </h2>
              <p className="mt-5 text-sm font-medium leading-7 text-[#e8e1d2]/64">
                Press play or use your mic. Nothing saves here. This is just a safe way to feel the idea.
              </p>
            </div>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#92bfb3]/70">
              Recording happens in the GateKPT desktop app.
            </p>
          </div>

          <TerrainSignalPreview activeCue={activeCue} />
        </div>
      </section>

      <section id="tracks" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.85fr_1fr]">
          <div className="gk-panel p-6 sm:p-8">
            <p className="gk-label text-[#c6a96d]">For making songs</p>
            <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.055em]">
              Build it one part at a time.
            </h2>
            <p className="mt-5 text-sm font-medium leading-7 text-[#e8e1d2]/64">
              Start with rhythm, add sound, then vocals. GateKPT keeps the pieces organized.
            </p>
            <div className="mt-8 rounded-[1.25rem] border border-[#92bfb3]/18 bg-[#92bfb3]/8 p-4">
              <p className="gk-label text-[#92bfb3]">Now</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.05em]">{activeCue}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8e1d2]/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#c6a96d] via-[#92bfb3] to-[#d08a56] transition-all duration-300"
                  style={{ width: `${((activeCueIndex + 1) / cuePath.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="gk-panel p-4 sm:p-5">
            <div className="grid gap-3">
              {cuePath.map(([number, name, note], index) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => setActiveCueIndex(index)}
                  className={`gk-cue group text-left ${activeCueIndex === index ? "is-active" : ""}`}
                  aria-pressed={activeCueIndex === index}
                >
                  <span className="font-mono text-xs text-[#e8e1d2]/42">{number}</span>
                  <div>
                    <p className="font-black">{name}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e8e1d2]/42">{note}</p>
                  </div>
                  <span className="ml-auto rounded-full border border-[#92bfb3]/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#92bfb3]/80 transition group-hover:border-[#c6a96d]/50 group-hover:text-[#c6a96d]">
                    {activeCueIndex === index ? "active" : "cue"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5">
            <p className="gk-label text-[#92bfb3]">What it helps with</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">Make, change, keep going.</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            {productSections.map(([title, text, Icon, meta]) => (
              <div key={title} className="gk-card group">
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-5 w-5 text-[#92bfb3] transition group-hover:text-[#c6a96d]" />
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#e8e1d2]/42">{meta}</span>
                </div>
                <h3 className="mt-5 text-lg font-black tracking-[-0.03em]">{title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-[#e8e1d2]/62">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_0.75fr]">
          <div className="gk-panel p-6 sm:p-8">
            <p className="gk-label text-[#d08a56]">Simple mission</p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.045em]">
              Help more people create music without feeling locked out by complicated tools.
            </h2>
          </div>
          <div className="gk-panel flex flex-col justify-between p-6 sm:p-8">
            <p className="gk-label text-[#92bfb3]">XIV family</p>
            <p className="mt-10 text-sm font-medium leading-7 text-[#e8e1d2]/62">
              Green Machine is for trading research. GateKPT is for music sessions. Separate rooms, same XIV system.
            </p>
            <Route className="mt-8 h-7 w-7 text-[#92bfb3]" />
          </div>
        </div>
      </section>
    </main>
  );
}
