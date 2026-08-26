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

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/notes/${entry.slug}`;
  return {
    title: entry.title,
    description: entry.summary,
    alternates: {
      canonical,
      languages: {
        en: canonical,
        es: `${siteUrl}/es/notes/${entry.slug}`,
      },
    },
    openGraph: {
      title: `${entry.title} - GateKPT`,
      description: entry.summary,
      type: "article",
      url: canonical,
      publishedTime: entry.publishedTime,
      authors: ["Marcelo Zapata"],
      images: [
        {
          url: `${siteUrl}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${entry.layer} - ${entry.title} - GateKPT`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${entry.title} - GateKPT`,
      description: entry.summary,
      images: [
        {
          url: `${siteUrl}/opengraph-image`,
          alt: `${entry.layer} - ${entry.title} - GateKPT`,
        },
      ],
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
          <Link href="/notes" className="gkl-back gki-mono">
            Back to The Record
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
          {entry.artifacts?.length ? (
            <div className="gkl-artifacts" aria-label="Public artifacts">
              {entry.artifacts.map((artifact) => (
                <a key={artifact.href} href={artifact.href}>
                  {artifact.label}
                </a>
              ))}
            </div>
          ) : null}
          {entry.nextHref && entry.nextLabel ? (
            <Link href={entry.nextHref} className="gkl-primary gkl-note-next">
              {entry.nextLabel}
            </Link>
          ) : null}
        </article>
      </main>
    </div>
  );
}
