import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { enCA } from "@/lib/i18n/en-CA";
import "./globals.css";

// Q20 default: Space Grotesk for titles and big numbers. next/font downloads it at build time and serves it from this app,
// so no visitor's browser talks to Google.
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["700"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: enCA.app.name,
  description: enCA.app.description,
  applicationName: enCA.app.name,
  appleWebApp: { capable: true, title: enCA.app.name, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1F6B47",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" className={spaceGrotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
