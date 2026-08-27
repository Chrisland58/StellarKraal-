"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

/**
 * Version string that uniquely identifies the current deployment.
 * Bump this on each release to trigger the modal for returning users.
 * Convention: match package.json version or use an ISO date slug.
 */
export const WHATS_NEW_VERSION = "1.1.0";

const STORAGE_KEY = "stellarkraal.whats_new_seen_version";

/** Top 3 features for the current release */
const FEATURES = [
  {
    icon: "🖼️",
    title: "Skeleton loading screens",
    description:
      "Dashboard, Loans, and Collateral pages now show layout-matched skeleton screens instead of a blank white flash while data loads.",
  },
  {
    icon: "🔔",
    title: "Toast position preference",
    description:
      "Choose where notification toasts appear — bottom-right, top-right, bottom-center, or top-center — and your choice is remembered.",
  },
  {
    icon: "❓",
    title: "Redesigned Help panel",
    description:
      "The Help menu is now a full slide-over panel with FAQ, Glossary, and support links, plus full keyboard navigation and focus trapping.",
  },
];

// ── Version-tracking hook ────────────────────────────────────────────────────

/**
 * useWhatsNew — manages the auto-show logic for the What's New modal.
 *
 * Returns { isOpen, dismiss }:
 *  - isOpen: true when the current version has never been seen
 *  - dismiss(): marks the version as seen and closes the modal
 */
export function useWhatsNew() {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) !== WHATS_NEW_VERSION;
  });

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, WHATS_NEW_VERSION);
    } catch {
      // Silently ignore storage errors (private browsing, storage full, etc.)
    }
    setIsOpen(false);
  }, []);

  return { isOpen, dismiss };
}

// ── Component ────────────────────────────────────────────────────────────────

export interface WhatsNewModalProps {
  /** Whether the modal is currently visible */
  isOpen: boolean;
  /** Called when the user dismisses the modal (close button, backdrop, Escape) */
  onClose: () => void;
}

/**
 * WhatsNewModal — shows a changelog summary when users visit after a new deployment.
 *
 * Accessibility:
 *  - role="dialog", aria-modal="true", aria-labelledby points to the heading
 *  - Focus trapped inside the modal while open (Tab / Shift+Tab cycle)
 *  - Escape key closes the modal
 *  - Backdrop click closes the modal
 *  - "Learn more" links to CHANGELOG
 *  - "Got it" and the × button both call onClose (which should persist the version)
 */
export default function WhatsNewModal({ isOpen, onClose }: WhatsNewModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = "whats-new-title";

  // ── Focus trap ──────────────────────────────────────────────────────────────
  const trapFocus = useCallback(
    (e: KeyboardEvent) => {
      if (!dialogRef.current) return;

      const focusableSelectors = [
        "a[href]",
        "button:not([disabled])",
        '[tabindex]:not([tabindex="-1"])',
      ].join(", ");

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter((el) => el.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }

      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      "button, a[href], [tabindex]:not([tabindex='-1'])"
    );
    firstFocusable?.focus();

    document.addEventListener("keydown", trapFocus);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", trapFocus);
      document.body.style.overflow = "";
    };
  }, [isOpen, trapFocus]);

  if (!isOpen) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
        data-testid="whats-new-backdrop"
      />

      {/* ── Dialog wrapper (centres content) ── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        data-testid="whats-new-modal"
        aria-hidden="false"
      >
        {/* ── Inner card ── */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-brown-950"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-brown/10 dark:border-brown/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-brown dark:text-cream-100 mb-2">
                  v{WHATS_NEW_VERSION}
                </span>
                <h2
                  id={titleId}
                  className="text-xl font-bold text-brown dark:text-cream-100"
                >
                  What&apos;s new in StellarKraal
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Dismiss what's new"
                className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-brown/50 transition hover:bg-brown/10 hover:text-brown focus:outline-none focus:ring-2 focus:ring-gold dark:text-cream-100/50 dark:hover:text-cream-100"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 4L4 12M4 4l8 8" />
                </svg>
              </button>
            </div>
          </div>

          {/* Feature list */}
          <ul className="px-6 py-4 space-y-4" aria-label="New features">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5" aria-hidden="true">
                  {feature.icon}
                </span>
                <div>
                  <p className="font-semibold text-sm text-brown dark:text-cream-100">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 text-sm text-brown/70 dark:text-cream-100/60">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-3">
            <Link
              href="/CHANGELOG.md"
              className="text-sm font-medium text-gold hover:underline focus:outline-none focus:ring-2 focus:ring-gold rounded"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more ↗
            </Link>
            <button
              onClick={onClose}
              className="rounded-lg bg-brown px-5 py-2 text-sm font-semibold text-cream-50 transition hover:bg-brown/80 focus:outline-none focus:ring-2 focus:ring-gold dark:bg-gold dark:text-brown"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
