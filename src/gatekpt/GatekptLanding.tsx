"use client";

import { motion } from "framer-motion";
import { Mic, Music2, Square, WandSparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type AudioStatus = "preview" | "starting" | "listening" | "blocked" | "unsupported";
type VisualMood = "sunrise" | "club" | "ocean" | "storm";

const moods: Record<VisualMood, { label: string; ink: string; glow: string; accent: string }> = {
  sunrise: { label: "Sunrise", ink: "#fff1c7", glow: "#ff8b45", accent: "#ffd37a" },
  club: { label: "Club", ink: "#f8efff", glow: "#ff3d9a", accent: "#5ff1ff" },
  ocean: { label: "Ocean", ink: "#eaffff", glow: "#15d6ff", accent: "#82ffce" },
  storm: { label: "Storm", ink: "#f4f7ff", glow: "#8aa4ff", accent: "#fff06a" },
};

const productNotes = [
  ["Play", "Open the page and make sound."],
  ["Paint", "The visual reacts and leaves a world behind."],
  ["Build", "MusicOS grows into loops, lyrics, captions, and exports."],
];

function LiveSoundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [status, setStatus] = useState<AudioStatus>("preview");
  const [mood, setMood] = useState<VisualMood>("sunrise");
  const [level, setLevel] = useState(34);

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

      if (canvas.width !== Math.floor(width * pixelRatio) || canvas.height !== Math.floor(height * pixelRatio)) {
        canvas.width = Math.floor(width * pixelRatio);
        canvas.height = Math.floor(height * pixelRatio);
      }

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const analyser = analyserRef.current;
      const bins = new Uint8Array(analyser?.frequencyBinCount || 128);
      const wave = new Uint8Array(analyser?.frequencyBinCount || 128);

      if (analyser) {
        analyser.getByteFrequencyData(bins);
        analyser.getByteTimeDomainData(wave);
      } else {
        const now = performance.now() / 1000;
        for (let index = 0; index < bins.length; index += 1) {
          bins[index] = 38 + Math.round(Math.sin(now * 1.4 + index * 0.2) * 22 + Math.sin(now * 0.42 + index * 0.08) * 18);
          wave[index] = 128 + Math.round(Math.sin(now * 1.9 + index * 0.16) * 30 + Math.sin(now * 0.58 + index * 0.03) * 12);
        }
      }

      const average = bins.reduce((sum, value) => sum + value, 0) / bins.length;
      const pulse = Math.min(1, average / 180);
      const selected = moods[mood];
      setLevel(Math.round(pulse * 100));

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#040302";
      ctx.fillRect(0, 0, width, height);

      const wash = ctx.createRadialGradient(width * 0.5, height * 0.5, 12, width * 0.5, height * 0.5, width * 0.78);
      wash.addColorStop(0, `${selected.ink}${Math.round((0.22 + pulse * 0.46) * 255).toString(16).padStart(2, "0")}`);
      wash.addColorStop(0.42, `${selected.glow}${Math.round((0.22 + pulse * 0.36) * 255).toString(16).padStart(2, "0")}`);
      wash.addColorStop(0.78, `${selected.accent}${Math.round((0.12 + pulse * 0.2) * 255).toString(16).padStart(2, "0")}`);
      wash.addColorStop(1, "rgba(4,3,2,0)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(performance.now() / 18000);
      for (let ring = 0; ring < 8; ring += 1) {
        const radius = 34 + ring * 28 + pulse * 44;
        ctx.beginPath();
        for (let point = 0; point <= 96; point += 1) {
          const angle = (point / 96) * Math.PI * 2;
          const bin = bins[(point * 3 + ring * 7) % bins.length] / 255;
          const warped = radius + Math.sin(angle * (3 + ring) + performance.now() / 900) * 8 + bin * 28;
          const x = Math.cos(angle) * warped;
          const y = Math.sin(angle) * warped;
          if (point === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = ring % 2 === 0 ? `${selected.ink}cc` : `${selected.accent}aa`;
        ctx.lineWidth = 1 + pulse * 2;
        ctx.shadowBlur = 18 + pulse * 34;
        ctx.shadowColor = selected.glow;
        ctx.stroke();
      }
      ctx.restore();

      ctx.beginPath();
      for (let index = 0; index < wave.length; index += 1) {
        const x = (index / (wave.length - 1)) * width;
        const y = height * 0.72 + ((wave[index] - 128) / 128) * (48 + pulse * 70);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = selected.ink;
      ctx.lineWidth = 2 + pulse * 4;
      ctx.shadowBlur = 24 + pulse * 42;
      ctx.shadowColor = selected.glow;
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(render);
    };

    render();
  }, [mood]);

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
      analyser.smoothingTimeConstant = 0.82;
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  useEffect(() => stopAudio, [stopAudio]);

  const helper =
    status === "listening"
      ? `Listening locally. Signal ${level}%.`
      : status === "blocked"
        ? "Mic blocked. Still playable in preview."
        : status === "unsupported"
          ? "Mic unavailable here. Preview still works."
          : status === "starting"
            ? "Starting audio..."
            : "Already moving. Add mic if you want it to follow sound.";

  return (
    <div className="relative overflow-hidden rounded-[2.125rem] border border-white/10 bg-black shadow-[0_34px_100px_rgba(0,0,0,0.48)]">
      <canvas ref={canvasRef} className="h-[32rem] w-full" aria-label="GateKPT live sound canvas" />

      <div className="absolute inset-x-4 top-4 flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-full border border-white/12 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          {status === "listening" ? "Live local audio" : "Visual preview"}
        </div>
        <div className="rounded-full border border-white/12 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          Esc not needed. Just scroll.
        </div>
      </div>

      <div className="absolute inset-x-4 bottom-4 rounded-[1.5rem] border border-white/10 bg-black/62 p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f1c27d]">GateKPT canvas</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-white/68">{helper}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(moods) as VisualMood[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMood(item)}
                className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                  mood === item
                    ? "bg-[#f1c27d] text-[#15120d]"
                    : "border border-white/10 bg-white/[0.06] text-white/64 hover:bg-white/10"
                }`}
              >
                {moods[item].label}
              </button>
            ))}
          </div>

          {status === "listening" || status === "starting" ? (
            <button
              type="button"
              onClick={stopMic}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.07] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/76 transition hover:bg-white/12"
            >
              <Square className="h-4 w-4" />
              Stop mic
            </button>
          ) : (
            <button
              type="button"
              onClick={startMic}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f1c27d] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#15120d] transition hover:-translate-y-0.5 hover:bg-[#ffd99b]"
            >
              <Mic className="h-4 w-4" />
              Let it listen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function GatekptLanding() {
  return (
    <div className="min-h-screen bg-[#070504] text-[#f8f0e5]">
      <section className="relative overflow-hidden px-4 py-13 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,137,72,0.18),transparent_28%),radial-gradient(circle_at_90%_5%,rgba(55,214,255,0.15),transparent_30%),linear-gradient(135deg,#070504_0%,#17100b_48%,#030303_100%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.72fr_1fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d] shadow-sm backdrop-blur">
              <WandSparkles className="h-3.5 w-3.5 text-[#f1c27d]" />
              GateKPT
            </div>

            <h1 className="text-5xl font-black leading-[0.9] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
              Play music like it is paint.
            </h1>

            <p className="mt-6 max-w-xl text-xl leading-8 text-white/74">
              Make noise. Change the mood. Watch sound become a living visual.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {productNotes.map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
                  <p className="text-sm font-black text-[#f1c27d]">{title}</p>
                  <p className="mt-2 text-sm font-semibold leading-5 text-white/58">{text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.6, ease: "easeOut" }}
          >
            <LiveSoundCanvas />
          </motion.div>
        </div>
      </section>

      <section id="try-visualizer" className="bg-[#f6f0e7] px-4 py-13 text-[#15120d] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[0.72fr_1fr]">
          <div className="rounded-[2rem] border border-[#15120d]/10 bg-white/70 p-6 shadow-[0_18px_55px_rgba(65,48,28,0.10)] sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8d5631]">What this is</p>
            <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.055em] sm:text-5xl">
              A free music playground.
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["No account", "Open it and play."],
              ["No upload", "Audio stays in your browser."],
              ["No pressure", "It works even without mic access."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-[1.5rem] border border-[#15120d]/10 bg-[#15120d] p-5 text-[#f8f0e5]">
                <p className="text-sm font-black text-[#f1c27d]">{title}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-white/66">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why" className="bg-[#11100d] px-4 py-13 text-[#f8f0e5] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">MusicOS</p>
            <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.055em] sm:text-5xl">
              The website is the toy. The app becomes the studio.
            </h2>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-8">
            <p className="text-sm font-semibold leading-7 text-white/68">
              GateKPT can grow from this into the real OS: looper capture, lyrics, captions,
              visual paintings, routing memory, and export checklists. The public site should
              make the first spark obvious before anything gets complicated.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f0e7] px-4 pb-16 text-[#15120d] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 rounded-[2rem] bg-[#15120d] p-6 text-[#f8f0e5] shadow-[0_26px_75px_rgba(65,48,28,0.18)] sm:p-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">GateKPT</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black leading-none tracking-[-0.055em] sm:text-5xl">
              Free music technology that feels alive first.
            </h2>
          </div>
          <Music2 className="hidden h-16 w-16 text-[#f1c27d] sm:block" />
        </div>
      </section>
    </div>
  );
}
