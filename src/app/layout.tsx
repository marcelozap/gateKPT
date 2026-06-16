import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { HubNav } from "@/components/HubNav";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GateKPT - What Does Sound Look Like?",
    template: "%s - GateKPT",
  },
  description:
    "A public music-art sketch from XIV: guitar, atmosphere, and motion in one living visual.",
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [
      { url: "/gatekpt-icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/gatekpt-icon.png"],
  },
  openGraph: {
    title: "GateKPT - What Does Sound Look Like?",
    description:
      "A public music-art sketch from XIV: guitar, atmosphere, and motion in one living visual.",
    type: "website",
    url: getSiteUrl(),
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
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
