import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Compare Two GitHub Repositories for Contributor Readiness | WelcomeScore",
  description:
    "Compare the visible first-contributor signals of two public GitHub repositories side by side, using fresh public repository data for each deliberate check.",
  path: "/compare",
  imagePath: "/opengraph-image",
  imageAlt: "WelcomeScore repository comparison for first-time contributors",
});

export default function CompareLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
