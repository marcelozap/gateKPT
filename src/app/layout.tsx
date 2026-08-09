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
    default: "GateKPT - AI From the Physical Layer Up",
    template: "%s - GateKPT",
  },
  description:
    "A public research terminal for the AI stack: power, chips, data, models, software, testing, and business context.",
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
    description:
      "A public research terminal for the system underneath modern AI.",
    type: "website",
    url: getSiteUrl(),
    siteName: "GateKPT",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#02050A",
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
