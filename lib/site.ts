export const SITE_NAME = "WelcomeScore";
export const SITE_DISPLAY_NAME = "WelcomeScore by ETHIOR";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.welcomescore.is-local.org";
export const CLOUDFLARE_PRODUCTION_URL = "https://www.welcomescore.is-local.org";
export const CLOUDFLARE_PAGES_URL = "https://welcomescore.pages.dev";
export const VERCEL_MIRROR_URL = "https://welcomescore.vercel.app";
export const GITHUB_PAGES_MIRROR_URL = "https://ethiorhq.github.io/welcomescore";
export const SOURCE_REPOSITORY_URL = "https://github.com/ethiorhq/welcomescore";

export interface ServerEndpoint {
  id: "cloudflare" | "vercel" | "github";
  name: string;
  shortName: string;
  role: string;
  url: string;
  domain: string;
  badgeColor: string;
  dotClass: string;
}

export const MULTI_SERVER_ENDPOINTS: ServerEndpoint[] = [
  {
    id: "cloudflare",
    name: "Cloudflare Edge Primary",
    shortName: "CF Edge",
    role: "Primary Edge (Workerd V8 Isolates)",
    url: CLOUDFLARE_PAGES_URL,
    domain: "welcomescore.pages.dev",
    badgeColor: "emerald",
    dotClass: "bg-emerald-400",
  },
  {
    id: "vercel",
    name: "Vercel Serverless Mirror",
    shortName: "Vercel",
    role: "Failover Mirror (Edge Compute)",
    url: VERCEL_MIRROR_URL,
    domain: "welcomescore.vercel.app",
    badgeColor: "amber",
    dotClass: "bg-accent",
  },
  {
    id: "github",
    name: "GitHub Pages Mirror",
    shortName: "GH Pages",
    role: "Static CDN Mirror (GitHub Global CDN)",
    url: GITHUB_PAGES_MIRROR_URL,
    domain: "ethiorhq.github.io/welcomescore",
    badgeColor: "sky",
    dotClass: "bg-sky-400",
  },
];
export const ETHIOR_URL = "https://ethior.com";
export const ETHIOR_FACEBOOK_URL = "https://www.facebook.com/ethiorhq/";
export const ETHIOR_INSTAGRAM_URL = "https://www.instagram.com/ethiorhq/";
export const ETHIOR_LINKEDIN_URL = "https://www.linkedin.com/company/ethior";
export const ETHIOR_GITHUB_URL = "https://github.com/ethiorhq";
export const SITE_DESCRIPTION =
  "WelcomeScore by ETHIOR evaluates how ready a public GitHub repository is for first-time contributors with evidence-bound guidance.";

export const THEME_COLOR = "#12141C";
export const BACKGROUND_COLOR = "#12141C";

export const PUBLIC_ROUTE_PATHS = [
  "/",
  "/compare",
  "/leaderboard",
  "/devops",
  "/org",
  "/templates",
  "/lounge",
  "/how-it-works",
  "/faq",
  "/privacy",
  "/terms",
  "/dev-lounge-policy",
  "/policies/multi-server",
  "/guides",
  "/js",
] as const;

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}
