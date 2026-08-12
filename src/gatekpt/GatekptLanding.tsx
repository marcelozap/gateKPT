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
import Link from "next/link";
import { getJournalEntries, type Locale } from "./journal";
import { LAYERS, LAYERS_ES } from "./stack";

type Phase = "boot" | "run" | "end";
const FADE = 130; // must match .gki-slot.out transition in globals.css

const COPY = {
  en: {
    whereBoot: "AI MAP",
    whereEnd: "END OF MAP",
    countBoot: "START",
    homeTitle: "AI, explained from the ground up.",
    homeBody:
      "A public notebook for learning what actually runs modern AI: electricity, chips, data, models, software, testing, and real-world use. Each idea has a number and a source.",
    openLog: "Read notes",
    exploreMap: "Start learning",
    layers: "Map",
    fieldLog: "Latest notes",
    viewAll: "View all",
    endKicker: "L01 - L07",
    endTitle: "AI is hardware, software, and people.",
    endBody:
      "Electricity limits the chips. Chips change the cost. Data shapes the answer. People decide whether the system matters.",
    backLayers: "Open map",
    startOver: "Start over",
    hint: "Space  -  next    Esc  -  map",
    back: "Back",
    log: "Notes",
    forward: "Next",
    load: "GATEKPT ONLINE",
    switchLabel: "ES",
    switchHref: "/es",
  },
  es: {
    whereBoot: "MAPA DE IA",
    whereEnd: "FIN DEL MAPA",
    countBoot: "INICIO",
    homeTitle: "IA, explicada desde la base.",
    homeBody:
      "Un cuaderno publico para aprender que hace funcionar la IA moderna: electricidad, chips, datos, modelos, software, pruebas y uso real. Cada idea tiene un numero y una fuente.",
    openLog: "Leer notas",
    exploreMap: "Empezar",
    layers: "Mapa",
    fieldLog: "Notas recientes",
    viewAll: "Ver todo",
    endKicker: "L01 - L07",
    endTitle: "La IA es hardware, software y personas.",
    endBody:
      "La electricidad limita los chips. Los chips cambian el costo. Los datos forman la respuesta. Las personas deciden si el sistema importa.",
    backLayers: "Abrir mapa",
    startOver: "Empezar de nuevo",
    hint: "Espacio  -  avanzar    Esc  -  mapa",
    back: "Atras",
    log: "Notas",
    forward: "Siguiente",
    load: "GATEKPT EN LINEA",
    switchLabel: "EN",
    switchHref: "/",
  },
} as const;

type GatekptLandingProps = {
  locale?: Locale;
};

