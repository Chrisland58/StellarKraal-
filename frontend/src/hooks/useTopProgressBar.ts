/**
 * useTopProgressBar — Issue #570
 *
 * Tracks loading state for:
 *  - Next.js route transitions (via navigation events)
 *  - Fetch calls that take > 300 ms (via a patched global fetch)
 *
 * Returns a `progress` value (0–100) and a `visible` flag for the bar.
 *
 * Acceptance criteria:
 *  ✓ Progress bar starts on route change and completes on page load
 *  ✓ Also triggered on any pending fetch call > 300 ms
 *  ✓ No layout shift
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const FETCH_DELAY_MS = 300;

export interface TopProgressBarState {
  /** 0–100 progress value */
  progress: number;
  /** Whether the bar should be visible */
  visible: boolean;
}

export function useTopProgressBar(): TopProgressBarState {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Ref-based counter for active "slow" fetch calls
  const activeFetchesRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    setVisible(true);
    setProgress(10);
    if (tickRef.current) clearInterval(tickRef.current);
    // Slowly advance toward 90% while loading
    tickRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          if (tickRef.current) clearInterval(tickRef.current);
          return 90;
        }
        return p + Math.random() * 8;
      });
    }, 400);
  }, []);

  const complete = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    setProgress(100);
    // Hide after the CSS transition finishes
    completeTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 400);
  }, []);

  // Route change detection — restart bar on every pathname/search change
  const prevRouteRef = useRef<string | null>(null);
  useEffect(() => {
    const current = `${pathname}?${searchParams?.toString() ?? ""}`;
    if (prevRouteRef.current !== null && prevRouteRef.current !== current) {
      // New route: start then immediately complete (Next.js App Router finishes synchronously)
      start();
      const t = setTimeout(complete, 200);
      return () => clearTimeout(t);
    }
    prevRouteRef.current = current;
  }, [pathname, searchParams, start, complete]);

  // Patch global fetch to show the bar for slow requests (> 300 ms)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const original = window.fetch;

    window.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      let timer: ReturnType<typeof setTimeout> | null = null;
      let triggered = false;

      timer = setTimeout(() => {
        triggered = true;
        activeFetchesRef.current += 1;
        if (activeFetchesRef.current === 1) start();
      }, FETCH_DELAY_MS);

      try {
        const res = await original(input, init);
        return res;
      } finally {
        if (timer) clearTimeout(timer);
        if (triggered) {
          activeFetchesRef.current = Math.max(0, activeFetchesRef.current - 1);
          if (activeFetchesRef.current === 0) complete();
        }
      }
    };

    return () => {
      window.fetch = original;
    };
  }, [start, complete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, []);

  return { progress: Math.min(100, Math.max(0, progress)), visible };
}
