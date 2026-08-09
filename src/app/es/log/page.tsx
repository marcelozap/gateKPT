import Link from "next/link";
import type { Metadata } from "next";
import { getJournalEntries } from "@/gatekpt/journal";

const entries = getJournalEntries("es");

export const metadata: Metadata = {
  title: "Diario - GateKPT",
  description:
    "Entradas publicas de GateKPT sobre energia, chips, datos, modelos, software, pruebas y sistemas reales de IA.",
};

export default function SpanishLogPage() {
  return (
    <main className="gkl-page">
      <div className="gkl-atmos" aria-hidden="true" />
      <header className="gkl-header">
        <Link href="/es" className="gkl-mark gki-mono">
          GateKPT
        </Link>
        <div className="gkl-nav">
          <Link href="/log" className="gki-mono">EN</Link>
          <span className="gki-mono">Diario</span>
        </div>
      </header>

      <section className="gkl-hero">
        <span className="gki-kicker gki-mono">Diario publico</span>
        <h1>Ideas sobre IA, organizadas como entradas.</h1>
        <p>
          Este es el archivo legible: notas, investigacion, marcos mentales e
          ideas en proceso sobre el stack de IA desde la capa fisica hacia arriba.
        </p>
      </section>

      <section className="gkl-list" aria-label="Entradas del diario">
        {entries.map((entry) => (
          <Link href={`/es/log/${entry.slug}`} className="gkl-card" key={entry.slug}>
            <span className="gkl-date gki-mono">{entry.date}</span>
            <div>
              <span className="gkl-layer gki-mono">{entry.layer}</span>
              <h2>{entry.title}</h2>
              <p>{entry.summary}</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
