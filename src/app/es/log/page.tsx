import Link from "next/link";
import type { Metadata } from "next";
import { getJournalEntries } from "@/gatekpt/journal";

const entries = getJournalEntries("es");
const trainingEntries = entries.filter((entry) =>
  ["prompting-as-work-design", "weekly-ai-brief-format"].includes(entry.slug),
);
const journalEntries = entries.filter((entry) => !trainingEntries.includes(entry));

export const metadata: Metadata = {
  title: "Notas - GateKPT",
  description:
    "Notas publicas de GateKPT sobre energia, chips, datos, modelos, software, pruebas y sistemas reales de IA.",
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
          <Link href="/notes" className="gki-mono">EN</Link>
          <span className="gki-mono">Notas</span>
        </div>
      </header>

      <section className="gkl-hero">
        <span className="gki-kicker gki-mono">GateKPT</span>
        <h1>Practica y diarios.</h1>
        <p>
          Notas simples de lo que estoy aprendiendo, practicando y convirtiendo
          en sistemas publicos.
        </p>
      </section>

      <section className="gkl-section" aria-label="Practica">
        <div className="gkl-section-head">
          <span className="gki-kicker gki-mono">Practica</span>
          <p>Repeticiones para usar IA con claridad.</p>
        </div>
        <div className="gkl-list">
          {trainingEntries.map((entry) => (
            <Link href={`/es/notes/${entry.slug}`} className="gkl-card" key={entry.slug}>
              <div>
                <h2>{entry.title}</h2>
                <p>{entry.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="gkl-section" aria-label="Diarios">
        <div className="gkl-section-head">
          <span className="gki-kicker gki-mono">Diarios</span>
          <p>Lo que voy mapeando mientras aprendo IA desde la base.</p>
        </div>
        <div className="gkl-list">
          {journalEntries.map((entry) => (
            <Link href={`/es/notes/${entry.slug}`} className="gkl-card" key={entry.slug}>
              <div>
                <h2>{entry.title}</h2>
                <p>{entry.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
