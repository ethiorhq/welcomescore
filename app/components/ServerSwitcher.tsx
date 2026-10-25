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
        className={`inline-flex items-center gap-1.5 rounded-md border border-muted/30 bg-surface/90 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] text-muted ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
        <span>Detecting edge…</span>
      </div>
    );
  }

  const isVercel = currentHost.includes("vercel.app");
  const isCloudflare =
    currentHost.includes("is-local.org") ||
    currentHost.includes("pages.dev") ||
    currentHost.includes("workers.dev");

  const activeLabelFull = isVercel
    ? "Vercel Mirror"
    : isCloudflare
    ? "Cloudflare Edge"
    : "Local Node";

  const activeLabelShort = isVercel
    ? "Vercel"
    : isCloudflare
    ? "CF Edge"
    : "Local";

  const targetUrl = isVercel
    ? `${CLOUDFLARE_PRODUCTION_URL}${currentPath}`
    : `${VERCEL_MIRROR_URL}${currentPath}`;

  const switchActionFull = isVercel
    ? "Switch to Cloudflare Edge →"
    : "Switch to Vercel Mirror →";

  const switchActionShort = isVercel ? "⇄ Cloudflare" : "⇄ Vercel";

  return (
    <a
      href={targetUrl}
      className={`group relative inline-flex items-center gap-1.5 rounded-md border border-muted/30 bg-surface/90 px-2 py-0.5 sm:px-2.5 sm:py-0.5 font-mono text-[10px] sm:text-[11px] text-text/80 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-accent/50 hover:bg-surface hover:text-accent focus:outline-none focus:ring-1 focus:ring-accent ${className}`}
      title={`Currently served by ${activeLabelFull}. Click to switch to ${isVercel ? "Cloudflare Edge" : "Vercel Mirror"}.`}
      aria-label={`Switch server from ${activeLabelFull} to ${isVercel ? "Cloudflare Edge" : "Vercel Mirror"}`}
    >
      {/* Live Glowing Status Indicator */}
      <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
            isCloudflare ? "bg-emerald-400" : "bg-accent"
          }`}
        />
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            isCloudflare ? "bg-emerald-500" : "bg-accent"
          }`}
        />
      </span>

      {/* Active Server Badge Text */}
      <span className="font-medium text-text/80 group-hover:text-accent transition-colors whitespace-nowrap">
        <span className="hidden sm:inline">{activeLabelFull}</span>
        <span className="inline sm:hidden">{activeLabelShort}</span>
      </span>

      <span className="text-muted/40" aria-hidden="true">
        ·
      </span>

      {/* Switch Action Link Text */}
      <span className="font-semibold text-accent underline-offset-2 group-hover:underline whitespace-nowrap">
        <span className="hidden sm:inline">{switchActionFull}</span>
        <span className="inline sm:hidden">{switchActionShort}</span>
      </span>
    </a>
  );
}
