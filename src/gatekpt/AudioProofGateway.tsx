"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type GatewayData = {
  bpm?: number;
  beat_times: number[];
  downbeat_times: number[];
  energy_curve: { hop_s: number; rms: number[] };
  band_energy: { values: number[][] };
  confidence?: { beats?: number; bpm?: number; downbeats?: number; onsets?: number };
  model_versions?: { analysis?: string; clap?: string };
};

type Telemetry = {
  audio: string;
  bands: string;
  zScore: string;
  zone: string;
  color: string;
};

type FitResult = {
  trainStart: number;
  trainEnd: number;
  holdout: number;
  baseline: number;
  rows: number;
};

const W = 860;
const H = 380;
const LOOP = 60;
const samples = [
  {
    id: "sample-01",
    label: "Sample 01",
    file: "/gateway/gateway_track_alt_mj.audioanalysis.v1.json",
  },
  {
    id: "sample-02",
    label: "Sample 02",
    file: "/gateway/gateway_track.audioanalysis.v1.json",
  },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
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

function fitBeatPhaseModel(data: GatewayData): FitResult {
  const chMax = Array.from({ length: 8 }, (_, channel) =>
    Math.max(...data.band_energy.values.map((row) => row[channel] ?? 0), 0.001),
  );
  const norm = (value: number, channel: number) => clamp(Math.log1p(value) / Math.log1p(chMax[channel]));
  const rows = data.band_energy.values.slice(0, 120).map((row, index) => {
    const bass = (norm(row[0], 0) + norm(row[1], 1)) * 0.5;
    const mids = (norm(row[2], 2) + norm(row[3], 3) + norm(row[4], 4)) / 3;
    const air = (norm(row[5], 5) + norm(row[6], 6) + norm(row[7], 7)) / 3;
    const target = envelopeAt(data.beat_times, index * data.energy_curve.hop_s, 0.06, 0.34);
    return { x: (bass + mids + air) / 3, y: target };
  });
  const split = Math.max(12, Math.floor(rows.length * 0.67));
  const train = rows.slice(0, split);
  const holdout = rows.slice(split);
  let weight = 0;
  let bias = 0;

  const loss = (set: typeof rows, baseline?: number) =>
    set.reduce((sum, row) => {
      const predicted = typeof baseline === "number" ? baseline : sigmoid(weight * row.x + bias);
      return sum + (predicted - row.y) ** 2;
    }, 0) / Math.max(set.length, 1);

  const trainStart = loss(train);
  const learningRate = 0.85;
  for (let epoch = 0; epoch < 120; epoch += 1) {
    let g0 = 0;
    let g1 = 0;
    for (const row of train) {
      const predicted = sigmoid(weight * row.x + bias);
      const common = 2 * (predicted - row.y) * predicted * (1 - predicted);
      g0 += common * row.x;
      g1 += common;
    }
    weight -= (learningRate * g0) / Math.max(train.length, 1);
    bias -= (learningRate * g1) / Math.max(train.length, 1);
  }

  const baseline = train.reduce((sum, row) => sum + row.y, 0) / Math.max(train.length, 1);
  return {
    trainStart,
    trainEnd: loss(train),
    holdout: loss(holdout),
    baseline: loss(holdout, baseline),
    rows: rows.length,
  };
}

function startMachine(
  canvas: HTMLCanvasElement,
  data: GatewayData,
  reduced: boolean,
  activeBands: boolean[],
  audioLabel: string,
  onTelemetry: (telemetry: Telemetry) => void,
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
  let lastTelemetry = 0;

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

    const zone = bass >= mids && bass >= air ? "LEGS" : air >= bass && air >= mids ? "HEAD/HANDS" : "TORSO";
    const hueBase = 184 + 52 * Math.sin(t / 18) + 18 * mids;
    const zScore = (rawRms - rmsMean) / Math.max(rmsStd, 0.001);

    if (typeof performance !== "undefined" && performance.now() - lastTelemetry > 220) {
      lastTelemetry = performance.now();
      onTelemetry({
        audio: audioLabel,
        bands: `${Math.round((bass + mids + air) * 33)}% active`,
        zScore: `${zScore >= 0 ? "+" : ""}${zScore.toFixed(2)}`,
        zone,
        color: `${Math.round(hueBase)}deg`,
      });
    }

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

    g.fillStyle = "rgba(238,240,244,0.42)";
    g.font = "10px monospace";
    g.letterSpacing = "2px";
    g.fillText("AUDIOANALYSIS.V1", 72, 340);
    for (let channel = 0; channel < 8; channel += 1) {
      const value = norm(row[channel], channel);
      const x = 72 + channel * 18;
      g.fillStyle = signalColor(channel * 0.7, 0.26 + value * 0.5);
      g.fillRect(x, 352 - value * 28, 8, Math.max(2, value * 28));
    }
  }

  if (reduced) {
    draw(12);
    return () => {};
  }

  let frameId = 0;
  let t0: number | null = null;
  function frame(now: number) {
    if (t0 === null || now < t0) t0 = now;
    draw(((((now - t0) / 1000) % LOOP) + LOOP) % LOOP);
    frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);

  return () => cancelAnimationFrame(frameId);
}

