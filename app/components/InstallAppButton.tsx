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
    isChrome: boolean;
    isEdge: boolean;
  }>({
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isMac: false,
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
    const isMac = /Macintosh/.test(userAgent);

    setPlatform({ isIOS, isAndroid, isSafari, isMac, isChrome, isEdge });

    // Check if already in standalone mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && (window.navigator as any).standalone === true)
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
      console.log("PWA was installed");
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
      tip = "Tap the Share button (square with arrow) and select \"Add to Home Screen\"";
    } else if (platform.isAndroid) {
      if (platform.isChrome) {
        tip = "Tap the three dots (⋮) and select \"Add to Home screen\"";
      } else if (platform.isEdge) {
        tip = "Tap the three lines (≡) and select \"Add to phone\"";
      } else {
        tip = "Tap the menu and select \"Add to Home screen\"";
      }
    } else if (platform.isMac) {
      if (platform.isSafari) {
        tip = "Go to File > Add to Dock to install as an app";
      } else if (platform.isChrome) {
        tip = "Click the Install icon in the address bar or menu > Save and Share > Install page as app";
      } else if (platform.isEdge) {
        tip = "Click the App Available icon in the address bar or menu > Apps > Install this site as an app";
      } else {
        tip = "Select \"Install\" or \"Add to Applications\" in your browser menu";
      }
    } else {
      tip = "Select \"Add to Home screen\" or \"Install\" in your browser menu";
    }

    return (
      <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
        <p className="text-xs text-muted max-w-[320px] mx-auto">
          Tip: You can install WelcomeScore by selecting <span className="text-text font-medium">&quot;{tip}&quot;</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={handleInstallClick}
          className="group relative flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-md bg-accent px-6 font-sans text-sm font-semibold text-base transition-all active:scale-[0.98] hover:bg-accent/90"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:-translate-y-0.5"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Install Web App (PWA)
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Install WelcomeScore as a lightweight App on your device.
      </p>
    </div>
  );
}
