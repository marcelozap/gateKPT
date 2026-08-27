"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type GatewayData = {
  duration_s?: number;
  bpm?: number;
  beat_times: number[];
  downbeat_times: number[];
  energy_curve: { hop_s: number; rms: number[] };
  band_energy: { values: number[][] };
  confidence?: { beats?: number; bpm?: number; downbeats?: number; onsets?: number };
  model_versions?: { analysis?: string; clap?: string };
};

const W = 860;
const H = 380;
const SAMPLES = [
  {
    label: "Sample 01",
    contract: "/gateway/xiv_malosound_mix.audioanalysis.v1.json",
    audio: "/audio/xiv-malosound-loop.mp3",
  },
  {
    label: "Sample 02",
    contract: "/gateway/gateway_track.audioanalysis.v1.json",
    audio: "/audio/gatekpt-night-guitar-preview.mp3",
  },
] as const;

const COPY = {
  en: {
    xiv: "XIV",
    malosound: "MALO",
    greenMachine: "GREEN",
    log: "LOG",
    headline: "Sound into signal. Signal into motion.",
    subline: "XIV is the system. MaloSound is the proof. Green Machine is the data lane.",
    start: "START AUDIO",
    stop: "STOP AUDIO",
    missing: "contract file missing",
    aria: "A signal-mapped body moving from audio analysis data.",
    proof: "MOTION MAP",
    lanes: [
      {
        href: "/xiv",
        title: "XIV",
        body: "Role-based AI orchestration for specialist agents, shared timelines, receipts, and real work.",
      },
      {
        href: "/malosound",
        title: "MaloSound",
        body: "Original music, audio analysis, coded rhythm, and visual motion as the first proof of concept.",
      },
      {
        href: "/green-machine",
        title: "Green Machine",
        body: "Data, evidence, and risk review with audit trails and no execution claims.",
      },
    ],
  },
  es: {
    xiv: "XIV",
    malosound: "MALO",
    greenMachine: "GREEN",
    log: "LOG",
    headline: "Sonido en señal. Señal en movimiento.",
    subline: "XIV es el sistema. MaloSound es la prueba. Green Machine es la línea de datos.",
    start: "INICIAR AUDIO",
    stop: "DETENER AUDIO",
    missing: "falta el contrato",
    aria: "Un cuerpo mapeado por señal que se mueve con datos de análisis de audio.",
    proof: "MAPA DE MOVIMIENTO",
    lanes: [
      {
        href: "/xiv",
        title: "XIV",
        body: "Orquestación de IA basada en roles para agentes especialistas, líneas de tiempo compartidas, recibos y trabajo real.",
      },
      {
        href: "/malosound",
        title: "MaloSound",
        body: "Música original, análisis de audio, ritmo en código y movimiento visual como primera prueba de concepto.",
      },
      {
        href: "/green-machine",
        title: "Green Machine",
        body: "Datos, evidencia y revisión de riesgo con auditoría y sin afirmaciones de ejecución.",
      },
    ],
  },
} as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function envelopeAt(times: number[], t: number, attack: number, decay: number) {
  let envelope = 0;
  for (const time of times) {
    const delta = t - time;
    if (delta >= 0 && delta < decay) envelope = Math.max(envelope, 1 - delta / decay);
    else if (delta < 0 && -delta < attack) envelope = Math.max(envelope, 0.25 * (1 + delta / attack));
  }
  return envelope;
}

