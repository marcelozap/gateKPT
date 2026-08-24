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
    default: "GateKPT - Sound Into Signal",
    template: "%s - GateKPT",
  },
  description: "A living gateway where music, signal analysis, motion mapping, The Record, and shipped systems meet.",
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [
      { url: "/gatekpt-icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/gatekpt-icon.png"],
  },
  openGraph: {
    title: "GateKPT - Sound Into Signal",
    description: "A living gateway where music, signal analysis, motion mapping, The Record, and shipped systems meet.",
    type: "website",
    url: getSiteUrl(),
    siteName: "GateKPT",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "GateKPT sound-to-signal gateway.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GateKPT - Sound Into Signal",
    description: "A living gateway where music, signal analysis, motion mapping, The Record, and shipped systems meet.",
    images: [
      {
        url: "/opengraph-image",
        alt: "GateKPT sound-to-signal gateway.",
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
        name: "GateKPT",
        url: siteUrl,
        description:
          "Marcelo Zapata's public surface for AI systems, machine learning literacy, The Record, signal-mapped motion, and visual work.",
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
