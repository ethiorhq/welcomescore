import type { Metadata } from "next";
import DevOpsDashboard from "./DevOpsDashboard";

export const metadata: Metadata = {
  title: "ETHIOR DevOps CI/CD Pipeline Doctor & License Radar · WelcomeScore",
  description:
    "Diagnose GitHub Actions workflow bottlenecks, eliminate wasted runner minutes with automated dependency caching, audit copyleft license compliance, and generate 1-click CI optimization PRs.",
  keywords: [
    "ETHIOR",
    "DevOps pipeline doctor",
    "GitHub Actions optimization",
    "CI CD cache optimizer",
    "runner minutes savings",
    "license compliance radar",
    "open source devops audit",
    "actions setup node cache",
    "devops score",
  ],
  openGraph: {
    title: "ETHIOR DevOps CI/CD Pipeline Doctor & License Radar",
    description:
      "Audit any GitHub repository for pipeline speed, wasted compute, supply-chain pin risks, and copyleft licenses.",
    type: "website",
    url: "https://www.welcomescore.is-local.org/devops",
  },
  alternates: {
    canonical: "https://www.welcomescore.is-local.org/devops",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ETHIOR DevOps CI/CD Pipeline Doctor",
  url: "https://www.welcomescore.is-local.org/devops",
  description:
    "Automated diagnostic profiler for GitHub Actions workflows, runner compute efficiency, supply-chain pinning, and open-source license compliance.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  creator: {
    "@type": "Organization",
    name: "ETHIOR",
    url: "https://ethior.com",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function DevOpsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DevOpsDashboard />
    </>
  );
}
