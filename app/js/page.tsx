import type { Metadata } from "next";
import JsHealthDashboard from "@/app/components/JsHealthDashboard";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "JavaScript Health Index for npm Maintainers",
  description: "Inspect public JavaScript and TypeScript package metadata, Node tooling, CI signals, and contributor foundations with WelcomeScore.",
  alternates: {
    canonical: `${SITE_URL}/js`,
  },
  openGraph: {
    title: "WelcomeScore JavaScript Health Index",
    description: "A read-only health view for JavaScript and TypeScript package maintainers.",
    url: `${SITE_URL}/js`,
  },
};

export default function JavaScriptHealthPage() {
  return <JsHealthDashboard />;
}
