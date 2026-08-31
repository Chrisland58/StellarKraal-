"use client";
import { useState, useId } from "react";

export interface FieldTooltipProps {
  /** The tooltip text shown on hover/focus. Written at Grade 8 reading level. */
  content: string;
  /** Optional aria-label for the trigger button (defaults to "More information"). */
  label?: string;
}

/**
 * FieldTooltip — #1095
 *
 * An info-icon button that shows a tooltip for complex form field terms
 * (LTV, health factor, origination fee, collateral value, etc.).
 *
 * Accessibility:
 *  - Trigger button is keyboard-focusable
 *  - Tooltip has role="tooltip" and is referenced by aria-describedby on the trigger
 *  - Opens on hover (mouseenter/mouseleave) and keyboard focus (focus/blur)
 *  - Toggle-able via Enter or Space
 *  - Closes on Escape
 */
export default function FieldTooltip({ content, label = "More information" }: FieldTooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  function show() {
    setVisible(true);
  }

  function hide() {
    setVisible(false);
  }

  function toggle() {
    setVisible((v) => !v);
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={label}
        aria-describedby={visible ? tooltipId : undefined}
        aria-expanded={visible}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            hide();
          }
        }}
        className="inline-flex items-center justify-center text-brown/50 hover:text-brown
          transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60
          focus-visible:ring-offset-1 rounded-full"
      >
        {/* Info circle icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
            w-56 sm:w-64 rounded-lg bg-brown-dark p-3 text-sm shadow-lg
            text-white pointer-events-none"
          style={{ backgroundColor: "#3D2810" }}
        >
          {content}
          {/* Caret */}
          <span
            aria-hidden="true"
            className="absolute left-1/2 -bottom-2 -translate-x-1/2
              border-solid border-t-8 border-x-8 border-b-0
              border-x-transparent"
            style={{ borderTopColor: "#3D2810" }}
          />
        </div>
      )}
    </span>
  );
}
