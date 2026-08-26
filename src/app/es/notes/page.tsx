import type { Metadata } from "next";
import SpanishLogPage from "@/app/es/log/page";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Escritura publicada",
  description: "Escritura de Marcelo Zapata sobre IA, sistemas, curiosidad y el mundo alrededor del modelo.",
  alternates: {
    canonical: `${getSiteUrl()}/es/notes`,
    languages: {
      en: `${getSiteUrl()}/notes`,
      es: `${getSiteUrl()}/es/notes`,
    },
  },
  openGraph: {
    title: "Escritura publicada - GateKPT",
    description: "Escritura de Marcelo Zapata sobre IA, sistemas, curiosidad y el mundo alrededor del modelo.",
    type: "website",
    url: `${getSiteUrl()}/es/notes`,
    images: [
      {
        url: `${getSiteUrl()}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Escritura publicada de GateKPT.",
      },
    ],
  },
};

export default SpanishLogPage;
