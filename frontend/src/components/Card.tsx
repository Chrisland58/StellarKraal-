import { HTMLAttributes, ReactNode, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "highlighted" | "warning";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual treatment of the card. */
  variant?: CardVariant;

  // ── Named slots ────────────────────────────────────────────────────────────
  /** Optional top row — rendered above a divider. */
  header?: ReactNode;
  /**
   * Short primary label. Rendered as the first line inside the body when
   * `header` is not provided (or alongside it when both are supplied).
   */
  title?: string;
  /** Smaller secondary label rendered below `title`. */
  subtitle?: string;
  /**
   * Inline badge placed to the right of `title`. Accepts any ReactNode so
   * callers can pass a pre-styled `<StatusBadge>` or a plain string.
   */
  badge?: ReactNode;
  /** Body content (always rendered). */
  children?: ReactNode;
  /**
   * Slot for action controls (buttons, links) pinned to the right of the
   * title row. Rendered only when `title` or `badge` is present.
   */
  action?: ReactNode;
  /** Optional bottom row — rendered below a divider, slightly tinted. */
  footer?: ReactNode;

  // ── Interaction states ─────────────────────────────────────────────────────
  /** Applies the selected ring + background tint. */
  selected?: boolean;
  /** Mutes the card and suppresses pointer/keyboard interaction. */
  disabled?: boolean;
  /**
   * When provided the card becomes a keyboard-focusable interactive element
   * (role="button") and fires this handler on click / Enter / Space.
   */
  onSelect?: () => void;

  className?: string;
}

const variantClasses: Record<CardVariant, string> = {
  default:
    "bg-cream-50 dark:bg-brown-800 border border-brown-100 dark:border-brown-700 shadow",
  highlighted:
    "bg-gold-50 dark:bg-brown-700 border border-gold-500 dark:border-gold-600 shadow-md",
  warning:
    "bg-warning-light dark:bg-brown-700 border border-warning dark:border-warning-dark shadow",
};

/**
 * Card — unified data-display container for all list items across the app.
 *
 * **Variants**: `default` | `highlighted` | `warning`
 *
 * **Named slots**
 * - `header`   — raw ReactNode rendered above a divider
 * - `title`    — primary label (string)
 * - `subtitle` — secondary label (string)
 * - `badge`    — inline chip/tag beside the title
 * - `action`   — controls pinned to the right of the title row
 * - `children` — body content
 * - `footer`   — bottom row below a divider (slightly tinted)
 *
 * **Interaction states**
 * - `selected`  — highlighted ring + subtle fill
 * - `disabled`  — muted + no pointer/keyboard interaction
 * - `onSelect`  — makes the card keyboard-navigable (role="button")
 *
 * Dark mode is handled automatically via Tailwind's `dark:` prefix.
 * All interactive states meet WCAG AA contrast and have explicit focus rings.
 */
export default function Card({
  variant = "default",
  header,
  title,
  subtitle,
  badge,
  children,
  action,
  footer,
  selected = false,
  disabled = false,
  onSelect,
  className,
  ...rest
}: CardProps) {
  const isInteractive = !!onSelect && !disabled;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isInteractive && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-disabled={disabled ? "true" : undefined}
      aria-pressed={isInteractive && selected ? "true" : undefined}
      onClick={isInteractive ? onSelect : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={cn(
        // ── Base ───────────────────────────────────────────────────────────────
        "rounded-2xl overflow-hidden transition-all duration-200",
        variantClasses[variant],

        // ── Hover state (non-disabled) ─────────────────────────────────────────
        !disabled &&
          "hover:shadow-lg hover:-translate-y-0.5 dark:hover:border-brown-500",

        // ── Interactive cursor & focus ring ────────────────────────────────────
        isInteractive && [
          "cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-gold-500 focus-visible:ring-offset-2",
          "active:scale-[0.99] active:shadow-md active:translate-y-0",
        ],

        // ── Selected state ─────────────────────────────────────────────────────
        selected && [
          "ring-2 ring-gold-500 dark:ring-gold-400",
          "bg-gold-50 dark:bg-brown-700",
        ],

        // ── Disabled state ─────────────────────────────────────────────────────
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",

        className
      )}
      {...rest}
    >
      {/* Optional legacy header slot */}
      {header && (
        <div className="px-6 py-4 border-b border-brown-100 dark:border-brown-700">
          {header}
        </div>
      )}

      {/* Title / subtitle / badge / action row */}
      {(title || badge || action) && (
        <div className="px-6 pt-5 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {title && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-brown-700 dark:text-cream-100 truncate">
                  {title}
                </span>
                {badge && <span>{badge}</span>}
              </div>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-brown-500 dark:text-brown-300 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="flex-shrink-0 flex items-center gap-2">{action}</div>
          )}
        </div>
      )}

      {/* Body */}
      {children !== undefined && (
        <div className={cn("px-6 py-5", (title || badge || action) && "pt-3")}>
          {children}
        </div>
      )}

      {/* Footer slot */}
      {footer && (
        <div className="px-6 py-4 border-t border-brown-100 dark:border-brown-700 bg-brown-50/40 dark:bg-brown-900/30">
          {footer}
        </div>
      )}
    </div>
  );
}
