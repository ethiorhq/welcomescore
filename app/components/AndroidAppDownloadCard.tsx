"use client";

import React, { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface AndroidAppDownloadCardProps {
  className?: string;
}

export default function AndroidAppDownloadCard({
  className = "",
}: AndroidAppDownloadCardProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [platform, setPlatform] = useState({
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isEdge: false,
  });

  const appUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL?.trim();
  const hasNativeApk = Boolean(appUrl && appUrl.startsWith("https://") && !appUrl.includes("debug"));

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userAgent = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isEdge = /Edg/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent) && !isEdge;
    const isSafari = /Safari/.test(userAgent) && !isChrome && !isEdge;

    setPlatform({ isIOS, isAndroid, isSafari, isChrome, isEdge });

    const checkStandalone = () => {
      const isPwaParam = window.location.search.includes("mode=pwa");
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      const isMinimalUiMedia = window.matchMedia("(display-mode: minimal-ui)").matches;
      const isFullscreenMedia = window.matchMedia("(display-mode: fullscreen)").matches;
      const isSafariStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      const isTwa = document.referrer.includes("android-app://");

      return isPwaParam || isStandaloneMedia || isMinimalUiMedia || isFullscreenMedia || isSafariStandalone || isTwa;
    };

    if (checkStandalone()) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      setShowInstructions((prev) => !prev);
    }
  };

  const getPlatformTip = () => {
    if (platform.isIOS) {
      return "Tap the Share button in Safari and choose 'Add to Home Screen'.";
    }
    if (platform.isAndroid) {
      return "Tap menu (⋮) in Chrome or your browser and choose 'Install app' or 'Add to Home screen'.";
    }
    return "Click the install icon (⊕) in your browser address bar to install on your computer.";
  };

  return (
    <div
      className={`rounded-xl border border-white/10 bg-[#1B1E29] p-5 shadow-lg ${className}`}
      role="region"
      aria-label="WelcomeScore Progressive Web App"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E8A23D]/10 text-[#E8A23D] border border-[#E8A23D]/20">
            {/* Mobile / PWA Device Icon */}
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-[#F2EEE6]">
                WelcomeScore App (PWA)
              </h3>
              <span className="font-mono text-[10px] text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/20">
                Installable • Offline Ready
              </span>
            </div>
            <p className="text-xs text-[#8B8F9E] mt-1">
              Install WelcomeScore on Android, iOS, or Desktop for instant audits with zero app store downloads.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {isStandalone || isInstalled ? (
            <div className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 px-3.5 py-2 font-mono text-xs text-[#22C55E]">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
              App Installed
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E8A23D] bg-[#E8A23D] px-4 py-2 font-mono text-xs font-semibold text-[#12141C] transition hover:bg-[#E8A23D]/90 active:scale-[0.98]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {deferredPrompt ? "Install App Now" : "Install App"}
            </button>
          )}

          {hasNativeApk && (
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-[#8B8F9E] transition hover:bg-white/10"
            >
              APK ↗
            </a>
          )}
        </div>
      </div>

      {showInstructions && !isStandalone && !isInstalled && (
        <div className="mt-4 border-t border-white/10 pt-3 text-xs text-[#8B8F9E] flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <p>
            <span className="font-semibold text-[#F2EEE6]">Installation guide:</span> {getPlatformTip()}
          </p>
          <button
            onClick={() => setShowInstructions(false)}
            className="text-[11px] text-[#8B8F9E] hover:text-[#F2EEE6] shrink-0 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
