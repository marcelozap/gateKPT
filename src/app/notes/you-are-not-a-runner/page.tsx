import type { Metadata } from "next";
import Link from "next/link";
import { HubNav } from "@/components/HubNav";
import { note003 } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

const canonical = `${getSiteUrl()}/notes/${note003.slug}`;

export const metadata: Metadata = {
  title: note003.title,
  description: note003.description,
  alternates: {
    canonical,
  },
  openGraph: {
    title: `${note003.title} - GateKPT`,
    description: note003.description,
    type: "article",
    url: canonical,
    publishedTime: note003.publishedTime,
    authors: ["Marcelo Zapata"],
    images: [
      {
        url: `${canonical}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "NOTE Nº 003 - You Are Not a Runner - gatekpt.ai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${note003.title} - GateKPT`,
    description: note003.description,
    images: [`${canonical}/opengraph-image`],
  },
};

export default function Note003Page() {
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
              <span className="gki-kicker gki-mono">{note003.displayKicker}</span>
            </div>
            <h1>{note003.title}</h1>
            <p>{note003.description}</p>
          </header>

          <div className="gkn-body">
            {note003.body.map((block) => (
              <p key={block.text} className={block.kind === "turn" ? "gkn-turn" : undefined}>
                {block.text}
                {block.footnote ? <sup className="gkn-ref">{block.footnote}</sup> : null}
              </p>
            ))}
          </div>

          <footer className="gkn-foot">
            <p>
              <span className="gki-mono">1.</span> {note003.citation}
            </p>
          </footer>
        </article>
      </main>
    </div>
  );
}
