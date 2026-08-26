"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GatekptLanding } from "./GatekptLanding";
import type { Locale } from "./content";
import styles from "./GatekptHome.module.css";

type Point = { x: number; y: number };
type Segment = {
  id: string;
  a: Point;
  b: Point;
  radius: number;
  index: number;
  kind?: "body" | "head" | "hand" | "foot";
};

const LAYERS = ["Input", "Tokens", "Context", "Models", "Tools", "Chips", "Power"];
const LAYERS_ES = ["Entrada", "Tokens", "Contexto", "Modelos", "Herramientas", "Chips", "Energía"];
const HOME_COPY = {
  en: {
    status: "visual ai",
    title: "AI from the text box out.",
    subtitle: "AI, machine learning, and data engineering shown as working systems.",
    proofLabel: "Proof lanes",
    proofLanes: [
      ["AI", "LLM systems"],
      ["ML", "1 / model trained · ledgered"],
      ["DATA", "contracts + record"],
    ],
    layersLabel: "AI layers",
    openMap: "Open map",
    notes: "Journal",
    music: "Coding beats",
    switchLabel: "ES",
    switchHref: "/es",
  },
  es: {
    status: "ia visual",
    title: "IA desde el texto hacia afuera.",
    subtitle: "IA, aprendizaje automático e ingeniería de datos como sistemas reales.",
    proofLabel: "Líneas de prueba",
    proofLanes: [
      ["IA", "sistemas LLM"],
      ["ML", "1 modelo entrenado · ledger"],
      ["DATOS", "contratos + registro"],
    ],
    layersLabel: "Capas de IA",
    openMap: "Abrir mapa",
    notes: "Diario",
    music: "Beats en codigo",
    switchLabel: "EN",
    switchHref: "/",
  },
} as const;
const SEGMENTS = 16;
const TAU = Math.PI * 2;
// Chameleon rule: one narrow hue window, slow drift. Never a rainbow sweep.
const HUE_CENTER = 202;
const HUE_SPAN = 40;
const VECTOR_LABELS = ["TORSO", "HEAD", "ARMS", "LEGS", "YAW", "TWIST", "LAYER"];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function oklchToLinear(l: number, c: number, h: number) {
  const a = c * Math.cos((h / 180) * Math.PI);
  const b = c * Math.sin((h / 180) * Math.PI);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;
  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
}

