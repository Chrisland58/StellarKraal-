"use client";

import { useState, useCallback, useEffect } from "react";

export type ToastPosition =
  | "bottom-right"
  | "bottom-center"
  | "top-right"
  | "top-center";

const STORAGE_KEY = "stellarkraal.toast_position";
const DEFAULT_DESKTOP: ToastPosition = "bottom-right";
const DEFAULT_MOBILE: ToastPosition = "bottom-center";

/**
 * Returns the default position based on the current viewport width.
 * On narrow screens (< 640 px) we default to bottom-center so the toast
 * doesn't overlap thumb-zone content. On wider viewports we use bottom-right.
 */
function getDefaultPosition(): ToastPosition {
  if (typeof window === "undefined") return DEFAULT_DESKTOP;
  return window.innerWidth < 640 ? DEFAULT_MOBILE : DEFAULT_DESKTOP;
}

/**
 * Persists and reads the user's preferred toast position from localStorage.
 * Falls back to bottom-right on desktop, bottom-center on mobile.
 *
 * Usage:
 *   const { position, setPosition } = useToastPosition();
 */
export function useToastPosition() {
  const [position, setPositionState] = useState<ToastPosition>(() => {
    if (typeof window === "undefined") return DEFAULT_DESKTOP;
    const stored = localStorage.getItem(STORAGE_KEY) as ToastPosition | null;
    if (stored && isValidPosition(stored)) return stored;
    return getDefaultPosition();
  });

  const setPosition = useCallback((next: ToastPosition) => {
    setPositionState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage may be unavailable in some environments; silently ignore.
    }
  }, []);

  // Sync with storage changes from other tabs.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue && isValidPosition(e.newValue as ToastPosition)) {
        setPositionState(e.newValue as ToastPosition);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { position, setPosition };
}

export function isValidPosition(value: string): value is ToastPosition {
  return ["bottom-right", "bottom-center", "top-right", "top-center"].includes(value);
}

/**
 * Maps a ToastPosition value to the Tailwind positioning classes
 * for the toast container.
 */
export function positionToClasses(position: ToastPosition): string {
  switch (position) {
    case "top-right":
      return "top-4 right-4 items-end";
    case "top-center":
      return "top-4 left-1/2 -translate-x-1/2 items-center";
    case "bottom-center":
      return "bottom-4 left-1/2 -translate-x-1/2 items-center";
    case "bottom-right":
    default:
      return "bottom-4 right-4 items-end";
  }
}
