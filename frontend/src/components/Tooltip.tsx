"use client";

/**
 * Tooltip — #557
 *
 * A keyboard-accessible tooltip that shows on hover OR focus, and hides on
 * blur or Escape. Automatically repositions when the tooltip would overflow
 * the viewport on small screens.
 *
 * Usage (info icon variant for form fields):
 * ```tsx
 * <FieldTooltip hint="The amount you want to borrow..." />
 * ```
 *
 * Usage (wrapping an arbitrary element):
 * ```tsx
 * <Tooltip hint="Press B to borrow">
 *   <button>Borrow</button>
 * </Tooltip>
 * ```
 */

import { ReactNode, useRef, useState, useCallback, useEffect, useId } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface TooltipProps {
  /** Tooltip text */
  hint: string;
  /** The element that triggers the tooltip */
  children: ReactNode;
}

interface FieldTooltipProps {
  /** Tooltip text sourced from WIZARD_FIELD_TOOLTIPS constants */
  hint: string;
  /** Additional class names for the trigger button */
  className?: string;
}

// ── Helper: viewport overflow guard ─────────────────────────────────────────

type PopoverSide = "top" | "bottom";

function usePopoverSide(
  triggerRef: React.RefObject<HTMLElement | null>,
  isVisible: boolean
): PopoverSide {
  const [side, setSide] = useState<PopoverSide>("top");

  useEffect(() => {
    if (!isVisible || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // If less than 80px above the trigger, flip below
    setSide(rect.top < 80 ? "bottom" : "top");
  }, [isVisible, triggerRef]);

  return side;
}

// ── Tooltip (wrapping variant) ───────────────────────────────────────────────

/**
 * Wraps a child element and shows a tooltip on hover/focus.
 * Supports keyboard access (show on focus, hide on blur/Escape).
 */
export default function Tooltip({ hint, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const side = usePopoverSide(triggerRef, visible);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setVisible(false);
  }, []);

  const positionClass =
    side === "bottom"
      ? "top-full mt-1.5"
      : "-top-1 -translate-y-full -mt-1.5";

  return (
    <span
      ref={triggerRef}
      className="relative group inline-flex w-full"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={handleKeyDown}
    >
      {children}
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`
            pointer-events-none absolute left-1/2 -translate-x-1/2 z-50
            max-w-xs w-max whitespace-normal break-words
            bg-[color:var(--token-text)] text-[color:var(--token-text-inverse)]
            text-xs px-2.5 py-1.5 rounded-md shadow-lg
            ${positionClass}
          `}
        >
          {hint}
        </span>
      )}
    </span>
  );
}

// ── FieldTooltip (info-icon variant for form fields) ─────────────────────────

/**
 * A standalone ⓘ info icon that shows a tooltip on hover/focus.
 * Intended for use next to form field labels in LoanWizard.
 */
export function FieldTooltip({ hint, className = "" }: FieldTooltipProps) {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();
  const side = usePopoverSide(triggerRef, visible);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setVisible(false);
      triggerRef.current?.blur();
    }
  }, []);

  const positionClass =
    side === "bottom"
      ? "top-full mt-1.5"
      : "-top-1 -translate-y-full -mt-1.5";

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        aria-label="More information"
        aria-describedby={visible ? tooltipId : undefined}
        aria-expanded={visible}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onKeyDown={handleKeyDown}
        className={`
          ml-1 inline-flex items-center justify-center
          w-4 h-4 rounded-full text-[10px] font-bold
          bg-color-primary/15 text-color-primary
          hover:bg-color-primary/25 focus:bg-color-primary/25
          focus:outline-none focus-visible:ring-2
          focus-visible:ring-color-primary focus-visible:ring-offset-1
          cursor-help transition-colors
          ${className}
        `}
      >
        <span aria-hidden="true">ⓘ</span>
      </button>

      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`
            pointer-events-none absolute left-1/2 -translate-x-1/2 z-50
            max-w-xs w-64 whitespace-normal break-words
            bg-[color:var(--token-text)] text-[color:var(--token-text-inverse)]
            text-xs px-3 py-2 rounded-md shadow-lg leading-relaxed
            ${positionClass}
          `}
        >
          {hint}
        </span>
      )}
    </span>
  );
}
