/**
 * TopProgressBar — Issue #570
 *
 * Slim progress bar fixed to the top of the viewport.  Triggered by
 * useTopProgressBar for route transitions and slow (> 300 ms) API calls.
 *
 * Acceptance criteria:
 *  ✓ Starts on route change, completes on page load
 *  ✓ Triggered on any pending fetch > 300 ms
 *  ✓ Colour matches primary design token (--token-primary)
 *  ✓ Hidden from screen readers (aria-hidden)
 *  ✓ No layout shift — position: fixed, height 3 px, z-index 9999
 */
"use client";

import { Suspense } from "react";
import { useTopProgressBar } from "@/hooks/useTopProgressBar";

function ProgressBarInner() {
  const { progress, visible } = useTopProgressBar();

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      data-testid="top-progress-bar"
      role="presentation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        zIndex: 9999,
        backgroundColor: "transparent",
        // No height/layout shift — the bar is positioned outside the flow
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          backgroundColor: "var(--token-primary, #5D3C15)",
          transition: "width 0.2s ease, opacity 0.2s ease",
          opacity: progress >= 100 ? 0 : 1,
          // Subtle glow on the leading edge
          boxShadow: "0 0 6px 1px var(--token-primary, #5D3C15)",
        }}
      />
    </div>
  );
}

/**
 * TopProgressBar wraps the inner bar in a Suspense boundary because
 * useSearchParams (used inside useTopProgressBar) requires one in Next.js 14
 * App Router when rendered in a Server Component tree.
 */
export default function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
