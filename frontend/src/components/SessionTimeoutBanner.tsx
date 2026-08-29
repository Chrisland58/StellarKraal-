/**
 * SessionTimeoutBanner — Issue #569
 *
 * Shows a dismissible warning banner when the session JWT has fewer than
 * 5 minutes remaining.  Includes a countdown and a "Refresh Session" button.
 *
 * Acceptance criteria:
 *  ✓ Appears when token has < 5 min remaining
 *  ✓ Countdown timer shows minutes and seconds remaining
 *  ✓ "Refresh Session" calls the token refresh endpoint
 *  ✓ On expiry without refresh, user is redirected to login (handled by hook)
 */
"use client";

import { useSessionTimeout } from "@/hooks/useSessionTimeout";

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SessionTimeoutBanner() {
  const { showBanner, secondsLeft, refresh, refreshing, refreshError } =
    useSessionTimeout();

  if (!showBanner) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      data-testid="session-timeout-banner"
      className="w-full px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm font-medium"
      style={{
        backgroundColor: "var(--token-warning-subtle, #FEF3C7)",
        color: "var(--token-text, #3D2810)",
        borderBottom: "1px solid var(--token-warning, #D97706)",
      }}
    >
      <span>
        ⏱ Your session expires in{" "}
        <strong
          aria-live="off"
          data-testid="session-countdown"
          className="tabular-nums"
        >
          {fmt(secondsLeft)}
        </strong>
      </span>

      <div className="flex items-center gap-3">
        {refreshError && (
          <span
            className="text-xs"
            style={{ color: "var(--token-danger, #DC2626)" }}
            role="status"
          >
            {refreshError}
          </span>
        )}

        <button
          type="button"
          disabled={refreshing}
          onClick={refresh}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold transition disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{
            backgroundColor: "var(--token-warning, #D97706)",
            color: "var(--token-on-warning, #FFFFFF)",
          }}
          aria-label="Refresh your session to stay logged in"
        >
          {refreshing ? "Refreshing…" : "Refresh Session"}
        </button>
      </div>
    </div>
  );
}
