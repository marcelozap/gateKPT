import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HubNav } from "@/components/HubNav";
import { SpanishDocumentGuard } from "@/components/SpanishDocumentGuard";
import { getEntries } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Escritura publicada",
  description: "Escritura de Marcelo Zapata sobre IA, sistemas, curiosidad y el mundo alrededor del modelo.",
  alternates: {
    canonical: `${getSiteUrl()}/es/log`,
  },
};

export default function SpanishLogPage() {
  const entries = getEntries("es");
  const latest = entries[0];

  return (
    <div className="gkl-page" lang="es" translate="no">
      <SpanishDocumentGuard />
      <div className="gkl-atmos" aria-hidden="true" />
      <HubNav locale="es" />
      <main className="gkl-shell">
        <section className="gkl-hero" aria-labelledby="writing-title">
          <div className="gkl-hero-copy">
            <span className="gki-kicker gki-mono">GateKPT / Escritura publicada</span>
            <h1 id="writing-title">Escritura publicada.</h1>
            <p>
              Notas que conectan la tecnologia con la atencion, el trabajo, la identidad y el mundo fisico alrededor
              del modelo.
            </p>
          </div>
          <figure className="gkl-hero-media">
            <Image
              src="/brand/xiv-holy-grail-reference-v2.png"
              alt="Un collage de ciudad neon con una figura usando un visor encendido"
              width={1680}
              height={945}
              priority
            />
          </figure>
        </section>

        <section className="gkl-start" aria-labelledby="gkl-start-title">
          <div>
            <span className="gkl-label gki-mono">Empieza aqui</span>
            <h2 id="gkl-start-title">Empieza con la nota mas nueva.</h2>
            <p>
              Lee primero la nota mas reciente. Despues usa las capas de IA para conectar las preguntas humanas con
              el sistema debajo de ellas.
            </p>
          </div>
          <Link href={latest.noteHref ?? `/es/log/${latest.slug}`} className="gkl-primary">
            Leer la nota completa <span aria-hidden="true">-&gt;</span>
          </Link>
        </section>

        <section className="gkl-list" aria-labelledby="gkl-list-title">
          <div className="gkl-list-head">
            <h2 id="gkl-list-title">Escritura publicada</h2>
            <span className="gkl-label gki-mono">{String(entries.length).padStart(2, "0")} notas</span>
          </div>
          {entries.map((entry, index) => {
            const href = entry.noteHref ?? `/es/log/${entry.slug}`;
            return (
              <Link
                key={entry.slug}
                href={href}
                className={`gkl-entry${index === 0 ? " gkl-entry-featured" : ""}`}
              >
                <div className="gkl-entry-meta gki-mono">
                  <span>{entry.date}</span>
                  <span>{entry.layer}</span>
                </div>
                <div className="gkl-entry-copy">
                  <h3>{entry.title}</h3>
                  <p>{entry.summary}</p>
                  <span className="gkl-read">Abrir {entry.layer} <span aria-hidden="true">-&gt;</span></span>
                </div>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
