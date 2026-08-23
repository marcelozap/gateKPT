"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type GatewayData = {
  beat_times: number[];
  downbeat_times: number[];
  energy_curve: { hop_s: number; rms: number[] };
  band_energy: { values: number[][] };
};

const W = 860;
const H = 380;
const LOOP = 60;
const gatewayFile = "/gateway/gateway_track_alt_mj.audioanalysis.v1.json";

function startMachine(canvas: HTMLCanvasElement, data: GatewayData, reduced: boolean) {
  const context = canvas.getContext("2d");
  if (!context) return null;
  const g: CanvasRenderingContext2D = context;

  const chMax = Array.from({ length: 8 }, (_, channel) =>
    Math.max(...data.band_energy.values.map((row) => row[channel] ?? 0), 0.001),
  );
  const norm = (value: number, channel: number) => Math.log1p(value) / Math.log1p(chMax[channel]);
  const rmsMax = Math.max(...data.energy_curve.rms, 0.001);
  const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

  function envAt(times: number[], t: number, attack: number, decay: number) {
    let envelope = 0;
    for (const time of times) {
      const delta = t - time;
      if (delta >= 0 && delta < decay) envelope = Math.max(envelope, 1 - delta / decay);
      else if (delta < 0 && -delta < attack) envelope = Math.max(envelope, 0.25 * (1 + delta / attack));
    }
    return envelope;
  }

  function rowAt(t: number) {
    const x = t / data.energy_curve.hop_s;
    const i = Math.min(data.band_energy.values.length - 1, Math.max(0, Math.floor(x)));
    const j = Math.min(data.band_energy.values.length - 1, i + 1);
    const f = x - i;
    return data.band_energy.values[i].map((value, channel) => value * (1 - f) + data.band_energy.values[j][channel] * f);
  }

  function draw(t: number) {
    g.globalAlpha = 0.66;
    const beatE = envAt(data.beat_times, t, 0.06, 0.34);
    const downE = envAt(data.downbeat_times, t, 0.08, 0.55);
    const ri = Math.min(data.energy_curve.rms.length - 1, Math.max(0, t / data.energy_curve.hop_s));
    const rms =
      lerp(
        data.energy_curve.rms[Math.floor(ri)],
        data.energy_curve.rms[Math.min(data.energy_curve.rms.length - 1, Math.ceil(ri))],
        ri % 1,
      ) / rmsMax;
    const row = rowAt(t);

    g.clearRect(0, 0, W, H);

    const glow = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 330);
    glow.addColorStop(0, `rgba(143,240,255,${0.05 + 0.1 * rms + 0.06 * downE})`);
    glow.addColorStop(1, "rgba(143,240,255,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, W, H);

    const bx = 120;
    const bw = W - 240;
    const by = 96;
    const bh = 190;
    const chrome = g.createLinearGradient(0, by, 0, by + bh);
    chrome.addColorStop(0, "rgba(233,233,242,0.16)");
    chrome.addColorStop(0.5, "rgba(92,92,108,0.06)");
    chrome.addColorStop(1, "rgba(233,233,242,0.11)");
    g.fillStyle = chrome;
    g.strokeStyle = "rgba(233,233,242,0.28)";
    g.lineWidth = 1;
    g.fillRect(bx, by, bw, bh);
    g.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

    const pad = 26;
    const chW = 26;
    const gap = (bw - 2 * pad - 8 * chW) / 7;
    for (let channel = 0; channel < 8; channel += 1) {
      const x = bx + pad + channel * (chW + gap);
      const value = norm(row[channel], channel);
      const slotH = bh - 52;
      g.strokeStyle = "rgba(233,233,242,0.14)";
      g.strokeRect(x + 0.5, by + 26.5, chW - 1, slotH - 1);
      const hgt = Math.max(2, value * (slotH - 6));
      g.fillStyle = `rgba(143,240,255,${0.35 + 0.55 * value})`;
      g.fillRect(x + 3, by + 26 + (slotH - 3) - hgt, chW - 6, hgt);
      g.strokeStyle = "rgba(6,6,11,0.65)";
      for (let segment = 1; segment < 9; segment += 1) {
        const sy = by + 26 + (slotH * segment) / 9;
        g.beginPath();
        g.moveTo(x + 3, sy);
        g.lineTo(x + chW - 3, sy);
        g.stroke();
      }
    }

    const cy = H / 2;
    for (const rx of [62, W - 62]) {
      g.beginPath();
      g.arc(rx, cy, 34 + 10 * beatE + 6 * downE, 0, Math.PI * 2);
      g.strokeStyle = `rgba(143,240,255,${0.25 + 0.6 * beatE})`;
      g.lineWidth = 2;
      g.stroke();

      g.beginPath();
      g.arc(rx, cy, 12 + 5 * downE, 0, Math.PI * 2);
      g.fillStyle = downE > 0.02 ? `rgba(226,107,210,${0.35 + 0.55 * downE})` : "rgba(233,233,242,0.25)";
      g.fill();
    }

    g.globalAlpha = 1;
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
  const [missingContract, setMissingContract] = useState(false);

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
        const response = await window.fetch(gatewayFile, { cache: "no-store" });
        if (!response.ok) throw new Error("contract file missing");
        const data = (await response.json()) as GatewayData;
        if (!cancelled) {
          setMissingContract(false);
          const machineCleanup = startMachine(currentCanvas, data, reduced);
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
  }, []);

  return (
    <>
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
              aria-label="A quiet chrome machine pulsing with the site's music."
            />
            {missingContract ? <span className="gkp-contract-missing">contract file missing</span> : null}
          </div>
          <h1 className="gkp-site-line">AI from the physical layer up.</h1>
          <p className="gkp-site-sub">Notes written while building, not after.</p>
        </div>

        <nav className="gkp-gates" aria-label="primary">
          <Link className="gkp-gate" href="/notes">
            READ NOTES
          </Link>
          <Link className="gkp-gate" href="/log">
            FIELD LOG
          </Link>
          <Link className="gkp-gate" href="/gatekpt">
            THE AI STACK
          </Link>
        </nav>

        <p className="gkp-machine-hint">
          <Link href="/notes/the-machine">runs on a song I made -&gt;</Link>
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
