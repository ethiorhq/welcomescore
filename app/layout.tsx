import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import SiteFooter from "@/app/components/SiteFooter";
import AlgofoxPetProvider from "@/app/components/pet/AlgofoxPetProvider";
import AlgofoxWidget from "@/app/components/pet/AlgofoxWidget";
import { homepageMetadata } from "@/lib/seo";
import { ETHIOR_URL, SITE_DESCRIPTION, SITE_DISPLAY_NAME, SITE_NAME, SITE_URL } from "@/lib/site";
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

export const metadata: Metadata = {
  ...homepageMetadata,
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_DISPLAY_NAME,
  category: "Developer tools",
  keywords: [
    "open source contributor onboarding",
    "GitHub repository readiness",
    "good first issue",
    "CONTRIBUTING.md",
    "developer community",
  ],
};

function jsonLd(value: object) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_DISPLAY_NAME,
  alternateName: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  publisher: {
    "@type": "Organization",
    name: "ETHIOR",
    url: ETHIOR_URL,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ETHIOR",
  url: ETHIOR_URL,
  sameAs: ["https://github.com/ethiorhq/welcomescore"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexMono.variable} ${ibmPlexSans.variable} bg-base text-text`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema) }} />
        <AlgofoxPetProvider>
          <div className="flex min-h-screen flex-col">
            {children}
            <SiteFooter />
          </div>
          <AlgofoxWidget />
        </AlgofoxPetProvider>
      </body>
    </html>
  );
}
