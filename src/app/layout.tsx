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
    default: "GateKPT - AI From the Physical Layer Up",
    template: "%s - GateKPT",
  },
  description: "AI notes, field logs, and a living gateway for understanding the machine.",
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [
      { url: "/gatekpt-icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/gatekpt-icon.png"],
  },
  openGraph: {
    title: "GateKPT - AI From the Physical Layer Up",
    description: "AI notes, field logs, and a living gateway for understanding the machine.",
    type: "website",
    url: getSiteUrl(),
    siteName: "GateKPT",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "GateKPT audio-analysis gateway.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GateKPT - AI From the Physical Layer Up",
    description: "AI notes, field logs, and a living gateway for understanding the machine.",
    images: [
      {
        url: "/opengraph-image",
        alt: "GateKPT audio-analysis gateway.",
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
