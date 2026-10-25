import { NextResponse } from "next/server";
import { CLOUDFLARE_PRODUCTION_URL, VERCEL_MIRROR_URL } from "@/lib/site";

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

  const activeServer = isVercel
    ? "vercel-serverless-mirror"
    : isCloudflare
    ? "cloudflare-edge-primary"
    : "local-node-dev";

  const activePlatform = isVercel
    ? "Vercel Edge / Serverless Mirror"
    : isCloudflare
    ? "Cloudflare Workers & Pages (OpenNext Workerd)"
    : "Local Node.js Development";

  const mirrorUrl = isVercel ? CLOUDFLARE_PRODUCTION_URL : VERCEL_MIRROR_URL;
  const mirrorName = isVercel ? "Cloudflare Edge Primary" : "Vercel Serverless Mirror";

  // Check Supabase connectivity if configured
  let databaseStatus = "unconfigured";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/`, {
        method: "HEAD",
        headers: { apikey: supabaseKey },
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
      region: cfRay ? `Cloudflare [${cfRay.split("-").pop() || "GLOBAL"}]` : vercelId ? `Vercel [${vercelId.split("::").shift() || "EDGE"}]` : "local",
      mirror: {
        name: mirrorName,
        url: mirrorUrl,
        status: "operational",
      },
      database: databaseStatus,
      latencyMs,
      timestamp: new Date().toISOString(),
      version: "2.2.0-multi-edge",
      multiServerPolicy: {
        architecture: "Active-Active Multi-Cloud (Cloudflare + Vercel)",
        primaryEdge: "Cloudflare Workers / Pages via OpenNext",
        failoverMirror: "Vercel Serverless Mirror",
        unifiedState: "Supabase PostgreSQL Database",
        targetUptime: "99.99%",
        automaticFailover: "Supported via DNS & Client Switcher",
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
        "X-Server-Node": activeServer,
      },
    }
  );
}
