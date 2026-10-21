export const SITE_NAME = "WelcomeScore";
export const SITE_DISPLAY_NAME = "WelcomeScore";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://welcomescore.vercel.app";
export const SOURCE_REPOSITORY_URL = "https://github.com/ethiorhq/welcomescore";
export const ETHIOR_URL = "https://ethior.com";
export const ETHIOR_FACEBOOK_URL = "https://www.facebook.com/ethiorhq/";
export const ETHIOR_INSTAGRAM_URL = "https://www.instagram.com/ethiorhq/";
export const ETHIOR_LINKEDIN_URL = "https://www.linkedin.com/company/ethior";
export const ETHIOR_GITHUB_URL = "https://github.com/ethiorhq";
export const SITE_DESCRIPTION =
  "Evaluate how ready a public GitHub repository is for first-time contributors with evidence-bound guidance.";

export const THEME_COLOR = "#12141C";
export const BACKGROUND_COLOR = "#12141C";

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
  "/js",
] as const;

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}
