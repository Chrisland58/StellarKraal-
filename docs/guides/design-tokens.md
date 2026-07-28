# Design Tokens Guide

Design tokens are the single source of truth for the visual language of StellarKraal. This guide explains how to use, understand, and extend design tokens.

## Overview

Design tokens are defined in `frontend/src/lib/design-tokens.ts` and exported as JavaScript objects. They include:

- **Color tokens** — brand colors, text colors, status colors, backgrounds
- **Typography tokens** — heading and body text styles
- **Utility functions** — helpers for contrast-compliant color pairs and health factor indicators

All colors meet **WCAG 2.1 AA contrast requirements** (4.5:1 for normal text, 3:1 for large text).

## Color Tokens

### Primary and Secondary Colors

```typescript
import { colors } from '@/lib/design-tokens';

// Primary brand (brown)
colors.primary.bg        // 'bg-brown-600' — primary button background
colors.primary.text      // 'text-cream-50' — text on primary background
colors.primary.hover     // 'hover:bg-brown-700' — hover state
colors.primary.border    // 'border-brown-600' — border color

// Secondary brand (gold)
colors.secondary.bg      // 'bg-gold-600' — secondary button background
colors.secondary.text    // 'text-cream-50' — text on secondary background
colors.secondary.hover   // 'hover:bg-gold-700' — hover state
colors.secondary.border  // 'border-gold-600' — border color
```

**Usage in components:**

```tsx
<button className={`${colors.primary.bg} ${colors.primary.text} ${colors.primary.hover}`}>
  Click me
</button>
```

### Text Colors

All text colors are WCAG AA compliant:

```typescript
colors.text.primary      // 'text-brown-700' — 13.9:1 contrast on white
colors.text.secondary    // 'text-brown-600' — 10.8:1 contrast on white
colors.text.muted        // 'text-brown-500' — 5.87:1 contrast on white
colors.text.inverse      // 'text-cream-50' — high contrast on dark backgrounds
```

**When to use:**

- **Primary**: Main body text, headings on light backgrounds
- **Secondary**: Subtext, metadata, supporting information
- **Muted**: Disabled text, helper text, less emphasized content
- **Inverse**: Text on dark backgrounds, overlays

### Background Colors

```typescript
colors.background.primary    // 'bg-cream-50' — page background (pure white)
colors.background.secondary  // 'bg-cream-200' — light sections
colors.background.card       // 'bg-cream-50' — card backgrounds
colors.background.overlay    // 'bg-brown-900/80' — modal/dialog overlays
```

### Interactive States

```typescript
colors.interactive.default   // 'bg-brown-600 text-cream-50' — default button
colors.interactive.hover     // 'hover:bg-brown-700' — hover state
colors.interactive.focus     // 'focus:ring-2 focus:ring-brown-600 focus:ring-offset-2' — focus ring
colors.interactive.disabled  // 'disabled:bg-brown-300 disabled:text-brown-600' — disabled state
```

**Usage:**

```tsx
<button className={colors.interactive.default}>
  Normal button
</button>

<button disabled className={`${colors.interactive.default} ${colors.interactive.disabled}`}>
  Disabled button
</button>
```

### Status Colors

Status colors communicate state to users:

```typescript
colors.status.success.bg       // 'bg-success-light' — light green background
colors.status.success.text     // 'text-success-dark' — dark green text
colors.status.success.border   // 'border-success' — green border

colors.status.error.bg         // 'bg-error-light' — light red background
colors.status.error.text       // 'text-error-dark' — dark red text
colors.status.error.border     // 'border-error' — red border

colors.status.warning.bg       // 'bg-warning-light' — light orange background
colors.status.warning.text     // 'text-warning-dark' — dark orange text
colors.status.warning.border   // 'border-warning' — orange border
```

**Usage in alerts:**

```tsx
<div className={colors.status.success.bg}>
  <p className={colors.status.success.text}>Loan approved!</p>
</div>
```

### Form Colors

```typescript
colors.form.input        // 'border-brown-500 focus:border-brown-600 focus:ring-brown-600'
colors.form.label        // 'text-brown-700' — label text
colors.form.placeholder  // 'placeholder-brown-500' — placeholder text
colors.form.error        // 'border-error text-error-dark' — error state
```

**Usage:**

```tsx
<label className={colors.form.label}>
  Collateral Value
</label>
<input
  type="number"
  placeholder="Amount in stroops"
  className={colors.form.input}
  aria-invalid={isError}
  className={isError ? colors.form.error : colors.form.input}
/>
```

## Typography Tokens

Typography tokens define heading, body, and caption styles:

```typescript
import { typography } from '@/lib/design-tokens';

typography.heading.h1    // 'text-h1' — large page headings
typography.heading.h2    // 'text-h2' — section headings
typography.heading.h3    // 'text-h3' — subsection headings
typography.heading.h4    // 'text-h4' — smaller headings

typography.body.default  // 'text-body' — normal paragraph text
typography.body.sm       // 'text-body-sm' — small text

typography.caption       // 'text-caption' — captions, metadata
typography.label         // 'text-label' — form labels
```

**Usage:**

