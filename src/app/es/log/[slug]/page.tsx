import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HubNav } from "@/components/HubNav";
import { SpanishDocumentGuard } from "@/components/SpanishDocumentGuard";
import { getEntries, getEntry } from "@/xiv/content";
import { getSiteUrl } from "@/lib/siteUrl";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getEntries("es").map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry("es", slug);

  if (!entry) {
    return {};
  }

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/es/log/${entry.slug}`;
  return {
    title: entry.title,
    description: entry.summary,
    alternates: {
      canonical,
      languages: {
        en: `${siteUrl}/log/${entry.slug}`,
        es: canonical,
      },
    },
    openGraph: {
      title: `${entry.title} - XIV`,
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
          alt: `${entry.layer} - ${entry.title} - XIV`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${entry.title} - XIV`,
      description: entry.summary,
      images: [
        {
          url: `${siteUrl}/opengraph-image`,
          alt: `${entry.layer} - ${entry.title} - XIV`,
        },
      ],
    },
  };
}

export default async function SpanishLogEntryPage({ params }: Props) {
  const { slug } = await params;
  const entry = getEntry("es", slug);

  if (!entry) {
    notFound();
  }

  return (
    <div className="gkl-page" lang="es" translate="no">
      <SpanishDocumentGuard />
      <div className="gkl-atmos" aria-hidden="true" />
      <HubNav locale="es" />
      <main className="gkl-shell gkl-shell-narrow">
        <article className="gkl-article">
          <Link href="/es/log" className="gkl-back gki-mono">
            Volver al diario
          </Link>
          <span className="gkl-meta gki-mono">
            {entry.date} / {entry.layer}
          </span>
          <h1>{entry.title}</h1>
          <p className="gkl-summary">{entry.summary}</p>
          <div className="gkl-body">
            {entry.body.map((item) => {
              const block = typeof item === "string" ? { text: item } : item;
              return (
              <p key={block.text} className={block.kind === "turn" ? "gkn-turn" : undefined}>
                {block.text}
                {block.footnote ? <sup className="gkn-ref">{block.footnote}</sup> : null}
              </p>
              );
            })}
          </div>
          {entry.citation ? (
            <footer className="gkn-foot">
              <p>
                <span className="gki-mono">1.</span> {entry.citation}
              </p>
            </footer>
          ) : null}
          {entry.artifacts?.length ? (
            <div className="gkl-artifacts" aria-label="Artefactos publicos">
              {entry.artifacts.map((artifact) => (
                <a key={artifact.href} href={artifact.href}>
                  {artifact.label}
                </a>
              ))}
            </div>
          ) : null}
        </article>
      </main>
    </div>
  );
}
