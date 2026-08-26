import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const title = "WelcomeScore — Is your repo ready for first-time contributors?";
const description =
  "WelcomeScore checks the contributor-friendliness of a public GitHub repository and returns a practical readiness score.";
const defaultBadgeImage = "/api/badge?repo=vercel/next.js";

export const metadata: Metadata = {
  metadataBase: new URL("https://welcomescore.vercel.app"),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: defaultBadgeImage,
        width: 600,
        height: 315,
        alt: "WelcomeScore preview for vercel/next.js",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [defaultBadgeImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexMono.variable} ${ibmPlexSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
