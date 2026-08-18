import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HubNav } from "@/components/HubNav";
import { SpanishDocumentGuard } from "@/components/SpanishDocumentGuard";
import { getEntries, getEntry } from "@/gatekpt/content";
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

  const canonical = `${getSiteUrl()}/es/log/${entry.slug}`;
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
            {entry.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>
      </main>
    </div>
  );
}
