"use client";
/**
 * SuccessOverlay — Issue #1102
 *
 * Full-screen success overlay with animated checkmark.
 * - Auto-dismisses after 3 seconds
 * - Dismisses on click
 * - Respects prefers-reduced-motion
 * - Accessible: role="status", aria-live="assertive"
 */
import { useEffect, useCallback } from "react";

interface Props {
  /** Human-readable title shown below the checkmark */
  title: string;
  /** Optional sub-message */
  message?: string;
  /** Called when the overlay should be removed */
  onDismiss: () => void;
  /** Auto-dismiss delay in ms (default: 3000) */
  delay?: number;
}

export default function SuccessOverlay({
  title,
  message,
  onDismiss,
  delay = 3000,
}: Props) {
  const dismiss = useCallback(() => onDismiss(), [onDismiss]);

  /* Auto-dismiss timer */
  useEffect(() => {
    const id = setTimeout(dismiss, delay);
    return () => clearTimeout(id);
  }, [dismiss, delay]);

  /* Keyboard: Escape or Enter/Space to dismiss */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (["Escape", "Enter", " "].includes(e.key)) dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  return (
    /*
     * Overlay backdrop — motion-safe variant draws the scale/fade animation.
     * motion-reduce variant shows a static version immediately.
     */
    <div
      role="status"
      aria-live="assertive"
      aria-label={title}
      onClick={dismiss}
      className="
        fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-brown/80 backdrop-blur-sm cursor-pointer
        motion-safe:animate-fadeIn
        motion-reduce:opacity-100
      "
    >
      {/* Card */}
      <div
        className="
          bg-cream rounded-3xl shadow-2xl px-10 py-12 flex flex-col items-center
          motion-safe:animate-scaleIn
          motion-reduce:scale-100
          max-w-sm w-full mx-4
        "
      >
        {/* Animated checkmark circle */}
        <div
          className="
            w-24 h-24 rounded-full bg-gold flex items-center justify-center mb-6
            motion-safe:animate-popIn
          "
          aria-hidden="true"
        >
          {/* SVG checkmark — drawn via stroke-dashoffset animation */}
          <svg
            viewBox="0 0 52 52"
            className="w-14 h-14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polyline
              points="14,27 22,35 38,19"
              stroke="#4A2C0A"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="motion-safe:animate-checkDraw"
              style={{ strokeDasharray: 40, strokeDashoffset: 40 }}
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-brown text-center mb-2">{title}</h2>

        {message && (
          <p className="text-brown/70 text-sm text-center">{message}</p>
        )}

        <p className="mt-6 text-brown/40 text-xs">Click anywhere or press Esc to close</p>
      </div>
    </div>
  );
}
