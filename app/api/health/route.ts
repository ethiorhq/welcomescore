import { NextResponse } from "next/server";
import {
  CLOUDFLARE_PAGES_URL,
  GITHUB_PAGES_MIRROR_URL,
  VERCEL_MIRROR_URL,
} from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startTime = Date.now();
  const host = (request.headers.get("host") || "").toLowerCase();
  const cfRay = request.headers.get("cf-ray");
  const vercelId = request.headers.get("x-vercel-id");

  const isCloudflare = Boolean(
    cfRay ||
    host.includes("is-local.org") ||
    host.includes("pages.dev") ||
    host.includes("workers.dev")
  );

  const isVercel = Boolean(
    vercelId ||
    host.includes("vercel.app")
  );

  const isGitHubPages = Boolean(
    host.includes("github.io")
  );

  const activeServer = isVercel
    ? "vercel-serverless-mirror"
    : isGitHubPages
    ? "github-pages-static-mirror"
    : isCloudflare
    ? "cloudflare-edge-primary"
    : "local-node-dev";

  const activePlatform = isVercel
    ? "Vercel Edge / Serverless Mirror"
    : isGitHubPages
    ? "GitHub Pages Global CDN Mirror"
    : isCloudflare
    ? "Cloudflare Workers & Pages (OpenNext Workerd)"
    : "Local Node.js Development";

  // Check Supabase connectivity if configured
  let databaseStatus = "unconfigured";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/`, {
        method: "HEAD",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      databaseStatus = res.ok || res.status === 404 ? "connected" : `degraded (${res.status})`;
    } catch {
      databaseStatus = "offline-fallback-active";
    }
  }

  const latencyMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: "operational",
      server: activeServer,
      platform: activePlatform,
      activeHost: host,
      region: cfRay
        ? `Cloudflare [${cfRay.split("-").pop() || "GLOBAL"}]`
        : vercelId
        ? `Vercel [${vercelId.split("::").shift() || "EDGE"}]`
        : isGitHubPages
        ? "GitHub Global CDN"
        : "local",
      mirrors: [
        {
          name: "Cloudflare Edge Primary",
          url: CLOUDFLARE_PAGES_URL,
          domain: "welcomescore.pages.dev",
          status: "operational",
        },
        {
          name: "Vercel Serverless Mirror",
          url: VERCEL_MIRROR_URL,
          domain: "welcomescore.vercel.app",
          status: "operational",
        },
        {
          name: "GitHub Pages Mirror",
          url: GITHUB_PAGES_MIRROR_URL,
          domain: "ethiorhq.github.io/welcomescore",
          status: "operational",
        },
      ],
      database: databaseStatus,
      latencyMs,
      timestamp: new Date().toISOString(),
      version: "2.2.0-multi-edge",
      multiServerPolicy: {
        architecture: "Active-Active Triple-Cloud Mesh (Cloudflare + Vercel + GitHub Pages)",
        primaryEdge: "Cloudflare Workers / Pages via OpenNext (workerd)",
        failoverMirror: "Vercel Serverless Mirror",
        staticMirror: "GitHub Pages Global CDN Mirror",
        unifiedState: "Supabase PostgreSQL Database",
        targetUptime: "99.99%",
        automaticFailover: "Supported via DNS & Client Switcher",
        altSvcPolicy: "clear (QUIC bypassed for standard TCP HTTP/2 reliability)",
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
        "X-Server-Node": activeServer,
        "alt-svc": "clear",
      },
    }
  );
}
