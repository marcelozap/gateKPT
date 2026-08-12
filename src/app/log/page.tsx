import type { Metadata } from "next";
import Link from "next/link";
import { HubNav } from "@/components/HubNav";
import { logEntriesEn } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Field Log",
  description: "Working notes from the GateKPT AI stack map.",
  alternates: {
    canonical: `${getSiteUrl()}/log`,
  },
};

export default function LogPage() {
  return (
    <div className="gkl-page">
      <div className="gkl-atmos" aria-hidden="true" />
      <HubNav />
      <main className="gkl-shell">
        <header className="gkl-hero">
          <span className="gki-kicker gki-mono">Field log</span>
          <h1>Notes from the stack map.</h1>
          <p>
            Short entries tracking power, chips, data, models, software, testing, and the business context around AI.
          </p>
        </header>

        <section className="gkl-list" aria-label="Field log entries">
          {logEntriesEn.map((entry) => (
            <Link key={entry.slug} href={`/log/${entry.slug}`} className="gkl-entry">
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
