import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Hall of Fame: Contributor-Ready GitHub Repositories | WelcomeScore",
  description:
    "Explore public repositories that were explicitly submitted to WelcomeScore’s Hall of Fame after meeting the published contributor-readiness and eligibility rules.",
  path: "/leaderboard",
  imagePath: "/opengraph-image",
  imageAlt: "WelcomeScore Hall of Fame for contributor-ready public repositories",
});

export default function LeaderboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
