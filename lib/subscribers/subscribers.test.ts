import { describe, expect, it, beforeEach } from "vitest";
import { validateSubscriberSubmission } from "./validation";
import {
  checkRateLimit,
  subscribeEmail,
  resetMemorySubscribers,
  getMemorySubscribersCount,
} from "./repository";

describe("Subscriber Validation", () => {
  it("rejects non-object or invalid payloads", () => {
    expect(validateSubscriberSubmission(null).valid).toBe(false);
    expect(validateSubscriberSubmission([]).valid).toBe(false);
    expect(validateSubscriberSubmission("hello@example.com").valid).toBe(false);
  });

  it("rejects empty or missing email", () => {
    const res1 = validateSubscriberSubmission({});
    expect(res1.valid).toBe(false);
    if (!res1.valid) expect(res1.code).toBe("MISSING_EMAIL");

    const res2 = validateSubscriberSubmission({ email: "   " });
    expect(res2.valid).toBe(false);
    if (!res2.valid) expect(res2.code).toBe("EMPTY_EMAIL");
  });

  it("rejects emails longer than 254 characters", () => {
    const longEmail = `${"a".repeat(250)}@example.com`;
    const res = validateSubscriberSubmission({ email: longEmail });
    expect(res.valid).toBe(false);
    if (!res.valid) expect(res.code).toBe("EMAIL_TOO_LONG");
  });

  it("rejects invalid email formats", () => {
    const invalidEmails = [
      "notanemail",
      "user@",
      "@domain.com",
      "user@domain",
      "user space@domain.com",
      "user@.com",
    ];

    for (const email of invalidEmails) {
      const res = validateSubscriberSubmission({ email });
      expect(res.valid).toBe(false);
      if (!res.valid) expect(res.code).toBe("INVALID_EMAIL_FORMAT");
    }
  });

  it("detects spam bots when honeypot field is filled", () => {
    const res = validateSubscriberSubmission({
      email: "valid@example.com",
      hp: "I am a spam bot",
    });
    expect(res.valid).toBe(false);
    if (!res.valid) expect(res.code).toBe("BOT_DETECTED");
  });

  it("validates and normalizes valid email addresses", () => {
    const res = validateSubscriberSubmission({
      email: "  Developer.Test+Tag@Example.COM  ",
      source: "welcomescore_modal",
    });

    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.data.email).toBe("developer.test+tag@example.com");
      expect(res.data.source).toBe("welcomescore_modal");
    }
  });

  it("sanitizes custom source values to safe alphanumeric strings", () => {
    const res = validateSubscriberSubmission({
      email: "dev@example.com",
      source: "Dangerous Source <script>!@#",
    });

    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.data.source).toBe("dangerous_source__script____");
    }
  });
});

describe("Subscriber Repository & Rate Limiting", () => {
  beforeEach(() => {
    resetMemorySubscribers();
  });

  it("subscribes a new email address successfully", async () => {
    const res = await subscribeEmail("dev1@example.com", "welcomescore_app", "127.0.0.1");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.isExisting).toBe(false);
      expect(res.message).toContain("You're on the list");
    }
    expect(getMemorySubscribersCount()).toBe(1);
  });

  it("handles duplicate email subscriptions gracefully without throwing", async () => {
    // First subscription
    await subscribeEmail("duplicate@example.com", "welcomescore_app", "127.0.0.1");

    // Second subscription with same email
    const res = await subscribeEmail("duplicate@example.com", "welcomescore_modal", "127.0.0.1");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.isExisting).toBe(true);
      expect(res.message).toContain("already on the list");
    }
    expect(getMemorySubscribersCount()).toBe(1);
  });

  it("enforces rate limits on excessive subscription attempts", () => {
    const ip = "192.168.1.100";

    for (let i = 0; i < 10; i++) {
      const status = checkRateLimit(ip);
      expect(status.allowed).toBe(true);
    }

    // 11th request should be rate limited
    const blocked = checkRateLimit(ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
