import type { Metadata } from "next";
import Link from "next/link";
import { HubNav } from "@/components/HubNav";
import { SpanishDocumentGuard } from "@/components/SpanishDocumentGuard";
import { getEntries } from "@/xiv/content";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Escritura publicada",
  description: "Escritura de Marcelo Zapata sobre XIV, MaloSound, Green Machine, IA, sistemas, música y trabajo.",
  alternates: {
    canonical: `${getSiteUrl()}/es/log`,
    languages: {
      en: `${getSiteUrl()}/log`,
      es: `${getSiteUrl()}/es/log`,
    },
  },
  openGraph: {
    title: "Escritura publicada - XIV",
    description: "Escritura de Marcelo Zapata sobre XIV, MaloSound, Green Machine, IA, sistemas, música y trabajo.",
    type: "website",
    url: `${getSiteUrl()}/es/log`,
    images: [
      {
        url: `${getSiteUrl()}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Escritura publicada de XIV.",
      },
    ],
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
            <span className="gki-kicker gki-mono">XIV / Escritura publicada</span>
            <h1 id="writing-title">Escritura publicada.</h1>
            <p>
              Notas que conectan XIV, MaloSound, Green Machine, la tecnología, la atención, el trabajo, la música y
              el mundo físico alrededor del modelo.
            </p>
          </div>
        </section>

        <section className="gkl-start" aria-labelledby="gkl-start-title">
          <div>
            <span className="gkl-label gki-mono">Empieza aquí</span>
            <h2 id="gkl-start-title">Empieza con la nota más nueva.</h2>
            <p>
              Lee primero la nota más reciente. Después conecta las preguntas humanas con el sistema debajo de ellas.
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
