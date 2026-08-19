"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { danceCopy, type DanceLocale } from "./strings";
import styles from "./dance.module.css";

const CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const BPM = 112;
const BEAT = 60 / BPM;
const ROUND_BEATS = 48;
const SPAWN_EVERY = 2; // beats
const LEAD_BEATS = 2; // ring appears this many beats before its hit beat
const HIT_RADIUS = 0.085; // normalized to stage min-dimension
const WIN_PERFECT = 0.09;
const WIN_GOOD = 0.18;
const WIN_LATE = 0.3;

type Phase = "boot" | "loading" | "denied" | "calibrate" | "count" | "play" | "pause" | "done";
type InputMode = "camera" | "pointer";
type Judgment = "perfect" | "good" | "late" | "miss";

type Target = {
  id: number;
  x: number; // 0..1, stage space (already mirrored)
  y: number;
  beat: number; // absolute beat index it should be hit on
  judged: Judgment | null;
  flashAt: number | null; // audio time when judged
};

type Landmark = { x: number; y: number; visibility?: number };
type Point = { x: number; y: number };

type LeadPose = {
  head: Point;
  neck: Point;
  shoulderLeft: Point;
  shoulderRight: Point;
  elbowLeft: Point;
  elbowRight: Point;
  handLeft: Point;
  handRight: Point;
  hipLeft: Point;
  hipRight: Point;
  kneeLeft: Point;
  kneeRight: Point;
  footLeft: Point;
  footRight: Point;
};

type LeadCue = Point & { progress: number };

type PoseLandmarkerLike = {
  detectForVideo: (video: HTMLVideoElement, ts: number) => { landmarks: Landmark[][] };
  close: () => void;
};

type VisionModule = {
  FilesetResolver: { forVisionTasks: (path: string) => Promise<unknown> };
  PoseLandmarker: {
    createFromOptions: (
      fileset: unknown,
      options: {
        baseOptions: { modelAssetPath: string; delegate?: string };
        runningMode: string;
        numPoses: number;
      },
    ) => Promise<PoseLandmarkerLike>;
  };
};

declare global {
  interface Window {
    __gkdVision?: VisionModule;
  }
}

const CONNECTIONS: Array<[number, number]> = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
];

