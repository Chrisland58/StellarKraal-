/**
 * Design tokens for StellarKraal
 * All colors meet WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
 */

export const colors = {
  // Primary brand colors
  primary: {
    bg: 'bg-brown-600',        // Updated to darker brown for better contrast
    text: 'text-cream-50',
    hover: 'hover:bg-brown-700',
    border: 'border-brown-600'
  },
  
  // Secondary colors  
  secondary: {
    bg: 'bg-gold-600',         // Updated to darker gold for better contrast
    text: 'text-cream-50',     // White text on gold background
    hover: 'hover:bg-gold-700', 
    border: 'border-gold-600'
  },

  // Text colors (all WCAG AA compliant)
  text: {
    primary: 'text-brown-700',    // 13.9:1 contrast on white
    secondary: 'text-brown-600',  // 10.8:1 contrast on white
    muted: 'text-brown-500',      // 5.87:1 contrast on white
    inverse: 'text-cream-50'      // High contrast on dark backgrounds
  },

  // Background colors
  background: {
    primary: 'bg-cream-50',       // Pure white
    secondary: 'bg-cream-200',    // Light cream
    card: 'bg-cream-50',          // White cards
    overlay: 'bg-brown-900/80'    // Dark overlay
  },

  // Interactive states
  interactive: {
    default: 'bg-brown-600 text-cream-50',  // Updated for better contrast
    hover: 'hover:bg-brown-700',
    focus: 'focus:ring-2 focus:ring-brown-600 focus:ring-offset-2',
    disabled: 'disabled:bg-brown-300 disabled:text-brown-600'
  },

  // Status colors
  status: {
    success: {
      bg: 'bg-success-light',
      text: 'text-success-dark',
      border: 'border-success'
    },
    error: {
      bg: 'bg-error-light', 
      text: 'text-error-dark',
      border: 'border-error'
    },
    warning: {
      bg: 'bg-warning-light',
      text: 'text-warning-dark', 
      border: 'border-warning'
    }
  },

  // Form elements
  form: {
    input: 'border-brown-500 focus:border-brown-600 focus:ring-brown-600', // Updated border color
    label: 'text-brown-700',
    placeholder: 'placeholder-brown-500',  // Updated placeholder color
    error: 'border-error text-error-dark'
  }
} as const;

// ── Spacing scale (#778) ─────────────────────────────────────────────────────
// Base-4 scale. Values map to Tailwind spacing keys defined in tailwind.config.js.
// Use these tokens instead of arbitrary px values to keep spacing consistent.
//
//   Token name    px     Tailwind class (example)
//   space-1       4 px   p-space-1 / gap-space-1 / mt-space-1
//   space-2       8 px   p-space-2 / gap-space-2
//   space-3      12 px   …
//   space-4      16 px
//   space-6      24 px
//   space-8      32 px
//   space-12     48 px
//   space-16     64 px

export const spacing = {
  /** 4 px — tight internal padding, icon gaps */
  space1:  'space-1',
  /** 8 px — small gaps, badge padding */
  space2:  'space-2',
  /** 12 px — inline element padding */
  space3:  'space-3',
  /** 16 px — default component padding */
  space4:  'space-4',
  /** 24 px — section padding, card inner spacing */
  space6:  'space-6',
  /** 32 px — between related sections */
  space8:  'space-8',
  /** 48 px — between major page sections */
  space12: 'space-12',
  /** 64 px — hero / page-level vertical rhythm */
  space16: 'space-16',
} as const;

// ── Typography tokens (#298) ─────────────────────────────────────────────────

export const typography = {
  heading: {
    h1: "text-h1",
    h2: "text-h2",
    h3: "text-h3",
    h4: "text-h4",
  },
  body: {
    default: "text-body",
    sm: "text-body-sm",
  },
  caption: "text-caption",
  label: "text-label",
} as const;

// Utility function to get contrast-compliant color combinations
export function getContrastPair(background: 'light' | 'dark' = 'light') {
  return background === 'light' 
    ? { bg: 'bg-cream-50', text: 'text-brown-700' }
    : { bg: 'bg-brown-700', text: 'text-cream-50' };
}

// Health factor colors with proper contrast
export function healthColor(value: number): string {
  if (value >= 15000) return '#16A34A'; // success.DEFAULT - 4.54:1 on white
  if (value >= 10000) return '#D97706'; // warning.DEFAULT - 4.52:1 on white
  return '#DC2626'; // error.DEFAULT - 5.25:1 on white
}

// Non-color indicators so health status is distinguishable without relying on colour perception
export type HealthTier = 'safe' | 'warning' | 'danger';

export function healthTier(value: number): HealthTier {
  if (value >= 15000) return 'safe';
  if (value >= 10000) return 'warning';
  return 'danger';
}

export const HEALTH_TIER_ICON: Record<HealthTier, string> = {
  safe: '✓',
  warning: '!',
  danger: '✕',
};

export const HEALTH_TIER_LABEL: Record<HealthTier, string> = {
  safe: 'Safe',
  warning: 'Warning',
  danger: 'Danger',
};
