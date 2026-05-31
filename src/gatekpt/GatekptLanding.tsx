"use client";

import { motion } from "framer-motion";
import { Captions, CircuitBoard, Layers3, Mic, Route, Sparkles, Square, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type AudioStatus = "preview" | "starting" | "listening" | "blocked" | "unsupported";

const surfaces: Array<[string, string, LucideIcon]> = [
  ["Capture", "Record full loops or solo RC-505 tracks into clean takes.", Layers3],
  ["Shape", "Make safe versions with plain-language changes.", Sparkles],
  ["Memory", "Keep lyrics, captions, routing notes, and export intent together.", Captions],
  ["Visuals", "Turn sound into a live visual layer for video-first work.", Waves],
];

const timeline = [
  ["01", "Drums", "Track 1", "amber"],
  ["02", "Guitar", "Track 2", "cyan"],
  ["03", "Piano", "Track 3", "violet"],
  ["04", "Vocal", "Track 4", "amber"],
];

function LiveSignalPreview() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [status, setStatus] = useState<AudioStatus>("preview");
  const [level, setLevel] = useState(28);

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
      const wave = new Uint8Array(analyser?.frequencyBinCount || 128);

      if (analyser) {
        analyser.getByteFrequencyData(bins);
        analyser.getByteTimeDomainData(wave);
      } else {
        const now = performance.now() / 1000;
        for (let index = 0; index < bins.length; index += 1) {
          bins[index] = 34 + Math.round(Math.sin(now * 1.2 + index * 0.14) * 22 + Math.sin(now * 0.42 + index * 0.05) * 16);
          wave[index] = 128 + Math.round(Math.sin(now * 1.8 + index * 0.12) * 24 + Math.sin(now * 0.4 + index * 0.03) * 12);
        }
      }

      const average = bins.reduce((sum, value) => sum + value, 0) / bins.length;
      const pulse = Math.min(1, average / 175);
      setLevel(Math.round(pulse * 100));

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#08090a";
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width * 0.56, height * 0.42, 20, width * 0.56, height * 0.42, width * 0.75);
      glow.addColorStop(0, `rgba(240, 184, 104, ${0.22 + pulse * 0.25})`);
      glow.addColorStop(0.4, `rgba(87, 218, 226, ${0.14 + pulse * 0.16})`);
      glow.addColorStop(0.78, `rgba(164, 132, 255, ${0.08 + pulse * 0.14})`);
      glow.addColorStop(1, "rgba(8,9,10,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(244,235,218,0.08)";
      for (let row = 1; row < 5; row += 1) {
        const y = (height / 5) * row;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const colors = ["#f0b868", "#57dae2", "#a484ff", "#f4ebda"];
      for (let lane = 0; lane < 4; lane += 1) {
        const centerY = height * (0.28 + lane * 0.14);
        ctx.beginPath();
        for (let index = 0; index < wave.length; index += 1) {
          const x = (index / (wave.length - 1)) * width;
          const bin = bins[(index + lane * 13) % bins.length] / 255;
          const y = centerY + ((wave[index] - 128) / 128) * (14 + bin * 34 + pulse * 18);
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.shadowBlur = 14 + pulse * 18;
        ctx.shadowColor = colors[lane];
        ctx.strokeStyle = colors[lane];
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      for (let mark = 0; mark < 7; mark += 1) {
        const x = width * (0.12 + mark * 0.13);
        ctx.fillStyle = mark % 2 === 0 ? "rgba(240,184,104,0.9)" : "rgba(87,218,226,0.75)";
        ctx.fillRect(x, height * 0.78, 2, 36 + Math.sin(performance.now() / 700 + mark) * 10);
      }

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
      analyser.smoothingTimeConstant = 0.84;
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
      <canvas ref={canvasRef} className="h-[34rem] w-full" aria-label="GateKPT audio reactive preview" />
      <div className="absolute inset-x-5 top-5 flex flex-wrap items-center justify-between gap-3">
        <span className="gk-chip">{status === "listening" ? "Live signal" : "Local preview"}</span>
        <span className="gk-chip">Signal {level}%</span>
      </div>
      <div className="absolute inset-x-5 bottom-5 rounded-[1.4rem] border border-white/10 bg-[#08090a]/78 p-4 backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="gk-label text-[#f0b868]">Audio-reactive visual layer</p>
            <p className="mt-1 text-sm font-medium leading-6 text-[#f4ebda]/68">
              Browser demo only. The desktop OS is built for capture, stems, captions, routing, and exports.
            </p>
          </div>
          {status === "listening" || status === "starting" ? (
            <button type="button" onClick={stopMic} className="gk-button-secondary">
              <Square className="h-4 w-4" />
              Stop
            </button>
          ) : (
            <button type="button" onClick={startMic} className="gk-button-primary">
              <Mic className="h-4 w-4" />
              Listen locally
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function GatekptLanding() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08090a] text-[#f4ebda]">
      <section className="relative px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="gk-ambient" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f0b868]/25 bg-[#f0b868]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-[#f0b868]">
              <CircuitBoard className="h-3.5 w-3.5" />
              GateKPT MusicOS
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.88] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
              A creative cockpit for capturing ideas fast.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#f4ebda]/70">
              Built for live-loop musicians and video-first artists who need takes, stems, lyrics,
              captions, routing, and visuals to stay connected without killing the moment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#workflow" className="gk-button-primary">
                See workflow
              </a>
              <a href="#visual" className="gk-button-secondary">
                Try visual layer
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.6, ease: "easeOut" }}
          >
            <LiveSignalPreview />
          </motion.div>
        </div>
      </section>

      <section id="workflow" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-4">
            {surfaces.map(([title, text, Icon]) => (
              <div key={title as string} className="gk-card group">
                <Icon className="h-5 w-5 text-[#57dae2] transition duration-200 group-hover:-translate-y-0.5 group-hover:text-[#f0b868]" />
                <h2 className="mt-5 text-xl font-black tracking-[-0.03em]">{title}</h2>
                <p className="mt-3 text-sm font-medium leading-6 text-[#f4ebda]/62">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.8fr_1fr]">
          <div className="gk-panel p-6 sm:p-8">
            <p className="gk-label text-[#a484ff]">RC-505 cue workflow</p>
            <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.055em]">
              Record the way the artist actually plays.
            </h2>
            <p className="mt-5 text-sm font-medium leading-7 text-[#f4ebda]/64">
              GateKPT is not trying to force a generic studio layout. It adapts around the rig:
              full loop capture, solo track stems, command-shaped versions, and one exported mix.
            </p>
          </div>

          <div className="gk-panel p-4 sm:p-5">
            <div className="grid gap-3">
              {timeline.map(([number, label, track, accent]) => (
                <div key={number} className={`gk-cue gk-cue-${accent}`}>
                  <span className="font-mono text-xs text-[#f4ebda]/42">{number}</span>
                  <div>
                    <p className="font-black">{label}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f4ebda]/42">{track}</p>
                  </div>
                  <span className="ml-auto rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#f4ebda]/58">
                    capture
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="visual" className="px-4 py-10 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_0.75fr]">
          <div className="gk-panel p-6 sm:p-8">
            <p className="gk-label text-[#f0b868]">Project memory surfaces</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Lyrics + captions", "Keep words close to the sound."],
                ["Stem capture", "Turn hardware performance into reusable takes."],
                ["Visual preview", "Let sound drive a performance image."],
                ["Export planning", "Prepare mixes, clips, and DJ-ready files."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#57dae2]/40">
                  <p className="font-black">{title}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#f4ebda]/58">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="gk-panel flex flex-col justify-between p-6 sm:p-8">
            <Route className="h-8 w-8 text-[#57dae2]" />
            <h2 className="mt-10 text-3xl font-black leading-none tracking-[-0.045em]">
              Serious creative software should feel calm under pressure.
            </h2>
            <p className="mt-5 text-sm font-medium leading-7 text-[#f4ebda]/62">
              The interface is designed for fast scanning during a session: cue cards, active states,
              signal status, section memory, and exports all in one coherent visual system.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
