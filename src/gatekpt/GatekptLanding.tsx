"use client";

/* -------------------------------------------------------------------
   GateKPT - the map.

   WAS: 4 beats x 7 layers = 28 states. That was tuned for retention,
   which is the wrong goal. This is free reference knowledge, and
   making someone click 28 times to read seven facts works against it.

   NOW: one layer = one screen. 7 screens. Essence, number, source and
   failure mode are all visible together, because they are one idea
   about one layer, not four.

   This is a public reference map, not an exam. Nothing is withheld.
   ------------------------------------------------------------------- */

import { useCallback, useEffect, useRef, useState } from "react";
import { LAYERS } from "./stack";

type Phase = "boot" | "run" | "end";
const FADE = 130; // must match .gki-slot.out transition in globals.css

const JOURNAL_ENTRIES = [
  {
    date: "2026-08-09",
    title: "AI stack ground map",
    layer: "L01-L07",
    summary: "A first public version of the system map: power, chips, data, models, software, evaluation, and business context.",
  },
  {
    date: "2026-08-09",
    title: "Why power comes first",
    layer: "L01 Power",
    summary: "AI is not only software. Compute depends on electricity, cooling, sites, interconnect, and physical buildout timelines.",
  },
  {
    date: "2026-08-09",
    title: "Data before model behavior",
    layer: "L03 Data",
    summary: "A model can only reason over what has been structured, linked, governed, retrieved, and trusted enough to use.",
  },
  {
    date: "Planned",
    title: "Prompting as work design",
    layer: "Prompt lab",
    summary: "A practical guide for turning loose requests into context, constraints, examples, output formats, and verification steps.",
  },
  {
    date: "Planned",
    title: "Weekly AI brief format",
    layer: "Briefs",
    summary: "A recurring note format for tracking what changed, why it matters, and which layer of the stack it touches.",
  },
] as const;

