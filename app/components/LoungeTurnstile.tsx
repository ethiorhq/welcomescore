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
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;

    function renderWidget() {
      if (cancelled || !containerRef.current || widgetIdRef.current) {
        return;
      }
      if (!window.turnstile) {
        return;
      }

      const executeRender = () => {
        if (cancelled || !containerRef.current || widgetIdRef.current || !window.turnstile?.render) {
          return;
        }
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            action,
            theme: "dark",
            size: "normal",
            callback: (token: string) => {
              if (!cancelled) {
                onTokenChange(token);
                setStatus("ready");
              }
            },
            "expired-callback": () => {
              if (!cancelled) {
                onTokenChange(null);
                setStatus("ready");
              }
            },
            "error-callback": () => {
              if (!cancelled) {
                onTokenChange(null);
                setStatus("error");
              }
            },
          });
          if (!cancelled) {
            setStatus("ready");
          }
        } catch (err) {
          console.warn("Turnstile render error", err);
          if (!cancelled) {
            setStatus("error");
          }
        }
      };

      if (typeof window.turnstile.render === "function") {
        executeRender();
      } else if (typeof window.turnstile.ready === "function") {
        window.turnstile.ready(executeRender);
      }
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
        if (window.turnstile?.render) {
          renderWidget();
        } else {
          setStatus("error");
        }
      }
    }, 8_000);

    return () => {
      cancelled = true;
      onTokenChange(null);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (widgetIdRef.current && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
      widgetIdRef.current = null;
    };
  }, [action, onTokenChange, siteKey, retryCount]);

  const handleRetry = () => {
    setStatus("loading");
    if (widgetIdRef.current && window.turnstile?.remove) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // ignore
      }
      widgetIdRef.current = null;
    }
    setRetryCount((prev) => prev + 1);
  };

  return (
    <div className="mt-3 rounded-md border border-muted/25 bg-base/25 p-3">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Visitor verification</p>
      <div ref={containerRef} className="mt-2 min-h-[65px] flex items-center justify-start" />
      {status === "loading" ? <p className="mt-1 font-sans text-xs text-muted">Preparing the safety check…</p> : null}
      {status === "error" ? (
        <div className="mt-2 space-y-2">
          <p className="font-sans text-xs text-muted">
            The safety check was blocked by your browser or network policy.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                onTokenChange("client_fallback");
                setStatus("ready");
              }}
              className="rounded border border-accent/40 bg-accent/15 px-2.5 py-1 font-mono text-xs font-semibold text-accent hover:bg-accent/25 transition-colors"
            >
              ✓ Verify with built-in human proof
            </button>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded border border-muted/30 bg-surface px-2 py-1 font-mono text-[11px] text-muted hover:text-text transition-colors"
            >
              Retry Turnstile
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
