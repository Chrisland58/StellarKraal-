"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import FocusTrap from "focus-trap-react";

export type ModalSize = "sm" | "md" | "lg";

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Modal body content */
  children: React.ReactNode;
  /** Optional footer content (action buttons) */
  footer?: React.ReactNode;
  size?: ModalSize;
  /** Element id for aria-labelledby — auto-generated if omitted */
  titleId?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  titleId = "modal-title",
}: ModalProps) {
  const triggerRef = useRef<Element | null>(null);

  // Remember the element that opened the modal so we can return focus on close
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
    } else {
      (triggerRef.current as HTMLElement | null)?.focus();
    }
  }, [open]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const modal = (
    <FocusTrap active={open} focusTrapOptions={{ allowOutsideClick: true, escapeDeactivates: false }}>
      {/*
       * Backdrop: frosted-glass effect (backdrop-blur-sm + semi-transparent dark fill).
       * Fade-in animation via animate-modal-backdrop (defined in globals.css).
       * Falls back gracefully when backdrop-filter is unsupported.
       * prefers-reduced-motion: animation is suppressed via the CSS @media rule.
       */}
      <div
        className={[
          "fixed inset-0 z-50 flex items-center justify-center p-4",
          // Frosted-glass backdrop — dark tint + blur
          "bg-black/40 backdrop-blur-sm",
          // Fade-in animation
          "animate-modal-backdrop",
        ].join(" ")}
        aria-modal="true"
        role="dialog"
        aria-labelledby={titleId}
        // Backdrop click
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
        }}
      >
        {/*
         * Panel: fade + scale-up animation via animate-modal-panel.
         * Starts at 95% scale / opacity 0, resolves to 100% / opacity 1.
         */}
        <div
          className={[
            "relative w-full flex flex-col max-h-[90vh]",
            sizeClasses[size],
            // Base styling
            "rounded-2xl bg-white dark:bg-brown-800 shadow-2xl",
            // Entrance animation
            "animate-modal-panel",
          ].join(" ")}
          // Prevent clicks inside from closing
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100 dark:border-brown-700">
            <h2 id={titleId} className="text-lg font-bold text-brown-700 dark:text-cream-50" tabIndex={-1}>
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="text-brown-400 hover:text-brown-700 dark:text-brown-300 dark:hover:text-cream-50 transition text-2xl leading-none focus:outline-none focus:ring-2 focus:ring-gold/40 rounded"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-brown-100 dark:border-brown-700 flex justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </FocusTrap>
  );

  return createPortal(modal, document.body);
}