export function GatekptLanding() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [li, setLi] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const [mapOpen, setMapOpen] = useState(false);
  const [entriesOpen, setEntriesOpen] = useState(false);
  const [fading, setFading] = useState(false);
  const [sweep, setSweep] = useState(0);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layer = LAYERS[li];

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
    if (phase === "boot") {
      go(() => {
        setPhase("run");
        setLi(0);
        setSeen((s) => new Set(s).add(0));
      });
      return;
    }
    if (phase === "end") return;
    if (li < LAYERS.length - 1) {
      const n = li + 1;
      go(() => {
        setLi(n);
        setSeen((s) => new Set(s).add(n));
      });
      return;
    }
    go(() => setPhase("end"));
  }, [phase, li, go]);

  const prev = useCallback(() => {
    if (phase !== "run") return;
    if (li > 0) {
      const n = li - 1;
      go(() => {
        setLi(n);
        setSeen((s) => new Set(s).add(n));
      });
      return;
    }
    go(() => setPhase("boot"));
  }, [phase, li, go]);

  const jump = useCallback((n: number) => {
    if (n < 0 || n >= LAYERS.length) return;
    setMapOpen(false);
    go(() => {
      setPhase("run");
      setLi(n);
      setSeen((s) => new Set(s).add(n));
    });
  }, [go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (entriesOpen) { if (k === "Escape") setEntriesOpen(false); return; }
      if (k === "Escape") { e.preventDefault(); setMapOpen((m) => !m); return; }
      if (mapOpen) { if (/^[1-7]$/.test(k)) jump(Number(k) - 1); return; }
      if (k === " " || k === "ArrowRight" || k === "Enter") { e.preventDefault(); next(); }
      else if (k === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (/^[1-7]$/.test(k)) jump(Number(k) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entriesOpen, mapOpen, next, prev, jump]);

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
      if (Math.abs(dx) > 48 && dy < 70) { if (dx < 0) next(); else prev(); }
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchend", end);
    };
  }, [next, prev]);

  const where = phase === "boot" ? "SEVEN LAYERS"
              : phase === "end"  ? "END OF MAP"
              : `${layer.id}  -  ${layer.name.toUpperCase()}`;
  const count = phase === "boot" ? "START"
              : phase === "end"  ? "07 / 07"
              : `${String(li + 1).padStart(2, "0")} / 07`;

  const body = () => {
    if (phase === "boot") return (
      <div className="gki-home">
        <section className="gki-home-main">
          <span className="gki-kicker gki-mono">GateKPT</span>
          <p className="gki-essence">AI from the physical layer up.</p>
          <p className="gki-donep">
            A public research terminal for understanding what actually runs modern
            AI: infrastructure, data, models, deployment, evaluation, and business context.
          </p>
          <div className="gki-actions">
            <button type="button" className="gki-go" onClick={(e) => { e.stopPropagation(); setEntriesOpen(true); }}>
              Open field log
            </button>
            <button type="button" className="gki-ghost gki-mono" onClick={(e) => { e.stopPropagation(); next(); }}>
              Explore map
            </button>
            <button type="button" className="gki-ghost gki-mono" onClick={(e) => { e.stopPropagation(); setMapOpen(true); }}>
              Layers
            </button>
          </div>
        </section>

        <aside className="gki-home-log" aria-label="Recent field log entries">
          <div className="gki-home-log-head">
            <span className="gki-kicker gki-mono">Field log</span>
            <button type="button" className="gki-mini gki-mono" onClick={(e) => { e.stopPropagation(); setEntriesOpen(true); }}>
              View all
            </button>
          </div>
          <div className="gki-home-log-list">
            {JOURNAL_ENTRIES.slice(0, 3).map((entry) => (
              <button
                type="button"
                key={`${entry.date}-${entry.title}`}
                className="gki-home-entry"
                onClick={(e) => { e.stopPropagation(); setEntriesOpen(true); }}
              >
                <span className="gki-entry-id gki-mono">{entry.date}</span>
                <strong>{entry.title}</strong>
                <span>{entry.summary}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    );

    if (phase === "end") return (
      <>
        <span className="gki-kicker gki-mono">L01 - L07</span>
        <p className="gki-doneh">The stack is physical, logical, and human.</p>
        <p className="gki-donep">
          Each layer limits the ones above it. Power sets what chips can run,
          chips set what models cost, and human workflows decide whether any of it matters.
        </p>
        <div className="gki-actions">
          <button type="button" className="gki-go" onClick={(e) => { e.stopPropagation(); setMapOpen(true); }}>
            Back to the layers
          </button>
          <button
            type="button"
            className="gki-ghost gki-mono"
            onClick={(e) => { e.stopPropagation(); go(() => { setPhase("run"); setLi(0); }); }}
          >
            Start over
          </button>
        </div>
      </>
    );

    /* ONE LAYER, ONE SCREEN.
       Left column carries the idea, right column carries the evidence.
       The essence holds peak contrast; the number is large but rendered
       in accent, so size creates the hierarchy instead of a second
       competing --focal element. */
    return (
      <>
        <span className="gki-kicker gki-mono">{layer.id} - {layer.name}</span>

        <div className="gki-layer">
          <div className="gki-layer-main">
            <p className="gki-essence">{layer.essence}</p>
            <p className="gki-breaks" dangerouslySetInnerHTML={{ __html: layer.brk }} />
          </div>

          <div className="gki-layer-fig">
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
          </div>
        </div>

      </>
    );
  };

  return (
    <div
      onClick={() => { if (mapOpen) setMapOpen(false); }}
      role="application"
      aria-label="GateKPT AI stack map"
    >
      <div className="gki-atmos" aria-hidden="true">
        <div className="gki-bloom xb1" /><div className="gki-bloom xb2" />
        <div className="gki-bloom xb3" /><div className="gki-bloom xb4" />
        <div className="gki-bloom xb5" />
        <div className="gki-rain" />
        <div className="gki-signage" /><div className="gki-substrate" /><div className="gki-vignette" />
      </div>
      <svg className="gki-grain" aria-hidden="true">
        <filter id="gki-grain-f">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" />
        </filter>
        <rect width="100%" height="100%" filter="url(#gki-grain-f)" />
      </svg>

      <div className="gki-loadscreen" aria-hidden="true">
        <div className="gki-loadmark gki-mono">
          <span>GATEKPT</span>
          <i />
          <small>FIELD LOG ONLINE</small>
        </div>
      </div>

      <div className="gki-edge gki-mono" style={{ top: 26, left: 30, display: "flex", alignItems: "center", gap: 9 }}>
        <span className="gki-mark" />
        <span style={{ color: "var(--focal)", letterSpacing: "0.2em" }}>GATEKPT</span>
      </div>
      <div className="gki-edge gki-mono" style={{ top: 26, right: 30 }}>{where}</div>
      <div className="gki-edge gki-mono" style={{ bottom: 26, left: 30 }}>{count}</div>
      <div className="gki-hint gki-mono">Space  -  next    Esc  -  all layers</div>
      <div className="gki-controls gki-mono" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={prev} disabled={phase === "boot"}>
          Back
        </button>
        <button type="button" onClick={() => setEntriesOpen(true)}>
          Log
        </button>
        <button type="button" onClick={() => setMapOpen(true)}>
          Layers
        </button>
        <button type="button" onClick={next} disabled={phase === "end"}>
          Forward
        </button>
      </div>

      {/* Beat pips removed - there are no beats now, only layers. */}
      <div className="gki-ladder" aria-hidden="true">
        {LAYERS.map((_, i) => (
          <i key={i} className={
            phase === "end" ? "done"
            : phase !== "run" ? ""
            : i < li ? "done" : i === li ? "now" : ""
          } />
        ))}
      </div>

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

      <div
        className={"gki-map" + (mapOpen ? " on" : "")}
        role="dialog"
        aria-label="All layers"
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
              <span className="gki-st">{l.fig}{l.unit}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className={"gki-entries" + (entriesOpen ? " on" : "")}
        role="dialog"
        aria-label="GateKPT entries"
        aria-hidden={!entriesOpen}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gki-entries-panel">
          <div className="gki-entries-head">
            <div>
              <span className="gki-kicker gki-mono">Entries</span>
              <h2>Field log and layer notes.</h2>
            </div>
            <button type="button" className="gki-ghost gki-mono" onClick={() => setEntriesOpen(false)}>
              Close
            </button>
          </div>
          <div className="gki-journal-list">
            {JOURNAL_ENTRIES.map((entry) => (
              <article key={`${entry.date}-${entry.title}`} className="gki-journal-card">
                <span className="gki-entry-id gki-mono">{entry.date}</span>
                <strong>{entry.title}</strong>
                <span>{entry.summary}</span>
                <small>{entry.layer}</small>
              </article>
            ))}
          </div>
          <div className="gki-entry-list">
            {LAYERS.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className="gki-entry-card"
                onClick={() => {
                  setEntriesOpen(false);
                  jump(index);
                }}
              >
                <span className="gki-entry-id gki-mono">{item.id}</span>
                <strong>{item.name}</strong>
                <span>{item.essence}</span>
                <small>{item.src}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GatekptLanding;
