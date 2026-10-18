"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState({
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isEdge: false,
  });

  useEffect(() => {
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
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone || isInstalled) return null;

  if (!deferredPrompt) {
    let tip = "";
    if (platform.isIOS) {
      tip = "TAP SHARE AND 'ADD TO HOME SCREEN'";
    } else if (platform.isAndroid) {
      tip = platform.isChrome ? "TAP ⋮ AND 'ADD TO HOME SCREEN'" : "TAP MENU AND 'ADD TO HOME SCREEN'";
    } else {
      tip = "CLICK THE 'INSTALL' ICON IN YOUR BROWSER ADDRESS BAR";
    }

    return (
      <div className="mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="flex items-center gap-3 rounded-md border border-muted/35 bg-surface px-4 py-2.5">
          <div className="flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <p className="font-sans text-[11px] font-bold tracking-widest text-muted">
            PWA TIP: <span className="text-text">{tip}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button
        onClick={handleInstallClick}
        className="group flex h-12 items-center gap-2.5 rounded-md bg-accent px-6 font-sans text-sm font-semibold text-base transition-all duration-180 ease-out active:scale-[0.98] hover:bg-accent/90"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform group-hover:-translate-y-0.5"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Install App</span>
      </button>
    </div>
  );
}
