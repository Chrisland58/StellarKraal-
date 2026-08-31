'use client';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui';

export interface FormSuccessProps {
  /** Heading shown above the summary (e.g. "Collateral Registered!") */
  title: string;
  /** Arbitrary content shown below the title — ID, amounts, etc. */
  summary: React.ReactNode;
  /** Called when the user wants to fill in another record. */
  onSubmitAnother: () => void;
  /** If provided, renders a "View Details" link to this path. */
  viewDetailsHref?: string;
  /** Alternative callback for navigation when a router push is preferred. */
  onViewDetails?: () => void;
  /** Label for the reset button. Defaults to "Submit Another". */
  submitAnotherLabel?: string;
  /** Label for the details navigation button/link. Defaults to "View Details". */
  viewDetailsLabel?: string;
}

/**
 * FormSuccess
 *
 * Renders a success state with:
 *  - An animated green checkmark (respects prefers-reduced-motion)
 *  - A summary of what was created
 *  - "Submit Another" button (resets the parent form)
 *  - "View Details" link/button (navigates to the created resource)
 *
 * Accessibility:
 *  - role="status" so screen readers announce the result automatically
 *  - The heading receives focus on mount so keyboard users don't have to tab back
 *  - All interactive elements are reachable via Tab in logical order
 */
export default function FormSuccess({
  title,
  summary,
  onSubmitAnother,
  viewDetailsHref,
  onViewDetails,
  submitAnotherLabel = 'Submit Another',
  viewDetailsLabel = 'View Details',
}: FormSuccessProps) {
  const reduced = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the success heading so keyboard/AT users are immediately aware
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Checkmark circle circumference: 2π × r  (r = 20, circumference ≈ 125.66)
  const CIRC = 2 * Math.PI * 20; // ≈ 125.66

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="bg-[color:var(--token-surface-raised,#fff)] rounded-2xl p-8 shadow flex flex-col items-center gap-6 text-center"
    >
      {/* ── Animated checkmark ───────────────────────────────────────────── */}
      <div aria-hidden="true">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-[color:var(--token-success,#16a34a)]"
        >
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r="38"
            fill="var(--token-success-subtle, #dcfce7)"
            stroke="currentColor"
            strokeWidth="2"
            style={
              reduced
                ? undefined
                : {
                    strokeDasharray: `${2 * Math.PI * 38}`,
                    strokeDashoffset: `${2 * Math.PI * 38}`,
                    animation: 'form-success-circle 0.5s ease forwards',
                  }
            }
          />
          {/* Checkmark path */}
          <path
            d="M24 40 L36 52 L56 28"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={
              reduced
                ? undefined
                : {
                    strokeDasharray: CIRC,
                    strokeDashoffset: CIRC,
                    animation: 'form-success-check 0.4s ease 0.4s forwards',
                  }
            }
          />
        </svg>

        {/* Keyframes injected via a <style> tag so we don't need a CSS file */}
        {!reduced && (
          <style>{`
            @keyframes form-success-circle {
              to { stroke-dashoffset: 0; }
            }
            @keyframes form-success-check {
              to { stroke-dashoffset: 0; }
            }
            @media (prefers-reduced-motion: reduce) {
              .form-success-circle,
              .form-success-check {
                animation: none !important;
                stroke-dashoffset: 0 !important;
              }
            }
          `}</style>
        )}
      </div>

      {/* ── Title ────────────────────────────────────────────────────────── */}
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-bold text-[color:var(--token-success,#16a34a)] outline-none"
      >
        {title}
      </h2>

      {/* ── Summary ──────────────────────────────────────────────────────── */}
      <div className="w-full rounded-xl bg-[color:var(--token-success-subtle,#dcfce7)] px-6 py-4 text-sm text-[color:var(--token-success,#16a34a)]">
        {summary}
      </div>

      {/* ── Action buttons ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {/* View Details — prefer Link for simple href, fallback to Button+callback */}
        {viewDetailsHref ? (
          <Link
            href={viewDetailsHref}
            className="inline-flex items-center justify-center gap-2 font-semibold transition
              px-5 py-2.5 text-sm rounded-xl
              bg-[color:var(--token-success,#16a34a)] text-white
              hover:opacity-90
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              focus-visible:ring-[color:var(--token-success,#16a34a)]"
          >
            {viewDetailsLabel}
          </Link>
        ) : onViewDetails ? (
          <Button variant="primary" onClick={onViewDetails}>
            {viewDetailsLabel}
          </Button>
        ) : null}

        <Button variant="ghost" onClick={onSubmitAnother}>
          {submitAnotherLabel}
        </Button>
      </div>
    </div>
  );
}
