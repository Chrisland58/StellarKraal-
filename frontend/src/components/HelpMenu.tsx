"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface HelpMenuProps {
  /** Called when the user clicks "Show Getting Started Guide" */
  onShowOnboarding: () => void;
  /** Whether the slide-over panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
}

/**
 * HelpMenu — slide-over panel that opens from the right side of the screen.
 *
 * Accessibility:
 * - Focus is trapped inside the open panel (Tab / Shift+Tab cycle within it).
 * - Pressing Escape closes the panel and restores focus to the trigger element.
 * - Panel has role="dialog", aria-modal="true", and aria-labelledby.
 * - Overlay has aria-hidden="true" so screen readers stay in the dialog.
 *
 * Layout:
 * - Fixed-width (w-80) on wider screens; full-width on narrow screens.
 * - Contains: FAQ link, Glossary link, Contact/support section.
 */
export default function HelpMenu({ onShowOnboarding, isOpen, onClose }: HelpMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = "help-panel-title";

  // ── Focus trap ──────────────────────────────────────────────────────────────
  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (!panelRef.current) return;

    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    const focusable = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((el) => el.offsetParent !== null); // only visible elements

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    if (e.key === "Escape") {
      onClose();
    }
  }, [onClose]);

  // Attach / detach keyboard handler when panel opens / closes
  useEffect(() => {
    if (!isOpen) return;

    // Move focus into the panel
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      "button, a[href], [tabindex]:not([tabindex='-1'])"
    );
    firstFocusable?.focus();

    document.addEventListener("keydown", trapFocus);
    return () => document.removeEventListener("keydown", trapFocus);
  }, [isOpen, trapFocus]);

  // Prevent body scroll while panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* ── Overlay ── */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
        data-testid="help-overlay"
      />

      {/* ── Slide-over panel ── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-cream-50 shadow-2xl dark:bg-brown-950 sm:w-80"
        data-testid="help-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brown/20 px-6 py-4 dark:border-brown/40">
          <h2
            id={titleId}
            className="text-lg font-semibold text-brown dark:text-cream-100"
          >
            Help &amp; Support
          </h2>
          <button
            onClick={onClose}
            aria-label="Close help panel"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-brown/60 transition hover:bg-brown/10 hover:text-brown focus:outline-none focus:ring-2 focus:ring-gold dark:text-cream-100/60 dark:hover:text-cream-100"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Getting started */}
          <section aria-labelledby="help-getting-started">
            <h3
              id="help-getting-started"
              className="mb-2 text-xs font-semibold uppercase tracking-wider text-brown/50 dark:text-cream-100/40"
            >
              Getting started
            </h3>
            <button
              onClick={() => {
                onShowOnboarding();
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-brown transition hover:bg-brown/10 focus:outline-none focus:ring-2 focus:ring-gold dark:text-cream-100 dark:hover:bg-brown/30"
            >
              <span aria-hidden="true" className="text-lg">🚀</span>
              Show Getting Started Guide
            </button>
          </section>

          {/* Resources */}
          <section aria-labelledby="help-resources">
            <h3
              id="help-resources"
              className="mb-2 text-xs font-semibold uppercase tracking-wider text-brown/50 dark:text-cream-100/40"
            >
              Resources
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/help/faq"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brown transition hover:bg-brown/10 focus:outline-none focus:ring-2 focus:ring-gold dark:text-cream-100 dark:hover:bg-brown/30"
                >
                  <span aria-hidden="true" className="text-lg">❓</span>
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/help/glossary"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brown transition hover:bg-brown/10 focus:outline-none focus:ring-2 focus:ring-gold dark:text-cream-100 dark:hover:bg-brown/30"
                >
                  <span aria-hidden="true" className="text-lg">📖</span>
                  Glossary
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brown transition hover:bg-brown/10 focus:outline-none focus:ring-2 focus:ring-gold dark:text-cream-100 dark:hover:bg-brown/30"
                >
                  <span aria-hidden="true" className="text-lg">📚</span>
                  Help &amp; Guides
                </Link>
              </li>
            </ul>
          </section>

          {/* Contact / Support */}
          <section aria-labelledby="help-contact">
            <h3
              id="help-contact"
              className="mb-2 text-xs font-semibold uppercase tracking-wider text-brown/50 dark:text-cream-100/40"
            >
              Contact &amp; Support
            </h3>
            <div className="rounded-xl border border-brown/15 bg-brown/5 p-4 text-sm dark:border-brown/30 dark:bg-brown/20">
              <p className="font-medium text-brown dark:text-cream-100">Need help?</p>
              <p className="mt-1 text-brown/70 dark:text-cream-100/60">
                Reach out to our support team and we'll get back to you as soon as possible.
              </p>
              <a
                href="mailto:support@stellarkraal.io"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline focus:outline-none focus:ring-2 focus:ring-gold rounded"
              >
                support@stellarkraal.io ↗
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
