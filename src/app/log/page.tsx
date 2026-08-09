import Link from "next/link";
import type { Metadata } from "next";
import { JOURNAL_ENTRIES } from "@/gatekpt/journal";

export const metadata: Metadata = {
  title: "Field Log - GateKPT",
  description:
    "Public GateKPT journal entries on AI infrastructure, data, models, prompting, evaluation, and real-world systems.",
};

export default function LogPage() {
  return (
    <main className="gkl-page">
      <div className="gkl-atmos" aria-hidden="true" />
      <header className="gkl-header">
        <Link href="/" className="gkl-mark gki-mono">
          GateKPT
        </Link>
        <span className="gki-mono">Field log</span>
      </header>

      <section className="gkl-hero">
        <span className="gki-kicker gki-mono">Public journal</span>
        <h1>Ideas on AI, organized as entries.</h1>
        <p>
          This is the readable archive: notes, research, framing, and working ideas
          about the AI stack from the physical layer up.
        </p>
      </section>

      <section className="gkl-list" aria-label="Journal entries">
        {JOURNAL_ENTRIES.map((entry) => (
          <Link href={`/log/${entry.slug}`} className="gkl-card" key={entry.slug}>
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
