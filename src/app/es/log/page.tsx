import type { Metadata } from "next";
import Link from "next/link";
import { HubNav } from "@/components/HubNav";
import { logEntriesEs } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Diario",
  description: "Notas de trabajo del mapa GateKPT del stack de IA.",
  alternates: {
    canonical: `${getSiteUrl()}/es/log`,
  },
};

export default function SpanishLogPage() {
  return (
    <div className="gkl-page">
      <div className="gkl-atmos" aria-hidden="true" />
      <HubNav />
      <main className="gkl-shell">
        <header className="gkl-hero">
          <span className="gki-kicker gki-mono">Diario</span>
          <h1>Notas del mapa del stack.</h1>
          <p>Entradas cortas sobre energia, chips, datos, modelos, software, pruebas y contexto de negocio.</p>
        </header>

        <section className="gkl-list" aria-label="Entradas del diario">
          {logEntriesEs.map((entry) => (
            <Link key={entry.slug} href={`/es/log/${entry.slug}`} className="gkl-entry">
              <span className="gkl-meta gki-mono">
                {entry.date} / {entry.layer}
              </span>
              <h2>{entry.title}</h2>
              <p>{entry.summary}</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
