"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getEntries, getLayers, localeCopy, type Locale } from "./content";

const FADE = 130; // must match .gki-slot.out transition in globals.css

type Phase = "boot" | "run" | "end";

export function GatekptLanding({ locale = "en" }: { locale?: Locale }) {
  const copy = localeCopy[locale];
  const layers = getLayers(locale);
  const entries = getEntries(locale);
  const [phase, setPhase] = useState<Phase>("boot");
  const [layerIndex, setLayerIndex] = useState(0);
  const [seen, setSeen] = useState(() => new Set<number>());
  const [mapOpen, setMapOpen] = useState(false);
  const [fading, setFading] = useState(false);
  const [sweep, setSweep] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layerCount = layers.length;
  const layer = layers[layerIndex];
  const layerHref = "#layers";

  useEffect(() => {
    document.body.classList.add("gk-instrument");
    return () => document.body.classList.remove("gk-instrument");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#layers") return;
    setPhase("run");
    setLayerIndex(0);
    setSeen((value) => new Set(value).add(0));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (phase === "run" && window.location.hash !== "#layers") {
      window.history.replaceState(null, "", `${window.location.pathname}#layers`);
    } else if (phase === "boot" && window.location.hash === "#layers") {
      window.history.replaceState(null, "", window.location.pathname || "/");
    }
  }, [phase]);

  const transition = useCallback((update: () => void) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setFading(true);
    timeoutRef.current = setTimeout(() => {
      update();
      setFading(false);
      setSweep((value) => value + 1);
    }, FADE);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const goForward = useCallback(() => {
    if (fading) return;

    if (phase === "boot") {
      transition(() => {
        setPhase("run");
        setLayerIndex(0);
        setSeen((value) => new Set(value).add(0));
      });
      return;
    }

    if (phase === "run") {
      if (layerIndex < layerCount - 1) {
        const next = layerIndex + 1;
        transition(() => {
          setLayerIndex(next);
          setSeen((value) => new Set(value).add(next));
        });
        return;
      }

      transition(() => setPhase("end"));
    }
  }, [fading, layerCount, layerIndex, phase, transition]);

  const goBack = useCallback(() => {
    if (fading) return;

    if (phase === "run") {
      if (layerIndex > 0) {
        const previous = layerIndex - 1;
        transition(() => {
          setLayerIndex(previous);
          setSeen((value) => new Set(value).add(previous));
        });
        return;
      }

      transition(() => setPhase("boot"));
    } else if (phase === "end") {
      transition(() => setPhase("run"));
    }
  }, [fading, layerIndex, phase, transition]);

  const jumpToLayer = useCallback((index: number) => {
    if (index < 0 || index >= layerCount || fading) return;
    setMapOpen(false);
    transition(() => {
      setPhase("run");
      setLayerIndex(index);
      setSeen((value) => new Set(value).add(index));
    });
  }, [fading, layerCount, transition]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const key = event.key;

      if (key === "Escape") {
        event.preventDefault();
        setMapOpen((value) => !value);
        return;
      }

      if (mapOpen) {
        if (/^[1-7]$/.test(key)) {
          jumpToLayer(Number(key) - 1);
        }
        return;
      }

      if (key === " " || key === "ArrowRight" || key === "Enter") {
        event.preventDefault();
        goForward();
      } else if (key === "ArrowLeft") {
        event.preventDefault();
        goBack();
      } else if (/^[1-7]$/.test(key)) {
        jumpToLayer(Number(key) - 1);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goBack, goForward, jumpToLayer, mapOpen]);

  useEffect(() => {
    const blockScroll = (event: Event) => event.preventDefault();
    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });
    return () => {
      window.removeEventListener("wheel", blockScroll);
      window.removeEventListener("touchmove", blockScroll);
    };
  }, []);

  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (event: TouchEvent) => {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const dx = event.changedTouches[0].clientX - startX;
      const dy = Math.abs(event.changedTouches[0].clientY - startY);

      if (Math.abs(dx) > 48 && dy < 70) {
        if (dx < 0) {
          goForward();
        } else {
          goBack();
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goBack, goForward]);

  const where =
    phase === "boot" ? copy.whereBoot : phase === "end" ? copy.whereEnd : `${layer.id}  -  ${layer.name.toUpperCase()}`;
  const count = phase === "boot" ? copy.countBoot : phase === "end" ? "07 / 07" : `${String(layerIndex + 1).padStart(2, "0")} / 07`;

  return (
    <div onClick={() => mapOpen && setMapOpen(false)} role="application" aria-label="GateKPT AI layers">
      <div className="gki-atmos" aria-hidden="true">
        <div className="gki-bloom xb1" />
        <div className="gki-bloom xb2" />
        <div className="gki-bloom xb3" />
        <div className="gki-bloom xb4" />
        <div className="gki-bloom xb5" />
        <div className="gki-rain" />
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

      <div className="gki-loadscreen" aria-hidden="true">
        <div className="gki-loadmark gki-mono">
          <span>GATEKPT</span>
          <i />
          <small>{copy.load}</small>
        </div>
      </div>

      <div className="gki-edge gki-mono gki-brand-edge">
        <span className="gki-mark" />
        <span>GATEKPT</span>
      </div>
      <Link className="gki-lang gki-mono" href={copy.switchHref} onClick={(event) => event.stopPropagation()}>
        {copy.switchLabel}
      </Link>
      <Link className="gki-writing-badge gki-mono" href={copy.logHref} onClick={(event) => event.stopPropagation()}>
        {copy.writingBadge}
      </Link>
      <div className="gki-edge gki-mono gki-where">{where}</div>
      <div className="gki-edge gki-mono gki-count">{count}</div>
      <div className="gki-hint gki-mono">{copy.hint}</div>

      <div className="gki-controls gki-mono" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={goBack} disabled={phase === "boot" || fading}>
          {copy.back}
        </button>
        <button type="button" onClick={() => setMapOpen(true)}>
          {copy.layers}
        </button>
        <button type="button" onClick={goForward} disabled={phase === "end" || fading}>
          {copy.forward}
        </button>
      </div>

      <div className="gki-ladder" aria-hidden="true">
        {layers.map((item, index) => (
          <i
            key={item.id}
            className={phase === "end" ? "done" : phase !== "run" ? "" : index < layerIndex ? "done" : index === layerIndex ? "now" : ""}
          />
        ))}
      </div>

      <div className="gki-stage">
        <div className="gki-frame">
          <span className="gki-tick xt-a" />
          <span className="gki-tick xt-b" />
          <span className="gki-tick xt-c" />
          <span className="gki-tick xt-d" />
          <span key={sweep} className="gki-visor" />

          <div className={`gki-slot${fading ? " out" : ""}`} aria-live="polite">
            {phase === "boot" ? (
              <div className="gki-home">
                <section className="gki-home-main">
                  <span className="gki-kicker gki-mono">GateKPT</span>
                  <p className="gki-essence">{copy.homeTitle}</p>
                  <p className="gki-donep">{copy.homeBody}</p>
                  <div className="gki-actions">
                    <Link className="gki-go" href={copy.noteHref} onClick={(event) => event.stopPropagation()}>
                      {copy.openLog}
                    </Link>
                    <Link
                      href={layerHref}
                      className="gki-ghost gki-mono"
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        window.history.replaceState(null, "", layerHref);
                        goForward();
                      }}
                    >
                      {copy.exploreMap}
                    </Link>
                  </div>
                </section>

                <aside className="gki-home-log" aria-label="The Record">
                  <div className="gki-home-log-head">
                    <span className="gki-kicker gki-mono">{copy.fieldLog}</span>
                    <Link className="gki-mini gki-mono" href={copy.logHref} onClick={(event) => event.stopPropagation()}>
                      {copy.viewAll}
                    </Link>
                  </div>
                  <div className="gki-home-log-list">
                    {entries.slice(0, 3).map((entry) => (
                      <Link
                        key={`${entry.date}-${entry.title}`}
                        href={entry.noteHref ?? `${copy.logHref}/${entry.slug}`}
                        className="gki-home-entry"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <span className="gki-entry-id gki-mono">{entry.date}</span>
                        <strong>{entry.title}</strong>
                        <span>{entry.summary}</span>
                      </Link>
                    ))}
                  </div>
                </aside>
              </div>
            ) : phase === "end" ? (
              <>
                <span className="gki-kicker gki-mono">{copy.endKicker}</span>
                <p className="gki-doneh">{copy.endTitle}</p>
                <p className="gki-donep">{copy.endBody}</p>
                <p className="gki-endnote">
                  <Link href={copy.noteHref} onClick={(event) => event.stopPropagation()}>
                    {copy.endNote}
                  </Link>
                </p>
                <div className="gki-actions">
                  <button
                    type="button"
                    className="gki-go"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMapOpen(true);
                    }}
                  >
                    {copy.backLayers}
                  </button>
                  <button
                    type="button"
                    className="gki-ghost gki-mono"
                    onClick={(event) => {
                      event.stopPropagation();
                      transition(() => {
                        setPhase("run");
                        setLayerIndex(0);
                      });
                    }}
                  >
                    {copy.startOver}
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="gki-kicker gki-mono">
                  {layer.id} - {layer.name}
                </span>
                <div className="gki-layer">
                  <div className="gki-layer-main">
                    <p className="gki-essence">{layer.essence}</p>
                    <p className="gki-breaks" dangerouslySetInnerHTML={{ __html: layer.brk }} />
                  </div>
                  <div className="gki-layer-fig">
                    <p className="gki-figure gki-mono">
                      {layer.fig}
                      <span className="gki-unit">{layer.unit}</span>
                    </p>
                    <p className="gki-figcap">{layer.figcap}</p>
                    <a
                      className="gki-src gki-mono"
                      href={layer.srcUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {layer.src}
                    </a>
                  </div>
                  <div className="gki-layer-more" tabIndex={0} aria-label={`${copy.moreLabel}: ${layer.name}`}>
                    <span className="gki-layer-more-label gki-mono">{copy.moreLabel}</span>
                    <ul>
                      {layer.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={`gki-map${mapOpen ? " on" : ""}`} role="dialog" aria-label="AI layers" aria-hidden={!mapOpen}>
        <div>
          {layers.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className={`gki-maprow gki-mono${phase === "run" && index === layerIndex ? " now" : ""}${seen.has(index) ? " seen" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                jumpToLayer(index);
              }}
            >
              <span className="gki-lid">{item.id}</span>
              <span>{item.name}</span>
              <span className="gki-st">
                {item.fig}
                {item.unit}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
