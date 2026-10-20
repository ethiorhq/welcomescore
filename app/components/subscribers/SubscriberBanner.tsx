"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface SubscriberBannerProps {
  source?: string;
  className?: string;
}

const STORAGE_KEY = "welcomescore_subscriber_state";
const DISMISS_KEY = "welcomescore_banner_dismissed";

export default function SubscriberBanner({
  source = "welcomescore_banner",
  className = "",
}: SubscriberBannerProps) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check subscriber status via localStorage, cookie, and IP detection
  useEffect(() => {
    // 1. Check local storage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { status?: string };
        if (parsed.status === "subscribed") {
          setIsSubscribed(true);
          return;
        }
      }
    } catch {
      // Safe fallback
    }

    // 2. Check cookie
    if (typeof document !== "undefined" && document.cookie.includes("welcomescore_subscribed=1")) {
      setIsSubscribed(true);
      return;
    }

    // 3. Check dismissed flag in session/local storage
    try {
      if (
        sessionStorage.getItem(DISMISS_KEY) === "1" ||
        localStorage.getItem(DISMISS_KEY) === "1"
      ) {
        setIsDismissed(true);
        return;
      }
    } catch {
      // Safe fallback
    }

    // 4. IP detection & server status check
    let isMounted = true;
    fetch("/api/subscribe", { method: "GET", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.isSubscribed) {
          setIsSubscribed(true);
          try {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ status: "subscribed", timestamp: Date.now() }),
            );
          } catch {
            // Safe fallback
          }
        }
      })
      .catch(() => {
        // Network errors or offline mode: silently ignore
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Safe fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    setFeedbackMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source,
          hp: honeypot,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setStatus("error");
        setFeedbackMessage(data.error?.message || "Could not subscribe. Please try again.");
        return;
      }

      setStatus("success");
      setFeedbackMessage(data.message || "You're on the list! Thank you for supporting WelcomeScore.");

      // Set cookie and localStorage marking subscriber status
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ status: "subscribed", timestamp: Date.now() }),
        );
        document.cookie = "welcomescore_subscribed=1; path=/; max-age=31536000; SameSite=Lax";
      } catch {
        // Safe fallback
      }

      // Automatically transition form to invisible after brief thank-you acknowledgement
      setTimeout(() => {
        setIsSubscribed(true);
      }, 3000);
    } catch {
      setStatus("error");
      setFeedbackMessage("Network error. Please check your connection and try again.");
    }
  };

  // When already submitted or dismissed, form is completely invisible (zero DOM footprint)
  if (isSubscribed || isDismissed) {
    return null;
  }

  return (
    <section
      aria-label="Developer updates and newsletter"
      className={`relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#141622]/85 p-5 sm:p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-accent/30 ${className}`}
    >
      {/* Subtle ambient light glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-accent/[0.07] blur-3xl"
        aria-hidden="true"
      />

      {status === "success" ? (
        /* Success State / Graceful Acknowledgement before disappearing */
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in duration-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-good/20 text-good font-mono text-xs font-bold">
                ✓
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-good font-semibold">
                Subscription Confirmed
              </span>
            </div>
            <p className="font-mono text-sm font-semibold text-text">
              You&apos;re on the list! Thank you for supporting WelcomeScore.
            </p>
            <p className="font-sans text-xs text-muted">
              Discover AI automation and custom tools by{" "}
              <Link
                href="https://ethior.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-accent underline underline-offset-2 hover:text-accent/80 transition"
              >
                ETHIOR ↗
              </Link>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSubscribed(true)}
            className="self-start sm:self-center rounded-lg border border-white/10 bg-base/60 px-3 py-1.5 font-mono text-xs text-muted hover:text-text transition"
          >
            Hide Form
          </button>
        </div>
      ) : (
        /* Professional, Clean Inline Subscription Form */
        <div className="space-y-3">
          {/* Top row: Category tag & Dismiss button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Developer Updates &amp; Tools
              </span>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-muted/50 hover:text-text transition p-1 -mr-1 -mt-1 rounded text-xs focus:outline-none"
              title="Dismiss for this session"
              aria-label="Dismiss subscription banner"
            >
              ✕
            </button>
          </div>

          {/* Heading & Subtitle */}
          <div>
            <h2 className="font-mono text-lg sm:text-xl font-bold tracking-tight text-text">
              Stay Updated with WelcomeScore &amp; ETHIOR
            </h2>
            <p className="font-sans text-xs text-muted leading-relaxed mt-1 max-w-xl">
              Get early access to open-source developer tooling updates, AI workflow prompts, and feature releases.
            </p>
          </div>

          {/* Compact Input Form */}
          <form onSubmit={handleSubmit} className="space-y-2 pt-1">
            {/* Honeypot field for bot protection */}
            <input
              type="text"
              name="hp_phone_field"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="absolute -left-[9999px] h-0 w-0 opacity-0 pointer-events-none"
              aria-hidden="true"
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-lg">
              <label htmlFor="subscriber-banner-email" className="sr-only">
                Email address
              </label>
              <input
                id="subscriber-banner-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="h-10 w-full rounded-lg border border-white/10 bg-base/80 px-3.5 font-mono text-xs sm:text-sm text-text placeholder:text-muted/50 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={status === "loading" || !email.trim()}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-accent px-5 font-mono text-xs font-bold uppercase tracking-wider text-base transition hover:bg-accent/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
              >
                {status === "loading" ? "Subscribing…" : "Get Updates"}
              </button>
            </div>

            {status === "error" && (
              <p className="font-sans text-xs text-bad" role="alert">
                {feedbackMessage}
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] text-muted/60 pt-0.5">
              <span>Zero spam. Unsubscribe at any time.</span>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
