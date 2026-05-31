"use client";

import { motion } from "framer-motion";
import { ArrowRight, AudioLines, Check, FileVideo, Mic, MonitorUp, Music2, Play, Sparkles, Square, Waves } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const systemSignals = [
  "C#/.NET desktop MusicOS",
  "Looper-first song workflow",
  "Captions, visuals, exports",
  "Optional browser demo below",
];

const points = [
  "GateKPT is being built around the live creator loop: drums, guitar or keys, vocals, captions, visuals, and export.",
  "The public website explains the product and gives visitors a small optional demo they can open and exit.",
  "The private C#/.NET desktop app keeps the real production memory: rig, takes, lyrics, captions, visual presets, and exports.",
];

const creators = [
  "Loop artists using Focusrite, RC-505, keys, guitar, vocals, and drums",
  "Singers who want the room to respond to pitch, tone, breath, and intensity",
  "Video creators turning performances into clips, captions, and release assets",
  "Independent artists who want to create faster without living inside a giant DAW",
];

const modules = [
  {
    name: "Live Visualizer",
    label: "Signal",
    text: "Audio-reactive worlds that respond to drums, voice, harmony, movement, and performance energy.",
  },
  {
    name: "Looper Capture",
    label: "Play",
    text: "Designed around the way the music starts: drums first, then guitar or piano, then vocals and layers.",
  },
  {
    name: "Visual Painting",
    label: "Reveal",
    text: "When the song is done, the visualizer becomes the reveal: a performance painting made from the session.",
  },
  {
    name: "Caption Engine",
    label: "Video",
    text: "Lyrics and spoken ideas become caption drafts so clips are easier to finish and post.",
  },
  {
    name: "Rig Routing",
    label: "Hardware",
    text: "Focusrite, RC-505, mic, monitor, instrument, and routing notes stay attached to the project.",
  },
  {
    name: "Export Memory",
    label: "Finish",
    text: "Track what has a take, what needs visuals, what needs captions, and what is ready to release.",
  },
];

const offers = [
  {
    name: "MusicOS Alpha",
    price: "Private app",
    text: "A C#/.NET creator cockpit for song flow, lyrics, captions, visual direction, rig memory, and export planning.",
  },
  {
    name: "Visualizer Demo",
    price: "Public web",
    text: "A lightweight 2D browser demo people can open from LinkedIn to feel the music-to-visual-art idea.",
  },
  {
    name: "Video Pipeline",
    price: "Release",
    text: "A faster path from live performance to captioned clips, demos, behind-the-scenes videos, and finished posts.",
  },
];

const stack = [
  "Native C#/.NET desktop app",
  "Audio-interface aware routing",
  "Always-on live visualizer",
  "Looper-first session flow",
  "Caption and video workflow",
  "Local-first creative memory",
];

