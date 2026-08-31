"use client";
import { useEffect } from "react";

export interface Shortcut {
  key: string;       // e.g. "b", "r", "?", "C" (uppercase for Shift+C)
  label: string;     // human-readable action name
  hint: string;      // e.g. "B", "Shift+C"
  shift?: boolean;   // if true, requires shiftKey to be held
  action: () => void;
}

/** Returns true when focus is inside an input, textarea, select, or dialog. */
function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = (el as HTMLElement).tagName.toLowerCase();
  if (["input", "textarea", "select"].includes(tag)) return true;
  // disable when any modal/dialog is open
  return !!document.querySelector('[role="dialog"]');
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ignore modifier combos (Ctrl/Alt/Meta) to avoid browser conflicts
      // shiftKey is allowed through — shift-based shortcuts are matched below
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (isInputFocused()) return;

      const match = shortcuts.find((s) => {
        if (s.key !== e.key) return false;
        // If the shortcut requires Shift, the event must have shiftKey.
        // If the shortcut does NOT require Shift, the event must NOT have shiftKey
        // (prevents plain-key shortcuts from firing when Shift is held).
        const requiresShift = s.shift === true;
        return requiresShift ? e.shiftKey === true : e.shiftKey !== true;
      });

      if (match) {
        e.preventDefault();
        match.action();
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
