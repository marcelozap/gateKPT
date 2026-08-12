import Link from "next/link";
import type { Metadata } from "next";
import { getJournalEntries } from "@/gatekpt/journal";

const entries = getJournalEntries("en");
const trainingEntries = entries.filter((entry) =>
  ["prompting-as-work-design", "weekly-ai-brief-format"].includes(entry.slug),
);
const journalEntries = entries.filter((entry) => !trainingEntries.includes(entry));

export const metadata: Metadata = {
  title: "Notes - GateKPT",
  description:
    "Public GateKPT notes on AI power, chips, data, models, software, testing, and real-world systems.",
};

export default function LogPage() {
  return (
    <main className="gkl-page">
      <div className="gkl-atmos" aria-hidden="true" />
      <header className="gkl-header">
        <Link href="/" className="gkl-mark gki-mono">
          GateKPT
        </Link>
        <div className="gkl-nav">
          <Link href="/es/log" className="gki-mono">ES</Link>
          <span className="gki-mono">Notes</span>
        </div>
      </header>

      <section className="gkl-hero">
        <span className="gki-kicker gki-mono">GateKPT</span>
        <h1>Training and journals.</h1>
        <p>
          Simple notes from what I am learning, practicing, and turning into public
          systems.
        </p>
      </section>

      <section className="gkl-section" aria-label="Training">
        <div className="gkl-section-head">
          <span className="gki-kicker gki-mono">Training</span>
          <p>Practice reps for using AI clearly.</p>
        </div>
        <div className="gkl-list">
          {trainingEntries.map((entry) => (
            <Link href={`/log/${entry.slug}`} className="gkl-card" key={entry.slug}>
              <div>
                <h2>{entry.title}</h2>
                <p>{entry.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="gkl-section" aria-label="Journals">
        <div className="gkl-section-head">
          <span className="gki-kicker gki-mono">Journals</span>
          <p>What I am mapping as I learn AI from the ground up.</p>
        </div>
        <div className="gkl-list">
          {journalEntries.map((entry) => (
            <Link href={`/log/${entry.slug}`} className="gkl-card" key={entry.slug}>
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
