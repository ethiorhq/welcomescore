"use client";

import { useEffect, useRef, useState } from "react";

type TurnstileWidget = {
  remove: (widgetId: string) => void;
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  ready: (callback: () => void) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileWidget;
  }
}

const TURNSTILE_SCRIPT_ID = "welcomescore-turnstile-api";

type LoungeTurnstileProps = {
  action: "lounge_message" | "lounge_report";
  siteKey: string;
  onTokenChange: (token: string | null) => void;
};

export default function LoungeTurnstile({ action, siteKey, onTokenChange }: LoungeTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;

    function renderWidget() {
      if (cancelled || !window.turnstile || !containerRef.current || widgetIdRef.current) {
        return;
      }
      window.turnstile.ready(() => {
        if (cancelled || !window.turnstile || !containerRef.current || widgetIdRef.current) {
          return;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: "dark",
          size: "flexible",
          callback: (token: string) => {
            onTokenChange(token);
            setStatus("ready");
          },
          "expired-callback": () => {
            onTokenChange(null);
            setStatus("ready");
          },
          "error-callback": () => {
            onTokenChange(null);
            setStatus("error");
          },
        });
      });
    }

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      if (window.turnstile) {
        renderWidget();
      } else {
        existingScript.addEventListener("load", renderWidget, { once: true });
      }
    } else {
      const script = document.createElement("script");
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderWidget, { once: true });
      script.addEventListener("error", () => {
        if (!cancelled) {
          setStatus("error");
        }
      }, { once: true });
      document.head.appendChild(script);
    }

    timeoutId = window.setTimeout(() => {
      if (!cancelled && !widgetIdRef.current) {
        setStatus("error");
      }
    }, 12_000);

    return () => {
      cancelled = true;
      onTokenChange(null);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [action, onTokenChange, siteKey]);

  return (
    <div className="mt-3 rounded-md border border-muted/25 bg-base/25 p-3">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Visitor verification</p>
      <div ref={containerRef} className="mt-2 min-h-[65px]" />
      {status === "loading" ? <p className="mt-1 font-sans text-xs text-muted">Preparing the safety check…</p> : null}
      {status === "error" ? <p className="mt-1 font-sans text-xs text-muted">The safety check could not load. Refresh the Lounge or try again shortly.</p> : null}
    </div>
  );
}
