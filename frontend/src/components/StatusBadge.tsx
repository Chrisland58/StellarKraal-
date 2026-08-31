'use client';

/**
 * StatusBadge — #539
 *
 * Colours are sourced from design tokens (CSS custom properties via Tailwind
 * semantic colour utilities) instead of hard-coded Tailwind palette classes.
 * This ensures the badge colours stay consistent with the design system and
 * flip correctly in dark mode.
 *
 * Token mapping
 * ─────────────
 * active      → success  (bg-color-success-subtle / text-color-success)
 * repaid      → primary  (bg-color-primary/10     / text-color-primary)
 * defaulted   → warning  (bg-color-warning-subtle / text-color-warning)
 * liquidated  → danger   (bg-color-danger-subtle  / text-color-danger)
 * available   → success  (same as active)
 * pledged     → secondary(bg-color-secondary/15   / text-color-secondary)
 *
 * All token colours pass WCAG AA (≥ 4.5:1) for normal text on both
 * light and dark backgrounds — verified in docs/guides/design-tokens.md.
 */

import React from 'react';

export type LoanStatus = 'active' | 'repaid' | 'defaulted' | 'liquidated';
export type CollateralStatus = 'available' | 'pledged';
export type BadgeStatus = LoanStatus | CollateralStatus;

interface Config {
  label: string;
  /** Tailwind semantic-token classes — theme-safe, WCAG AA compliant */
  classes: string;
  icon: string;
  ariaLabel: string;
}

const STATUS_CONFIG: Record<BadgeStatus, Config> = {
  active: {
    label: 'Active',
    classes:
      'bg-color-success-subtle text-color-success',
    icon: '●',
    ariaLabel: 'Status: Active',
  },
  repaid: {
    label: 'Repaid',
    classes:
      'bg-color-primary/10 text-color-primary',
    icon: '✓',
    ariaLabel: 'Status: Repaid',
  },
  defaulted: {
    label: 'Defaulted',
    classes:
      'bg-color-warning-subtle text-color-warning',
    icon: '⚠',
    ariaLabel: 'Status: Defaulted',
  },
  liquidated: {
    label: 'Liquidated',
    classes:
      'bg-color-danger-subtle text-color-danger',
    icon: '✕',
    ariaLabel: 'Status: Liquidated',
  },
  available: {
    label: 'Available',
    classes:
      'bg-color-success-subtle text-color-success',
    icon: '◆',
    ariaLabel: 'Status: Available',
  },
  pledged: {
    label: 'Pledged',
    classes:
      'bg-color-secondary/15 text-color-secondary',
    icon: '⬡',
    ariaLabel: 'Status: Pledged',
  },
};

interface Props {
  status: BadgeStatus | string;
}

export default function StatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status as BadgeStatus];

  if (!config) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-color-surface text-color-text-subtle">
        {status}
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-label={config.ariaLabel}
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${config.classes}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}
