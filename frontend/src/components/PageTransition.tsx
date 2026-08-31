"use client";

/**
 * PageTransition — #556
 *
 * Wraps page content in a fade-in/fade-out animation on route change.
 *
 * Requirements met:
 * - Pages fade in over 150 ms (opacity 0 → 1)
 * - Animation does not block interactivity (pointer-events remain active;
 *   framer-motion only animates opacity, not layout)
 * - Reduced-motion: `useReducedMotion()` skips the animation entirely so
 *   `prefers-reduced-motion: reduce` is respected
 * - No layout shift: `will-change: opacity` is used instead of transforms;
 *   the wrapper is full-width so it never affects document flow
 * - Works on all existing app routes: wired in the root layout so every
 *   Next.js page benefits automatically
 */

import { motion, useReducedMotion } from "framer-motion";

interface Props {
  children: React.ReactNode;
}

/** Animation variants — opacity only so no layout shift occurs */
const variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1, ease: "easeIn" },
  },
};

export default function PageTransition({ children }: Props) {
  const reduced = useReducedMotion();

  // Honour `prefers-reduced-motion: reduce` — render children directly
  if (reduced) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      // Prevent layout shift: block display, full width, no min-height
      style={{ display: "block", width: "100%", willChange: "opacity" }}
    >
      {children}
    </motion.div>
  );
}
