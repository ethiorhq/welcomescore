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

    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
    ) {
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
      tip = "Tap Share and 'Add to Home Screen'";
    } else if (platform.isAndroid) {
      tip = platform.isChrome ? "Tap ⋮ and 'Add to Home screen'" : "Tap menu and 'Add to Home screen'";
    } else {
      tip = "Click the 'Install' icon in your browser address bar";
    }

    return (
      <div className="mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-1000">
        <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
          <div className="flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold">
            PWA TIP: <span className="text-text/90 ml-1 italic">{tip}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <button
        onClick={handleInstallClick}
        className="group relative flex h-9 items-center gap-2.5 overflow-hidden rounded-full bg-accent px-5 font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-base transition-all active:scale-95 hover:bg-accent/90 shadow-[0_0_20px_rgba(232,162,61,0.15)] hover:shadow-[0_0_25px_rgba(232,162,61,0.35)] border border-white/10"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <svg
          width="14"
          height="14"
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
      <div className="mt-3 flex items-center gap-2 opacity-20">
        <div className="h-[1px] w-3 bg-muted-foreground" />
        <span className="text-[8px] font-black tracking-[0.3em] uppercase">PWA Experience</span>
        <div className="h-[1px] w-3 bg-muted-foreground" />
      </div>
    </div>
  );
}
