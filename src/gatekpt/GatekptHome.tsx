"use client";

import { useEffect, useRef, useState } from "react";
import { GatekptLanding } from "./GatekptLanding";
import styles from "./GatekptHome.module.css";

const LAYERS = ["Input", "Tokens", "Context", "Models", "Tools", "Chips", "Power"];
const TAU = Math.PI * 2;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function oklchToRgb(l: number, c: number, h: number) {
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

function toCssRgb(linear: number[]) {
  const channels = linear.map((channel) => {
    const srgb = channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
    return Math.round(clamp(srgb) * 255);
  });
  return `rgb(${channels[0]} ${channels[1]} ${channels[2]})`;
}

function oklch(l: number, c: number, h: number) {
  let chroma = c;
  for (let i = 0; i < 8; i++) {
    const linear = oklchToRgb(l, chroma, h);
    if (linear.every((channel) => channel >= 0 && channel <= 1)) {
      return toCssRgb(linear);
    }
    chroma *= 0.82;
  }
  return toCssRgb(oklchToRgb(l, 0, h));
}

function skinColor(slice: number, focus: number, t: number) {
  const hueBase = (208 + t * 2.4) % 360;
  const travelingFront = 0.5 + 0.5 * Math.sin((slice * 0.35 - t / 11) * TAU);
  const light = 0.58 + travelingFront * 0.13 + focus * 0.05;
  const chroma = 0.1 + travelingFront * 0.055 + focus * 0.025;
  const hue = hueBase + travelingFront * 55 + focus * 8;
  return oklch(light, chroma, hue);
}

export function GatekptHome() {
  const [showMap, setShowMap] = useState(false);
  const [layer, setLayer] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layerRef = useRef(0);

  useEffect(() => {
    layerRef.current = layer;
  }, [layer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const canvasEl = canvas;
    const context = ctx;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 2);
      canvasEl.width = Math.floor(window.innerWidth * dpr);
      canvasEl.height = Math.floor(window.innerHeight * dpr);
      canvasEl.style.width = `${window.innerWidth}px`;
      canvasEl.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function profile(y: number) {
      const n = (y + 2) / 4.25;
      const torso = Math.exp(-Math.pow((n - 0.46) / 0.24, 2)) * 0.72;
      const chest = Math.exp(-Math.pow((n - 0.63) / 0.14, 2)) * 0.3;
      const head = Math.exp(-Math.pow((n - 0.88) / 0.09, 2)) * 0.46;
      const hips = Math.exp(-Math.pow((n - 0.28) / 0.1, 2)) * 0.42;
      return Math.max(0.05, torso + chest + head + hips);
    }

    function draw(now: number) {
      const t = reduced ? 6 : now / 1000;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 760;
      const cx = mobile ? w * 0.52 : w * 0.56;
      const cy = mobile ? h * 0.7 : h * 0.72;
      const scale = mobile ? Math.min(w * 0.38, 180) : Math.min(w * 0.18, 260);

      context.clearRect(0, 0, w, h);
      context.fillStyle = "#02050a";
      context.fillRect(0, 0, w, h);

      context.globalAlpha = 0.55;
      for (let i = 0; i < (mobile ? 60 : 180); i++) {
        const a = i * 12.9898;
        const x = (Math.sin(a) * 0.5 + 0.5) * w;
        const y = (Math.sin(a * 1.73 + 4.2) * 0.5 + 0.5) * h;
        context.fillStyle = i % 11 === 0 ? "rgba(125, 249, 255, 0.72)" : "rgba(169, 180, 198, 0.42)";
        context.fillRect(x, y, i % 9 === 0 ? 3 : 1.5, i % 9 === 0 ? 3 : 1.5);
      }

      context.save();
      context.translate(cx, cy);
      context.rotate(Math.sin(t * Math.PI * 0.25) * 0.08 + layerRef.current * 0.015);

      for (let i = 0; i < 74; i++) {
        const y = -1.82 + (i / 73) * 4.05;
        const slice = i / 73;
        const p = profile(y);
        const band = (i / 73) * 6;
        const focus = Math.max(0, 1 - Math.abs(band - layerRef.current) / 1.35);
        const waveA = Math.sin(t * 0.77 + i * 0.19 * 1.618);
        const waveB = Math.sin(t * 1.246 + i * 0.19 * 0.73);
        const field = waveA * 0.065 + waveB * 0.05;
        const width = (p + focus * 0.2 + Math.abs(field)) * scale;
        const depth = (p * 0.55 + 0.08) * scale;
        const sy = y * scale * 0.86;
        context.beginPath();
        context.ellipse(Math.sin(t * 0.9 + i * 0.17) * 8, sy, width, depth, 0, 0, Math.PI * 2);
        context.strokeStyle = skinColor(slice, focus, t);
        context.globalAlpha = 0.16 + focus * 0.68;
        context.lineWidth = focus > 0.45 ? 1.25 : 0.7;
        context.stroke();
      }

      context.globalAlpha = 0.42;
      context.strokeStyle = "#F5A524";
      context.lineWidth = 1;
      context.beginPath();
      context.ellipse(0, -scale * 0.22, scale * 1.5, scale * 0.22, -0.22, 0, Math.PI * 2);
      context.stroke();
      context.restore();

      if (!reduced) raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (showMap) return <GatekptLanding />;

  return (
    <div className={styles.shell}>
      <section className={styles.hero} id="visual">
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <main className={styles.hud}>
          <header className={styles.topbar}>
            <div className={styles.mark}>GateKPT</div>
            <div className={styles.status}>live map</div>
          </header>

          <section className={styles.headline}>
            <h1>AI from the text box out.</h1>
            <p>Seven layers behind one prompt.</p>
            <div className={styles.layers} aria-label="AI layers">
              {LAYERS.map((name, index) => (
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
              <button type="button" onClick={() => setShowMap(true)}>Open map</button>
              <a href="/notes">Notes</a>
              <a href="https://www.marcelozapata.dev/#malosound">MaloSound</a>
              <a href="https://www.marcelozapata.dev/#greenmachine">GreenMachine</a>
            </div>
          </nav>
        </main>
      </section>
    </div>
  );
}

export default GatekptHome;
