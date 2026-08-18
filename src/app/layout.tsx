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
    default: "GateKPT - AI From the Text Box Out",
    template: "%s - GateKPT",
  },
  description:
    "Published writing and a public map of the AI layers: input, tokens, context, models, tools, chips, and power.",
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [
      { url: "/gatekpt-icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/gatekpt-icon.png"],
  },
  openGraph: {
    title: "GateKPT - AI From the Text Box Out",
    description: "Published writing and a public map of what happens after you type.",
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
    title: "GateKPT - AI From the Text Box Out",
    description: "Published writing and a public map of what happens after you type.",
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
