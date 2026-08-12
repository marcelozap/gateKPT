import type { Metadata } from "next";
import Link from "next/link";
import { HubNav } from "@/components/HubNav";
import { note001 } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

const canonical = `${getSiteUrl()}/notes/${note001.slug}`;

export const metadata: Metadata = {
  title: "The Only Thing Paying Attention",
  description: note001.description,
  alternates: {
    canonical,
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
    images: [`${canonical}/opengraph-image`],
  },
};

function NoteParagraph({ paragraph, index }: { paragraph: string; index: number }) {
  if (index === 6) {
    return (
      <p>
        WALL-E gave humanity seven hundred years to arrive at that ship.
        <sup className="gkn-ref gki-mono">1</sup> The mechanism it depicts has no such pacing requirement.
      </p>
    );
  }

  if (index === 8) {
    return <p className="gkn-turn">{paragraph}</p>;
  }

  return <p>{paragraph}</p>;
}

export default function NotePage() {
  return (
    <div className="gkn-page">
      <div className="gkn-atmos" aria-hidden="true" />
      <HubNav />
      <main className="gkn-shell">
        <article className="gkn-article">
          <header className="gkn-head">
            <Link href="/" className="gkn-back gki-mono">
              Back to stack map
            </Link>
            <span className="gki-kicker gki-mono">{note001.displayKicker}</span>
            <h1>{note001.title}</h1>
            <p>{note001.description}</p>
          </header>

          <div className="gkn-body">
            {note001.body.map((paragraph, index) => (
              <NoteParagraph key={`${index}-${paragraph}`} paragraph={paragraph} index={index} />
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
