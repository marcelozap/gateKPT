import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "XIV - Role-Based AI Systems",
    template: "%s - XIV",
  },
  description:
    "XIV is the orchestrator. MaloSound is the music lane. Green Machine is the data and risk-review lane.",
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [
      { url: "/xiv-icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/xiv-icon.png"],
  },
  openGraph: {
    title: "XIV - Role-Based AI Systems",
    description:
      "XIV is the orchestrator. MaloSound is the music lane. Green Machine is the data and risk-review lane.",
    type: "website",
    url: getSiteUrl(),
    siteName: "XIV",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "XIV ecosystem: orchestration, MaloSound, and Green Machine data lane.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XIV - Role-Based AI Systems",
    description:
      "XIV is the orchestrator. MaloSound is the music lane. Green Machine is the data and risk-review lane.",
    images: [
      {
        url: "/opengraph-image",
        alt: "XIV ecosystem: orchestration, MaloSound, and Green Machine data lane.",
      },
    ],
  },
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${siteUrl}/#marcelo-zapata`,
        name: "Marcelo Zapata",
        url: siteUrl,
        sameAs: ["https://www.linkedin.com/in/marcelozap/"],
        jobTitle: "AI Machine Learning & Data Engineer",
        knowsAbout: [
          "AI systems",
          "machine learning",
          "large language models",
          "data engineering",
          "signal mapping",
          "audio analysis",
          "visual systems",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "XIV",
        url: siteUrl,
        description:
          "Marcelo Zapata's public surface for XIV role-based AI systems, MaloSound artist-tech proof, and Green Machine data review.",
        publisher: {
          "@id": `${siteUrl}/#marcelo-zapata`,
        },
      },
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${newsreader.variable}`}>
      <body className="font-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <main id="main-content" className="relative z-10 outline-none" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
