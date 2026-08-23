"use client";

import { useEffect, useRef, useState } from "react";
import { GatekptLanding } from "./GatekptLanding";
import styles from "./GatekptHome.module.css";

const LAYERS = ["Input", "Tokens", "Context", "Models", "Tools", "Chips", "Power"];

export function GatekptHome() {
  const [showMap, setShowMap] = useState(false);
  const [layer, setLayer] = useState(0);
  const [readout, setReadout] = useState("SEGMENTS   74\nSPEED_MAX 0.00 u/s\nFRAME      16.7 ms\nFIELD      fixed");
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
    const palette = ["#0E2A3A", "#22D3EE", "#7C5CE6", "#E838C8", "#F5A524"];
    let raf = 0;
    let last = performance.now();
    let maxSpeed = 0;

    function ramp(t: number) {
      const clamped = Math.max(0, Math.min(1, t));
      return palette[Math.min(palette.length - 1, Math.floor(clamped * palette.length))];
    }

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
      const dt = Math.max(1, now - last);
      last = now;
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
        context.fillStyle = ramp(0.18 + ((i % 7) / 10));
        context.fillRect(x, y, i % 9 === 0 ? 3 : 1.5, i % 9 === 0 ? 3 : 1.5);
      }

      context.save();
      context.translate(cx, cy);
      context.rotate(Math.sin(t * Math.PI * 0.25) * 0.08 + layerRef.current * 0.015);
      maxSpeed = 0;

      for (let i = 0; i < 74; i++) {
        const y = -1.82 + (i / 73) * 4.05;
        const p = profile(y);
        const band = (i / 73) * 6;
        const focus = Math.max(0, 1 - Math.abs(band - layerRef.current) / 1.35);
        const waveA = Math.sin(t * 0.77 + i * 0.19 * 1.618);
        const waveB = Math.sin(t * 1.246 + i * 0.19 * 0.73);
        const field = waveA * 0.065 + waveB * 0.05;
        const width = (p + focus * 0.2 + Math.abs(field)) * scale;
        const depth = (p * 0.55 + 0.08) * scale;
        const sy = y * scale * 0.86;
        maxSpeed = Math.max(maxSpeed, Math.abs(field) * 5.4 + focus * 0.18);

        context.beginPath();
        context.ellipse(Math.sin(t * 0.9 + i * 0.17) * 8, sy, width, depth, 0, 0, Math.PI * 2);
        context.strokeStyle = ramp(0.08 + focus * 0.72 + Math.abs(field) * 1.3);
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

      setReadout(
        `SEGMENTS   74\nSPEED_MAX ${maxSpeed.toFixed(2)} u/s\nFRAME      ${dt.toFixed(1)} ms\nFIELD      fixed`,
      );

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
            <div className={styles.status}>procedural · no training</div>
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
              <a href="#demo">What runs</a>
              <a href="#experience">Use cases</a>
              <a href="https://www.marcelozapata.dev/#malosound">MaloSound</a>
              <a href="https://www.marcelozapata.dev/#greenmachine">GreenMachine</a>
            </div>
            <pre className={styles.readout}>{readout}</pre>
          </nav>
        </main>
      </section>

      <article className={styles.proof}>
        <div className={styles.inner}>
          <section id="demo" className={styles.section}>
            <span className={styles.eyebrow}>What runs</span>
            <h2>A small visual system.</h2>
            <p className={styles.lead}>
              Canvas geometry. Fixed math. Layer controls. No hidden model.
            </p>
            <div className={styles.grid}>
              <div className={styles.card}>
                <h3>Signals</h3>
                <p>The controls bring one slice of the AI stack forward.</p>
              </div>
              <div className={styles.card}>
                <h3>Mapping</h3>
                <p>Motion and focus become color through a fixed palette function.</p>
              </div>
              <div className={styles.card}>
                <h3>Scope</h3>
                <p>The page shows the map. The articles do the teaching.</p>
              </div>
            </div>
          </section>

          <section id="experience" className={styles.section}>
            <span className={styles.eyebrow}>Use cases</span>
            <h2>How I work with AI.</h2>
            <p className={styles.lead}>
              Research, build, organize, test. GateKPT is the public notebook;
              the project links show where the work goes.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}

export default GatekptHome;