function startMachine(
  canvas: HTMLCanvasElement,
  data: GatewayData,
  reduced: boolean,
  activeBands: boolean[],
  getAudioTime: () => number | null,
  proofLabel: string,
) {
  const context = canvas.getContext("2d");
  if (!context) return null;
  const g: CanvasRenderingContext2D = context;

  const chMax = Array.from({ length: 8 }, (_, channel) =>
    Math.max(...data.band_energy.values.map((row) => row[channel] ?? 0), 0.001),
  );
  const norm = (value: number, channel: number) => clamp(Math.log1p(value) / Math.log1p(chMax[channel]));
  const rmsMax = Math.max(...data.energy_curve.rms, 0.001);
  const rmsMean = data.energy_curve.rms.reduce((sum, value) => sum + value, 0) / Math.max(data.energy_curve.rms.length, 1);
  const rmsStd = Math.sqrt(
    data.energy_curve.rms.reduce((sum, value) => sum + (value - rmsMean) ** 2, 0) /
      Math.max(data.energy_curve.rms.length, 1),
  );
  const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
  const loop = Math.max(1, Math.min(data.duration_s ?? 60, data.energy_curve.rms.length * data.energy_curve.hop_s));

  function envAt(times: number[], t: number, attack: number, decay: number) {
    return envelopeAt(times, t, attack, decay);
  }

  function rowAt(t: number) {
    const x = t / data.energy_curve.hop_s;
    const i = Math.min(data.band_energy.values.length - 1, Math.max(0, Math.floor(x)));
    const j = Math.min(data.band_energy.values.length - 1, i + 1);
    const f = x - i;
    return data.band_energy.values[i].map((value, channel) => value * (1 - f) + data.band_energy.values[j][channel] * f);
  }

  function draw(t: number) {
    const beatE = envAt(data.beat_times, t, 0.06, 0.34);
    const downE = envAt(data.downbeat_times, t, 0.08, 0.55);
    const ri = Math.min(data.energy_curve.rms.length - 1, Math.max(0, t / data.energy_curve.hop_s));
    const rawRms =
      lerp(
        data.energy_curve.rms[Math.floor(ri)],
        data.energy_curve.rms[Math.min(data.energy_curve.rms.length - 1, Math.ceil(ri))],
        ri % 1,
      );
    const rms = rawRms / rmsMax;
    const row = rowAt(t).map((value, channel) => (activeBands[channel] ? value : 0));
    const bass = clamp((norm(row[0], 0) + norm(row[1], 1)) * 0.5);
    const mids = clamp((norm(row[2], 2) + norm(row[3], 3) + norm(row[4], 4)) / 3);
    const air = clamp((norm(row[5], 5) + norm(row[6], 6) + norm(row[7], 7)) / 3);
    const pulse = clamp(beatE * 0.65 + downE * 0.25 + rms * 0.35);
    const zScore = clamp((rawRms - rmsMean) / Math.max(rmsStd, 0.001), -1, 3);
    const motionScore = clamp(0.42 * bass + 0.34 * mids + 0.24 * air + 0.22 * pulse);

    g.clearRect(0, 0, W, H);

    const glow = g.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, 330);
    glow.addColorStop(0, `rgba(143,240,255,${0.08 + 0.16 * rms + 0.1 * downE})`);
    glow.addColorStop(1, "rgba(143,240,255,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, W, H);

    g.strokeStyle = `rgba(143,240,255,${0.08 + 0.18 * pulse})`;
    g.lineWidth = 1;
    for (let line = 0; line < 9; line += 1) {
      const y = 62 + line * 28 + Math.sin(t * 0.4 + line) * 4;
      g.beginPath();
      g.moveTo(86, y);
      g.bezierCurveTo(260, y + 18 * Math.sin(t / 3 + line), 570, y - 22 * Math.cos(t / 4 + line), 774, y);
      g.stroke();
    }

    const cx = W / 2 + Math.sin(t * 1.1) * (10 + 15 * mids);
    const floor = 314;
    const bounce = 10 * beatE + 7 * bass + 3 * Math.sin(t * 2.2);
    const shoulderY = 148 - bounce;
    const hipY = 232 - bounce * 0.45;
    const yaw = Math.sin(t * 1.35) * 0.28 + (mids - 0.5) * 0.18;
    const reach = 36 + 30 * air + 22 * beatE;
    const step = Math.sin(t * 1.95);
    const twist = Math.sin(t * 1.55 + bass) * (18 + 22 * pulse);

    const head = { x: cx + yaw * 18, y: 82 - bounce * 0.65 };
    const neck = { x: cx + yaw * 8, y: 116 - bounce * 0.55 };
    const chest = { x: cx + yaw * 18, y: shoulderY };
    const waist = { x: cx - yaw * 22, y: 194 - bounce * 0.35 };
    const hips = { x: cx - yaw * 34, y: hipY };
    const lShoulder = { x: chest.x - 54 - twist * 0.16, y: shoulderY + 4 };
    const rShoulder = { x: chest.x + 54 - twist * 0.16, y: shoulderY - 2 };
    const lElbow = { x: lShoulder.x - reach * 0.52, y: 166 - bounce - 32 * Math.sin(t * 1.7) };
    const rElbow = { x: rShoulder.x + reach * 0.56, y: 162 - bounce + 28 * Math.cos(t * 1.55) };
    const lHand = { x: lElbow.x - 20 - 18 * air, y: lElbow.y + 44 + 16 * beatE };
    const rHand = { x: rElbow.x + 22 + 18 * air, y: rElbow.y + 38 - 20 * downE };
    const lKnee = { x: hips.x - 42 - 25 * step, y: 262 - bounce * 0.2 + 8 * bass };
    const rKnee = { x: hips.x + 42 + 24 * step, y: 260 - bounce * 0.2 - 9 * bass };
    const lFoot = { x: lKnee.x - 18 + 22 * Math.cos(t * 1.2), y: floor - 6 * beatE };
    const rFoot = { x: rKnee.x + 22 + 18 * Math.sin(t * 1.25), y: floor - 10 * downE };

    function signalColor(offset: number, alpha = 0.9) {
      const hue = 184 + 52 * Math.sin(t / 18 + offset) + 18 * mids;
      const light = 58 + 10 * pulse;
      return `hsla(${hue}, 88%, ${light}%, ${alpha})`;
    }

    function limb(a: { x: number; y: number }, b: { x: number; y: number }, width: number, offset: number) {
      g.lineCap = "round";
      g.lineJoin = "round";
      g.shadowBlur = 18 + 18 * pulse;
      g.shadowColor = signalColor(offset, 0.45);
      g.strokeStyle = signalColor(offset, 0.84);
      g.lineWidth = width;
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.stroke();
      g.shadowBlur = 0;
      g.strokeStyle = "rgba(238,240,244,0.12)";
      g.lineWidth = Math.max(1, width * 0.16);
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.stroke();
    }

    function joint(p: { x: number; y: number }, radius: number, offset: number) {
      g.beginPath();
      g.arc(p.x, p.y, radius, 0, Math.PI * 2);
      g.fillStyle = signalColor(offset, 0.86);
      g.shadowBlur = 14 + 10 * pulse;
      g.shadowColor = signalColor(offset, 0.55);
      g.fill();
      g.shadowBlur = 0;
    }

    limb(neck, chest, 20, 0.1);
    limb(chest, waist, 42, 0.6);
    limb(waist, hips, 46, 1.1);
    limb(lShoulder, lElbow, 18, 1.8);
    limb(lElbow, lHand, 14, 2.2);
    limb(rShoulder, rElbow, 18, 2.6);
    limb(rElbow, rHand, 14, 3.1);
    limb(hips, lKnee, 24, 3.6);
    limb(lKnee, lFoot, 18, 4.1);
    limb(hips, rKnee, 24, 4.5);
    limb(rKnee, rFoot, 18, 5);

    g.beginPath();
    g.ellipse(head.x, head.y, 27 + 3 * downE, 32 + 3 * beatE, yaw, 0, Math.PI * 2);
    g.fillStyle = signalColor(5.4, 0.86);
    g.shadowBlur = 22 + 16 * pulse;
    g.shadowColor = signalColor(5.4, 0.5);
    g.fill();
    g.shadowBlur = 0;

    for (let slice = 0; slice < 15; slice += 1) {
      const f = slice / 14;
      const y = 91 + f * 196 - bounce * (0.6 - f * 0.25);
      const width = 32 + Math.sin(f * Math.PI) * 95 * (0.72 + 0.22 * mids);
      const x = cx + Math.sin(t * 0.9 + f * 3.2) * (8 + 14 * pulse) + (0.5 - f) * twist;
      g.beginPath();
      g.ellipse(x, y, width * 0.5, 2.8 + 2 * pulse, yaw * 0.7, 0, Math.PI * 2);
      g.strokeStyle = signalColor(f * 6, 0.18 + 0.42 * (1 - Math.abs(f - 0.5)));
      g.lineWidth = 1.4;
      g.stroke();
    }

    for (const [index, point] of [neck, chest, waist, hips, lHand, rHand, lFoot, rFoot].entries()) {
      joint(point, index < 4 ? 4.5 : 5.8, index * 0.75);
    }

    const barsX = 74;
    const barsY = 318;
    g.font = "700 9px monospace";
    g.fillStyle = "rgba(238,240,244,0.34)";
    g.fillText(proofLabel, barsX, barsY - 13);
    row.slice(0, 8).forEach((value, channel) => {
      const h = 9 + norm(value, channel) * 34;
      const x = barsX + channel * 17;
      g.fillStyle = activeBands[channel]
        ? `hsla(${188 + channel * 13}, 88%, ${54 + motionScore * 22}%, 0.76)`
        : "rgba(238,240,244,0.1)";
      g.fillRect(x, barsY - h, 8, h);
    });
    g.fillStyle = "rgba(143,240,255,0.5)";
    g.fillText(`MOTION ${Math.round(motionScore * 100).toString().padStart(2, "0")}`, 666, 322);
    g.fillStyle = "rgba(245,184,75,0.42)";
    g.fillText(`Z ${zScore.toFixed(2)}`, 666, 340);
  }

  if (reduced) {
    draw(12);
    return () => {};
  }

  let frameId = 0;
  let t0: number | null = null;
  function frame(now: number) {
    if (t0 === null || now < t0) t0 = now;
    const audioTime = getAudioTime();
    const phase = audioTime ?? (now - t0) / 1000;
    draw((((phase % loop) + loop) % loop));
    frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);

  return () => cancelAnimationFrame(frameId);
}

