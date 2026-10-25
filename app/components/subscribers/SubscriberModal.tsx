"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "welcomescore_subscriber_state";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default function SubscriberModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubscribedOrSuppressed, setIsSubscribedOrSuppressed] = useState(false);

  // Helper to check if auto-triggers should be suppressed
  const isSuppressed = useCallback(() => {
    // 1. If already subscribed via cookie
    if (typeof document !== "undefined" && document.cookie.includes("welcomescore_subscribed=1")) {
      return true;
    }

    // 2. If already subscribed or dismissed in localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { status?: string; timestamp?: number };
        if (parsed.status === "subscribed") return true;
        if (parsed.timestamp && Date.now() - parsed.timestamp < THIRTY_DAYS_MS) {
          return true;
        }
      }
    } catch {
      // Safe fallback
    }

    return isSubscribedOrSuppressed;
  }, [isSubscribedOrSuppressed]);

  // Check IP detection on mount to suppress auto-popups for existing subscribers
  useEffect(() => {
    let isMounted = true;
    fetch("/api/subscribe", { method: "GET", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.isSubscribed) {
          setIsSubscribedOrSuppressed(true);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const openModal = useCallback(() => {
    if (isSuppressed()) return;
    setIsOpen(true);
  }, [isSuppressed]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Mark as dismissed for 30 days if not already subscribed
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed?.status !== "subscribed") {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ status: "dismissed", timestamp: Date.now() }),
        );
      }
    } catch {
      // Safe fallback
    }
  }, []);

  // Listen for explicit manual trigger from footer or other links
  useEffect(() => {
    const handleOpenRequest = () => {
      setStatus("idle");
      setEmail("");
      setErrorMessage("");
      setIsOpen(true);
    };

    window.addEventListener("open-subscriber-modal", handleOpenRequest);
    return () => window.removeEventListener("open-subscriber-modal", handleOpenRequest);
  }, []);

  // 1. Delay Trigger (45 seconds on desktop only) - avoids congesting mobile viewport
  useEffect(() => {
    if (isSuppressed()) return;
    if (typeof window !== "undefined" && window.innerWidth < 768) return;

    const timer = setTimeout(() => {
      openModal();
    }, 45_000);

    return () => clearTimeout(timer);
  }, [isSuppressed, openModal]);

  // 2. Exit-Intent Trigger (Desktop mouse leaving top of screen)
  useEffect(() => {
    if (isSuppressed()) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        openModal();
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [isSuppressed, openModal]);

  // 3. Scroll Trigger (70% scroll depth)
  useEffect(() => {
    if (isSuppressed()) return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const scrollPercentage = window.scrollY / scrollHeight;

      if (scrollPercentage >= 0.7) {
        openModal();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSuppressed, openModal]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source: "welcomescore_modal",
          hp: honeypot,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setStatus("error");
        setErrorMessage(data.error?.message || "Could not complete subscription.");
        return;
      }

      setStatus("success");
      setIsSubscribedOrSuppressed(true);

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ status: "subscribed", timestamp: Date.now() }),
        );
        document.cookie = "welcomescore_subscribed=1; path=/; max-age=31536000; SameSite=Lax";
      } catch {
        // Safe localStorage fallback
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscriber-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#151724] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Ambient Top Glow */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-accent/15 blur-3xl"
          aria-hidden="true"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-base/50 text-muted transition hover:border-accent hover:text-text focus:outline-none"
          aria-label="Close subscription modal"
        >
          ✕
        </button>

        {status === "success" ? (
          /* Success State / Thank You Screen */
          <div className="space-y-4 pt-2 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-good/20 text-good font-mono text-sm font-bold">
                ✓
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-good font-semibold">
                You&apos;re On The List
              </span>
            </div>

            <h3 id="subscriber-modal-title" className="font-mono text-2xl font-bold text-text">
              You&apos;re on the list! Thank you for supporting WelcomeScore.
            </h3>

            <p className="font-sans text-sm text-muted leading-relaxed">
              We&apos;ll notify you when new framework scoring engines, open-source maintainer tooling,
              and developer features go live.
            </p>

            {/* ETHIOR Promotion Line */}
            <div className="rounded-xl border border-white/10 bg-base/60 p-4 mt-3">
              <p className="font-sans text-xs text-text/90 leading-relaxed">
                Need custom AI agents or business automation workflows for your team? Explore what we build at{" "}
                <Link
                  href="https://ethior.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-bold text-accent underline underline-offset-4 hover:text-accent/80 transition"
                >
                  ethior.com ↗
                </Link>
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg bg-surface border border-white/10 px-4 py-2 font-mono text-xs text-muted hover:text-text transition"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          /* Smart Modal Form */
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5 pr-6">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                  Developer Updates &amp; Tooling
                </span>
              </div>
              <h2 id="subscriber-modal-title" className="font-mono text-xl sm:text-2xl font-bold text-text">
                Stay Updated with WelcomeScore &amp; ETHIOR
              </h2>
              <p className="font-sans text-xs sm:text-sm text-muted leading-relaxed">
                Get early access to open-source developer tooling updates, AI workflow prompts, and feature releases.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot field */}
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

              <div className="space-y-2">
                <label htmlFor="subscriber-modal-email" className="font-mono text-xs text-muted block">
                  Work or GitHub Email
                </label>
                <input
                  id="subscriber-modal-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@example.com"
                  className="h-11 w-full rounded-lg border border-white/10 bg-base/80 px-4 font-mono text-sm text-text placeholder:text-muted/60 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>

              {status === "error" && (
                <p className="font-sans text-xs text-bad" role="alert">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading" || !email.trim()}
                className="w-full inline-flex h-11 items-center justify-center rounded-lg bg-accent px-6 font-mono text-xs font-bold uppercase tracking-wider text-base transition hover:bg-accent/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "loading" ? "Subscribing…" : "Join Waitlist & Updates"}
              </button>

              <div className="flex items-center justify-between text-[11px] text-muted/70 font-sans pt-1">
                <span>Zero spam. 1-click unsubscribe.</span>
                <button
                  type="button"
                  onClick={closeModal}
                  className="hover:text-text transition underline underline-offset-2"
                >
                  Dismiss for 30 days
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
