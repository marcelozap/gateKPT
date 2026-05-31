"use client";

import { motion } from "framer-motion";
import { Archive, Captions, Cable, Film, Layers3, Mic, Mountain, Route, Sparkles, Square, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type AudioStatus = "preview" | "starting" | "listening" | "blocked" | "unsupported";

const workflow: Array<[string, string, LucideIcon]> = [
  ["Capture", "Record the sound.", Mic],
  ["Choose", "Keep the best moment.", Layers3],
  ["Shape", "Make it warmer, raw, brighter, or live.", Sparkles],
  ["Visualize", "Turn the sound into a look.", Captions],
  ["Export", "Share the finished idea.", Archive],
];

const productSections: Array<[string, string, LucideIcon, string]> = [
  ["Record", "Capture sound before the feeling disappears.", Mic, "Start"],
  ["Command", "Type simple changes instead of hunting through knobs.", Sparkles, "Shape"],
  ["Visual", "Let the sound create motion, color, and clip direction.", Waves, "Look"],
  ["Route", "Keep live-loop gear and stems understandable.", Cable, "Rig"],
  ["Finish", "Prepare demos, clips, folders, and shareable files.", Archive, "Export"],
];

const cuePath = [
  ["01", "Drums", "Capture the pulse"],
  ["02", "Guitar", "Add movement"],
  ["03", "Keys", "Fill the room"],
  ["04", "Vocal", "Find the line"],
  ["05", "Extra", "Texture or hook"],
];

function TerrainSignalPreview() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [status, setStatus] = useState<AudioStatus>("preview");
  const [level, setLevel] = useState(21);

  const stopAudio = useCallback(() => {
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
      setLevel(Math.round(pulse * 100));

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

      for (let line = 0; line < 12; line += 1) {
        const yBase = height * (0.22 + line * 0.058);
        ctx.beginPath();
        for (let index = 0; index < bins.length; index += 1) {
          const x = (index / (bins.length - 1)) * width;
          const signal = bins[(index + line * 5) % bins.length] / 255;
          const y = yBase + Math.sin(index * 0.08 + line * 0.7 + performance.now() / 2400) * (7 + line * 0.8) - signal * (10 + pulse * 22);
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
        const y = height * 0.63 + Math.sin(index * 0.09 + performance.now() / 900) * 16 - (bins[index] / 255) * 78;
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
        <span className="gk-chip">{status === "listening" ? "Live sound" : "Preview"}</span>
        <span className="gk-chip">Signal {level}%</span>
      </div>
      <div className="absolute inset-x-5 bottom-5 rounded-[1.4rem] border border-white/10 bg-[#07100d]/82 p-4 backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="gk-label text-[#c6a96d]">Sound preview</p>
            <p className="mt-1 text-sm font-medium leading-6 text-[#e8e1d2]/68">
              Tap the mic and watch sound become motion. Nothing is uploaded.
            </p>
          </div>
          {status === "listening" || status === "starting" ? (
            <button type="button" onClick={stopMic} className="gk-button-secondary">
              <Square className="h-4 w-4" />
              Stop
            </button>
          ) : (
            <button type="button" onClick={startMic} className="gk-button-primary">
              <Waves className="h-4 w-4" />
              Try locally
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function GatekptLanding() {
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
              Capture ideas fast.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#e8e1d2]/72">
              GateKPT is a custom music tool for recording ideas, shaping sound with simple commands, and turning sessions into visuals.
            </p>
            <div className="mt-6 grid max-w-xl grid-cols-3 gap-2">
              {["Record", "Shape", "Visualize"].map((item) => (
                <div key={item} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.16em] text-[#e8e1d2]/60">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#workflow" className="gk-button-primary">
                See workflow
              </a>
              <a href="#preview" className="gk-button-secondary">
                Try preview
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, duration: 0.6, ease: "easeOut" }}>
            <TerrainSignalPreview />
          </motion.div>
        </div>
      </section>

      <section id="workflow" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="gk-label text-[#92bfb3]">Workflow</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">Capture. Choose. Shape. Export.</h2>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            {workflow.map(([title, text, Icon]) => (
              <div key={title} className="gk-card group">
                <Icon className="h-5 w-5 text-[#92bfb3] transition duration-200 group-hover:-translate-y-0.5 group-hover:text-[#c6a96d]" />
                <h3 className="mt-5 text-xl font-black tracking-[-0.03em]">{title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-[#e8e1d2]/62">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.85fr_1fr]">
          <div className="gk-panel p-6 sm:p-8">
            <p className="gk-label text-[#c6a96d]">Live-loop workflow</p>
            <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.055em]">
              Cue cards for the way a session actually builds.
            </h2>
            <p className="mt-5 text-sm font-medium leading-7 text-[#e8e1d2]/64">
              Start with drums, add guitar or keys, then vocals. Keep the flow visible while the loop grows.
            </p>
          </div>
          <div className="gk-panel p-4 sm:p-5">
            <div className="grid gap-3">
              {cuePath.map(([number, name, note]) => (
                <div key={number} className="gk-cue group">
                  <span className="font-mono text-xs text-[#e8e1d2]/42">{number}</span>
                  <div>
                    <p className="font-black">{name}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e8e1d2]/42">{note}</p>
                  </div>
                  <span className="ml-auto rounded-full border border-[#92bfb3]/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#92bfb3]/80 transition group-hover:border-[#c6a96d]/50 group-hover:text-[#c6a96d]">
                    cue
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="preview" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.82fr_1fr]">
          <div className="gk-panel p-6 sm:p-8">
            <p className="gk-label text-[#c6a96d]">Try it</p>
            <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.055em]">
              Make sound visible.
            </h2>
            <p className="mt-5 text-sm font-medium leading-7 text-[#e8e1d2]/64">
              This public demo is intentionally simple: use your mic, make noise, watch the terrain respond.
            </p>
          </div>

          <div className="gk-panel p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["01", "Allow mic", "Browser only"],
                ["02", "Play sound", "Voice or beat"],
                ["03", "Watch motion", "Live terrain"],
              ].map(([number, title, note]) => (
                <div key={title} className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-5">
                  <span className="font-mono text-xs text-[#e8e1d2]/42">{number}</span>
                  <p className="mt-8 text-xl font-black tracking-[-0.03em]">{title}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#92bfb3]/70">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5">
            <p className="gk-label text-[#92bfb3]">What it helps with</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">Record, shape, visualize, finish.</h2>
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
            <p className="gk-label text-[#d08a56]">Public-safe summary</p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.045em]">
              Creative audio tool for capturing ideas fast and shaping sessions with simple commands.
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
