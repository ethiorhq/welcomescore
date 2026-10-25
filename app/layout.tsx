import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import SiteFooter from "@/app/components/SiteFooter";
import AlgofoxPetProvider from "@/app/components/pet/AlgofoxPetProvider";
import AlgofoxWidget from "@/app/components/pet/AlgofoxWidget";
import SubscriberModal from "@/app/components/subscribers/SubscriberModal";
import ServiceWorkerRegistry from "@/app/components/ServiceWorkerRegistry";
import { homepageMetadata } from "@/lib/seo";
import { ETHIOR_URL, SITE_DESCRIPTION, SITE_DISPLAY_NAME, SITE_URL, THEME_COLOR } from "@/lib/site";
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

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  ...homepageMetadata,
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ETHIOR WelcomeScore — Open Source Contributor Readiness & Repository Onboarding Audit",
    template: "%s | ETHIOR WelcomeScore",
  },
  applicationName: SITE_DISPLAY_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ETHIOR WelcomeScore",
  },
  formatDetection: {
    telephone: false,
  },
  verification: {
    google: "googlee36968cc925022c1",
  },
  category: "Developer tools",
  keywords: [
    "ETHIOR WelcomeScore",
    "WelcomeScore by ETHIOR",
    "ETHIOR open source readiness",
    "ETHIOR repository audit",
    "ETHIOR GitHub readiness score",
    "first-time contributor welcoming score",
    "GitHub repository onboarding audit",
    "good first issue repository analyzer",
    "CONTRIBUTING.md automated validator",
    "open source community health check",
    "developer onboarding grade",
    "open source maintainer control plane",
    "repository newcomer accessibility audit",
    "GitHub README contributor badge",
    "open source documentation audit tool",
    "code of conduct checker",
    "software onboarding score",
  ],
};

function jsonLd(value: object) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const structuredDataGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${ETHIOR_URL}/#organization`,
      name: "ETHIOR",
      url: ETHIOR_URL,
      logo: `${SITE_URL}/favicon.ico`,
      sameAs: [
        "https://github.com/ethiorhq",
        "https://www.linkedin.com/company/ethior",
        "https://www.facebook.com/ethiorhq/",
        "https://www.instagram.com/ethiorhq/",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "ETHIOR WelcomeScore",
      alternateName: [
        "WelcomeScore",
        "WelcomeScore by ETHIOR",
        "ETHIOR Repository Auditor",
        "ETHIOR Contributor Readiness Index",
      ],
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: {
        "@id": `${ETHIOR_URL}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/?repo={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "ETHIOR WelcomeScore",
      alternateName: "WelcomeScore by ETHIOR",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "All (Cloud Edge & Web-based)",
      url: SITE_URL,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      creator: {
        "@id": `${ETHIOR_URL}/#organization`,
      },
      featureList: [
        "Deterministic 5-pillar GitHub contributor readiness audit",
        "Real-time CONTRIBUTING.md, Code of Conduct, and License detection",
        "Good first issue mentorship clarity and labels validation",
        "Dynamic SVG badge generator for GitHub READMEs",
        "Competitive open source repository comparison matrix",
        "Algofox AI-powered dev roast and actionable maintainer patch plans",
        "Developer Lounge real-time community hub with Cloudflare Turnstile bot protection",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexMono.variable} ${ibmPlexSans.variable} bg-base text-text`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredDataGraph) }} />
        <ServiceWorkerRegistry />
        <AlgofoxPetProvider>
          <div className="flex min-h-screen flex-col">
            {children}
            <SiteFooter />
          </div>
          <AlgofoxWidget />
          <SubscriberModal />
        </AlgofoxPetProvider>
      </body>
    </html>
  );
}
