import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jbmono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GateKPT - The AI Stack, Mapped End to End",
    template: "%s - GateKPT",
  },
  description:
    "A public map of the AI stack: power, chips, data, models, software, testing, and business. Seven layers, one number and one source each.",
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [
      { url: "/gatekpt-icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/gatekpt-icon.png"],
  },
  openGraph: {
    title: "GateKPT - The AI Stack, Mapped End to End",
    description:
      "Power, chips, data, models, software, testing, business. Seven layers, mapped.",
    type: "website",
    url: getSiteUrl(),
    siteName: "GateKPT",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#05070D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable}`}>
      <body className="font-body">
        <main id="main-content" className="relative z-10 outline-none" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