export function AudioProofGateway({ locale = "en" }: { locale?: "en" | "es" }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [missingContract, setMissingContract] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [activeBands, setActiveBands] = useState(() => Array.from({ length: 8 }, () => true));
  const copy = COPY[locale];
  const sample = SAMPLES[sampleIndex] ?? SAMPLES[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const currentCanvas = canvas;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cleanup = () => {};
    let cancelled = false;

    async function loadGateway() {
      try {
        if (typeof window.fetch !== "function") throw new Error("contract file missing");
        const response = await window.fetch(sample.contract, { cache: "no-store" });
        if (!response.ok) throw new Error("contract file missing");
        const data = (await response.json()) as GatewayData;
        if (!cancelled) {
          setMissingContract(false);
          const machineCleanup = startMachine(
            currentCanvas,
            data,
            reduced,
            activeBands,
            () => {
              const audio = audioRef.current;
              return audio && !audio.paused ? audio.currentTime : null;
            },
            copy.proof,
          );
          if (machineCleanup) cleanup = machineCleanup;
          else setMissingContract(true);
        }
      } catch {
        if (!cancelled) setMissingContract(true);
        const g = currentCanvas.getContext("2d");
        if (!g) return;
        g.clearRect(0, 0, W, H);
      }
    }

    void loadGateway();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [activeBands, copy.proof, sample.contract]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setAudioPlaying(false);
  }, [sample.audio]);

  async function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play();
      setAudioPlaying(true);
    } else {
      audio.pause();
      setAudioPlaying(false);
    }
  }

  return (
    <>
      <audio ref={audioRef} src={sample.audio} loop preload="metadata" />
      <section className="gkp-hero">
        <div className="gkp-hero-top">
          <span className="gkp-brand">
            <b>XIV</b>
          </span>
          <span className="gkp-sig">
            <Link href="/">EN</Link> · <Link href="/es">ES</Link> · <Link href="/xiv">{copy.xiv}</Link> ·{" "}
            <Link href="/malosound">{copy.malosound}</Link> · <Link href="/green-machine">{copy.greenMachine}</Link>
          </span>
        </div>

        <div className="gkp-stage-wrap">
          <div className="gkp-machine-frame">
            <canvas
              ref={canvasRef}
              id="machine"
              width={W}
              height={H}
              role="img"
              aria-label={copy.aria}
            />
            {missingContract ? <span className="gkp-contract-missing">{copy.missing}</span> : null}
          </div>
          <div className="gkp-sample-switcher" aria-label="Motion samples">
            {SAMPLES.map((option, index) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={sampleIndex === index}
                onClick={() => setSampleIndex(index)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="gkp-band-toggles" aria-label="Audio bands mapped to motion">
            {activeBands.map((active, index) => (
              <button
                key={index}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setActiveBands((bands) => bands.map((band, bandIndex) => (bandIndex === index ? !band : band)))
                }
              >
                B{index + 1}
              </button>
            ))}
          </div>
          <h1 className="gkp-site-line">{copy.headline}</h1>
          <p className="gkp-site-sub">{copy.subline}</p>
          <button type="button" className="gkp-audio-toggle" onClick={toggleAudio} aria-pressed={audioPlaying}>
            <span className="gkp-audio-icon" aria-hidden="true" />
            <span>{audioPlaying ? copy.stop : copy.start}</span>
          </button>
          <div className="gkp-ecosystem" aria-label="XIV ecosystem">
            {copy.lanes.map((lane) => (
              <Link key={lane.href} href={lane.href} className="gkp-lane">
                <span>{lane.title}</span>
                <p>{lane.body}</p>
              </Link>
            ))}
          </div>
        </div>

        <nav className="gkp-gates" aria-label="XIV sections">
          <Link className="gkp-gate" href={locale === "es" ? "/es/log/coding-beats" : "/log/coding-beats"}>
            CODING BEATS
          </Link>
          <Link className="gkp-gate" href={locale === "es" ? "/es/log" : "/log"}>
            {copy.log}
          </Link>
        </nav>
      </section>

      <footer className="gkp-home-footer">
        <span className="gkp-owner">
          <a href="https://www.linkedin.com/in/marcelozap/">Marcelo Zapata</a>
        </span>
      </footer>
    </>
  );
}
