/**
 * useRipple — #809
 *
 * Returns a `triggerRipple` handler to be attached to a button's onPointerDown
 * event. When called it injects a `.ripple-wave` <span> at the pointer's
 * position inside the button. The element is removed after the 400 ms
 * animation completes.
 *
 * The ripple is automatically disabled when `prefers-reduced-motion` is set —
 * both via the CSS media query in globals.css (hides `.ripple-wave`) AND here
 * in JS so no DOM nodes are created unnecessarily.
 *
 * The ripple does NOT interfere with disabled or loading buttons: the hook
 * checks the button's disabled state before injecting anything.
 *
 * Usage:
 *   const { triggerRipple } = useRipple();
 *   <button onPointerDown={triggerRipple} className="btn-ripple">…</button>
 */
import { useCallback } from "react";

export function useRipple() {
  const triggerRipple = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const button = e.currentTarget;

      // Do nothing if the button is disabled or loading
      if (button.disabled || button.getAttribute("aria-disabled") === "true") {
        return;
      }

      // Respect prefers-reduced-motion at the JS level
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement("span");
      ripple.className = "ripple-wave";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      button.appendChild(ripple);

      // Remove the element after the 400 ms animation finishes
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    },
    []
  );

  return { triggerRipple };
}
