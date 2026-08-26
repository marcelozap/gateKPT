import type { Metadata } from "next";
import Link from "next/link";
import { HubNav } from "@/components/HubNav";
import { note001 } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

const canonical = `${getSiteUrl()}/notes/${note001.slug}`;

export const metadata: Metadata = {
  title: note001.title,
  description: note001.description,
  alternates: {
    canonical,
    languages: {
      en: canonical,
      es: `${getSiteUrl()}/es/notes/${note001.slug}`,
    },
  },
  openGraph: {
    title: `${note001.title} - GateKPT`,
    description: note001.description,
    type: "article",
    url: canonical,
    publishedTime: note001.publishedTime,
    authors: ["Marcelo Zapata"],
    images: [
      {
        url: `${canonical}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "NOTE Nº 001 - The Only Thing Paying Attention - gatekpt.ai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${note001.title} - GateKPT`,
    description: note001.description,
    images: [
      {
        url: `${canonical}/opengraph-image`,
        alt: "NOTE Nº 001 - The Only Thing Paying Attention - GateKPT",
      },
    ],
  },
};

export default function NotePage() {
  return (
    <div className="gkn-page">
      <div className="gkn-atmos" aria-hidden="true" />
      <HubNav />
      <main className="gkn-shell">
        <article className="gkn-article">
          <header className="gkn-head">
            <div className="gkn-head-meta">
              <Link href="/" className="gkn-back gki-mono">
                Back to AI layers
              </Link>
              <span className="gki-kicker gki-mono">{note001.displayKicker}</span>
            </div>
            <h1>{note001.title}</h1>
            <p>{note001.description}</p>
          </header>

          <div className="gkn-body">
            {note001.body.map((block) => (
              <p key={block.text} className={block.kind === "turn" ? "gkn-turn" : undefined}>
                {block.text}
                {block.footnote ? <sup className="gkn-ref">{block.footnote}</sup> : null}
              </p>
            ))}
          </div>

          <footer className="gkn-foot">
            <p>
              <span className="gki-mono">1.</span> {note001.citation}
            </p>
          </footer>
        </article>
      </main>
    </div>
  );
}