export function GatekptLanding({ locale = "en" }: GatekptLandingProps) {
  const copy = COPY[locale];
  const layers = locale === "es" ? LAYERS_ES : LAYERS;
  const entries = getJournalEntries(locale);
  const logHref = locale === "es" ? "/es/notes" : "/notes";
  const [phase, setPhase] = useState<Phase>("boot");
  const [li, setLi] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const [mapOpen, setMapOpen] = useState(false);
  const [fading, setFading] = useState(false);
  const [sweep, setSweep] = useState(0);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layer = layers[li];

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
    if (li < layers.length - 1) {
      const n = li + 1;
      go(() => {
        setLi(n);
        setSeen((s) => new Set(s).add(n));
      });
      return;
    }
    go(() => setPhase("end"));
  }, [phase, li, go, layers.length]);

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
    if (n < 0 || n >= layers.length) return;
    setMapOpen(false);
    go(() => {
      setPhase("run");
      setLi(n);
      setSeen((s) => new Set(s).add(n));
    });
  }, [go, layers.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === "Escape") { e.preventDefault(); setMapOpen((m) => !m); return; }
      if (mapOpen) { if (/^[1-7]$/.test(k)) jump(Number(k) - 1); return; }
      if (k === " " || k === "ArrowRight" || k === "Enter") { e.preventDefault(); next(); }
      else if (k === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (/^[1-7]$/.test(k)) jump(Number(k) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mapOpen, next, prev, jump]);

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

  const where = phase === "boot" ? copy.whereBoot
              : phase === "end"  ? copy.whereEnd
              : `${layer.id}  -  ${layer.name.toUpperCase()}`;
  const count = phase === "boot" ? copy.countBoot
              : phase === "end"  ? "07 / 07"
              : `${String(li + 1).padStart(2, "0")} / 07`;

  const body = () => {
    if (phase === "boot") return (
      <div className="gki-home">
        <section className="gki-home-main">
          <span className="gki-kicker gki-mono">GateKPT</span>
          <p className="gki-essence">{copy.homeTitle}</p>
          <p className="gki-donep">{copy.homeBody}</p>
          <div className="gki-actions">
            <Link href={logHref} className="gki-go" onClick={(e) => e.stopPropagation()}>
              {copy.openLog}
            </Link>
            <button type="button" className="gki-ghost gki-mono" onClick={(e) => { e.stopPropagation(); next(); }}>
              {copy.exploreMap}
            </button>
            <button type="button" className="gki-ghost gki-mono" onClick={(e) => { e.stopPropagation(); setMapOpen(true); }}>
              {copy.layers}
            </button>
          </div>
        </section>

        <aside className="gki-home-log" aria-label="Recent notes">
          <div className="gki-home-log-head">
            <span className="gki-kicker gki-mono">{copy.fieldLog}</span>
            <Link href={logHref} className="gki-mini gki-mono" onClick={(e) => e.stopPropagation()}>
              {copy.viewAll}
            </Link>
          </div>
          <div className="gki-home-log-list">
            {entries.slice(0, 3).map((entry) => (
              <Link
                href={`${logHref}/${entry.slug}`}
                key={`${entry.date}-${entry.title}`}
                className="gki-home-entry"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="gki-entry-id gki-mono">{entry.date}</span>
                <strong>{entry.title}</strong>
                <span>{entry.summary}</span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    );

    if (phase === "end") return (
      <>
        <span className="gki-kicker gki-mono">{copy.endKicker}</span>
        <p className="gki-doneh">{copy.endTitle}</p>
        <p className="gki-donep">{copy.endBody}</p>
        <div className="gki-actions">
          <button type="button" className="gki-go" onClick={(e) => { e.stopPropagation(); setMapOpen(true); }}>
            {copy.backLayers}
          </button>
          <button
            type="button"
            className="gki-ghost gki-mono"
            onClick={(e) => { e.stopPropagation(); go(() => { setPhase("run"); setLi(0); }); }}
          >
            {copy.startOver}
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
      aria-label="GateKPT AI learning map"
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
          <small>{copy.load}</small>
        </div>
      </div>

      <div className="gki-edge gki-mono" style={{ top: 26, left: 30, display: "flex", alignItems: "center", gap: 9 }}>
        <span className="gki-mark" />
        <span style={{ color: "var(--focal)", letterSpacing: "0.2em" }}>GATEKPT</span>
      </div>
      <Link className="gki-lang gki-mono" href={copy.switchHref} onClick={(e) => e.stopPropagation()}>
        {copy.switchLabel}
      </Link>
      <div className="gki-edge gki-mono" style={{ top: 26, right: 30 }}>{where}</div>
      <div className="gki-edge gki-mono" style={{ bottom: 26, left: 30 }}>{count}</div>
      <div className="gki-hint gki-mono">{copy.hint}</div>
      <div className="gki-controls gki-mono" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={prev} disabled={phase === "boot"}>
          {copy.back}
        </button>
        <Link href={logHref}>
          {copy.log}
        </Link>
        <button type="button" onClick={() => setMapOpen(true)}>
          {copy.layers}
        </button>
        <button type="button" onClick={next} disabled={phase === "end"}>
          {copy.forward}
        </button>
      </div>

      {/* Beat pips removed - there are no beats now, only layers. */}
      <div className="gki-ladder" aria-hidden="true">
        {layers.map((_, i) => (
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
        aria-label="Full map"
        aria-hidden={!mapOpen}
      >
        <div>
          {layers.map((l, i) => (
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

    </div>
  );
}

export default GatekptLanding;
