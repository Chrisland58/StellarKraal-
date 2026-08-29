"use client";

import { useContext } from "react";
import { ToastContext } from "@/components/toast/ToastContext";
import { type ToastPosition } from "@/hooks/useToastPosition";

const POSITIONS: { value: ToastPosition; label: string }[] = [
  { value: "bottom-right", label: "Bottom-right (default on desktop)" },
  { value: "bottom-center", label: "Bottom-center (default on mobile)" },
  { value: "top-right", label: "Top-right" },
  { value: "top-center", label: "Top-center" },
];

/**
 * ToastPositionSelector — lets the user choose where toast notifications appear.
 *
 * Reads and writes to localStorage via ToastContext.setToastPosition.
 * Renders as a labelled <select> that meets WCAG AA contrast requirements
 * using the existing design token colours.
 */
export default function ToastPositionSelector() {
  const context = useContext(ToastContext);

  // Gracefully degrade when rendered outside a ToastProvider (e.g., static export)
  if (!context) return null;

  const { toastPosition, setToastPosition } = context;

  return (
    <section aria-labelledby="toast-position-heading" className="space-y-3">
      <div>
        <h2
          id="toast-position-heading"
          className="text-base font-semibold text-brown dark:text-cream-100"
        >
          Toast notification position
        </h2>
        <p className="mt-1 text-sm text-brown/60 dark:text-cream-100/60">
          Choose where notification toasts appear on screen.
        </p>
      </div>

      <label htmlFor="toast-position-select" className="sr-only">
        Toast notification position
      </label>
      <select
        id="toast-position-select"
        value={toastPosition}
        onChange={(e) => setToastPosition(e.target.value as ToastPosition)}
        className="block w-full rounded-lg border border-brown/30 bg-cream-50 px-3 py-2 text-sm text-brown shadow-sm focus:outline-none focus:ring-2 focus:ring-gold dark:bg-brown-900 dark:text-cream-100 dark:border-brown/50"
      >
        {POSITIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <p className="text-xs text-brown/50 dark:text-cream-100/40">
        Your preference is saved automatically and applied immediately.
      </p>
    </section>
  );
}
