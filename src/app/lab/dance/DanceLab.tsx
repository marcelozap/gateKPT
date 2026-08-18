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
      o.connect(g).connect(ctx.destination);
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
      s.connect(hp).connect(g).connect(ctx.destination);
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
      s.connect(bp).connect(g).connect(ctx.destination);
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
      o.connect(lp).connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + BEAT / 2);
    }
  }, []);

  const startClock = useCallback((leadInBeats: number) => {
    const ctx = audioRef.current ?? new AudioContext();
    audioRef.current = ctx;
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
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
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
    const minDim = Math.min(W, H);
    g.clearRect(0, 0, W, H);

    const styleVars = getComputedStyle(stage);
    const cyan = styleVars.getPropertyValue("--visor").trim() || "#8ff0ff";
    const amber = styleVars.getPropertyValue("--amber").trim() || "#f5b84b";
    const ink = styleVars.getPropertyValue("--ink").trim() || "#f4efe4";

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

    // skeleton
    const wrists = wristsRef.current;
    const pose = poseRef.current;
    if (inputModeRef.current === "camera" && pose) {
      g.strokeStyle = cyan;
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
    const beat = beatNow();
    for (const t of targetsRef.current) {
      const tx = t.x * W;
      const ty = t.y * H;
      const r = HIT_RADIUS * minDim;
      if (t.judged) {
        if (t.flashAt !== null && now - t.flashAt < 0.35) {
          const a = 1 - (now - t.flashAt) / 0.35;
          g.strokeStyle = t.judged === "miss" ? "rgba(200, 107, 67, 1)" : t.judged === "perfect" ? cyan : ink;
          g.globalAlpha = a;
          g.lineWidth = 2;
          g.beginPath();
          g.arc(tx, ty, r * (1 + (1 - a) * 0.5), 0, Math.PI * 2);
          g.stroke();
          g.globalAlpha = 1;
        }
        continue;
      }
      const dt = t.beat - beat; // beats until hit
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
      g.arc(tx, ty, r * (1 + approach * 1.6), 0, Math.PI * 2);
      g.stroke();
      // side tick label
      g.fillStyle = amber;
      g.font = `10px ${styleVars.getPropertyValue("--font-jbmono").trim() || "monospace"}`;
      g.fillText(t.x < 0.5 ? "L" : "R", tx - 3, ty - r - 6);
    }

    // wrist markers
    g.fillStyle = cyan;
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
