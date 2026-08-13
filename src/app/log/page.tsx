import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HubNav } from "@/components/HubNav";
import { getEntries } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Published Writing",
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
        <section className="gkl-hero" aria-labelledby="writing-title">
          <div className="gkl-hero-copy">
            <span className="gki-kicker gki-mono">GateKPT / Published writing</span>
            <h1 id="writing-title">Published writing.</h1>
            <p>
              Notes that connect technology to attention, work, identity, and the physical world around the model.
            </p>
          </div>
          <figure className="gkl-hero-media">
            <Image
              src="/brand/xiv-holy-grail-reference-v2.png"
              alt="A neon city collage of a lone figure wearing a glowing visor"
              width={1680}
              height={945}
              priority
            />
          </figure>
        </section>

        <section className="gkl-start" aria-labelledby="gkl-start-title">
          <div>
            <span className="gkl-label gki-mono">Start here</span>
            <h2 id="gkl-start-title">Start with the newest note.</h2>
            <p>
              Read the latest piece first. Then use the AI layers to connect the human questions back to the system
              underneath them.
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
