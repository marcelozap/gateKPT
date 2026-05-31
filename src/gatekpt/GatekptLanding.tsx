"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Mic, Music2, Sparkles, Square, Waves, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type DemoStatus = "idle" | "preview" | "starting" | "listening" | "blocked" | "unsupported";

const promiseCards = [
  ["Make noise", "Clap, sing, hum, tap the desk."],
  ["See it move", "Sound turns into color and motion."],
  ["Leave anytime", "Esc closes it. No pressure."],
];

const productSteps = [
  ["1", "Play first", "Open a visual toy and make a sound. That is the whole first step."],
  ["2", "Catch ideas", "The bigger MusicOS helps save lyrics, loops, captions, visuals, and project memory."],
  ["3", "Finish things", "The goal is less menu-diving and more songs, clips, and creative momentum."],
];

function PublicVisualizerDemo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<DemoStatus>("idle");
  const [level, setLevel] = useState(0);

  const stopAudio = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  }, []);

  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) {
      return;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
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
      const frequencyData = new Uint8Array(analyser?.frequencyBinCount || 96);
      const timeData = new Uint8Array(analyser?.frequencyBinCount || 96);

      if (analyser) {
        analyser.getByteFrequencyData(frequencyData);
        analyser.getByteTimeDomainData(timeData);
      } else {
        const now = performance.now() / 1000;
        for (let index = 0; index < frequencyData.length; index += 1) {
          frequencyData[index] = 35 + Math.round(Math.sin(now * 1.8 + index * 0.29) * 18 + Math.sin(now * 0.6 + index * 0.09) * 14);
          timeData[index] = 128 + Math.round(Math.sin(now * 1.35 + index * 0.2) * 22);
        }
      }

      const average = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length;
      const pulse = Math.min(1, average / 180);
      setLevel(Math.round(pulse * 100));

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#050403";
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width * 0.5, height * 0.48, 10, width * 0.5, height * 0.48, width * 0.76);
      glow.addColorStop(0, `rgba(255, 238, 192, ${0.24 + pulse * 0.5})`);
      glow.addColorStop(0.45, `rgba(241, 126, 72, ${0.14 + pulse * 0.32})`);
      glow.addColorStop(0.78, `rgba(44, 213, 255, ${0.11 + pulse * 0.24})`);
      glow.addColorStop(1, "rgba(5, 4, 3, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2);
      for (let ring = 0; ring < 7; ring += 1) {
        ctx.beginPath();
        const radius = 26 + ring * 31 + pulse * 42;
        ctx.strokeStyle = ring % 2 === 0 ? `rgba(255, 218, 143, ${0.18 + pulse * 0.28})` : `rgba(44, 213, 255, ${0.12 + pulse * 0.24})`;
        ctx.lineWidth = 1 + pulse * 2;
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      ctx.beginPath();
      for (let index = 0; index < timeData.length; index += 1) {
        const x = (index / (timeData.length - 1)) * width;
        const y = height / 2 + ((timeData[index] - 128) / 128) * (60 + pulse * 90);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = "rgba(255, 243, 210, 0.95)";
      ctx.lineWidth = 2 + pulse * 3;
      ctx.shadowBlur = 24 + pulse * 42;
      ctx.shadowColor = "rgba(255, 190, 112, 0.9)";
      ctx.stroke();
      ctx.shadowBlur = 0;

      const barCount = 42;
      const barWidth = width / barCount;
      for (let index = 0; index < barCount; index += 1) {
        const value = frequencyData[Math.floor((index / barCount) * frequencyData.length)] / 255;
        const barHeight = Math.max(4, value * height * 0.42);
        ctx.fillStyle = index % 3 === 0 ? "rgba(44, 213, 255, 0.7)" : "rgba(255, 190, 112, 0.76)";
        ctx.fillRect(index * barWidth, height - barHeight, Math.max(2, barWidth - 4), barHeight);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();
  }, []);

  const openDemo = () => {
    setIsOpen(true);
    setStatus("preview");
    requestAnimationFrame(drawVisualizer);
  };

  const closeDemo = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    stopAudio();
    setLevel(0);
    setStatus("idle");
    setIsOpen(false);
  }, [stopAudio]);

  const stopMic = () => {
    stopAudio();
    setStatus("preview");
    requestAnimationFrame(drawVisualizer);
  };

  const startMic = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        requestAnimationFrame(drawVisualizer);
        return;
      }

      setStatus("starting");
      stopAudio();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      await audioContext.resume();

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
      stopAudio();
      setStatus("blocked");
      requestAnimationFrame(drawVisualizer);
    }
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        closeDemo();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeDemo, isOpen]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      stopAudio();
    };
  }, [stopAudio]);

  const statusMessage =
    status === "listening"
      ? `Mic is live locally. Signal ${level}%.`
    : status === "blocked"
        ? "Mic was blocked. No problem. The moving preview still works."
        : status === "unsupported"
          ? "This browser is not giving mic access here. Preview mode still works."
          : status === "starting"
            ? "Starting local audio..."
            : "Preview mode is already alive. Start mic only if you want it to react to sound.";

  return (
    <section id="try-visualizer" className="bg-[#080706] px-4 py-13 text-[#f8f0e5] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {!isOpen ? (
          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(241,194,125,0.16),transparent_34%),rgba(255,255,255,0.04)] p-6 shadow-[0_26px_75px_rgba(0,0,0,0.24)] sm:p-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Playground</p>
                <h2 className="mt-3 max-w-3xl text-4xl font-black leading-none tracking-[-0.055em] sm:text-5xl">
                  Open the sound toy.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
                  It starts moving right away. If you want, let it listen to your sound.
                </p>
              </div>
              <button
                type="button"
                onClick={openDemo}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#f1c27d] px-6 py-3 text-sm font-black uppercase tracking-[0.13em] text-[#15120d] transition hover:-translate-y-0.5 hover:bg-[#ffd99b]"
              >
                <Waves className="h-4 w-4" />
                Open playground
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[0.62fr_1fr] lg:items-stretch">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Play</p>
              <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.055em] sm:text-5xl">
                Make a sound. Watch it paint.
              </h2>
              <p className="mt-5 text-sm leading-7 text-white/66">
                The preview is just for fun. Start mic if you want the colors to follow your voice,
                drums, room, or interface.
              </p>

              <div className="mt-8 flex flex-col gap-3">
                {status === "listening" || status === "starting" ? (
                  <button
                    type="button"
                    onClick={stopMic}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-black/28 px-6 py-3 text-sm font-black uppercase tracking-[0.13em] text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    <Square className="h-4 w-4" />
                    Stop mic
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startMic}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f1c27d] px-6 py-3 text-sm font-black uppercase tracking-[0.13em] text-[#15120d] transition hover:-translate-y-0.5 hover:bg-[#ffd99b]"
                  >
                    <Mic className="h-4 w-4" />
                    Let it listen
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeDemo}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-6 py-3 text-sm font-bold text-white/72 transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                  Leave
                </button>
              </div>

              <p className="mt-5 rounded-2xl border border-white/10 bg-black/24 p-4 text-sm font-semibold leading-6 text-white/62">
                {statusMessage}
              </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-white/42">
                Esc also exits.
              </p>
            </div>

            <div className="relative min-h-[26rem] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_34px_100px_rgba(0,0,0,0.42)]">
              <div className="absolute left-4 top-4 z-10 rounded-full border border-white/12 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/68 backdrop-blur">
                {status === "listening" ? "Listening locally" : "Just playing"}
              </div>
              <canvas ref={canvasRef} className="h-full min-h-[26rem] w-full" aria-label="Audio reactive visualizer demo" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function GatekptLanding() {
  return (
    <div className="min-h-screen bg-[#080706] text-[#f8f0e5]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-21">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(55,214,255,0.20),transparent_28%),radial-gradient(circle_at_78%_10%,rgba(241,194,125,0.22),transparent_30%),linear-gradient(135deg,#080706_0%,#15120d_46%,#050505_100%)]" />

        <div className="relative mx-auto grid max-w-6xl gap-13 lg:grid-cols-[1fr_0.78fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d] shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#f1c27d]" />
              GateKPT
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
              Music should feel fun again.
            </h1>

            <p className="mt-7 max-w-2xl text-xl leading-8 text-white/76">
              A free place to play with sound, color, ideas, and creative momentum.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#try-visualizer"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#f8f0e5] px-6 py-3 text-sm font-black uppercase tracking-[0.13em] text-[#15120d] shadow-[0_18px_45px_rgba(0,0,0,0.32)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Play with sound
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </a>
              <a
                href="mailto:hello@gatekpt.ai?subject=GateKPT%20MusicOS"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-black/28 px-6 py-3 text-sm font-bold text-white/78 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Say hi
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.6, ease: "easeOut" }}
            className="rounded-[2rem] border border-white/12 bg-black/35 p-5 shadow-[0_34px_100px_rgba(0,0,0,0.42)] backdrop-blur"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">What it feels like</p>
            <h2 className="mt-4 text-3xl font-black leading-none tracking-[-0.055em] text-white">
              A little music lab where sound becomes something you can see.
            </h2>
            <div className="mt-6 grid gap-3">
              {promiseCards.map(([title, detail]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                  <p className="text-sm font-black text-[#f8f0e5]">{title}</p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-white/58">{detail}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#f6f0e7] px-4 py-13 text-[#15120d] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8d5631]">The Idea</p>
            <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.055em] sm:text-5xl">
              Start with joy. Build into power.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {productSteps.map(([number, title, text]) => (
              <article key={title} className="rounded-[1.75rem] border border-[#15120d]/10 bg-white/62 p-6 shadow-[0_18px_55px_rgba(65,48,28,0.10)]">
                <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#15120d] text-sm font-black text-[#f8f0e5]">
                  {number}
                </div>
                <h3 className="text-3xl font-black tracking-[-0.055em]">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#62533f]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PublicVisualizerDemo />

      <section id="why" className="bg-[#11100d] px-4 py-13 text-[#f8f0e5] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[0.8fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-black/40 p-6 sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Why</p>
              <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.055em] sm:text-5xl">
              Music tools should invite people in.
              </h2>
          </div>
          <div className="grid gap-3">
            {[
              "No confusing setup before the first spark.",
              "No scary download just to understand the idea.",
              "The deeper MusicOS can grow after the fun is real.",
            ].map((line) => (
              <div key={line} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm font-semibold leading-6 text-white/72">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1c27d] text-[#15120d]">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f0e7] px-4 pb-16 text-[#15120d] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-[#15120d] p-6 text-[#f8f0e5] shadow-[0_26px_75px_rgba(65,48,28,0.18)] sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">GateKPT</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black leading-none tracking-[-0.055em] sm:text-5xl">
              Free music technology for people who just want to create.
              </h2>
            </div>
            <Music2 className="hidden h-16 w-16 text-[#f1c27d] sm:block" />
          </div>
        </div>
      </section>
    </div>
  );
}