function toCssRgb(linear: number[], alpha = 1) {
  const channels = linear.map((channel) => {
    const srgb = channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
    return Math.round(clamp(srgb) * 255);
  });
  return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`;
}

function oklchSafe(l: number, c: number, h: number, alpha = 1) {
  let chroma = c;
  for (let i = 0; i < 8; i++) {
    const linear = oklchToLinear(l, chroma, h);
    if (linear.every((channel) => channel >= 0 && channel <= 1)) return toCssRgb(linear, alpha);
    chroma *= 0.82;
  }
  return toCssRgb(oklchToLinear(l, 0, h), alpha);
}

function rotate(point: Point, angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: point.x * c - point.y * s, y: point.x * s + point.y * c };
}

function add(a: Point, b: Point) {
  return { x: a.x + b.x, y: a.y + b.y };
}

function endFrom(start: Point, angle: number, length: number) {
  return add(start, rotate({ x: 0, y: length }, angle));
}

function skinColor(yNorm: number, speed: number, t: number, focus: number) {
  const front = 0.5 + 0.5 * Math.sin((yNorm * 1.45 - t / 11) * TAU);
  const heat = clamp(speed * 0.68 + front * 0.22 + focus * 0.1);
  const drift = 0.5 + 0.5 * Math.sin(t / 31);
  const hue =
    HUE_CENTER - HUE_SPAN / 2 + HUE_SPAN * clamp(drift * 0.44 + front * 0.36 + heat * 0.2);
  const light = 0.34 + front * 0.2 + heat * 0.18;
  const chroma = 0.09 + front * 0.035 + heat * 0.065;
  return oklchSafe(light, chroma, hue, 0.92);
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function assertAnatomy() {
  const visibleNeck = 1.54 - 0.28 - 1.12;
  const headToChest = 0.28 / 0.3;
  const waistExists = 0.21 < 0.26 && 0.21 < 0.3;

  console.assert(visibleNeck >= 0.13, "GateKPT anatomy: neck must remain visible.");
  console.assert(headToChest <= 0.95, "GateKPT anatomy: head must stay narrower than chest.");
  console.assert(waistExists, "GateKPT anatomy: waist must stay narrower than pelvis and chest.");
}

export function GatekptHome({ locale = "en" }: { locale?: Locale }) {
  const copy = HOME_COPY[locale];
  const layerNames = locale === "es" ? LAYERS_ES : LAYERS;
  const [showMap, setShowMap] = useState(false);
  const [layer, setLayer] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const layerRef = useRef(0);
  const prevRef = useRef<Point[] | null>(null);
  const speedRef = useRef(new Float32Array(SEGMENTS));
  const lastRef = useRef(0);

  useEffect(() => {
    layerRef.current = layer;
  }, [layer]);

  useEffect(() => {
    assertAnatomy();
  }, []);

  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const context = ctx;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const mobile = width < 760;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);

    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = reduced ? 4 : now / 1000;
    const dt = lastRef.current ? Math.max((now - lastRef.current) / 1000, 1 / 120) : 1 / 60;
    lastRef.current = now;
    const phase = (t % 8) / 8;
    const loop = phase * TAU;
    const layerFocus = layerRef.current / Math.max(1, LAYERS.length - 1);
    const scale = mobile ? Math.min(width * 0.132, 60) : Math.min(width * 0.085, 118);
    const origin = { x: mobile ? width * 0.6 : width * 0.63, y: mobile ? height * 0.82 : height * 0.67 };

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#02050a";
    ctx.fillRect(0, 0, width, height);

    const atmosphere = ctx.createRadialGradient(origin.x, origin.y - scale * 1.2, 0, origin.x, origin.y, scale * 6.2);
    atmosphere.addColorStop(0, "rgba(125, 249, 255, 0.14)");
    atmosphere.addColorStop(0.36, "rgba(124, 92, 230, 0.07)");
    atmosphere.addColorStop(0.72, "rgba(255, 45, 149, 0.028)");
    atmosphere.addColorStop(1, "rgba(2, 5, 10, 0)");
    ctx.fillStyle = atmosphere;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < (mobile ? 54 : 150); i++) {
      const seed = i * 19.1987;
      const x = (Math.sin(seed) * 0.5 + 0.5) * width;
      const y = (Math.sin(seed * 1.41 + 2.7) * 0.5 + 0.5) * height;
      ctx.globalAlpha = i % 13 === 0 ? 0.42 : 0.18;
      ctx.fillStyle = i % 13 === 0 ? "#7df9ff" : "#93a0b4";
      ctx.fillRect(x, y, i % 13 === 0 ? 2 : 1, i % 13 === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;

    const rootYaw = Math.sin(loop) * 0.2;
    const chestYaw = Math.sin(loop + Math.PI * 0.55) * 0.09;
    const shoulderSwing = 0.3 + Math.sin(loop) * 0.22;
    const elbowSwing = -0.4 + Math.sin(loop + Math.PI * 0.8) * 0.28;
    const legSwing = Math.sin(loop + Math.PI) * 0.16;
    const counter = -chestYaw * 0.6;

    const local = (x: number, y: number) => add(origin, rotate({ x: x * scale, y: -y * scale }, rootYaw));
    const hips = local(0, 0);
    const pelvisTop = local(0, 0.3);
    const waistTop = local(0, 0.68);
    const chestTop = local(0, 1.18);
    const neckTop = local(0, 1.32);
    const head = local(Math.sin(counter) * 0.05, 1.58);
    const shoulderL = local(-0.3, 1.02);
    const shoulderR = local(0.3, 1.02);
    const hipL = local(-0.17, -0.06);
    const hipR = local(0.17, -0.06);
    const elbowL = endFrom(shoulderL, rootYaw + shoulderSwing, scale * 0.76);
    const elbowR = endFrom(shoulderR, rootYaw - shoulderSwing, scale * 0.76);
    const handL = endFrom(elbowL, rootYaw + shoulderSwing + elbowSwing, scale * 0.64);
    const handR = endFrom(elbowR, rootYaw - shoulderSwing - elbowSwing, scale * 0.64);
    const kneeL = endFrom(hipL, rootYaw - 0.05 + legSwing, scale * 0.88);
    const kneeR = endFrom(hipR, rootYaw + 0.05 - legSwing, scale * 0.88);
    const footL = endFrom(kneeL, rootYaw + 0.02 - legSwing * 0.4, scale * 0.76);
    const footR = endFrom(kneeR, rootYaw - 0.02 + legSwing * 0.4, scale * 0.76);

    const segments: Segment[] = [
      { id: "pelvis", a: hips, b: pelvisTop, radius: scale * 0.26, index: 0, kind: "body" },
      { id: "waist", a: pelvisTop, b: waistTop, radius: scale * 0.21, index: 1, kind: "body" },
      { id: "chest", a: waistTop, b: chestTop, radius: scale * 0.3, index: 2, kind: "body" },
      { id: "neck", a: chestTop, b: neckTop, radius: scale * 0.095, index: 3 },
      { id: "head", a: head, b: head, radius: scale * 0.28, index: 4, kind: "head" },
      { id: "upperArmL", a: shoulderL, b: elbowL, radius: scale * 0.135, index: 5 },
      { id: "upperArmR", a: shoulderR, b: elbowR, radius: scale * 0.135, index: 6 },
      { id: "forearmL", a: elbowL, b: handL, radius: scale * 0.115, index: 7 },
      { id: "forearmR", a: elbowR, b: handR, radius: scale * 0.115, index: 8 },
      { id: "handL", a: handL, b: handL, radius: scale * 0.115, index: 9, kind: "hand" },
      { id: "handR", a: handR, b: handR, radius: scale * 0.115, index: 10, kind: "hand" },
      { id: "thighL", a: hipL, b: kneeL, radius: scale * 0.165, index: 11 },
      { id: "thighR", a: hipR, b: kneeR, radius: scale * 0.165, index: 12 },
      { id: "shinL", a: kneeL, b: footL, radius: scale * 0.135, index: 13 },
      { id: "shinR", a: kneeR, b: footR, radius: scale * 0.135, index: 14 },
      { id: "feet", a: footL, b: footR, radius: scale * 0.13, index: 15, kind: "foot" },
    ];

    const centers = segments.map((segment) => ({
      x: (segment.a.x + segment.b.x) / 2,
      y: (segment.a.y + segment.b.y) / 2,
    }));

    if (!prevRef.current) prevRef.current = centers;
    centers.forEach((center, index) => {
      const prev = prevRef.current?.[index] ?? center;
      const distance = Math.hypot(center.x - prev.x, center.y - prev.y) / scale;
      const normalized = clamp(distance / Math.max(dt * 3, 0.001));
      speedRef.current[index] = speedRef.current[index] * 0.85 + normalized * 0.15;
    });
    prevRef.current = centers;

    const groundY = Math.max(footL.y, footR.y) + scale * 0.17;
    ctx.save();
    ctx.globalAlpha = 0.46;
    ctx.strokeStyle = "rgba(125, 249, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(origin.x, groundY, scale * 1.35, scale * 0.16, -0.04, 0, TAU);
    ctx.stroke();
    ctx.restore();

    const links = [
      [hips, pelvisTop],
      [pelvisTop, waistTop],
      [waistTop, chestTop],
      [chestTop, neckTop],
      [neckTop, head],
      [chestTop, shoulderL],
      [chestTop, shoulderR],
      [shoulderL, elbowL],
      [shoulderR, elbowR],
      [elbowL, handL],
      [elbowR, handR],
      [hips, hipL],
      [hips, hipR],
      [hipL, kneeL],
      [hipR, kneeR],
      [kneeL, footL],
      [kneeR, footR],
    ];
    const nodes = [hips, pelvisTop, waistTop, chestTop, neckTop, head, shoulderL, shoulderR, elbowL, elbowR, handL, handR, hipL, hipR, kneeL, kneeR, footL, footR];

    function drawCapsule(segment: Segment) {
      const centerY = ((segment.a.y + segment.b.y) / 2 - (origin.y - scale * 1.9)) / (scale * 4.2);
      const focus = Math.max(0, 1 - Math.abs(segment.index / (SEGMENTS - 1) - layerFocus) * 4);
      const color = skinColor(clamp(centerY), speedRef.current[segment.index], t, focus);

      context.strokeStyle = color;
      context.fillStyle = color;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.shadowColor = color;
      context.shadowBlur = 10 + focus * 12;

      if (segment.kind === "head") {
        context.save();
        context.translate(segment.a.x, segment.a.y);
        context.rotate(rootYaw * 0.2 + counter);
        context.beginPath();
        context.ellipse(0, 0, segment.radius * 0.92, segment.radius * 1.14, 0, 0, TAU);
        context.fill();
        context.restore();
        return;
      }

      if (segment.kind === "hand") {
        context.save();
        context.translate(segment.a.x, segment.a.y);
        context.scale(0.86, 1.18);
        context.beginPath();
        context.arc(0, 0, segment.radius, 0, TAU);
        context.fill();
        context.restore();
        return;
      }

      if (segment.kind === "foot") {
        [footL, footR].forEach((foot, side) => {
          context.save();
          context.translate(foot.x, foot.y);
          context.rotate(rootYaw + (side === 0 ? -0.08 : 0.08));
          context.scale(1.7, 0.6);
          context.beginPath();
          context.arc(0, 0, segment.radius, 0, TAU);
          context.fill();
          context.restore();
        });
        return;
      }

      context.lineWidth = segment.radius * 2;
      context.beginPath();
      context.moveTo(segment.a.x, segment.a.y);
      context.lineTo(segment.b.x, segment.b.y);
      context.stroke();
    }

    [...segments.slice(11, 16), segments[0], segments[1], segments[2], segments[3], segments[4], ...segments.slice(5, 11)]
      .forEach(drawCapsule);

    ctx.shadowBlur = 0;

    const energy = clamp(mean(Array.from(speedRef.current)));

    ctx.save();
    ctx.globalAlpha = 0.3 + energy * 0.24;
    ctx.strokeStyle = "#bff6ff";
    ctx.lineWidth = 1;
    links.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
    nodes.forEach((node, index) => {
      const joint = index % 5 === 0;
      ctx.globalAlpha = 0.62 + energy * 0.3;
      ctx.fillStyle = joint ? "#ffffff" : "#bff6ff";
      ctx.beginPath();
      ctx.arc(node.x, node.y, joint ? 2.7 : 1.9, 0, TAU);
      ctx.fill();
      if (joint) {
        ctx.globalAlpha = 0.2 + energy * 0.26;
        ctx.strokeStyle = "#7df9ff";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5 + energy * 2.6, 0, TAU);
        ctx.stroke();
      }
    });
    ctx.restore();

    const speeds = Array.from(speedRef.current);
    const featureVector = [
      mean([speeds[0], speeds[1], speeds[2]]),
      mean([speeds[3], speeds[4], speeds[9], speeds[10]]),
      mean([speeds[5], speeds[6], speeds[7], speeds[8]]),
      mean([speeds[11], speeds[12], speeds[13], speeds[14], speeds[15]]),
      clamp(Math.abs(rootYaw) * 3.1),
      clamp(Math.abs(chestYaw) * 5.4),
      clamp(layerFocus),
    ];

    // Mobile keeps the probe in the free gutter under the layer chips, left of the figure.
    const probeX = mobile ? 18 : origin.x + scale * 1.95;
    const probeY = mobile ? height * 0.76 : origin.y - scale * 2.05;
    const barW = mobile ? 46 : 64;
    const barGap = mobile ? 7 : 9;

    ctx.save();
    ctx.font = '10px ui-monospace, "JetBrains Mono", SFMono-Regular, Menlo, monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(147, 160, 180, 0.72)";
    ctx.fillText("VISUAL", probeX, probeY - 18);
    ctx.fillStyle = "rgba(125, 249, 255, 0.9)";
    ctx.fillText("VECTOR", probeX + 46, probeY - 18);
    featureVector.forEach((value, index) => {
      const y = probeY + index * barGap;
      const active = index === layerRef.current;
      ctx.fillStyle = "rgba(34, 44, 64, 0.72)";
      ctx.fillRect(probeX, y, barW, 2);
      ctx.fillStyle = active ? "rgba(245, 165, 36, 0.86)" : "rgba(125, 249, 255, 0.78)";
      ctx.fillRect(probeX, y, barW * clamp(value), 2);
      if (!mobile) {
        ctx.font = '8px ui-monospace, "JetBrains Mono", SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = active ? "rgba(245, 165, 36, 0.7)" : "rgba(147, 160, 180, 0.46)";
        ctx.fillText(VECTOR_LABELS[index], probeX + barW + 7, y + 1);
      }
    });
    ctx.restore();

    if (!reduced) animationRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [draw]);

  if (showMap) return <GatekptLanding locale={locale} />;

  return (
    <div className={styles.shell}>
      <section className={styles.hero} id="visual">
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <main className={styles.hud}>
          <header className={styles.topbar}>
            <div className={styles.mark}>GateKPT</div>
            <div className={styles.status}>{copy.status}</div>
          </header>

          <section className={styles.headline}>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
            <div className={styles.proofLanes} aria-label={copy.proofLabel}>
              {copy.proofLanes.map(([label, detail]) => (
                <span key={label}>
                  <strong>{label}</strong>
                  {detail}
                </span>
              ))}
            </div>
            <div className={styles.layers} aria-label={copy.layersLabel}>
              {layerNames.map((name, index) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={layer === index}
                  onMouseEnter={() => setLayer(index)}
                  onFocus={() => setLayer(index)}
                  onClick={() => setLayer(index)}
                >
                  L0{index + 1} {name}
                </button>
              ))}
            </div>
          </section>

          <nav className={styles.gateway} aria-label="Gateway links">
            <div className={styles.links}>
              <button type="button" onClick={() => setShowMap(true)}>{copy.openMap}</button>
              <a href={locale === "es" ? "/es/log" : "/log"}>{copy.notes}</a>
              <a href={locale === "es" ? "/es/log/coding-beats" : "/log/coding-beats"}>{copy.music}</a>
              <a href={copy.switchHref}>{copy.switchLabel}</a>
            </div>
          </nav>
        </main>
      </section>
    </div>
  );
}

export default GatekptHome;
