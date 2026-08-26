/**
 * useSessionTimeout — Issue #569
 *
 * Reads the JWT expiry from a "session" cookie, ticks a countdown, and
 * surfaces state that drives the SessionTimeoutBanner.
 *
 * Acceptance criteria:
 *  ✓ Banner appears when token has < 5 minutes remaining
 *  ✓ Countdown timer shows minutes and seconds remaining
 *  ✓ On expiry without refresh, user is redirected to /
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/** Milliseconds before expiry at which the warning becomes visible. */
const WARN_MS = 5 * 60 * 1000; // 5 minutes

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Parses the `session` cookie and returns the JWT expiry as a Unix timestamp
 * in milliseconds, or `null` when no valid token is found.
 */
function readExpiry(): number | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)session=([^;]+)/);
  if (!match) return null;
  try {
    const parts = match[1].split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (typeof payload?.exp !== "number") return null;
    return payload.exp * 1000; // convert seconds → ms
  } catch {
    return null;
  }
}

export interface SessionTimeoutState {
  /** Whether the warning banner should be visible. */
  showBanner: boolean;
  /** Seconds remaining until token expiry (0 when expired). */
  secondsLeft: number;
  /** Call this to attempt a token refresh via the API. */
  refresh: () => Promise<void>;
  /** Whether a refresh request is in-flight. */
  refreshing: boolean;
  /** Non-null when the last refresh attempt failed. */
  refreshError: string | null;
}

export function useSessionTimeout(): SessionTimeoutState {
  const [expiryMs, setExpiryMs] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Read expiry once on mount and whenever the cookie could change
  useEffect(() => {
    setExpiryMs(readExpiry());
  }, []);

  // Tick every second while we have an expiry
  useEffect(() => {
    if (expiryMs == null) return;
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [expiryMs]);

  // Redirect to login on expiry
  useEffect(() => {
    if (expiryMs == null) return;
    const msLeft = expiryMs - now;
    if (msLeft <= 0 && typeof window !== "undefined") {
      window.location.href = "/";
    }
  }, [expiryMs, now]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch(`${API}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
      // Re-read the updated cookie
      setExpiryMs(readExpiry());
    } catch (e: unknown) {
      setRefreshError(e instanceof Error ? e.message : "Session refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const msLeft = expiryMs != null ? Math.max(0, expiryMs - now) : Infinity;
  const secondsLeft = Math.floor(msLeft / 1000);
  const showBanner = expiryMs != null && msLeft > 0 && msLeft <= WARN_MS;

  return { showBanner, secondsLeft, refresh, refreshing, refreshError };
}
