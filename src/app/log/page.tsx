import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HubNav } from "@/components/HubNav";
import { getEntries } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Field Log",
  description: "Marcelo Zapata's writing on AI, systems, curiosity, and the world around the model.",
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
        <section className="gkl-hero" aria-labelledby="field-log-title">
          <div className="gkl-hero-copy">
            <span className="gki-kicker gki-mono">GateKPT / Field log</span>
            <h1 id="field-log-title">Writing about the system underneath AI.</h1>
            <p>
              This is the writing layer of GateKPT: personal notes that connect technology to attention, work, and
              the physical world around it.
            </p>
          </div>
          <figure className="gkl-hero-media">
            <Image
              src="/gatekpt-field-log-hero.png"
              alt="A person with a tablet and tennis racket walking through a rainy city at night"
              width={1785}
              height={881}
              priority
            />
          </figure>
        </section>

        <section className="gkl-start" aria-labelledby="gkl-start-title">
          <div>
            <span className="gkl-label gki-mono">Start here</span>
            <h2 id="gkl-start-title">One note is live right now.</h2>
            <p>
              Read the latest piece first. The stack map is the system behind the site; the field log is where the
              human questions enter it.
            </p>
          </div>
          <Link href={latest.noteHref ?? `/log/${latest.slug}`} className="gkl-primary">
            Read the full note <span aria-hidden="true">-&gt;</span>
          </Link>
        </section>

        <section className="gkl-list" aria-labelledby="gkl-list-title">
          <div className="gkl-list-head">
            <h2 id="gkl-list-title">Published writing</h2>
            <span className="gkl-label gki-mono">{String(entries.length).padStart(2, "0")} notes</span>
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
