"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { audioAnalysisLabel, parseAudioAnalysisV1, type AudioAnalysisV1 } from "./audioAnalysis";
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
  hitTime: number; // seconds in the active clock
  judged: Judgment | null;
  flashAt: number | null; // audio time when judged
};

type Landmark = { x: number; y: number; visibility?: number };
type Point = { x: number; y: number };

type MotionRegions = {
  head: number;
  torso: number;
  leftArm: number;
  rightArm: number;
  leftLeg: number;
  rightLeg: number;
};

type VisualPattern = "alternate" | "pulse" | "strobe" | "gradient-sweep";

type VisualState = {
  musicEnergy: number;
  kineticIntensity: number;
  rhythmicDensity: number;
  switchFrequencyHz: number;
  switchPattern: VisualPattern;
  section: "intro" | "groove" | "build" | "drop" | "breakdown";
  regions: MotionRegions;
};

type LeadPose = {
  bodyTilt: number;
  headTilt: number;
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
  kineticIntensity: number;
  regions: MotionRegions;
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

/** A deterministic eight-count phrase so the performer always has a body to follow. */
function leadDancerPose(beat: number, cue: LeadCue | null): LeadPose {
  const groove = Math.sin((beat * Math.PI) / 2);
  const phrase = Math.sin((beat * Math.PI) / 4);
  const sway = Math.sin((beat * Math.PI) / 4) * 0.028;
  const bounce = Math.abs(Math.sin(beat * Math.PI)) * 0.018;
  const bodyTilt = phrase * 0.06;
  const cx = 0.5 + sway;
  const shoulderY = 0.34 - bounce;
  const hipY = 0.62 - bounce * 0.45;
  const leftLift = clamp((groove + 0.12) * 0.5, 0, 1);
  const rightLift = clamp((-groove + 0.12) * 0.5, 0, 1);
  const leftHand = { x: cx - 0.26 - leftLift * 0.045, y: 0.48 - leftLift * 0.2 + phrase * 0.025 };
  const rightHand = { x: cx + 0.26 + rightLift * 0.045, y: 0.48 - rightLift * 0.2 - phrase * 0.025 };
  const leftKneeLift = clamp((groove + 0.15) * 0.5, 0, 1);
  const rightKneeLift = clamp((-groove + 0.15) * 0.5, 0, 1);
  const kineticIntensity = clamp(0.28 + Math.abs(groove) * 0.42 + Math.abs(phrase) * 0.24 + bounce * 4, 0, 1);
  const regions: MotionRegions = {
    head: clamp(0.2 + Math.abs(phrase) * 0.45, 0, 1),
    torso: clamp(0.35 + Math.abs(phrase) * 0.5 + bounce * 3, 0, 1),
    leftArm: clamp(0.3 + leftLift * 0.62 + Math.abs(groove) * 0.16, 0, 1),
    rightArm: clamp(0.3 + rightLift * 0.62 + Math.abs(groove) * 0.16, 0, 1),
    leftLeg: clamp(0.3 + leftKneeLift * 0.58 + Math.abs(groove) * 0.18, 0, 1),
    rightLeg: clamp(0.3 + rightKneeLift * 0.58 + Math.abs(groove) * 0.18, 0, 1),
  };

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
    bodyTilt,
    headTilt: -phrase * 0.08,
    head: { x: cx + bodyTilt * 0.18, y: 0.17 - bounce * 0.35 },
    neck: { x: cx + bodyTilt * 0.2, y: 0.28 - bounce },
    shoulderLeft: { x: cx - 0.105 + bodyTilt * 0.1, y: shoulderY - bodyTilt * 0.12 },
    shoulderRight: { x: cx + 0.105 + bodyTilt * 0.1, y: shoulderY + bodyTilt * 0.12 },
    elbowLeft: { x: cx - 0.19 - leftLift * 0.025, y: 0.44 - leftLift * 0.08 + groove * 0.018 },
    elbowRight: { x: cx + 0.19 + rightLift * 0.025, y: 0.44 - rightLift * 0.08 - groove * 0.018 },
    handLeft: leftHand,
    handRight: rightHand,
    hipLeft: { x: cx - 0.075 + bodyTilt * 0.08, y: hipY + bodyTilt * 0.06 },
    hipRight: { x: cx + 0.075 + bodyTilt * 0.08, y: hipY - bodyTilt * 0.06 },
    kneeLeft: { x: cx - 0.115 + groove * 0.045, y: 0.78 - leftKneeLift * 0.07 - bounce * 0.25 },
    kneeRight: { x: cx + 0.115 - groove * 0.045, y: 0.78 - rightKneeLift * 0.07 - bounce * 0.25 },
    footLeft: { x: cx - 0.145 - leftKneeLift * 0.035 - groove * 0.018, y: 0.95 - leftKneeLift * 0.1 },
    footRight: { x: cx + 0.145 + rightKneeLift * 0.035 + groove * 0.018, y: 0.95 - rightKneeLift * 0.1 },
    kineticIntensity,
    regions,
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

function drawLimb(
  g: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  width: number,
  fill: string,
  underlight: string,
  W: number,
  H: number,
): void {
  drawSegment(g, a, b, width + Math.max(4, width * 0.28), underlight, W, H);
  drawSegment(g, a, b, width, fill, W, H);
}

function drawEllipse(
  g: CanvasRenderingContext2D,
  point: Point,
  radiusX: number,
  radiusY: number,
  fill: string,
  stroke: string,
  lineWidth: number,
  W: number,
  H: number,
): void {
  g.beginPath();
  g.ellipse(point.x * W, point.y * H, radiusX, radiusY, 0, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = stroke;
  g.lineWidth = lineWidth;
  g.stroke();
}

function heatColor(heat: number, alpha: number): string {
  const t = clamp(heat, 0, 1);
  const r = Math.round(43 + (255 - 43) * t);
  const g = Math.round(105 + (54 - 105) * t);
  const b = Math.round(191 + (85 - 191) * t);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

function switchSignal(seconds: number, state: VisualState): number {
  if (!Number.isFinite(seconds) || state.switchFrequencyHz <= 0) return 0;
  const phase = (seconds * state.switchFrequencyHz) % 1;
  if (state.switchPattern === "strobe") return phase < 0.18 ? 1 : 0.05;
  if (state.switchPattern === "pulse") return 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
  if (state.switchPattern === "gradient-sweep") return phase;
  return phase < 0.5 ? 0.18 : 0.86;
}

function tubeGlow(region: keyof MotionRegions, state: VisualState, seconds: number): string {
  const activation = state.regions[region];
  const switching = switchSignal(seconds, state);
  const heat = clamp(state.kineticIntensity * 0.62 + activation * 0.28 + switching * 0.1, 0, 1);
  const alpha = 0.18 + activation * 0.38 + state.musicEnergy * 0.18 + switching * 0.12;
  return heatColor(heat, alpha);
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
  state: VisualState,
  seconds: number,
): void {
  const core = `rgba(125, 249, 255, ${0.58 + pulse * 0.16})`;
  const outfit = `rgba(10, 17, 28, ${0.9 + pulse * 0.05})`;
  const outfitPanel = `rgba(28, 48, 66, ${0.68 + pulse * 0.08})`;
  const skin = `rgba(222, 170, 145, ${0.88 + pulse * 0.06})`;
  const skinShadow = `rgba(138, 78, 87, ${0.48 + pulse * 0.08})`;
  const hair = `rgba(17, 22, 35, ${0.96 + pulse * 0.03})`;
  const bodyGlow = tubeGlow("torso", state, seconds);
  const headGlow = tubeGlow("head", state, seconds);
  const leftArmGlow = tubeGlow("leftArm", state, seconds);
  const rightArmGlow = tubeGlow("rightArm", state, seconds);
  const leftLegGlow = tubeGlow("leftLeg", state, seconds);
  const rightLegGlow = tubeGlow("rightLeg", state, seconds);
  const switching = switchSignal(seconds, state);
  const head = pose.head;
  const torso = [
    pose.shoulderLeft,
    { x: pose.shoulderLeft.x + 0.035, y: pose.neck.y + 0.015 },
    { x: pose.shoulderRight.x - 0.035, y: pose.neck.y + 0.015 },
    pose.shoulderRight,
    { x: pose.hipRight.x + 0.06, y: pose.hipRight.y - 0.015 },
    { x: pose.hipRight.x + 0.035, y: pose.hipRight.y + 0.035 },
    { x: pose.hipLeft.x - 0.035, y: pose.hipLeft.y + 0.035 },
    { x: pose.hipLeft.x - 0.06, y: pose.hipLeft.y - 0.015 },
  ];
  const headRadiusX = minDim * 0.045;
  const headRadiusY = minDim * 0.058;
  const headRadiusXNorm = headRadiusX / W;
  const headRadiusYNorm = headRadiusY / H;
  const footLeft = { x: pose.footLeft.x - 0.035, y: pose.footLeft.y + 0.005 };
  const footRight = { x: pose.footRight.x + 0.035, y: pose.footRight.y + 0.005 };

  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.globalAlpha = 0.96;

  // A dancer's stage shadow gives the character weight before the beat light
  // traces the outfit. The body is drawn in layers so it reads as a person,
  // not a collection of joints.
  g.fillStyle = `rgba(0, 0, 0, ${0.28 + pulse * 0.1})`;
  g.beginPath();
  g.ellipse(((footLeft.x + footRight.x) / 2) * W, 0.975 * H, minDim * 0.2, minDim * 0.022, 0, 0, Math.PI * 2);
  g.fill();

  drawLimb(g, pose.hipLeft, pose.kneeLeft, minDim * 0.085, outfit, leftLegGlow, W, H);
  drawLimb(g, pose.kneeLeft, pose.footLeft, minDim * 0.062, outfitPanel, leftLegGlow, W, H);
  drawLimb(g, pose.hipRight, pose.kneeRight, minDim * 0.085, outfit, rightLegGlow, W, H);
  drawLimb(g, pose.kneeRight, pose.footRight, minDim * 0.062, outfitPanel, rightLegGlow, W, H);

  drawSegment(g, pose.footLeft, footLeft, minDim * 0.046, "#f4efe4", W, H);
  drawSegment(g, pose.footRight, footRight, minDim * 0.046, "#f4efe4", W, H);
  drawSegment(g, pose.footLeft, footLeft, minDim * 0.014, core, W, H);
  drawSegment(g, pose.footRight, footRight, minDim * 0.014, core, W, H);

  drawLimb(g, pose.shoulderLeft, pose.elbowLeft, minDim * 0.064, outfit, leftArmGlow, W, H);
  drawLimb(g, pose.elbowLeft, pose.handLeft, minDim * 0.035, skin, leftArmGlow, W, H);
  drawLimb(g, pose.shoulderRight, pose.elbowRight, minDim * 0.064, outfit, rightArmGlow, W, H);
  drawLimb(g, pose.elbowRight, pose.handRight, minDim * 0.035, skin, rightArmGlow, W, H);

  drawPolygon(g, torso, outfit, bodyGlow, Math.max(1.5, minDim * 0.005), W, H);
  drawPolygon(
    g,
    [
      { x: pose.shoulderLeft.x + 0.025, y: pose.shoulderLeft.y + 0.025 },
      { x: pose.neck.x, y: pose.neck.y + 0.03 },
      { x: pose.shoulderRight.x - 0.025, y: pose.shoulderRight.y + 0.025 },
      { x: pose.hipRight.x - 0.015, y: pose.hipRight.y - 0.02 },
      { x: pose.hipLeft.x + 0.015, y: pose.hipLeft.y - 0.02 },
    ],
    outfitPanel,
    bodyGlow,
    1,
    W,
    H,
  );
  drawSegment(g, { x: pose.hipLeft.x - 0.02, y: pose.hipLeft.y }, { x: pose.hipRight.x + 0.02, y: pose.hipRight.y }, minDim * 0.012, heatColor(clamp(state.kineticIntensity + switching * 0.2, 0, 1), 0.9), W, H);
  drawLimb(g, pose.neck, { x: head.x, y: head.y + headRadiusYNorm * 0.82 }, minDim * 0.035, skin, skinShadow, W, H);

  drawEllipse(g, head, headRadiusX, headRadiusY, skin, headGlow, 1.5, W, H);
  drawPolygon(
    g,
    [
      { x: head.x - headRadiusXNorm, y: head.y - headRadiusYNorm * 0.15 },
      { x: head.x - headRadiusXNorm * 0.78, y: head.y - headRadiusYNorm * 0.86 },
      { x: head.x - headRadiusXNorm * 0.1, y: head.y - headRadiusYNorm * 1.12 },
      { x: head.x + headRadiusXNorm * 0.78, y: head.y - headRadiusYNorm * 0.75 },
      { x: head.x + headRadiusXNorm, y: head.y + headRadiusYNorm * 0.05 },
      { x: head.x + headRadiusXNorm * 0.42, y: head.y - headRadiusYNorm * 0.12 },
      { x: head.x - headRadiusXNorm * 0.2, y: head.y - headRadiusYNorm * 0.08 },
    ],
    hair,
    hair,
    1,
    W,
    H,
  );
  drawSegment(g, { x: head.x - headRadiusXNorm * 0.55, y: head.y + headRadiusYNorm * 0.12 }, { x: head.x - headRadiusXNorm * 0.12, y: head.y + headRadiusYNorm * 0.1 }, 1.5, "rgba(17, 22, 35, 0.9)", W, H);
  drawSegment(g, { x: head.x + headRadiusXNorm * 0.12, y: head.y + headRadiusYNorm * 0.1 }, { x: head.x + headRadiusXNorm * 0.52, y: head.y + headRadiusYNorm * 0.08 }, 1.5, "rgba(17, 22, 35, 0.9)", W, H);
  drawSegment(g, { x: head.x - headRadiusXNorm * 0.24, y: head.y + headRadiusYNorm * 0.46 }, { x: head.x + headRadiusXNorm * 0.2, y: head.y + headRadiusYNorm * 0.43 }, 1, headGlow, W, H);

  for (const point of [pose.handLeft, pose.handRight]) drawEllipse(g, point, minDim * 0.018, minDim * 0.018, skin, skinShadow, 1, W, H);
  for (const point of [pose.kneeLeft, pose.kneeRight]) drawEllipse(g, point, minDim * 0.04, minDim * 0.04, outfitPanel, core, 1, W, H);

  g.globalAlpha = 0.18 + pulse * 0.12;
  g.strokeStyle = bodyGlow;
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(
    ((footLeft.x + footRight.x) / 2) * W,
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

function audioEnergyAt(analysis: AudioAnalysisV1 | null, seconds: number): number {
  const curve = analysis?.energy_curve;
  if (!curve || curve.rms.length === 0 || !Number.isFinite(seconds)) return 0.42;
  const index = clamp(Math.floor(seconds / curve.hop_s), 0, curve.rms.length - 1);
  const value = curve.rms[index];
  const min = Math.min(...curve.rms);
  const max = Math.max(...curve.rms);
  return clamp((value - min) / Math.max(0.001, max - min), 0, 1);
}

function rhythmicDensityAt(analysis: AudioAnalysisV1 | null, seconds: number): number {
  if (!analysis || !Number.isFinite(seconds)) return 0.32;
  const start = seconds - 2;
  const end = seconds + 2;
  const onsets = analysis.onset_times.filter((time) => time >= start && time <= end).length;
  return clamp(onsets / 12, 0, 1);
}

function buildVisualState(
  analysis: AudioAnalysisV1 | null,
  seconds: number,
  analyserEnergy: number,
  pose: LeadPose,
): VisualState {
  const musicEnergy = clamp(analyserEnergy * 0.72 + audioEnergyAt(analysis, seconds) * 0.28, 0, 1);
  const rhythmicDensity = rhythmicDensityAt(analysis, seconds);
  const section: VisualState["section"] = seconds < 4
    ? "intro"
    : musicEnergy < 0.24
      ? "breakdown"
      : musicEnergy > 0.76
        ? "drop"
        : rhythmicDensity > 0.62
          ? "build"
          : "groove";
  const doubleTime = rhythmicDensity > 0.62;
  const switchFrequencyHz = clamp(
    1.5 + rhythmicDensity * 7 + (doubleTime ? 3 : 0) + (section === "drop" ? 2 : 0),
    0,
    20,
  );
  const switchPattern: VisualPattern = section === "breakdown"
    ? "gradient-sweep"
    : section === "build"
      ? "pulse"
      : doubleTime
        ? "strobe"
        : "alternate";

  return {
    musicEnergy,
    kineticIntensity: pose.kineticIntensity,
    rhythmicDensity,
    switchFrequencyHz,
    switchPattern,
    section,
    regions: pose.regions,
  };
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
  state: VisualState,
  seconds: number,
): void {
  const phase = ((beat % 1) + 1) % 1;
  const beatPulse = Math.pow(1 - phase, 3);
  const switching = switchSignal(seconds, state);
  const pulse = clamp(energy * 0.8 + beatPulse * 0.32 + switching * 0.08, 0, 1);
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

  g.globalAlpha = 0.16 + pulse * 0.2 + state.musicEnergy * 0.08;
  g.strokeStyle = cyan;
  g.lineWidth = 1;
  const ringCount = state.section === "drop" ? 11 : state.section === "breakdown" ? 6 : 9;
  for (let i = 0; i < ringCount; i += 1) {
    const radius = minDim * (0.16 + i * 0.1 + beatPulse * 0.045 + switching * 0.018);
    g.beginPath();
    g.ellipse(centerX, centerY, radius * 1.25, radius * 0.58, 0, 0, Math.PI * 2);
    g.stroke();
  }

  g.globalAlpha = 0.1 + pulse * 0.14 + (state.section === "build" ? switching * 0.12 : 0);
  g.strokeStyle = magenta;
  const rayCount = state.section === "build" ? 12 : state.section === "breakdown" ? 4 : 7;
  for (let i = 0; i < rayCount; i += 1) {
    const x = ((i + 1) / (rayCount + 1)) * W;
    g.beginPath();
    g.moveTo(x, H);
    g.lineTo(centerX + (x - centerX) * (0.24 + pulse * 0.08 + switching * 0.04), centerY);
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
  const [analysis, setAnalysis] = useState<AudioAnalysisV1 | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarkerLike | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioFileRef = useRef<File | null>(null);
  const trackStartTimerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const spectrumRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0); // audio time of beat 0
  const scheduledToRef = useRef(0); // last 16th scheduled (index)
  const analysisRef = useRef<AudioAnalysisV1 | null>(null);
  const trackModeRef = useRef(false);
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
  const activeBeatDuration = useCallback(() => 60 / (analysisRef.current?.bpm ?? BPM), []);

  const clockSeconds = useCallback(() => {
    if (trackModeRef.current && audioElementRef.current) return audioElementRef.current.currentTime;
    const ctx = audioRef.current;
    if (!ctx) return -Infinity;
    return ctx.currentTime - startTimeRef.current;
  }, []);

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
    const beatDuration = activeBeatDuration();
    trackModeRef.current = Boolean(analysisRef.current && audioFileRef.current);

    if (trackModeRef.current && audioFileRef.current) {
      const audio = new Audio();
      const url = URL.createObjectURL(audioFileRef.current);
      audio.preload = "auto";
      audio.src = url;
      audio.currentTime = 0;
      audioElementRef.current = audio;
      audioUrlRef.current = url;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      const leadInMs = leadInBeats * beatDuration * 1000;
      trackStartTimerRef.current = window.setTimeout(() => {
        void audio.play().catch(() => setTrackError("The local audio could not start. Press retry and choose the file again."));
      }, leadInMs);
      return;
    }

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
  }, [activeBeatDuration, scheduleSixteenth]);

  const stopEverything = useCallback(() => {
    if (schedulerRef.current !== null) window.clearInterval(schedulerRef.current);
    schedulerRef.current = null;
    if (trackStartTimerRef.current !== null) window.clearTimeout(trackStartTimerRef.current);
    trackStartTimerRef.current = null;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    audioElementRef.current?.pause();
    audioElementRef.current?.removeAttribute("src");
    audioElementRef.current?.load();
    audioElementRef.current = null;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    trackModeRef.current = false;
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
    const seconds = clockSeconds();
    if (!Number.isFinite(seconds)) return -Infinity;
    return seconds / activeBeatDuration();
  }, [activeBeatDuration, clockSeconds]);

  const judge = useCallback((target: Target, offsetSeconds: number) => {
    const abs = Math.abs(offsetSeconds);
    let j: Judgment;
    if (abs <= WIN_PERFECT) j = "perfect";
    else if (abs <= WIN_GOOD) j = "good";
    else j = "late";
    target.judged = j;
    target.flashAt = clockSeconds();
    const points = j === "perfect" ? 100 : j === "good" ? 60 : 20;
    const nextCombo = j === "late" ? 0 : comboRef.current + 1;
    comboRef.current = nextCombo;
    setCombo(nextCombo);
    setBestCombo((b) => Math.max(b, nextCombo));
    setScore((s) => s + Math.round(points * (1 + nextCombo * 0.1)));
    setJudgments((jj) => ({ ...jj, [j]: jj[j] + 1 }));
    setFlash(j);
  }, [clockSeconds]);

  const missTarget = useCallback((target: Target) => {
    target.judged = "miss";
    target.flashAt = clockSeconds();
    comboRef.current = 0;
    setCombo(0);
    setJudgments((jj) => ({ ...jj, miss: jj.miss + 1 }));
    setFlash("miss");
  }, [clockSeconds]);

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
    const seconds = clockSeconds();
    let energy = 0;
    const analyser = analyserRef.current;
    const spectrum = spectrumRef.current;
    if (analyser && spectrum) {
      analyser.getByteFrequencyData(spectrum);
      let total = 0;
      for (let i = 0; i < spectrum.length; i += 1) total += spectrum[i];
      energy = spectrum.length > 0 ? total / (spectrum.length * 255) : 0;
    }

    const cueTarget = targetsRef.current
      .filter((target) => !target.judged && target.beat >= visualBeat - 0.4)
      .sort((a, b) => Math.abs(a.beat - visualBeat) - Math.abs(b.beat - visualBeat))[0];
    const cue = cueTarget
      ? {
          x: cueTarget.x,
          y: cueTarget.y,
          progress: clamp(1 - (cueTarget.hitTime - seconds) / (LEAD_BEATS * activeBeatDuration()), 0, 1),
        }
      : null;
    const leadPose = leadDancerPose(visualBeat, cue);
    const visualState = buildVisualState(analysisRef.current, seconds, energy, leadPose);

    drawVisualizer(g, W, H, minDim, visualBeat, visualState.musicEnergy, cyan, magenta, visualState, seconds);

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

    drawLeadDancer(g, leadPose, W, H, minDim, cyan, magenta, visualState.musicEnergy, visualState, seconds);

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
    const now = clockSeconds();
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
      const leadSeconds = LEAD_BEATS * activeBeatDuration();
      const secondsUntilHit = t.hitTime - now;
      if (secondsUntilHit > leadSeconds) continue;
      // inner ring
      g.strokeStyle = cyan;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(tx, ty, r, 0, Math.PI * 2);
      g.stroke();
      // approach ring converges at beat time
      const approach = Math.max(0, secondsUntilHit / leadSeconds);
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
  }, [activeBeatDuration, beatNow, clockSeconds]);

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
        window.setTimeout(() => setPhase("play"), 4 * activeBeatDuration() * 1000);
      }
    }

    if (current === "play") {
      const seconds = clockSeconds();
      const beatDuration = activeBeatDuration();
      // spawn
      const targets = targetsRef.current;
      const nextBeatToSpawn = targets.length * SPAWN_EVERY + LEAD_BEATS;
      const analysisBeats = analysisRef.current?.beat_times;
      const maxBeats = analysisBeats ? Math.min(ROUND_BEATS, analysisBeats.length) : ROUND_BEATS;
      const hitTime = analysisBeats?.[nextBeatToSpawn] ?? nextBeatToSpawn * BEAT;
      if (nextBeatToSpawn < maxBeats && seconds >= hitTime - LEAD_BEATS * beatDuration) {
        const n = targets.length;
        const spot = targetSpot(n);
        targets.push({ id: n, ...spot, beat: nextBeatToSpawn, hitTime, judged: null, flashAt: null });
      }
      // judge
      for (const t of targets) {
        if (t.judged) continue;
        const offset = seconds - t.hitTime; // seconds past the hit beat
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
      const endTime = analysisBeats
        ? Math.min(analysisRef.current?.duration_s ?? Infinity, (analysisBeats.at(-1) ?? 0) + beatDuration * 2)
        : ROUND_BEATS * BEAT + 1;
      if (seconds > endTime) {
        setPhase("done");
        stopEverything();
      }
    }

    drawFrame();
  }, [activeBeatDuration, clockSeconds, drawFrame, judge, missTarget, startClock, stopEverything]);

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

  const onAnalysisFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    try {
      const next = parseAudioAnalysisV1(await file.text());
      analysisRef.current = next;
      setAnalysis(next);
      setTrackError(null);
    } catch (error) {
      setTrackError(error instanceof Error ? error.message : "The analysis file could not be read.");
    }
  }, []);

  const onAudioFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    audioFileRef.current = file;
    setAudioName(file.name);
    setTrackError(null);
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
    if (trackModeRef.current && audioElementRef.current) void audioElementRef.current.play();
    setPhase("play");
  }, []);

  const total = judgments.perfect + judgments.good + judgments.late + judgments.miss;
  const trackReady = Boolean(analysis && audioName);

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
        <span>{copy.labels.audio} {(analysis?.bpm ?? BPM).toFixed(2)} BPM{trackReady ? " / MALO" : " / SYNTH"}</span>
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
            <div className={styles.trackImport}>
              <div className={`${styles.trackImportHeader} gki-mono`}>
                <span>{copy.trackLabel}</span>
                <span className={trackReady ? styles.trackReady : ""}>{trackReady ? copy.trackReady : copy.trackOptional}</span>
              </div>
              <div className={styles.fileButtons}>
                <label className={`${styles.fileButton} gki-mono`}>
                  {copy.loadAnalysis}
                  <input type="file" accept=".json,application/json" onChange={onAnalysisFileChange} />
                </label>
                <label className={`${styles.fileButton} gki-mono`}>
                  {copy.loadAudio}
                  <input type="file" accept="audio/*,.mp3,.wav,.m4a" onChange={onAudioFileChange} />
                </label>
              </div>
              {analysis && <p className={`${styles.trackMeta} gki-mono`}>{audioAnalysisLabel(analysis)} / {analysis.bpm.toFixed(2)} BPM</p>}
              {audioName && <p className={`${styles.trackMeta} gki-mono`}>{audioName}</p>}
              {trackError && <p className={`${styles.trackMeta} ${styles.trackError} gki-mono`}>{trackError}</p>}
              <p className={`${styles.trackPrivacy} gki-mono`}>{copy.trackPrivacy}</p>
            </div>
            <button type="button" className={styles.startButton} onClick={() => void begin("camera")}>
              {trackReady ? copy.startTrack : copy.start}
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
