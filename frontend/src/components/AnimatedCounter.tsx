"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface AnimatedCounterProps {
  /** The target numeric value to count up to. */
  value: number;
  /**
   * Optional formatter applied to the displayed number.
   * Defaults to `toLocaleString` with no extra options.
   */
  formatter?: (n: number) => string;
  /**
   * Animation duration in milliseconds. Must be between 800 and 1200.
   * Defaults to 1000ms.
   */
  duration?: number;
  /** Optional className forwarded to the wrapping `<span>`. */
  className?: string;
  /** Accessible label describing the metric (used as aria-label). */
  "aria-label"?: string;
}

/**
 * AnimatedCounter counts up from 0 to `value` on mount and re-animates
 * whenever `value` changes. The animation is skipped when the user has
 * `prefers-reduced-motion` enabled — in that case the final value is shown
 * immediately.
 *
 * Duration is clamped to [800, 1200] ms to satisfy the acceptance criteria.
 */
export default function AnimatedCounter({
  value,
  formatter = (n) => n.toLocaleString(),
  duration = 1000,
  className,
  "aria-label": ariaLabel,
}: AnimatedCounterProps) {
  const reducedMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(reducedMotion ? value : 0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prevValueRef = useRef<number>(reducedMotion ? value : 0);

  // Clamp duration to [800, 1200]
  const clampedDuration = Math.min(1200, Math.max(800, duration));

  useEffect(() => {
    // If the user prefers reduced motion, snap to the final value immediately.
    if (reducedMotion) {
      setDisplayed(value);
      prevValueRef.current = value;
      return;
    }

    const from = prevValueRef.current;
    const to = value;

    if (from === to) return;

    // Cancel any in-flight animation before starting a new one.
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startRef.current = null;

    function tick(timestamp: number) {
      if (startRef.current === null) {
        startRef.current = timestamp;
      }

      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / clampedDuration, 1);

      // Ease-out cubic for a smooth deceleration near the target.
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplayed(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Guarantee the exact final value is shown.
        setDisplayed(to);
        prevValueRef.current = to;
        rafRef.current = null;
        startRef.current = null;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reducedMotion, clampedDuration]);

  return (
    <span
      className={className}
      aria-label={ariaLabel}
      aria-live="polite"
      aria-atomic="true"
    >
      {formatter(displayed)}
    </span>
  );
}
