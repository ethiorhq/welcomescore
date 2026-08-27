export const SITE_NAME = "WelcomeScore";
export const SITE_DISPLAY_NAME = "WelcomeScore.js.org";
export const SITE_URL = "https://welcomescore.vercel.app";
export const SOURCE_REPOSITORY_URL = "https://github.com/ethiorhq/welcomescore";
export const ETHIOR_URL = "https://ethior.com";
export const SITE_DESCRIPTION =
  "Check how ready a public GitHub repository is for first-time contributors, then improve its onboarding with practical, evidence-bound guidance.";

export const PUBLIC_ROUTE_PATHS = [
  "/",
  "/compare",
  "/leaderboard",
  "/lounge",
  "/how-it-works",
  "/faq",
  "/privacy",
  "/terms",
  "/dev-lounge-policy",
  "/guides",
] as const;

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}
