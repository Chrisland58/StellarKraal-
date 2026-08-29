/**
 * Icon — thin wrapper around lucide-react SVG icons.
 *
 * Defines the project-wide icon size token scale:
 * | Token | px | CSS class        |
 * |-------|----|------------------|
 * | sm    | 16 | h-4 w-4          |
 * | md    | 20 | h-5 w-5 (default)|
 * | lg    | 24 | h-6 w-6          |
 *
 * All icons are hidden from assistive technology by default (`aria-hidden`).
 * When the icon carries semantic meaning, pass an `aria-label` to expose it.
 *
 * @example
 *   import { Icon } from "@/components/Icon";
 *   import { LayoutDashboard } from "lucide-react";
 *
 *   <Icon icon={LayoutDashboard} size="md" className="text-brown-600" />
 */

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Size token map ─────────────────────────────────────────────────────────────
export type IconSize = "sm" | "md" | "lg";

/**
 * Pixel values for documentation / runtime use.
 * The actual rendered size is controlled by the Tailwind classes in `sizeClasses`.
 */
export const ICON_SIZE_PX: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

const sizeClasses: Record<IconSize, string> = {
  sm: "h-4 w-4",   // 16 px
  md: "h-5 w-5",   // 20 px
  lg: "h-6 w-6",   // 24 px
};

// ── Component ──────────────────────────────────────────────────────────────────

export interface IconProps {
  /** The lucide-react icon component to render. */
  icon: LucideIcon;
  /** Size token — defaults to `md` (20 px). */
  size?: IconSize;
  /** Additional Tailwind classes (e.g. colour overrides). */
  className?: string;
  /**
   * Accessible label. When provided the element is exposed to assistive
   * technology as an image. Omit for decorative icons.
   */
  "aria-label"?: string;
}

export function Icon({
  icon: LucideComponent,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: IconProps) {
  return (
    <LucideComponent
      aria-hidden={ariaLabel ? undefined : "true"}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      focusable="false"
      className={cn(sizeClasses[size], className)}
    />
  );
}