function ProductHeroPanel() {
  const cards = [
    ["Song Builder", "Drums -> harmony -> vocals"],
    ["Lyric Vault", "Hooks, fragments, rewrites"],
    ["Caption Engine", "Draft first, review before burn-in"],
    ["Visual Room", "2D/3D renderer path planning"],
    ["Rig Routing", "Focusrite / RC-505 memory"],
    ["Export Memory", "Clips, artwork, release tasks"],
  ];

  return (
    <div className="relative overflow-hidden rounded-[2.125rem] border border-white/12 bg-[#120f0b] p-5 shadow-[0_34px_100px_rgba(0,0,0,0.42)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(241,194,125,0.18),transparent_28%),radial-gradient(circle_at_84%_8%,rgba(55,214,255,0.14),transparent_24%)]" />

      <div className="relative rounded-[1.6rem] border border-white/10 bg-black/35 p-5 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Product Snapshot</p>
            <h2 className="mt-3 text-3xl font-black leading-none tracking-[-0.055em] text-white">
              Private creator OS. Public proof page.
            </h2>
          </div>
          <span className="rounded-full bg-[#f1c27d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#15120d]">
            Alpha
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {cards.map(([title, detail]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <p className="text-sm font-black text-[#f8f0e5]">{title}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-white/52">{detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-[#f1c27d]/20 bg-[#f1c27d]/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f1c27d]">Website Role</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
            Use this page from LinkedIn, GitHub, and your personal site to explain the project first.
            The visualizer demo is a lower section, not the whole product.
          </p>
        </div>
      </div>
    </div>
  );
}

function PublicVisualizerDemo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "listening" | "blocked">("idle");
  const [level, setLevel] = useState(0);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const pixelRatio = window.devicePixelRatio || 1;
      const targetWidth = Math.floor(width * pixelRatio);
      const targetHeight = Math.floor(height * pixelRatio);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const analyser = analyserRef.current;
      const frequencyData = analyser ? new Uint8Array(analyser.frequencyBinCount) : new Uint8Array(96);
      const timeData = analyser ? new Uint8Array(analyser.frequencyBinCount) : new Uint8Array(96);

      if (analyser) {
        analyser.getByteFrequencyData(frequencyData);
        analyser.getByteTimeDomainData(timeData);
      } else {
        const now = performance.now() / 1000;
        for (let index = 0; index < frequencyData.length; index += 1) {
          frequencyData[index] = 28 + Math.round(Math.sin(now * 1.6 + index * 0.34) * 18 + Math.sin(now * 0.7 + index * 0.11) * 12);
          timeData[index] = 128 + Math.round(Math.sin(now * 1.2 + index * 0.18) * 18);
        }
      }

      const average = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length;
      const pulse = average / 255;
      setLevel(Math.round(pulse * 100));

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 8, width * 0.5, height * 0.5, width * 0.72);
      gradient.addColorStop(0, `rgba(255, 244, 210, ${0.28 + pulse * 0.5})`);
      gradient.addColorStop(0.42, `rgba(241, 194, 125, ${0.18 + pulse * 0.35})`);
      gradient.addColorStop(0.72, `rgba(55, 214, 255, ${0.12 + pulse * 0.28})`);
      gradient.addColorStop(1, "rgba(5, 5, 5, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2);
      for (let ring = 0; ring < 5; ring += 1) {
        ctx.beginPath();
        const radius = 42 + ring * 38 + pulse * 58;
        ctx.strokeStyle = ring % 2 === 0 ? `rgba(241, 194, 125, ${0.18 + pulse * 0.35})` : `rgba(55, 214, 255, ${0.14 + pulse * 0.28})`;
        ctx.lineWidth = 1 + pulse * 3;
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      ctx.beginPath();
      for (let index = 0; index < timeData.length; index += 1) {
        const x = (index / (timeData.length - 1)) * width;
        const y = height / 2 + ((timeData[index] - 128) / 128) * (54 + pulse * 90);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = "rgba(255, 244, 210, 0.92)";
      ctx.lineWidth = 2 + pulse * 3;
      ctx.shadowBlur = 26 + pulse * 46;
      ctx.shadowColor = "rgba(241, 194, 125, 0.82)";
      ctx.stroke();
      ctx.shadowBlur = 0;

      const barCount = 48;
      const barWidth = width / barCount;
      for (let index = 0; index < barCount; index += 1) {
        const value = frequencyData[Math.floor((index / barCount) * frequencyData.length)] / 255;
        const barHeight = value * height * 0.45;
        ctx.fillStyle = index % 3 === 0 ? "rgba(55, 214, 255, 0.78)" : "rgba(241, 194, 125, 0.78)";
        ctx.fillRect(index * barWidth, height - barHeight, Math.max(2, barWidth - 3), barHeight);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();
  }, []);

  const stopDemo = useCallback(
    (closeDemo = false) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      void audioContextRef.current?.close();
      audioContextRef.current = null;
      analyserRef.current = null;
      setLevel(0);
      setStatus("idle");

      if (closeDemo) {
        setIsDemoOpen(false);
      } else {
        requestAnimationFrame(drawVisualizer);
      }
    },
    [drawVisualizer],
  );

  useEffect(() => {
    if (isDemoOpen) {
      drawVisualizer();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      void audioContextRef.current?.close();
    };
  }, [drawVisualizer, isDemoOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !isDemoOpen) {
        return;
      }

      stopDemo(true);
      document.getElementById("product-flow")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isDemoOpen, stopDemo]);

  async function startDemo() {
    try {
      setStatus("starting");
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setStatus("listening");
      drawVisualizer();
    } catch {
      setStatus("blocked");
    }
  }

  return (
    <section id="try-visualizer" className="bg-[#080706] px-4 py-16 text-[#f8f0e5] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {!isDemoOpen ? (
          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(241,194,125,0.14),transparent_34%),rgba(255,255,255,0.04)] p-6 shadow-[0_26px_75px_rgba(0,0,0,0.24)] sm:p-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Optional Interactive Demo</p>
                <h2 className="mt-3 max-w-3xl text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
                  Open a small visualizer demo.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/62">
                  This is not the whole website. It is a small browser preview of the idea.
                  You can close it anytime with the button or by pressing Esc.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDemoOpen(true)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#f1c27d] px-6 py-3 text-sm font-black uppercase tracking-[0.13em] text-[#15120d] transition hover:-translate-y-0.5 hover:bg-[#ffd99b]"
              >
                <Waves className="h-4 w-4" />
                Open demo
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[0.72fr_1fr] lg:items-stretch">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Public Demo</p>
          <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
            Try the visualizer in your browser.
          </h2>
          <p className="mt-5 text-sm leading-7 text-white/64">
            Click start, allow microphone access, then sing, clap, play music, or feed audio from your setup.
            The demo listens locally in the browser and paints from the signal.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {status !== "listening" && status !== "starting" ? (
              <button
                type="button"
                onClick={startDemo}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f1c27d] px-6 py-3 text-sm font-black uppercase tracking-[0.13em] text-[#15120d] transition hover:-translate-y-0.5 hover:bg-[#ffd99b]"
              >
                <Mic className="h-4 w-4" />
                Start visualizer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => stopDemo()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-black/28 px-6 py-3 text-sm font-black uppercase tracking-[0.13em] text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Square className="h-4 w-4" />
                Stop
              </button>
            )}
            <button
              type="button"
              onClick={() => stopDemo(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-6 py-3 text-sm font-bold text-white/68 transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              Exit demo
            </button>
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
            {status === "blocked"
              ? "Mic permission was blocked. Enable it in the browser to try again."
              : status === "starting"
                ? "Starting local audio..."
                  : status === "listening"
                    ? `Live signal level ${level}%`
                    : "Press Esc anytime to exit this demo."}
          </p>
        </div>

        <div className="relative min-h-[18rem] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_34px_100px_rgba(0,0,0,0.42)]">
          <div className="absolute left-4 top-4 z-10 rounded-full border border-white/12 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/68 backdrop-blur">
            Esc exits demo
          </div>
          <canvas ref={canvasRef} className="h-full min-h-[18rem] w-full" aria-label="Audio reactive visualizer demo" />
          {status !== "listening" && (
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(241,194,125,0.18),rgba(0,0,0,0.72)_58%)] p-8 text-center">
              <div>
                <Waves className="mx-auto h-10 w-10 text-[#f1c27d]" />
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-white/72">
                  {status === "starting" ? "Starting audio" : "Idle visual painting"}
                </p>
                <p className="mt-2 max-w-xs text-xs font-medium leading-5 text-white/48">
                  The public demo becomes audio-reactive after microphone permission.
                </p>
              </div>
            </div>
          )}
        </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductPathStrip() {
  const path = [
    {
      label: "Landing Page",
      title: "Understand the product",
      text: "This page is for LinkedIn, portfolio visitors, and early users to understand the music-to-visual-art idea fast.",
    },
    {
      label: "Public Demo",
      title: "Try the visualizer",
      text: "A browser-safe mic demo lets people feel the core concept without installing your private MusicOS.",
    },
    {
      label: "Private App",
      title: "Create for real",
      text: "The C#/.NET desktop app is the serious cockpit for rig routing, takes, lyrics, captions, visuals, and export memory.",
    },
  ];

  return (
    <section className="bg-[#080706] px-4 pb-8 text-[#f8f0e5] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-3 rounded-[2rem] border border-white/10 bg-white/[0.035] p-3 md:grid-cols-3">
        {path.map((item) => (
          <article key={item.label} className="rounded-[1.5rem] border border-white/10 bg-black/28 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f1c27d]">{item.label}</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.05em]">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-white/58">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CreationFlowSection() {
  const steps = [
    {
      icon: AudioLines,
      title: "Play into the rig",
      text: "Start with drums, a loop, keys, guitar, or voice. GateKPT is designed around performing the idea first.",
    },
    {
      icon: Waves,
      title: "Shape the visual world",
      text: "The audio signal drives motion, color, pulse, and room energy while the song is still being built.",
    },
    {
      icon: FileVideo,
      title: "Leave with assets",
      text: "The goal is not just a cool screen. It is a song, a visual artifact, captions, clips, and a path to release.",
    },
  ];

  return (
    <section id="product-flow" className="bg-[#11100d] px-4 py-16 text-[#f8f0e5] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">How It Works</p>
          <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
            A creator workflow, not a screensaver.
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/62">
            The visualizer is one part of GateKPT. The full direction is a local Music OS
            for making the performance easier to capture, understand, package, and share.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.title} className="rounded-[1.75rem] border border-white/10 bg-black/30 p-6">
              <step.icon className="h-7 w-7 text-[#f1c27d]" />
              <h3 className="mt-8 text-3xl font-black tracking-[-0.055em]">{step.title}</h3>
              <p className="mt-4 text-sm leading-7 text-white/62">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BuildStatusSection() {
  const milestones = [
    {
      label: "Now",
      title: "Public landing + safe demo",
      text: "GateKPT.ai explains the product and offers a lightweight 2D browser visualizer that visitors can open and exit safely.",
    },
    {
      label: "Private alpha",
      title: "C#/.NET MusicOS",
      text: "The desktop app holds the real creative workflow: looper layers, lyrics, captions, rig routing, visual presets, project memory, and exports.",
    },
    {
      label: "Next",
      title: "Performance visual engine",
      text: "The heavier 2D/3D renderer belongs in the private app path, where it can support projector, OBS, stage safety, and saved visual artwork.",
    },
  ];

  return (
    <section className="bg-[#f6f0e7] px-4 py-16 text-[#15120d] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8d5631]">Build Status</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
              Public demo here. Serious creation in the desktop OS.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-[#62533f]">
            This is the important split: the website gives people the instant “I get it”
            moment, while the private app becomes the real instrument.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {milestones.map((item) => (
            <article
              key={item.label}
              className="rounded-[1.75rem] border border-[#15120d]/10 bg-white/62 p-6 shadow-[0_18px_55px_rgba(65,48,28,0.10)]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8d5631]">{item.label}</p>
              <h3 className="mt-5 text-3xl font-black tracking-[-0.055em]">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#62533f]">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GatekptLanding() {
  return (
    <div className="min-h-screen bg-[#080706] text-[#f8f0e5]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(55,214,255,0.20),transparent_28%),radial-gradient(circle_at_78%_10%,rgba(241,194,125,0.22),transparent_30%),linear-gradient(135deg,#080706_0%,#15120d_46%,#050505_100%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-13 lg:grid-cols-[1fr_0.82fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="max-w-5xl"
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d] shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#f1c27d]" />
              GateKPT MusicOS
            </div>

            <h1 className="max-w-5xl text-6xl font-black leading-[0.86] tracking-[-0.078em] sm:text-7xl lg:text-[7.4rem]">
              A creator OS for music, visuals, and release-ready clips.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
              GateKPT is a C#/.NET desktop MusicOS for live-loop creators:
              plan the song, capture layers, keep lyrics and captions together,
              shape visuals, and package the performance into finished media.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#product-flow"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#f8f0e5] px-6 py-3 text-sm font-black uppercase tracking-[0.13em] text-[#15120d] shadow-[0_18px_45px_rgba(0,0,0,0.32)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                See the product
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </a>
              <a
                href="#try-visualizer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-black/28 px-6 py-3 text-sm font-bold text-white/78 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Play className="h-4 w-4" />
                Try optional demo
              </a>
            </div>

            <div className="mt-10 grid max-w-3xl gap-2 sm:grid-cols-2">
              {systemSignals.map((signal) => (
                <div
                  key={signal}
                  className="rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm font-semibold text-white/82 backdrop-blur"
                >
                  {signal}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.6, ease: "easeOut" }}
          >
            <ProductHeroPanel />
          </motion.div>
        </div>
      </section>

      <ProductPathStrip />
      <CreationFlowSection />

      <section className="bg-[#11100d] px-4 py-16 text-[#f8f0e5] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_0.82fr]">
          <div className="rounded-[2rem] border border-white/10 bg-black/55 p-6 shadow-[0_26px_75px_rgba(0,0,0,0.32)] sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Public Surface</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl">
              The product is the sync between sound and sight.
            </h2>
            <div className="mt-8 space-y-4">
              {points.map((point) => (
                <div key={point} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1c27d] text-[#15120d]">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <p className="text-sm leading-6 text-white/72">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/12 bg-white/10 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.22)] backdrop-blur sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Private App</p>
            <h2 className="mt-4 text-3xl font-black leading-none tracking-[-0.055em] text-white">
              Not a web toy. A local creator instrument.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/68">
              The desktop app is where the private work happens: record, route, write,
              caption, test visuals, and keep the session memory. The website shows the
              promise. The Music OS does the work beside the rig.
            </p>
          </div>
        </div>
      </section>

      <BuildStatusSection />

      <section className="bg-[#f6f0e7] px-4 py-16 text-[#15120d] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[0.78fr_1fr]">
          <div className="rounded-[2rem] border border-[#15120d]/10 bg-white/60 p-6 sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8d5631]">Who It Is For</p>
            <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
              Built for creators who perform ideas into existence.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#62533f]">
              The app starts with the physical rig and the live session, not a blank timeline.
              Play the sound, capture the layer, let the visuals react, then finish the clip.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {creators.map((creator) => (
              <div
                key={creator}
                className="rounded-[1.5rem] border border-[#15120d]/10 bg-[#15120d] p-5 text-sm font-semibold leading-6 text-[#f8f0e5]"
              >
                {creator}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f0e7] px-4 py-16 text-[#15120d] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8d5631]">Inside The Music OS</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
                One loop: play, see, shape, save, release.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-[#62533f]">
              GateKPT makes the visualizer part of the creation process, not a final plugin
              slapped onto the song after the energy is gone.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#15120d]/10 bg-[#15120d] p-3 shadow-[0_26px_75px_rgba(65,48,28,0.18)]">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => (
                <article
                  key={module.name}
                  className="group min-h-[14rem] rounded-[1.5rem] border border-white/10 bg-[#211b13] p-5 text-[#f8f0e5] transition duration-300 hover:-translate-y-1 hover:border-[#f1c27d]/45 hover:bg-[#2b2217]"
                >
                  <div className="mb-8 inline-flex rounded-full bg-[#f1c27d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#15120d]">
                    {module.label}
                  </div>
                  <h3 className="text-3xl font-black tracking-[-0.055em]">{module.name}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/64">{module.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#f6f0e7] px-4 py-16 text-[#15120d] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8d5631]">Offer</p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.06em] sm:text-5xl">MusicOS, visual demo, videos.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#62533f]">
              The website explains the visual product. The private app is the working cockpit
              for the performance, the song, and the video assets.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {offers.map((offer) => (
              <article
                key={offer.name}
                className="rounded-[1.75rem] border border-[#15120d]/10 bg-white/50 p-6 shadow-[0_18px_55px_rgba(65,48,28,0.10)] backdrop-blur"
              >
                <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#15120d] text-[#f8f0e5]">
                  <Music2 className="h-5 w-5" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8d5631]">{offer.price}</p>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.055em]">{offer.name}</h3>
                <p className="mt-4 text-sm leading-7 text-[#62533f]">{offer.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0f0d09] px-4 py-16 text-[#f8f0e5] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(55,214,255,0.16),transparent_34%),rgba(255,255,255,0.04)] p-6 shadow-[0_26px_75px_rgba(0,0,0,0.28)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.86fr_1fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Technical Stack</p>
              <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
                Serious local architecture, simple creative surface.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/64">
                The long-term product is not just a landing page. It is a native Music OS
                that can sit beside the creator rig, listen to the live signal, and turn
                sound into visuals without forcing every idea through a full studio session.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {stack.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/28 px-4 py-3 text-sm font-bold text-white/78"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="videos" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[0.9fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[#15120d] p-6 text-[#f8f0e5] sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Videos</p>
            <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
              The proof is the reveal.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/64">
              The content strategy becomes simple: show the sound being built, show the
              visual world reacting, then reveal the final painting behind the performance.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: AudioLines, label: "Input", text: "Rig audio feeds the visual world." },
              { icon: Waves, label: "React", text: "Motion follows transients, pitch, and intensity." },
              { icon: MonitorUp, label: "Project", text: "The final look can live on screen or projector." },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-[#f8f0e5]">
                <item.icon className="h-6 w-6 text-[#f1c27d]" />
                <p className="mt-5 text-[11px] font-black uppercase tracking-[0.22em] text-[#f1c27d]">{item.label}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/72">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicVisualizerDemo />

      <section id="early-access" className="bg-[#f6f0e7] px-4 pb-20 text-[#15120d] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-[#15120d] p-6 text-[#f8f0e5] shadow-[0_26px_75px_rgba(65,48,28,0.18)] sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Early Access</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
                Build the song. Keep the painting.
              </h2>
            </div>
            <a
              href="mailto:hello@gatekpt.ai?subject=GateKPT%20Visualizer%20OS%20Early%20Access"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#f1c27d] px-6 py-3 text-sm font-black uppercase tracking-[0.13em] text-[#15120d] transition hover:-translate-y-0.5 hover:bg-[#ffd99b]"
            >
              Request access
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/64">
            Start with the live visualizer and creator workflow. Keep the DAW for deep
            engineering when needed. Use GateKPT to make the first spark visible.
          </p>
        </div>
      </section>
    </div>
  );
}
