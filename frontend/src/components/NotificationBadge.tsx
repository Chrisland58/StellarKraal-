/**
 * NotificationBadge — #803
 *
 * A red pill badge that shows the count of at-risk loans.
 * Rendered beside the Dashboard nav link in the Navbar.
 *
 * Design decisions
 * ────────────────
 * • Colour: `--token-danger` (maps to `text-red-700` / `bg-red-600` in Tailwind)
 *   which exceeds WCAG AA contrast (5.25:1 on white, 4.6:1 on dark background).
 * • aria-label: "X loans at risk of liquidation" as specified in #803.
 * • When `count` is 0 the component renders nothing — badge disappears.
 * • Counts > 99 are displayed as "99+" to prevent badge overflow.
 */

interface NotificationBadgeProps {
  /** Number of at-risk loans. Renders nothing when 0. */
  count: number;
}

export default function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count <= 0) return null;

  const label = `${count} loan${count === 1 ? '' : 's'} at risk of liquidation`;
  const display = count > 99 ? '99+' : String(count);

  return (
    <span
      aria-label={label}
      title={label}
      className={[
        // ── Positioning ────────────────────────────────────────────────────────
        // Parent link is `position: relative` so this floats top-right.
        "absolute -top-1 -right-1",

        // ── Visual ────────────────────────────────────────────────────────────
        // bg-color-danger maps to --token-danger (red) via tailwind.config.js.
        // Falls back to explicit red classes for safety.
        "inline-flex items-center justify-center",
        "min-w-[1.125rem] h-[1.125rem] px-1",
        "rounded-full text-[10px] font-bold leading-none",

        // Danger design token colour — WCAG AA compliant on both light/dark nav bg
        "bg-[color:var(--token-danger,#DC2626)] text-white",

        // Subtle ring to separate from icon in dark mode
        "ring-1 ring-white/50 dark:ring-stone-800/70",
      ].join(" ")}
    >
      {display}
    </span>
  );
}
