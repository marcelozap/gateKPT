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
    default: "GateKPT - Make Sound Visible",
    template: "%s - GateKPT",
  },
  description:
    "Play a sample, use your mic, and watch sound turn into color, terrain, and motion.",
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
  },
  openGraph: {
    title: "GateKPT - Make Sound Visible",
    description:
      "No account, no upload, no pressure. Make a sound and watch the page move.",
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