/** Deterministic position for target n — no Math.random, stable per round. */
function targetSpot(n: number): { x: number; y: number } {
  const h = Math.sin(n * 12.9898) * 43758.5453;
  const f = h - Math.floor(h);
  const side = n % 2 === 0 ? 0 : 1; // alternate left / right half
  return {
    x: 0.12 + side * 0.5 + f * 0.26,
    y: 0.2 + ((n * 0.37 + f) % 1) * 0.5,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** A small, deterministic choreography so the performer always has a body to follow. */
function leadDancerPose(beat: number, cue: LeadCue | null): LeadPose {
  const groove = Math.sin((beat * Math.PI) / 2);
  const sway = Math.sin((beat * Math.PI) / 4) * 0.035;
  const bounce = Math.abs(Math.sin(beat * Math.PI)) * 0.018;
  const cx = 0.5 + sway;
  const shoulderY = 0.36 - bounce;
  const hipY = 0.64 - bounce * 0.45;
  const leftHand = { x: cx - 0.28, y: 0.53 + groove * 0.035 };
  const rightHand = { x: cx + 0.28, y: 0.53 - groove * 0.035 };

  if (cue) {
    const eased = cue.progress * cue.progress * (3 - 2 * cue.progress);
    if (cue.x < 0.5) {
      leftHand.x += (cue.x - leftHand.x) * eased;
      leftHand.y += (cue.y - leftHand.y) * eased;
    } else {
      rightHand.x += (cue.x - rightHand.x) * eased;
      rightHand.y += (cue.y - rightHand.y) * eased;
    }
  }

  return {
    head: { x: cx + sway * 0.25, y: 0.19 - bounce * 0.35 },
    neck: { x: cx, y: 0.29 - bounce },
    shoulderLeft: { x: cx - 0.09, y: shoulderY },
    shoulderRight: { x: cx + 0.09, y: shoulderY },
    elbowLeft: { x: cx - 0.2 - groove * 0.018, y: 0.47 + groove * 0.025 },
    elbowRight: { x: cx + 0.2 + groove * 0.018, y: 0.47 - groove * 0.025 },
    handLeft: leftHand,
    handRight: rightHand,
    hipLeft: { x: cx - 0.065, y: hipY },
    hipRight: { x: cx + 0.065, y: hipY },
    kneeLeft: { x: cx - 0.11 + groove * 0.025, y: 0.79 - bounce * 0.25 },
    kneeRight: { x: cx + 0.11 - groove * 0.025, y: 0.79 - bounce * 0.25 },
    footLeft: { x: cx - 0.14 - groove * 0.02, y: 0.96 },
    footRight: { x: cx + 0.14 + groove * 0.02, y: 0.96 },
  };
}

function drawSegment(
  g: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  width: number,
  color: string,
  W: number,
  H: number,
): void {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(a.x * W, a.y * H);
  g.lineTo(b.x * W, b.y * H);
  g.stroke();
}

function drawPolygon(
  g: CanvasRenderingContext2D,
  points: Point[],
  fill: string,
  stroke: string,
  lineWidth: number,
  W: number,
  H: number,
): void {
  if (points.length < 3) return;
  g.beginPath();
  g.moveTo(points[0].x * W, points[0].y * H);
  for (const point of points.slice(1)) g.lineTo(point.x * W, point.y * H);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = stroke;
  g.lineWidth = lineWidth;
  g.stroke();
}

function drawDiamond(
  g: CanvasRenderingContext2D,
  point: Point,
  size: number,
  fill: string,
  W: number,
  H: number,
): void {
  drawPolygon(
    g,
    [
      { x: point.x, y: point.y - size },
      { x: point.x + size, y: point.y },
      { x: point.x, y: point.y + size },
      { x: point.x - size, y: point.y },
    ],
    fill,
    fill,
    1,
    W,
    H,
  );
}

function drawLeadDancer(
  g: CanvasRenderingContext2D,
  pose: LeadPose,
  W: number,
  H: number,
  minDim: number,
  cyan: string,
  magenta: string,
  pulse: number,
): void {
  const core = `rgba(125, 249, 255, ${0.52 + pulse * 0.16})`;
  const suit = `rgba(4, 16, 25, ${0.78 + pulse * 0.08})`;
  const panel = `rgba(125, 249, 255, ${0.09 + pulse * 0.06})`;
  const joint = `rgba(228, 253, 255, ${0.72 + pulse * 0.18})`;
  const limbLinks: Array<[Point, Point]> = [
    [pose.shoulderLeft, pose.elbowLeft], [pose.elbowLeft, pose.handLeft],
    [pose.shoulderRight, pose.elbowRight], [pose.elbowRight, pose.handRight],
    [pose.hipLeft, pose.kneeLeft], [pose.kneeLeft, pose.footLeft],
    [pose.hipRight, pose.kneeRight], [pose.kneeRight, pose.footRight],
  ];
  const headRadiusX = minDim * 0.045 / W;
  const headRadiusY = minDim * 0.045 / H;
  const head = pose.head;
  const torso = [
    pose.shoulderLeft,
    { x: pose.shoulderLeft.x + 0.035, y: pose.neck.y + 0.01 },
    { x: pose.shoulderRight.x - 0.035, y: pose.neck.y + 0.01 },
    pose.shoulderRight,
    { x: pose.hipRight.x + 0.045, y: pose.hipRight.y - 0.015 },
    pose.hipRight,
    pose.hipLeft,
    { x: pose.hipLeft.x - 0.045, y: pose.hipLeft.y - 0.015 },
  ];

  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.globalAlpha = 0.92;

  // A light-traced synthetic body: magenta sits underneath the cyan core as a
  // small XIV accent, while the torso carries the actual visual weight.
  for (const [a, b] of limbLinks) {
    drawSegment(g, a, b, Math.max(8, minDim * 0.035), `rgba(226, 107, 210, ${0.18 + pulse * 0.08})`, W, H);
    drawSegment(g, a, b, Math.max(3, minDim * 0.014), core, W, H);
  }
  drawPolygon(g, torso, suit, core, Math.max(1, minDim * 0.005), W, H);
  drawSegment(g, pose.neck, { x: head.x, y: head.y + headRadiusY * 1.35 }, Math.max(4, minDim * 0.018), core, W, H);

  const chest = [
    { x: head.x, y: pose.neck.y + 0.035 },
    { x: pose.shoulderRight.x - 0.035, y: pose.shoulderRight.y + 0.02 },
    { x: pose.hipRight.x - 0.01, y: pose.hipRight.y - 0.05 },
    { x: pose.hipLeft.x + 0.01, y: pose.hipLeft.y - 0.05 },
    { x: pose.shoulderLeft.x + 0.035, y: pose.shoulderLeft.y + 0.02 },
  ];
  drawPolygon(g, chest, panel, `rgba(125, 249, 255, ${0.34 + pulse * 0.1})`, 1, W, H);
  drawSegment(g, { x: head.x - 0.035, y: pose.neck.y + 0.07 }, { x: head.x + 0.035, y: pose.neck.y + 0.07 }, 1.5, magenta, W, H);

  const headPolygon = Array.from({ length: 6 }, (_, i) => {
    const angle = Math.PI / 6 + (i * Math.PI) / 3;
    return { x: head.x + Math.cos(angle) * headRadiusX, y: head.y + Math.sin(angle) * headRadiusY };
  });
  drawPolygon(g, headPolygon, suit, core, Math.max(1, minDim * 0.005), W, H);
  drawSegment(
    g,
    { x: head.x - headRadiusX * 0.7, y: head.y + headRadiusY * 0.08 },
    { x: head.x + headRadiusX * 0.7, y: head.y + headRadiusY * 0.08 },
    Math.max(3, minDim * 0.012),
    magenta,
    W,
    H,
  );
  drawSegment(
    g,
    { x: head.x - headRadiusX * 0.5, y: head.y + headRadiusY * 0.08 },
    { x: head.x + headRadiusX * 0.5, y: head.y + headRadiusY * 0.08 },
    Math.max(1, minDim * 0.004),
    "#f4efe4",
    W,
    H,
  );

  for (const point of [pose.shoulderLeft, pose.shoulderRight, pose.hipLeft, pose.hipRight]) {
    drawDiamond(g, point, Math.max(0.006, minDim * 0.009 / Math.max(W, H)), joint, W, H);
  }
  for (const point of [pose.elbowLeft, pose.elbowRight, pose.kneeLeft, pose.kneeRight]) {
    drawDiamond(g, point, Math.max(0.005, minDim * 0.007 / Math.max(W, H)), core, W, H);
  }
  for (const point of [pose.handLeft, pose.handRight, pose.footLeft, pose.footRight]) {
    g.fillStyle = joint;
    g.beginPath();
    g.arc(point.x * W, point.y * H, Math.max(3, minDim * 0.008), 0, Math.PI * 2);
    g.fill();
  }

  g.globalAlpha = 0.18 + pulse * 0.12;
  g.strokeStyle = cyan;
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(
    ((pose.footLeft.x + pose.footRight.x) / 2) * W,
    0.98 * H,
    minDim * (0.19 + pulse * 0.035),
    minDim * 0.018,
    0,
    0,
    Math.PI * 2,
  );
  g.stroke();
  g.restore();
}

function drawVisualizer(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  minDim: number,
  beat: number,
  energy: number,
  cyan: string,
  magenta: string,
): void {
  const phase = ((beat % 1) + 1) % 1;
  const beatPulse = Math.pow(1 - phase, 3);
  const pulse = clamp(energy * 0.8 + beatPulse * 0.32, 0, 1);
  const centerX = W * 0.5;
  const centerY = H * 0.52;

  g.save();
  g.fillStyle = `rgba(2, 5, 12, ${0.42 + pulse * 0.1})`;
  g.fillRect(0, 0, W, H);

  const glow = g.createRadialGradient(centerX, centerY, 0, centerX, centerY, minDim * (0.65 + pulse * 0.22));
  glow.addColorStop(0, `rgba(34, 211, 238, ${0.12 + pulse * 0.12})`);
  glow.addColorStop(0.55, `rgba(34, 211, 238, ${0.035 + pulse * 0.035})`);
  glow.addColorStop(1, "rgba(2, 5, 12, 0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  g.globalAlpha = 0.22 + pulse * 0.18;
  g.strokeStyle = cyan;
  g.lineWidth = 1;
  for (let i = 0; i < 9; i += 1) {
    const radius = minDim * (0.16 + i * 0.1 + beatPulse * 0.045);
    g.beginPath();
    g.ellipse(centerX, centerY, radius * 1.25, radius * 0.58, 0, 0, Math.PI * 2);
    g.stroke();
  }

  g.globalAlpha = 0.16 + pulse * 0.12;
  g.strokeStyle = magenta;
  for (let i = 0; i < 7; i += 1) {
    const x = ((i + 1) / 8) * W;
    g.beginPath();
    g.moveTo(x, H);
    g.lineTo(centerX + (x - centerX) * (0.24 + pulse * 0.08), centerY);
    g.stroke();
  }
  g.restore();
}

function loadVisionModule(): Promise<VisionModule> {
  return new Promise((resolve, reject) => {
    if (window.__gkdVision) {
      resolve(window.__gkdVision);
      return;
    }
    const code =
      `import { FilesetResolver, PoseLandmarker } from "${CDN}/vision_bundle.mjs";` +
      `window.__gkdVision = { FilesetResolver, PoseLandmarker };` +
      `window.dispatchEvent(new Event("gkd-vision-ready"));`;
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const script = document.createElement("script");
    script.type = "module";
    script.src = url;
    const timeout = window.setTimeout(() => reject(new Error("vision load timeout")), 20000);
    window.addEventListener(
      "gkd-vision-ready",
      () => {
        window.clearTimeout(timeout);
        URL.revokeObjectURL(url);
        if (window.__gkdVision) resolve(window.__gkdVision);
        else reject(new Error("vision module missing"));
      },
      { once: true },
    );
    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("vision script failed"));
    };
    document.head.appendChild(script);
  });
}

export function DanceLab({ locale = "en" }: { locale?: DanceLocale }) {
  const copy = danceCopy[locale];
  const [phase, setPhase] = useState<Phase>("boot");
  const [inputMode, setInputMode] = useState<InputMode>("camera");
  const [loadStep, setLoadStep] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [judgments, setJudgments] = useState<Record<Judgment, number>>({
    perfect: 0, good: 0, late: 0, miss: 0,
  });
  const [flash, setFlash] = useState<Judgment | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarkerLike | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const spectrumRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0); // audio time of beat 0
  const scheduledToRef = useRef(0); // last 16th scheduled (index)
  const targetsRef = useRef<Target[]>([]);
  const wristsRef = useRef<Array<{ x: number; y: number }>>([]);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const calibrateFramesRef = useRef(0);
  const phaseRef = useRef<Phase>("boot");
  const comboRef = useRef(0);
  const inputModeRef = useRef<InputMode>("camera");
  const poseRef = useRef<Landmark[] | null>(null);
  const tickRef = useRef<() => void>(() => {});

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // ---------------------------------------------------------------- audio
  const scheduleSixteenth = useCallback((ctx: AudioContext, i: number, t: number) => {
    const master = 0.5;
    if (i % 4 === 0) {
      // kick on quarters
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(48, t + 0.11);
      g.gain.setValueAtTime(0.9 * master, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      o.connect(g).connect(analyserRef.current ?? ctx.destination);
      o.start(t);
      o.stop(t + 0.14);
    }
    if (i % 4 === 2) {
      // offbeat hat
      const len = Math.floor(ctx.sampleRate * 0.04);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let k = 0; k < len; k++) d[k] = (((k * 1103515245 + 12345) % 2048) / 1024 - 1) * (1 - k / len);
      const s = ctx.createBufferSource();
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 8000;
      const g = ctx.createGain();
      g.gain.value = 0.22 * master;
      s.buffer = buf;
      s.connect(hp).connect(g).connect(analyserRef.current ?? ctx.destination);
      s.start(t);
    }
    if (i % 16 === 4 || i % 16 === 12) {
      // clap on 2 and 4
      const len = Math.floor(ctx.sampleRate * 0.09);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let k = 0; k < len; k++) d[k] = (((k * 48271 + 7) % 4096) / 2048 - 1) * Math.pow(1 - k / len, 2);
      const s = ctx.createBufferSource();
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1800;
      bp.Q.value = 0.9;
      const g = ctx.createGain();
      g.gain.value = 0.4 * master;
      s.buffer = buf;
      s.connect(bp).connect(g).connect(analyserRef.current ?? ctx.destination);
      s.start(t);
    }
    if (i % 2 === 0) {
      // eighth-note bass, A1 root pattern
      const steps = [0, 0, 7, 0, 10, 0, 7, 5];
      const semi = steps[(i / 2) % 8];
      const freq = 55 * Math.pow(2, semi / 12);
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = freq;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 320;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.28 * master, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + BEAT / 2 - 0.02);
      o.connect(lp).connect(g).connect(analyserRef.current ?? ctx.destination);
      o.start(t);
      o.stop(t + BEAT / 2);
    }
  }, []);

  const startClock = useCallback((leadInBeats: number) => {
    const ctx = audioRef.current ?? new AudioContext();
    audioRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.78;
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;
    spectrumRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
    void ctx.resume();
    startTimeRef.current = ctx.currentTime + leadInBeats * BEAT;
    scheduledToRef.current = -leadInBeats * 4;
    if (schedulerRef.current !== null) window.clearInterval(schedulerRef.current);
    schedulerRef.current = window.setInterval(() => {
      const horizon = ctx.currentTime + 0.14;
      let i = scheduledToRef.current;
      while (startTimeRef.current + (i / 4) * BEAT < horizon) {
        const t = startTimeRef.current + (i / 4) * BEAT;
        if (t >= ctx.currentTime - 0.01 && i < ROUND_BEATS * 4) scheduleSixteenth(ctx, ((i % 16) + 16) % 16, t);
        i += 1;
      }
      scheduledToRef.current = i;
    }, 25);
  }, [scheduleSixteenth]);

  const stopEverything = useCallback(() => {
    if (schedulerRef.current !== null) window.clearInterval(schedulerRef.current);
    schedulerRef.current = null;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    spectrumRef.current = null;
    void audioRef.current?.close();
    audioRef.current = null;
  }, []);

  useEffect(() => stopEverything, [stopEverything]);

  // ---------------------------------------------------------------- game
  const beatNow = useCallback(() => {
    const ctx = audioRef.current;
    if (!ctx) return -Infinity;
    return (ctx.currentTime - startTimeRef.current) / BEAT;
  }, []);

  const judge = useCallback((target: Target, offsetSeconds: number) => {
    const abs = Math.abs(offsetSeconds);
    let j: Judgment;
    if (abs <= WIN_PERFECT) j = "perfect";
    else if (abs <= WIN_GOOD) j = "good";
    else j = "late";
    target.judged = j;
    target.flashAt = audioRef.current?.currentTime ?? 0;
    const points = j === "perfect" ? 100 : j === "good" ? 60 : 20;
    const nextCombo = j === "late" ? 0 : comboRef.current + 1;
    comboRef.current = nextCombo;
    setCombo(nextCombo);
    setBestCombo((b) => Math.max(b, nextCombo));
    setScore((s) => s + Math.round(points * (1 + nextCombo * 0.1)));
    setJudgments((jj) => ({ ...jj, [j]: jj[j] + 1 }));
    setFlash(j);
  }, []);

  const missTarget = useCallback((target: Target) => {
    target.judged = "miss";
    target.flashAt = audioRef.current?.currentTime ?? 0;
    comboRef.current = 0;
    setCombo(0);
    setJudgments((jj) => ({ ...jj, miss: jj.miss + 1 }));
    setFlash("miss");
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const rect = stage.getBoundingClientRect();
    if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
    }
    const g = canvas.getContext("2d");
    if (!g) return;
    const W = canvas.width;
    const H = canvas.height;
    if (W <= 0 || H <= 0) return;
    const minDim = Math.min(W, H);
    g.clearRect(0, 0, W, H);

    const styleVars = getComputedStyle(stage);
    const cyan = styleVars.getPropertyValue("--visor").trim() || "#8ff0ff";
    const amber = styleVars.getPropertyValue("--amber").trim() || "#f5b84b";
    const ink = styleVars.getPropertyValue("--ink").trim() || "#f4efe4";
    const magenta = "#e26bd2";
    const beat = beatNow();
    const visualBeat = Number.isFinite(beat) ? beat : 0;
    let energy = 0;
    const analyser = analyserRef.current;
    const spectrum = spectrumRef.current;
    if (analyser && spectrum) {
      analyser.getByteFrequencyData(spectrum);
      let total = 0;
      for (let i = 0; i < Math.min(12, spectrum.length); i += 1) total += spectrum[i];
      energy = total / (Math.min(12, spectrum.length) * 255);
    }

    drawVisualizer(g, W, H, minDim, visualBeat, energy, cyan, magenta);

    // video, mirrored and dimmed
    const video = videoRef.current;
    if (inputModeRef.current === "camera" && video && video.readyState >= 2) {
      g.save();
      g.globalAlpha = 0.34;
      g.translate(W, 0);
      g.scale(-1, 1);
      const vr = video.videoWidth / video.videoHeight;
      const cr = W / H;
      let dw = W;
      let dh = H;
      if (vr > cr) dw = H * vr;
      else dh = W / vr;
      g.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh);
      g.restore();
    } else {
      // simulator backdrop: sparse technical grid
      g.strokeStyle = "rgba(244, 239, 228, 0.07)";
      g.lineWidth = 1;
      for (let x = 0; x < W; x += Math.round(minDim / 8)) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
      }
      for (let y = 0; y < H; y += Math.round(minDim / 8)) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      }
    }

    const cueTarget = targetsRef.current
      .filter((target) => !target.judged && target.beat >= visualBeat - 0.4)
      .sort((a, b) => Math.abs(a.beat - visualBeat) - Math.abs(b.beat - visualBeat))[0];
    const cue = cueTarget
      ? {
          x: cueTarget.x,
          y: cueTarget.y,
          progress: clamp(1 - (cueTarget.beat - visualBeat) / LEAD_BEATS, 0, 1),
        }
      : null;
    drawLeadDancer(g, leadDancerPose(visualBeat, cue), W, H, minDim, cyan, magenta, energy);

    // skeleton
    const wrists = wristsRef.current;
    const pose = poseRef.current;
    if (inputModeRef.current === "camera" && pose) {
      g.strokeStyle = amber;
      g.globalAlpha = 0.8;
      g.lineWidth = 1.5;
      for (const [a, b] of CONNECTIONS) {
        const la = pose[a];
        const lb = pose[b];
        if (!la || !lb) continue;
        g.beginPath();
        g.moveTo((1 - la.x) * W, la.y * H);
        g.lineTo((1 - lb.x) * W, lb.y * H);
        g.stroke();
      }
      g.globalAlpha = 1;
    }

    // targets
    const now = audioRef.current?.currentTime ?? 0;
    for (const t of targetsRef.current) {
      const tx = t.x * W;
      const ty = t.y * H;
      const r = Math.max(0, HIT_RADIUS * minDim);
      if (t.judged) {
        if (t.flashAt !== null && now - t.flashAt < 0.35) {
          const a = clamp(1 - (now - t.flashAt) / 0.35, 0, 1);
          g.strokeStyle = t.judged === "miss" ? "rgba(200, 107, 67, 1)" : t.judged === "perfect" ? cyan : ink;
          g.globalAlpha = a;
          g.lineWidth = 2;
          g.beginPath();
          g.arc(tx, ty, Math.max(0, r * (1 + (1 - a) * 0.5)), 0, Math.PI * 2);
          g.stroke();
          g.globalAlpha = 1;
        }
        continue;
      }
      const dt = t.beat - visualBeat; // beats until hit
      if (dt > LEAD_BEATS) continue;
      // inner ring
      g.strokeStyle = cyan;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(tx, ty, r, 0, Math.PI * 2);
      g.stroke();
      // approach ring converges at beat time
      const approach = Math.max(0, dt / LEAD_BEATS);
      g.strokeStyle = "rgba(143, 240, 255, 0.45)";
      g.lineWidth = 1;
      g.beginPath();
      g.arc(tx, ty, Math.max(0, r * (1 + approach * 1.6)), 0, Math.PI * 2);
      g.stroke();
      // side tick label
      g.fillStyle = amber;
      g.font = `10px ${styleVars.getPropertyValue("--font-jbmono").trim() || "monospace"}`;
      g.fillText(t.x < 0.5 ? "L" : "R", tx - 3, ty - r - 6);
    }

    // wrist markers
    g.fillStyle = amber;
    for (const w of wrists) {
      g.beginPath();
      g.arc(w.x * W, w.y * H, 5, 0, Math.PI * 2);
      g.fill();
    }
  }, [beatNow]);

  const tick = useCallback(() => {
    rafRef.current = requestAnimationFrame(() => tickRef.current());
    const current = phaseRef.current;

    // pose read
    if (inputModeRef.current === "camera" && landmarkerRef.current && videoRef.current && videoRef.current.readyState >= 2) {
      try {
        const res = landmarkerRef.current.detectForVideo(videoRef.current, performance.now());
        const pose = res.landmarks?.[0] ?? null;
        poseRef.current = pose;
        const ws: Array<{ x: number; y: number }> = [];
        if (pose) {
          for (const idx of [15, 16]) {
            const lm = pose[idx];
            if (lm && (lm.visibility === undefined || lm.visibility > 0.4)) {
              ws.push({ x: 1 - lm.x, y: lm.y });
            }
          }
        }
        wristsRef.current = ws;
      } catch {
        // single bad frame is not fatal
      }
    } else if (inputModeRef.current === "pointer") {
      wristsRef.current = pointerRef.current ? [pointerRef.current] : [];
    }

    if (current === "calibrate") {
      const need = inputModeRef.current === "camera" ? 2 : 1;
      calibrateFramesRef.current = wristsRef.current.length >= need ? calibrateFramesRef.current + 1 : 0;
      if (calibrateFramesRef.current > 40) {
        calibrateFramesRef.current = 0;
        setPhase("count");
        startClock(4);
        window.setTimeout(() => setPhase("play"), 4 * BEAT * 1000);
      }
    }

    if (current === "play") {
      const beat = beatNow();
      // spawn
      const targets = targetsRef.current;
      const nextBeatToSpawn = targets.length * SPAWN_EVERY + LEAD_BEATS;
      if (nextBeatToSpawn <= ROUND_BEATS - 2 && beat >= nextBeatToSpawn - LEAD_BEATS) {
        const n = targets.length;
        const spot = targetSpot(n);
        targets.push({ id: n, ...spot, beat: nextBeatToSpawn, judged: null, flashAt: null });
      }
      // judge
      for (const t of targets) {
        if (t.judged) continue;
        const offset = (beat - t.beat) * BEAT; // seconds past the hit beat
        if (offset > WIN_LATE) {
          missTarget(t);
          continue;
        }
        if (offset < -WIN_LATE) continue;
        const stage = stageRef.current;
        if (!stage) continue;
        const rect = stage.getBoundingClientRect();
        const minDim = Math.min(rect.width, rect.height);
        for (const w of wristsRef.current) {
          const dx = (w.x - t.x) * rect.width;
          const dy = (w.y - t.y) * rect.height;
          if (Math.hypot(dx, dy) <= HIT_RADIUS * minDim * 1.15) {
            judge(t, offset);
            break;
          }
        }
      }
      if (beat > ROUND_BEATS + 1) {
        setPhase("done");
        stopEverything();
      }
    }

    drawFrame();
  }, [beatNow, drawFrame, judge, missTarget, startClock, stopEverything]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  // flash decay
  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 450);
    return () => window.clearTimeout(id);
  }, [flash]);

  const resetRound = useCallback(() => {
    targetsRef.current = [];
    comboRef.current = 0;
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setJudgments({ perfect: 0, good: 0, late: 0, miss: 0 });
  }, []);

  const begin = useCallback(async (mode: InputMode) => {
    resetRound();
    inputModeRef.current = mode;
    setInputMode(mode);
    setPhase("loading");
    setLoadStep(0);
    try {
      if (mode === "camera") {
        const vision = await loadVisionModule();
        setLoadStep(1);
        const fileset = await vision.FilesetResolver.forVisionTasks(`${CDN}/wasm`);
        const landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        landmarkerRef.current = landmarker;
        setLoadStep(2);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 540 } },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) throw new Error("no video element");
        video.srcObject = stream;
        await video.play();
        setLoadStep(3);
      }
      setPhase("calibrate");
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => tickRef.current());
    } catch {
      stopEverything();
      setPhase("denied");
    }
  }, [resetRound, stopEverything]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    pointerRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  const pauseGame = useCallback(() => {
    if (phaseRef.current !== "play") return;
    void audioRef.current?.suspend();
    setPhase("pause");
  }, []);

  const resumeGame = useCallback(() => {
    if (phaseRef.current !== "pause") return;
    void audioRef.current?.resume();
    setPhase("play");
  }, []);

  const total = judgments.perfect + judgments.good + judgments.late + judgments.miss;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <p className={`${styles.kicker} gki-mono`}>{copy.kicker}</p>
          <h1 className={styles.title}>{copy.title}</h1>
        </div>
        <Link href={locale === "es" ? "/es" : "/"} className={`${styles.back} gki-mono`}>
          {copy.backHome} →
        </Link>
      </header>

      <div className={`${styles.statusRow} gki-mono`}>
        <span>{copy.labels.audio} {BPM.toFixed(2)} BPM</span>
        <span>{copy.labels.pose} 33 LM</span>
        <span>{copy.labels.lead} ON</span>
        <span>{copy.labels.input} {inputMode === "camera" ? "CAM" : "PTR"}</span>
        <span>{copy.labels.round} 01</span>
        <span className={styles.statusScore}>{copy.score} {score.toString().padStart(5, "0")}</span>
      </div>

      <div
        ref={stageRef}
        className={styles.stage}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        data-phase={phase}
      >
        <video ref={videoRef} className={styles.video} playsInline muted />
        <canvas ref={canvasRef} className={styles.canvas} />

        {phase === "boot" && (
          <div className={styles.panel}>
            <p className={styles.lede}>{copy.lede}</p>
            <p className={`${styles.guide} gki-mono`}>{copy.guide}</p>
            <p className={`${styles.privacy} gki-mono`}>{copy.privacy}</p>
            <button type="button" className={styles.startButton} onClick={() => void begin("camera")}>
              {copy.start}
            </button>
            <button type="button" className={`${styles.simLink} gki-mono`} onClick={() => void begin("pointer")}>
              {copy.simulator}
            </button>
          </div>
        )}

        {phase === "loading" && (
          <div className={styles.panel}>
            <ul className={`${styles.loadList} gki-mono`}>
              {copy.loading.map((line, i) => (
                <li key={line} data-state={i < loadStep ? "done" : i === loadStep ? "now" : "wait"}>
                  {i < loadStep ? "▪" : "▫"} {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        {phase === "denied" && (
          <div className={styles.panel}>
            <p className={styles.lede}>{copy.cameraDenied}</p>
            <button type="button" className={styles.startButton} onClick={() => void begin("camera")}>
              {copy.cameraRetry}
            </button>
            <button type="button" className={`${styles.simLink} gki-mono`} onClick={() => void begin("pointer")}>
              {copy.simulator}
            </button>
          </div>
        )}

        {phase === "calibrate" && (
          <div className={styles.hint}>
            <p>{copy.calibrate}</p>
            <p className="gki-mono">{copy.calibrateHold}</p>
          </div>
        )}

        {phase === "count" && (
          <div className={styles.hint}>
            <p className="gki-mono">{copy.countdown}</p>
          </div>
        )}

        {phase === "play" && flash && (
          <p className={styles.flash} data-judgment={flash}>
            {copy[flash === "good" ? "good" : flash]}
          </p>
        )}

        {phase === "play" && (
          <button type="button" className={`${styles.pauseButton} gki-mono`} onClick={pauseGame}>
            {copy.pause}
          </button>
        )}

        {phase === "pause" && (
          <div className={styles.panel}>
            <p className={styles.lede}>{copy.pause}</p>
            <button type="button" className={styles.startButton} onClick={resumeGame}>
              {copy.resume}
            </button>
          </div>
        )}

        {phase === "play" && combo > 1 && (
          <p className={`${styles.combo} gki-mono`}>{copy.combo} ×{combo}</p>
        )}

        {phase === "done" && (
          <div className={styles.panel}>
            <p className={styles.lede}>{copy.done}</p>
            <div className={`${styles.results} gki-mono`}>
              <span>{copy.score}</span><span>{score}</span>
              <span>{copy.perfect}</span><span>{judgments.perfect}/{total}</span>
              <span>{copy.good}</span><span>{judgments.good}/{total}</span>
              <span>{copy.late}</span><span>{judgments.late}/{total}</span>
              <span>{copy.miss}</span><span>{judgments.miss}/{total}</span>
              <span>{copy.best}</span><span>×{bestCombo}</span>
            </div>
            <button
              type="button"
              className={styles.startButton}
              onClick={() => {
                stopEverything();
                void begin(inputMode);
              }}
            >
              {copy.retry}
            </button>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <span className={styles.magenta}>{copy.magentaPhrase}</span>
      </footer>
    </div>
  );
}