```tsx
<h1 className={typography.heading.h1}>Welcome to StellarKraal</h1>
<p className={typography.body.default}>Get started by connecting your wallet.</p>
<p className={typography.caption}>Powered by Stellar</p>
```

## Utility Functions

### `getContrastPair(background: 'light' | 'dark')`

Returns a contrast-compliant text and background color pair:

```typescript
import { getContrastPair } from '@/lib/design-tokens';

// For light backgrounds
const light = getContrastPair('light');
// { bg: 'bg-cream-50', text: 'text-brown-700' }

// For dark backgrounds
const dark = getContrastPair('dark');
// { bg: 'bg-brown-700', text: 'text-cream-50' }
```

**Usage in dynamic components:**

```tsx
function Card({ isDark }: { isDark: boolean }) {
  const { bg, text } = getContrastPair(isDark ? 'dark' : 'light');
  return <div className={`${bg} ${text} p-4`}>Content</div>;
}
```

### `healthColor(value: number): string`

Returns an RGB hex color based on loan health factor:

```typescript
import { healthColor } from '@/lib/design-tokens';

healthColor(15000)  // '#16A34A' — success (green), 4.54:1 contrast
healthColor(10000)  // '#D97706' — warning (orange), 4.52:1 contrast
healthColor(5000)   // '#DC2626' — error (red), 5.25:1 contrast
```

**Thresholds:**

- ≥ 15,000: Success (green)
- ≥ 10,000: Warning (orange)
- < 10,000: Error (red)

**Usage:**

```tsx
function HealthIndicator({ loanId }: { loanId: string }) {
  const loan = getLoan(loanId);
  const color = healthColor(loan.healthFactor);
  
  return (
    <div
      className="w-4 h-4 rounded-full"
      style={{ backgroundColor: color }}
      title={`Health factor: ${loan.healthFactor}`}
    />
  );
}
```

## Light and Dark Mode Support

All design tokens automatically support light and dark themes through CSS variables and Tailwind's built-in `dark:` prefix.

### Example: Light/Dark Mode Toggle

```tsx
function ComponentWithModeSupport() {
  return (
    <div className={`
      ${colors.background.primary}
      dark:bg-brown-800
      ${colors.text.primary}
      dark:text-cream-50
      p-4
    `}>
      Content adapts to light and dark mode
    </div>
  );
}
```

### Verification

Always verify WCAG AA compliance when adding new color pairs:

- Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Ensure **4.5:1 ratio** for normal text
- Ensure **3:1 ratio** for large text (18pt or 14pt bold+)
- Test with [WAVE Browser Extension](https://wave.webaim.org/extension/) or similar

## Adding a New Token

### 1. Define the token in `design-tokens.ts`

```typescript
export const colors = {
  // ... existing tokens
  
  // New token category
  notification: {
    bg: 'bg-info-light',
    text: 'text-info-dark',
    border: 'border-info',
    icon: 'text-info'
  }
} as const;
```

### 2. Verify contrast

Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to ensure new colors meet WCAG AA.

### 3. Export and use

```typescript
// In components
import { colors } from '@/lib/design-tokens';

<div className={colors.notification.bg}>
  <span className={colors.notification.icon}>ℹ️</span>
  <p className={colors.notification.text}>Information message</p>
</div>
```

### 4. Document the token

Add a comment explaining when to use the token:

```typescript
notification: {
  bg: 'bg-info-light',      // Light blue background
  text: 'text-info-dark',   // Dark blue text (5:1 contrast)
  border: 'border-info',    // Border color for info boxes
  icon: 'text-info'         // Icon color in notifications
}
```

## Best Practices

### ✅ Do

- **Use tokens consistently** — never hardcode colors
- **Test contrast ratios** — use WebAIM or similar tools
- **Group related tokens** — organize by semantic meaning (primary, status, form)
- **Document usage** — add JSDoc comments explaining token purpose
- **Support dark mode** — use `dark:` prefixes for dark theme variants
- **Follow naming conventions** — `{semantic}_{variant}_{state}` pattern (e.g., `primary_bg_hover`)

### ❌ Don't

- **Hardcode hex colors** — always use tokens
- **Bypass contrast requirements** — design tokens enforce WCAG compliance
- **Create single-use tokens** — reuse existing tokens where possible
- **Mix token types** — don't mix Tailwind classes with raw hex values
- **Ignore dark mode** — test all tokens in both light and dark themes

## Troubleshooting

### Colors don't render correctly

Ensure Tailwind is processing the Tailwind class names. Design tokens export Tailwind classes (e.g., `'bg-brown-600'`), not raw color values.

```tsx
// ✅ Correct
<div className={colors.primary.bg}>Correct</div>

// ❌ Wrong
<div style={{ backgroundColor: colors.primary.bg }}>Wrong</div>
```

### Dark mode not working

Verify `tailwind.config.js` has dark mode enabled:

```javascript
export default {
  darkMode: 'class', // Enable class-based dark mode
  // ...
}
```

### Contrast check fails

Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to verify the color pair. If contrast is below 4.5:1:

1. Darken text or lighten background
2. Choose a different color pair from the existing palette
3. Consider `getContrastPair()` utility for automatic pairing

## Related Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Design Audit Report](../../DARK_MODE_AUDIT.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)
