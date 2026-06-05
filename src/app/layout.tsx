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
    default: "GateKPT - Late Night Florida",
    template: "%s - GateKPT",
  },
  description:
    "Late Night Florida: covers, voice notes, field recordings, visuals, and songs built from humid nights, pressure, language, and sound.",
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
  },
  openGraph: {
    title: "GateKPT - Late Night Florida",
    description:
      "Songs from the training ground: covers, field recordings, visual terrain, and a custom MusicOS for shaping takes.",
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
