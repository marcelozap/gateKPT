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
    default: "GateKPT - Play With Sound",
    template: "%s - GateKPT",
  },
  description:
    "GateKPT is a free music playground where sound becomes color, motion, ideas, and creative momentum.",
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
  },
  openGraph: {
    title: "GateKPT - Play With Sound",
    description:
      "A free music playground where sound becomes color, motion, ideas, and creative momentum.",
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
