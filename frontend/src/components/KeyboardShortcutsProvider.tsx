"use client";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts, Shortcut } from "@/hooks/useKeyboardShortcuts";
import ShortcutsHelpModal from "@/components/ShortcutsHelpModal";
import { useWallet } from "@/hooks/useWallet";
import ShortcutsHelpOverlay from "@/components/ShortcutsHelpOverlay";

/**
 * KeyboardShortcutsProvider — #1098
 *
 * Registers global keyboard shortcuts and renders the help overlay.
 *
 * Toggle behaviour (changed from hold-500ms to instant toggle):
 *   Press '?' once → overlay opens.
 *   Press '?' again → overlay closes.
 *   Press Escape  → overlay closes.
 *   Shortcuts are suppressed when focus is in any input/textarea/select.
 *
 * Shortcuts registered:
 *   h        → Go to Home
 *   d        → Go to Dashboard
 *   b        → Borrow (get a loan)
 *   r        → Go to repay (dashboard)
 *   n        → New loan request (/borrow)          ← #1098
 *   g then d → Go to Dashboard (chord)             ← #1098
 *   g then c → Go to Collateral (chord)            ← #1098
 *   Escape   → Close modal / cancel
 */
export default function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  // Chord state: tracks whether the first key of a multi-key sequence was pressed
  const chordRef = useRef<string | null>(null);
  const chordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "h",      hint: "H",         label: "Go to Home",                action: () => router.push("/") },
    { key: "d",      hint: "D",         label: "Go to Dashboard",           action: () => router.push("/dashboard") },
    { key: "b",      hint: "B",         label: "Borrow (get a loan)",       action: () => router.push("/borrow") },
    { key: "r",      hint: "R",         label: "Go to repay (dashboard)",   action: () => router.push("/dashboard") },
    { key: "n",      hint: "N",         label: "New loan request",          action: () => router.push("/borrow") },
    { key: "g d",    hint: "G then D",  label: "Go to Dashboard (chord)",   action: () => router.push("/dashboard") },
    { key: "g c",    hint: "G then C",  label: "Go to Collateral (chord)",  action: () => router.push("/collateral") },
    { key: "Escape", hint: "Esc",       label: "Close modal / cancel",      action: () => setHelpOpen(false) },
  ], [router]);

  // Base shortcuts exclude chord shortcuts — chords are handled separately below
  const baseShortcuts = useMemo(
    () => shortcuts.filter((s) => !s.key.includes(" ")),
    [shortcuts]
  );

  useKeyboardShortcuts(baseShortcuts);

  // '?' instant toggle — distinct from base shortcuts to avoid isInputFocused() guard
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Close overlay on Escape (this fires even when dialog is open since
      // useKeyboardShortcuts suppresses keys when a dialog is present)
      if (e.key === "Escape") {
        setHelpOpen(false);
        return;
      }

      if (e.key === "?" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;

        e.preventDefault();
        setHelpOpen((v) => !v);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Chord shortcuts: g+d and g+c
  useEffect(() => {
    function handleChord(e: KeyboardEvent) {
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      // Suppress chords when overlay (dialog) is open
      if (document.querySelector('[role="dialog"]')) return;

      if (chordRef.current === "g") {
        // Cancel the chord timer
        if (chordTimerRef.current) {
          clearTimeout(chordTimerRef.current);
          chordTimerRef.current = null;
        }
        chordRef.current = null;

        if (e.key === "d") {
          e.preventDefault();
          router.push("/dashboard");
        } else if (e.key === "c") {
          e.preventDefault();
          router.push("/collateral");
        }
        return;
      }

      if (e.key === "g") {
        chordRef.current = "g";
        // Auto-cancel chord after 1500 ms so 'g' alone doesn't stay pending forever
        chordTimerRef.current = setTimeout(() => {
          chordRef.current = null;
        }, 1500);
      }
    }

    window.addEventListener("keydown", handleChord);
    return () => {
      window.removeEventListener("keydown", handleChord);
      if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
    };
  }, [router]);

  return (
    <>
      {children}
      {helpOpen && (
        <ShortcutsHelpOverlay shortcuts={shortcuts} onClose={() => setHelpOpen(false)} />
      )}
    </>
  );
}
