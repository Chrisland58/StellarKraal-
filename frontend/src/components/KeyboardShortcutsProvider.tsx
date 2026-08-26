"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts, Shortcut } from "@/hooks/useKeyboardShortcuts";
import ShortcutsHelpOverlay from "@/components/ShortcutsHelpOverlay";

export default function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const helpOpenRef = useRef(helpOpen);
  helpOpenRef.current = helpOpen;

  const toggleHelp = useCallback(() => setHelpOpen((v) => !v), []);

  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "h",      hint: "H",   label: "Go to Home",               action: () => router.push("/") },
    { key: "d",      hint: "D",   label: "Go to Dashboard",          action: () => router.push("/dashboard") },
    { key: "b",      hint: "B",   label: "Borrow (get a loan)",      action: () => router.push("/borrow") },
    { key: "r",      hint: "R",   label: "Go to repay (dashboard)",  action: () => router.push("/dashboard") },
    { key: "Escape", hint: "Esc", label: "Close modal / cancel",     action: () => setHelpOpen(false) },
  ], [router]);

  useKeyboardShortcuts(shortcuts);

  // Hold '?' for 500ms to show shortcuts overlay; release to dismiss
  useState(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "?" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if (document.querySelector('[role="dialog"]')) return;

        e.preventDefault();
        holdTimerRef.current = setTimeout(() => {
          setHelpOpen(true);
        }, 500);
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === "?") {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        if (helpOpenRef.current) {
          setHelpOpen(false);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  });

  return (
    <>
      {children}
      {helpOpen && (
        <ShortcutsHelpOverlay shortcuts={shortcuts} onClose={() => setHelpOpen(false)} />
      )}
    </>
  );
}
