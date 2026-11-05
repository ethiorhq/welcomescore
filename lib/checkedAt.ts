/**
 * Pure helpers for the checked-at indicator (Issue #7).
 *
 * `checkedAt` is an ISO 8601 string generated on the server at the end of
 * `scoreRepo()` in `lib/scoreRepo.ts`. These helpers only format it for
 * display; they never fetch, cache, or refresh anything.
 *
 * Both helpers are safe for invalid input: they return "" / null instead of
 * throwing, so a stale or malformed timestamp simply hides the indicator
 * instead of breaking the audit card.
 */

/** Local-time-friendly rendering, e.g. "Nov 6, 2026, 02:26 PM UTC". */
export function formatCheckedAt(iso: string | undefined | null): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Relative rendering, e.g. "just now", "5 minutes ago", "2 hours ago".
 * `now` exists only so tests can pin the clock; callers omit it.
 * Returns null for invalid input. A future timestamp reads as "just now"
 * rather than a negative duration.
 */
export function relativeCheckedAt(
  iso: string | undefined | null,
  now: Date = new Date(),
): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 60_000) {
    return "just now";
  }
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes === 1) {
    return "1 minute ago";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
}
