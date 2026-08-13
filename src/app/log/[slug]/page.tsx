import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HubNav } from "@/components/HubNav";
import { getEntries, getEntry } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getEntries("en").map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry("en", slug);

  if (!entry) {
    return {};
  }

  const canonical = `${getSiteUrl()}/log/${entry.slug}`;
  return {
    title: entry.title,
    description: entry.summary,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${entry.title} - GateKPT`,
      description: entry.summary,
      type: "article",
      url: canonical,
    },
  };
}

export default async function LogEntryPage({ params }: Props) {
  const { slug } = await params;
  const entry = getEntry("en", slug);

  if (!entry) {
    notFound();
  }

  return (
    <div className="gkl-page">
      <div className="gkl-atmos" aria-hidden="true" />
      <HubNav />
      <main className="gkl-shell gkl-shell-narrow">
        <article className="gkl-article">
          <Link href="/log" className="gkl-back gki-mono">
            Back to writing
          </Link>
          <span className="gkl-meta gki-mono">
            {entry.date} / {entry.layer}
          </span>
          <h1>{entry.title}</h1>
          <p className="gkl-summary">{entry.summary}</p>
          <div className="gkl-body">
            {entry.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>
      </main>
    </div>
  );
}
