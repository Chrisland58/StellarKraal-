'use client';

import { useEffect, useId, useRef, type MouseEvent } from 'react';
import { colors } from '@/lib/design-tokens';

export interface SummaryError {
  /** DOM id of the related input (used as the in-page link target). */
  fieldId: string;
  /** Human-readable error message shown as the link text. */
  message: string;
}

export interface ErrorSummaryProps {
  errors: SummaryError[];
  title?: string;
}

/**
 * Accessible form error summary (#832).
 *
 * Renders at the top of a form after a failed submit. Each error is a link
 * that moves focus to the matching field. Hidden when `errors` is empty.
 */
export default function ErrorSummary({ errors, title }: ErrorSummaryProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const visible = errors.length > 0;

  useEffect(() => {
    if (visible) {
      headingRef.current?.focus();
    }
  }, [visible, errors.length]);

  if (!visible) return null;

  const heading =
    title ??
    (errors.length === 1
      ? 'There is 1 error in this form'
      : `There are ${errors.length} errors in this form`);

  function jumpToField(event: MouseEvent<HTMLAnchorElement>, fieldId: string) {
    event.preventDefault();
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field.focus();
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-labelledby={headingId}
      className={`rounded-xl border px-4 py-3 ${colors.status.error.bg} ${colors.status.error.border} ${colors.status.error.text} dark:bg-red-950/40 dark:border-red-700 dark:text-red-200`}
    >
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className="text-sm font-semibold text-error-dark dark:text-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 dark:focus-visible:ring-offset-brown-900"
      >
        {heading}
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {errors.map((err) => (
          <li key={`${err.fieldId}-${err.message}`}>
            <a
              href={`#${err.fieldId}`}
              onClick={(e) => jumpToField(e, err.fieldId)}
              className="underline text-error-dark dark:text-red-200 hover:text-error rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 dark:focus-visible:ring-offset-brown-900"
            >
              {err.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Map a field-error record onto ErrorSummary items, dropping empty messages. */
export function toSummaryErrors(
  errors: Record<string, string | null | undefined>,
  fieldIds: Record<string, string>
): SummaryError[] {
  return (Object.entries(errors) as [string, string | null | undefined][])
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, message]) => ({ fieldId: fieldIds[key] ?? key, message }));
}
