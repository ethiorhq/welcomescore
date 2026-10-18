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
  const [platform, setPlatform] = useState<{
    isIOS: boolean;
    isAndroid: boolean;
    isSafari: boolean;
    isMac: boolean;
    isWindows: boolean;
    isChrome: boolean;
    isEdge: boolean;
  }>({
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isMac: false,
    isWindows: false,
    isChrome: false,
    isEdge: false,
  });

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isWindows = /Win/.test(userAgent);
    const isEdge = /Edg/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent) && !isEdge;
    const isSafari = /Safari/.test(userAgent) && !isChrome && !isEdge;
    const isMac = /Macintosh/.test(userAgent);

    setPlatform({ isIOS, isAndroid, isSafari, isMac, isWindows, isChrome, isEdge });

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

  if (isStandalone || isInstalled) {
    return null;
  }

  if (!deferredPrompt) {
    let tip = "";
    if (platform.isIOS) {
      tip = "Tap Share and 'Add to Home Screen'";
    } else if (platform.isAndroid) {
      tip = platform.isChrome ? "Tap ⋮ and 'Add to Home screen'" : "Tap menu and 'Add to Home screen'";
    } else if (platform.isMac || platform.isWindows) {
      tip = platform.isSafari ? "File > Add to Dock" : "Click Install in the address bar";
    } else {
      tip = "Select 'Add to Home screen' in your browser menu";
    }

    return (
      <div className="mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-1000">
        <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
          <div className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold">
            Native App Tip: <span className="text-text/90 font-bold ml-1">{tip}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <button
        onClick={handleInstallClick}
        className="group relative flex h-10 items-center gap-2.5 overflow-hidden rounded-full bg-accent px-5 font-sans text-xs font-bold text-base transition-all active:scale-[0.96] hover:bg-accent/90 shadow-[0_0_20px_rgba(232,162,61,0.2)] hover:shadow-[0_0_25px_rgba(232,162,61,0.4)]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
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
      <div className="mt-3 flex items-center gap-1.5 opacity-50">
        <div className="h-px w-4 bg-muted" />
        <span className="text-[10px] font-medium tracking-tight uppercase">PWA Experience</span>
        <div className="h-px w-4 bg-muted" />
      </div>
    </div>
  );
}
