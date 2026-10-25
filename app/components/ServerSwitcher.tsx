"use client";

import { useEffect, useState } from "react";
import { CLOUDFLARE_PRODUCTION_URL, VERCEL_MIRROR_URL } from "@/lib/site";

export default function ServerSwitcher({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [currentHost, setCurrentHost] = useState("");
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    setMounted(true);
    setCurrentHost(window.location.hostname);
    setCurrentPath(window.location.pathname + window.location.search);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-md border border-muted/30 bg-surface/90 px-2 py-0.5 font-mono text-[10px] text-muted ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
        <span>Checking server…</span>
      </div>
    );
  }

  const isVercel = currentHost.includes("vercel.app");
  const isCloudflare =
    currentHost.includes("is-local.org") ||
    currentHost.includes("pages.dev") ||
    currentHost.includes("workers.dev");

  const activeLabel = isVercel
    ? "Vercel Node"
    : isCloudflare
    ? "Cloudflare Edge"
    : "Local Node";

  const targetUrl = isVercel
    ? `${CLOUDFLARE_PRODUCTION_URL}${currentPath}`
    : `${VERCEL_MIRROR_URL}${currentPath}`;

  const switchActionText = isVercel
    ? "Switch to Cloudflare Edge →"
    : "Switch to Vercel Mirror →";

  const switchActionShort = isVercel ? "Switch to Cloudflare →" : "Switch to Vercel →";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border border-muted/30 bg-surface/90 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] text-muted shadow-sm backdrop-blur-md transition-all duration-200 hover:border-accent/40 ${className}`}
      title={`Currently serving from ${activeLabel}. Click to switch server.`}
    >
      {/* Live Glowing Status Indicator */}
      <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-70 ${
            isCloudflare ? "bg-emerald-400" : "bg-accent"
          }`}
        />
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            isCloudflare ? "bg-emerald-500" : "bg-accent"
          }`}
        />
      </span>

      {/* Active host name */}
      <span className="font-medium text-text/80 whitespace-nowrap">{activeLabel}</span>

      <span className="text-muted/30" aria-hidden="true">
        ·
      </span>

      {/* Action link */}
      <a
        href={targetUrl}
        className="font-semibold text-accent hover:underline hover:text-accent/90 transition-colors whitespace-nowrap"
        title={`Failover or switch to ${isVercel ? "Cloudflare Edge" : "Vercel Mirror"}`}
      >
        <span className="hidden sm:inline">{switchActionText}</span>
        <span className="inline sm:hidden">{switchActionShort}</span>
      </a>
    </div>
  );
}
