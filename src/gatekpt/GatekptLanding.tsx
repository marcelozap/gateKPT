"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LAYERS } from "./stack";

type Phase = "boot" | "run" | "end";
const FADE = 130; // must match .gki-slot.out transition in globals.css

export function GatekptLanding() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [li, setLi] = useState(0);
  const [bi, setBi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const [mapOpen, setMapOpen] = useState(false);
  const [fading, setFading] = useState(false);
  const [sweep, setSweep] = useState(0);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answered = picked !== null;
  const layer = LAYERS[li];

  /* body gets the instrument class: no scroll, dark base.
     Reading routes (/briefs, /work) must NOT set this. */
  useEffect(() => {
    document.body.classList.add("gk-instrument");
    return () => document.body.classList.remove("gk-instrument");
  }, []);

  const go = useCallback((fn: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    setFading(true);
    timer.current = setTimeout(() => {
      fn();
      setFading(false);
      setSweep((s) => s + 1);
    }, FADE);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const next = useCallback(() => {
    if (phase === "boot") { go(() => { setPhase("run"); setLi(0); setBi(0); setPicked(null); }); return; }
    if (phase === "end") return;
    if (bi === 3 && !answered) return;              // <- the gate
    if (bi < 3) { go(() => setBi((b) => b + 1)); return; }
    if (li < LAYERS.length - 1) { go(() => { setLi((l) => l + 1); setBi(0); setPicked(null); }); return; }
    go(() => setPhase("end"));
  }, [phase, bi, li, answered, go]);

  const prev = useCallback(() => {
    if (phase !== "run") return;
    if (bi > 0) { go(() => { setBi((b) => b - 1); setPicked(null); }); return; }
    if (li > 0) { go(() => { setLi((l) => l - 1); setBi(3); setPicked(null); }); return; }
    go(() => setPhase("boot"));
  }, [phase, bi, li, go]);

  const jump = useCallback((n: number) => {
    if (n < 0 || n >= LAYERS.length) return;
    setMapOpen(false);
    go(() => { setPhase("run"); setLi(n); setBi(0); setPicked(null); });
  }, [go]);

  /* fading guard: a keypress mid-transition must not open the gate
     without an answer ever being recorded */
  const choose = useCallback((i: number) => {
    if (phase !== "run" || bi !== 3 || answered || fading) return;
    setPicked(i);
    setSeen((s) => new Set(s).add(li));
  }, [phase, bi, answered, fading, li]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === "Escape") { e.preventDefault(); setMapOpen((m) => !m); return; }
      if (mapOpen) { if (/^[1-7]$/.test(k)) jump(Number(k) - 1); return; }
      if (k === " " || k === "ArrowRight" || k === "Enter") { e.preventDefault(); next(); }
      else if (k === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (k === "a" || k === "A") choose(0);
      else if (k === "b" || k === "B") choose(1);
      else if (/^[1-7]$/.test(k)) jump(Number(k) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mapOpen, next, prev, choose, jump]);

  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    return () => {
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
    };
  }, []);

  useEffect(() => {
    let sx = 0, sy = 0;
    const start = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const end = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = Math.abs(e.changedTouches[0].clientY - sy);
      if (Math.abs(dx) > 48 && dy < 70) {
        if (dx < 0) next(); else prev();
      }
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchend", end);
    };
  }, [next, prev]);

  const where = phase === "boot" ? "SEVEN LAYERS"
              : phase === "end"  ? "COMPLETE"
              : `${layer.id}  -  ${layer.name.toUpperCase()}`;
  const count = phase === "boot" ? "NOT STARTED"
              : phase === "end"  ? "07 / 07"
              : `${String(li + 1).padStart(2, "0")} / 07`;
  const gateHeld = phase === "run" && bi === 3 && answered;

  const body = () => {
    if (phase === "boot") return (
      <>
        <span className="gki-kicker gki-mono">GateKPT  -  Stack Trainer</span>
        <p className="gki-essence">The AI stack has seven layers. Hold all seven.</p>
        <div className="gki-actions">
          <button className="gki-go" onClick={(e) => { e.stopPropagation(); next(); }}>
            Begin - L01
          </button>
          <button className="gki-ghost gki-mono" onClick={(e) => { e.stopPropagation(); setMapOpen(true); }}>
            See the map
          </button>
        </div>
      </>
    );

    if (phase === "end") return (
      <>
        <span className="gki-kicker gki-mono">L01 - L07  -  Complete</span>
        <p className="gki-doneh">You now hold the whole ladder.</p>
        <p className="gki-donep">
          Seven layers, seven anchors, seven failure modes. Each layer constrains the
          ones above it - that relationship is the thing worth keeping.
        </p>
        <div className="gki-actions">
          <button
            className="gki-go"
            onClick={(e) => { e.stopPropagation(); setMapOpen(true); }}
          >
            Open the map
          </button>
          <button
            className="gki-ghost gki-mono"
            onClick={(e) => {
              e.stopPropagation();
              setSeen(new Set());
              go(() => { setPhase("run"); setLi(0); setBi(0); setPicked(null); });
            }}
          >
            Run it again
          </button>
        </div>
      </>
    );

    if (bi === 0) return (
      <>
        <span className="gki-kicker gki-mono">{layer.id} - {layer.name}</span>
        <p className="gki-essence">{layer.essence}</p>
      </>
    );

    if (bi === 1) return (
      <>
        <span className="gki-kicker gki-mono">The anchor</span>
        <p className="gki-figure gki-mono">
          {layer.fig}<span className="gki-unit">{layer.unit}</span>
        </p>
        <p className="gki-figcap">{layer.figcap}</p>
        <a
          className="gki-src gki-mono"
          href={layer.srcUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {layer.src}
        </a>
      </>
    );

    if (bi === 2) return (
      <>
        <span className="gki-kicker gki-mono">What breaks</span>
        <p className="gki-breaks" dangerouslySetInnerHTML={{ __html: layer.brk }} />
      </>
    );

    return (
      <>
        <span className="gki-kicker gki-mono">Check - answer to continue</span>
        <p className="gki-q">{layer.q}</p>
        <div className="gki-opts">
          {layer.a.map((text, i) => (
            <button
              key={i}
              className={
                "gki-opt" +
                (answered && i === layer.right ? " right" : "") +
                (answered && i === picked && i !== layer.right ? " wrong" : "")
              }
              disabled={answered}
              onClick={(e) => { e.stopPropagation(); choose(i); }}
            >
              <span className="gki-key gki-mono">{i === 0 ? "A" : "B"}</span>
              <span>{text}</span>
            </button>
          ))}
        </div>
        {answered && (
          <p className={"gki-verdict" + (picked === layer.right ? "" : " miss")}>
            {layer.why}
          </p>
        )}
      </>
    );
  };

  return (
    <div
      onClick={() => { if (mapOpen) { setMapOpen(false); return; } next(); }}
      role="application"
      aria-label="GateKPT stack trainer"
    >
      {/* Decorative atmosphere. */}
      <div className="gki-atmos" aria-hidden="true">
        <div className="gki-bloom xb1" />
        <div className="gki-bloom xb2" />
        <div className="gki-bloom xb3" />
        <div className="gki-bloom xb4" />
        <div className="gki-bloom xb5" />
        <div className="gki-signage" />
        <div className="gki-substrate" />
        <div className="gki-vignette" />
      </div>
      <svg className="gki-grain" aria-hidden="true">
        <filter id="gki-grain-f">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" />
        </filter>
        <rect width="100%" height="100%" filter="url(#gki-grain-f)" />
      </svg>

      {/* Peripheral chrome. */}
      <div className="gki-edge gki-mono" style={{ top: 26, left: 30, display: "flex", alignItems: "center", gap: 9 }}>
        <span className="gki-mark" />
        <span style={{ color: "var(--focal)", letterSpacing: "0.2em" }}>GATEKPT</span>
      </div>
      <div className="gki-edge gki-mono" style={{ top: 26, right: 30 }}>{where}</div>
      <div className="gki-edge gki-mono" style={{ bottom: 26, left: 30 }}>{count}</div>
      <div className={"gki-hint gki-mono" + (gateHeld ? " lit" : "")}>
        {gateHeld ? "Space  -  next layer" : "Space  -  advance    Esc  -  map"}
      </div>

      <div className="gki-pips" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={phase === "run" && i === bi ? "now" : ""} />
        ))}
      </div>
      <div className="gki-ladder" aria-hidden="true">
        {LAYERS.map((_, i) => (
          <i key={i} className={
            phase === "end" ? "done"
            : phase !== "run" ? ""
            : i < li ? "done" : i === li ? "now" : ""
          } />
        ))}
      </div>

      {/* Focal frame. */}
      <div className="gki-stage">
        <div className="gki-frame">
          <span className="gki-tick xt-a" /><span className="gki-tick xt-b" />
          <span className="gki-tick xt-c" /><span className="gki-tick xt-d" />
          <span key={sweep} className="gki-visor" />
          <div className={"gki-slot" + (fading ? " out" : "")} aria-live="polite">
            {body()}
          </div>
        </div>
      </div>

      {/* Recognition map. */}
      <div
        className={"gki-map" + (mapOpen ? " on" : "")}
        role="dialog"
        aria-label="Layer map"
        aria-hidden={!mapOpen}
      >
        <div>
          {LAYERS.map((l, i) => (
            <div
              key={l.id}
              className={
                "gki-maprow gki-mono" +
                (phase === "run" && i === li ? " now" : "") +
                (seen.has(i) ? " seen" : "")
              }
              onClick={(e) => { e.stopPropagation(); jump(i); }}
            >
              <span className="gki-lid">{l.id}</span>
              <span>{l.name}</span>
              <span className="gki-st">{seen.has(i) ? "OK held" : "-"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GatekptLanding;
