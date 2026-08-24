import type { Metadata } from "next";
import Link from "next/link";
import { HubNav } from "@/components/HubNav";
import { getEntries } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "The Record",
  description: "Marcelo Zapata's journal entries on technology, systems, music, curiosity, and the world around the model.",
  alternates: {
    canonical: `${getSiteUrl()}/log`,
  },
};

export default function LogPage() {
  const entries = getEntries("en");
  const latest = entries[0];

  return (
    <div className="gkl-page">
      <div className="gkl-atmos" aria-hidden="true" />
      <HubNav />
      <main className="gkl-shell">
        <section className="gkl-hero" aria-labelledby="writing-title">
          <div className="gkl-hero-copy">
            <span className="gki-kicker gki-mono">GateKPT / The Record</span>
            <h1 id="writing-title">The Record.</h1>
            <p>
              Journal entries that connect technology to attention, work, identity, music, and the physical world
              around the model.
            </p>
          </div>
        </section>

        <section className="gkl-start" aria-labelledby="gkl-start-title">
          <div>
            <span className="gkl-label gki-mono">Start here</span>
            <h2 id="gkl-start-title">Start with the newest entry.</h2>
            <p>
              Read the latest entry first. Then use the AI layers to connect the human questions back to the system
              underneath them.
            </p>
          </div>
          <Link href={latest.noteHref ?? `/log/${latest.slug}`} className="gkl-primary">
            Read the full entry <span aria-hidden="true">-&gt;</span>
          </Link>
        </section>

        <section className="gkl-list" aria-labelledby="gkl-list-title">
          <div className="gkl-list-head">
            <h2 id="gkl-list-title">Journal entries</h2>
            <span className="gkl-label gki-mono">{String(entries.length).padStart(2, "0")} entries</span>
          </div>
          {entries.map((entry, index) => {
            const href = entry.noteHref ?? `/log/${entry.slug}`;
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
                  <span className="gkl-read">Open {entry.layer} <span aria-hidden="true">-&gt;</span></span>
                </div>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
