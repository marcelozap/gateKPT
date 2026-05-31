import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { HubNav } from "@/components/HubNav";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GateKPT - Music",
    template: "%s - GateKPT",
  },
  description:
    "GateKPT is the public home for the MusicOS creator app, videos, creative services, pricing models, and early access.",
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
  },
  openGraph: {
    title: "GateKPT - Music",
    description:
      "A music-first landing page for the GateKPT MusicOS creator app, videos, services, and early access.",
    type: "website",
    url: getSiteUrl(),
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-body">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <HubNav />
        <main id="main-content" className="relative z-10 outline-none" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
