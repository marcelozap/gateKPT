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
    default: "Marcelo Zapata - AI, Machine Learning & Data Engineering",
    template: "%s - GateKPT",
  },
  description:
    "GateKPT is Marcelo Zapata's public AI, machine learning, and data engineering notebook: LLM systems, visual signal mapping, data contracts, and field notes.",
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [
      { url: "/gatekpt-icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/gatekpt-icon.png"],
  },
  openGraph: {
    title: "Marcelo Zapata - AI, Machine Learning & Data Engineering",
    description: "LLM systems, visual signal mapping, data contracts, and field notes in one public GateKPT surface.",
    type: "website",
    url: getSiteUrl(),
    siteName: "GateKPT",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "GateKPT - AI from the text box out.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marcelo Zapata - AI, Machine Learning & Data Engineering",
    description: "LLM systems, visual signal mapping, data contracts, and field notes in one public GateKPT surface.",
    images: [
      {
        url: "/opengraph-image",
        alt: "GateKPT - AI from the text box out.",
      },
    ],
  },
  other: {
    "google": "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${newsreader.variable}`}>
      <body className="font-body">
        <main id="main-content" className="relative z-10 outline-none" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
