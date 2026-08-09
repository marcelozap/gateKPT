import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getJournalEntry, JOURNAL_ENTRIES } from "@/gatekpt/journal";

type EntryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return JOURNAL_ENTRIES.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: EntryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getJournalEntry(slug);
  if (!entry) return {};

  return {
    title: `${entry.title} - GateKPT Field Log`,
    description: entry.summary,
    openGraph: {
      title: `${entry.title} - GateKPT Field Log`,
      description: entry.summary,
      type: "article",
    },
  };
}

export default async function EntryPage({ params }: EntryPageProps) {
  const { slug } = await params;
  const entry = getJournalEntry(slug);
  if (!entry) notFound();

  return (
    <main className="gkl-page">
      <div className="gkl-atmos" aria-hidden="true" />
      <header className="gkl-header">
        <Link href="/" className="gkl-mark gki-mono">
          GateKPT
        </Link>
        <Link href="/log" className="gki-mono">
          Field log
        </Link>
      </header>

      <article className="gkl-article">
        <div className="gkl-article-head">
          <span className="gki-kicker gki-mono">{entry.layer}</span>
          <h1>{entry.title}</h1>
          <p>{entry.summary}</p>
          <time className="gkl-date gki-mono">{entry.date}</time>
        </div>

        <div className="gkl-body">
          {entry.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <footer className="gkl-footer">
          <Link href="/log" className="gki-ghost gki-mono">
            Back to field log
          </Link>
        </footer>
      </article>
    </main>
  );
}
