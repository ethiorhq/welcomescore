"use client";

import React, { useState } from "react";
import Link from "next/link";

interface SubscriberBannerProps {
  source?: string;
  className?: string;
}

export default function SubscriberBanner({
  source = "welcomescore_banner",
  className = "",
}: SubscriberBannerProps) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");

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
      try {
        localStorage.setItem(
          "welcomescore_subscriber_state",
          JSON.stringify({ status: "subscribed", timestamp: Date.now() }),
        );
      } catch {
        // Safe localStorage fallback
      }
    } catch {
      setStatus("error");
      setFeedbackMessage("Network error. Please check your connection and try again.");
    }
  };

  return (
    <section
      aria-label="Newsletter & Updates"
      className={`relative overflow-hidden rounded-2xl border border-accent/25 bg-surface/90 p-6 sm:p-8 shadow-xl ${className}`}
    >
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/10 blur-3xl"
        aria-hidden="true"
      />

      {status === "success" ? (
        /* Component C: Success State / Thank You Screen */
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-good/20 text-good font-mono text-sm font-bold">
              ✓
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-good font-semibold">
              Subscription Confirmed
            </span>
          </div>

          <h3 className="font-mono text-xl sm:text-2xl font-bold text-text">
            You&apos;re on the list! Thank you for supporting WelcomeScore.
          </h3>

          <p className="font-sans text-sm text-muted leading-relaxed max-w-2xl">
            You&apos;ll be the first to know about new open-source scoring releases, stack health engines,
            and developer tooling updates.
          </p>

          {/* ETHIOR Promotion Line */}
          <div className="rounded-xl border border-muted/20 bg-base/60 p-4 mt-2">
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
        </div>
      ) : (
        /* Component A: Trigger Banner / Inline Section */
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Developer Updates &amp; Tools
            </p>
            <h2 className="font-mono text-xl sm:text-2xl font-bold text-text">
              Stay Updated with WelcomeScore &amp; ETHIOR
            </h2>
            <p className="font-sans text-xs sm:text-sm text-muted leading-relaxed max-w-2xl">
              Get early access to open-source developer tooling updates, AI workflow prompts, and feature releases.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
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
                className="h-11 w-full rounded-lg border border-muted/30 bg-base/70 px-4 font-mono text-sm text-text placeholder:text-muted/60 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={status === "loading" || !email.trim()}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-accent px-6 font-mono text-xs font-bold uppercase tracking-wider text-base transition hover:bg-accent/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "loading" ? "Subscribing…" : "Get Updates"}
              </button>
            </div>

            {status === "error" && (
              <p className="font-sans text-xs text-bad" role="alert">
                {feedbackMessage}
              </p>
            )}

            <p className="font-sans text-[11px] text-muted/70">
              Zero spam. Unsubscribe at any time with one click.
            </p>
          </form>
        </div>
      )}
    </section>
  );
}