export function AudioProofGateway() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [missingContract, setMissingContract] = useState(false);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [sampleMeta, setSampleMeta] = useState<{ bpm?: number; confidence?: number }>({});
  const [activeBands, setActiveBands] = useState(() => Array.from({ length: 8 }, () => true));
  const [telemetry, setTelemetry] = useState<Telemetry>({
    audio: "loading",
    bands: "0% active",
    zScore: "+0.00",
    zone: "TORSO",
    color: "184deg",
  });
  const [fitResult, setFitResult] = useState<FitResult | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const sample = samples[sampleIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const currentCanvas = canvas;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cleanup = () => {};
    let cancelled = false;
    setFitResult(null);

    async function loadGateway() {
      try {
        if (typeof window.fetch !== "function") throw new Error("contract file missing");
        const response = await window.fetch(sample.file, { cache: "no-store" });
        if (!response.ok) throw new Error("contract file missing");
        const data = (await response.json()) as GatewayData;
        if (!cancelled) {
          setMissingContract(false);
          setSampleMeta({
            bpm: data.bpm,
            confidence: data.confidence?.beats,
          });
          setFitResult(fitBeatPhaseModel(data));
          const machineCleanup = startMachine(currentCanvas, data, reduced, activeBands, sample.label, setTelemetry);
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
  }, [activeBands, sample.file]);

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
      <audio ref={audioRef} src="/audio/gatekpt-night-guitar-preview.mp3" loop preload="metadata" />
      <section className="gkp-hero">
        <div className="gkp-hero-top">
          <span className="gkp-brand">
            GATE<b>KPT</b>
          </span>
          <span className="gkp-sig">
            <Link href="/">EN</Link> · <Link href="/es">ES</Link>
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
              aria-label="A signal-mapped body moving from audio analysis data."
            />
            {missingContract ? <span className="gkp-contract-missing">contract file missing</span> : null}
          </div>
          <h1 className="gkp-site-line">Sound into signal. Signal into motion.</h1>
          <p className="gkp-site-sub">A song I made, measured into a living data sketch.</p>
          <button type="button" className="gkp-audio-toggle" onClick={toggleAudio} aria-pressed={audioPlaying}>
            {audioPlaying ? "PAUSE ORIGINAL LOOP" : "PLAY ORIGINAL LOOP"}
          </button>
          <div className="gkp-sample-switcher" aria-label="Measured audio samples">
            {samples.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={sampleIndex === index}
                onClick={() => setSampleIndex(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="gkp-band-toggles" aria-label="Band mute toggles">
            {activeBands.map((active, index) => (
              <button
                key={`band-${index}`}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setActiveBands((bands) =>
                    bands.map((bandActive, bandIndex) => (bandIndex === index ? !bandActive : bandActive)),
                  )
                }
              >
                B{index + 1}
              </button>
            ))}
          </div>
          <div className="gkp-signal-chain" aria-label="Live signal chain">
            <span>
              <b>AUDIO</b>
              {telemetry.audio}
            </span>
            <span>
              <b>8 BANDS</b>
              {telemetry.bands}
            </span>
            <span>
              <b>z-SCORE</b>
              {telemetry.zScore}
            </span>
            <span>
              <b>ZONE MAP</b>
              {telemetry.zone}
            </span>
            <span>
              <b>COLOR</b>
              {telemetry.color}
            </span>
          </div>
          <div className="gkp-proof-rail" aria-label="AI and machine learning proof">
            <span>PRETRAINED AUDIO EMBEDDING</span>
            <span>RHYTHM + ENERGY ANALYSIS</span>
            <span>SCHEMA-CHECKED JSON</span>
            {typeof sampleMeta.bpm === "number" ? <span>{sampleMeta.bpm.toFixed(1)} BPM</span> : null}
          </div>
          {fitResult ? (
            <div className="gkp-fit-readout" aria-label="In-browser machine learning fit">
              <span>2-PARAM FIT ON SIGNAL FEATURES</span>
              <span>{fitResult.rows} ROWS</span>
              <span>
                LOSS {fitResult.trainStart.toFixed(3)} -&gt; {fitResult.trainEnd.toFixed(3)}
              </span>
              <span>
                HOLDOUT {fitResult.holdout.toFixed(3)} / BASELINE {fitResult.baseline.toFixed(3)}
              </span>
            </div>
          ) : null}
        </div>

        <nav className="gkp-gates" aria-label="primary">
          <Link className="gkp-gate" href="/notes/music-measured">
            MUSIC MEASURED
          </Link>
          <Link className="gkp-gate" href="/gatekpt">
            AI STACK
          </Link>
          <Link className="gkp-gate" href="/notes">
            THE RECORD
          </Link>
        </nav>

        <p className="gkp-machine-hint">
          <Link href="/notes/music-measured">the thought behind it -&gt;</Link>
        </p>
      </section>

      <footer className="gkp-home-footer">
        <span className="gkp-owner">
          <a href="https://www.linkedin.com/in/marcelozap/">Marcelo Zapata</a>
        </span>
        <span>
          <a href="https://marcelozapata.dev">work -&gt;</a>
        </span>
      </footer>
    </>
  );
}
