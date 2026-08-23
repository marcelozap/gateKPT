"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GatekptLanding } from "./GatekptLanding";
import styles from "./GatekptHome.module.css";

type AudioAnalysis = {
  source_name?: string;
  duration_s?: number;
  duration?: number;
  bpm?: number;
  beat_times: number[];
  downbeat_times: number[];
  energy_curve: { hop_s?: number; rms: number[] };
  band_energy: { hop_s?: number; values: number[][] };
};

const LAYERS = ["Input", "Tokens", "Context", "Models", "Tools", "Chips", "Power"];
const ANALYSIS_FILES = [
  "/gateway/gateway_track_alt_mj.audioanalysis.v1.json",
  "/gateway/gateway_track.audioanalysis.v1.json",
];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function valueAt(analysis: AudioAnalysis, t: number) {
  const hop = analysis.energy_curve.hop_s || 0.5;
  const values = analysis.energy_curve.rms;
  const index = Math.max(0, Math.min(values.length - 1, Math.floor(t / hop)));
  const max = Math.max(...values, 0.001);
  return values[index] / max;
}

function bandsAt(analysis: AudioAnalysis, t: number) {
  const hop = analysis.band_energy.hop_s || 0.5;
  const rows = analysis.band_energy.values;
  const index = Math.max(0, Math.min(rows.length - 1, Math.floor(t / hop)));
  const max = Math.max(...rows.flat(), 0.001);
  return rows[index].slice(0, 8).map((value) => value / max);
}

async function loadAnalysis() {
  for (const file of ANALYSIS_FILES) {
    try {
      const response = await fetch(file, { cache: "no-store" });
      if (!response.ok) continue;
      const next = (await response.json()) as AudioAnalysis;
      if (Array.isArray(next.beat_times) && Array.isArray(next.band_energy?.values)) return next;
    } catch {
      // Try the next contract. The canvas has an honest idle state if none load.
    }
  }
  return null;
}

export function GatekptHome() {
  const [showMap, setShowMap] = useState(false);
  const [layer, setLayer] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analysisRef = useRef<AudioAnalysis | null>(null);
  const animationRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const layerRef = useRef(0);
  const beatRef = useRef({ beat: -1, downbeat: -1, beatFlash: 0, downbeatFlash: 0 });

  useEffect(() => {
    layerRef.current = layer;
  }, [layer]);

  useEffect(() => {
    let cancelled = false;
    startRef.current = performance.now();

    loadAnalysis().then((analysis) => {
      if (!cancelled) analysisRef.current = analysis;
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, width < 760 ? 1.5 : 2);

    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = reduced ? 12 : now / 1000;
    const analysis = analysisRef.current;
    const mobile = width < 760;
    const cx = mobile ? width * 0.52 : width * 0.62;
    const cy = mobile ? height * 0.63 : height * 0.54;
    const size = Math.min(width, height);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#02050a";
    ctx.fillRect(0, 0, width, height);

    const atmosphere = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.78);
    atmosphere.addColorStop(0, "rgba(125, 249, 255, 0.16)");
    atmosphere.addColorStop(0.36, "rgba(124, 92, 230, 0.075)");
    atmosphere.addColorStop(0.72, "rgba(255, 45, 149, 0.035)");
    atmosphere.addColorStop(1, "rgba(2, 5, 10, 0)");
    ctx.fillStyle = atmosphere;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < (mobile ? 52 : 140); i++) {
      const seed = i * 19.1987;
      const x = (Math.sin(seed) * 0.5 + 0.5) * width;
      const y = (Math.sin(seed * 1.41 + 2.7) * 0.5 + 0.5) * height;
      ctx.globalAlpha = i % 13 === 0 ? 0.48 : 0.22;
      ctx.fillStyle = i % 13 === 0 ? "#7df9ff" : "#93a0b4";
      ctx.fillRect(x, y, i % 13 === 0 ? 2 : 1, i % 13 === 0 ? 2 : 1);
    }

    const duration = analysis?.duration_s || analysis?.duration || 60;
    const elapsed = analysis ? ((now - startRef.current) / 1000) % duration : t % 60;
    const energy = analysis ? clamp(valueAt(analysis, elapsed)) : 0.42 + Math.sin(t * 0.8) * 0.08;
    const bands = analysis ? bandsAt(analysis, elapsed) : new Array(8).fill(0.28);
    const state = beatRef.current;

    if (analysis) {
      const beatIndex = analysis.beat_times.findIndex((beat) => beat > elapsed) - 1;
      const downbeatIndex = analysis.downbeat_times.findIndex((beat) => beat > elapsed) - 1;
      if (beatIndex >= 0 && beatIndex !== state.beat) {
        state.beat = beatIndex;
        state.beatFlash = 1;
      }
      if (downbeatIndex >= 0 && downbeatIndex !== state.downbeat) {
        state.downbeat = downbeatIndex;
        state.downbeatFlash = 1;
      }
    } else {
      state.beatFlash = 0.25 + Math.sin(t * 1.1) * 0.1;
      state.downbeatFlash = 0.12 + Math.sin(t * 0.35) * 0.08;
    }

    state.beatFlash *= 0.88;
    state.downbeatFlash *= 0.84;

    const layerFocus = layerRef.current / Math.max(1, LAYERS.length - 1);
    const core = size * (0.14 + energy * 0.055 + state.downbeatFlash * 0.035);
    const outer = core * (1.62 + layerFocus * 0.16);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(elapsed * 0.038 + layerFocus * 0.32);

    for (let i = 0; i < 8; i++) {
      const band = clamp(bands[i] ?? 0);
      const angle = (i / 8) * Math.PI * 2;
      const length = core * (1.1 + band * 1.55 + state.beatFlash * 0.18);
      const inner = core * (0.42 + layerFocus * 0.08);
      const x1 = Math.cos(angle) * inner;
      const y1 = Math.sin(angle) * inner;
      const x2 = Math.cos(angle) * length;
      const y2 = Math.sin(angle) * length;
      const cyan = i % 2 === 0;

      ctx.strokeStyle = cyan
        ? `rgba(125, 249, 255, ${0.18 + band * 0.58})`
        : `rgba(244, 248, 252, ${0.16 + band * 0.46})`;
      ctx.lineWidth = 1.2 + band * 4.8 + state.downbeatFlash * 2.6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(244, 248, 252, ${0.34 + state.beatFlash * 0.34})`;
    ctx.lineWidth = 1.5 + state.downbeatFlash * 7;
    ctx.beginPath();
    ctx.arc(0, 0, core, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(125, 249, 255, ${0.16 + energy * 0.32})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, outer, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.18 + energy * 0.22;
    ctx.strokeStyle = "#f5a524";
    ctx.beginPath();
    ctx.ellipse(0, core * 0.08, outer * 1.18, outer * 0.18, -0.24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const scanY = (elapsed / duration) * height;
    ctx.globalAlpha = 0.08 + state.downbeatFlash * 0.24;
    ctx.fillStyle = "#ffb020";
    ctx.fillRect(0, scanY, width, 2 + state.downbeatFlash * 8);
    ctx.globalAlpha = 1;

    if (!reduced) animationRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [draw]);

  if (showMap) return <GatekptLanding />;

  return (
    <div className={styles.shell}>
      <section className={styles.hero} id="visual">
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <main className={styles.hud}>
          <header className={styles.topbar}>
            <div className={styles.mark}>GateKPT</div>
            <div className={styles.status}>analysis v1</div>
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
