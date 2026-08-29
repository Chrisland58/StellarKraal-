# Accessibility Guide for Contributors

This guide explains how to write, test, and review accessible code in StellarKraal. The project targets **WCAG 2.1 AA** compliance.

---

## ARIA Usage Patterns

StellarKraal uses specific ARIA patterns consistently across components. Follow these conventions when adding new components.

### Navigation

```tsx
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/dashboard" aria-current="page">Dashboard</a></li>
  </ul>
</nav>
```

- Use `<nav>` with a descriptive `aria-label`.
- Use `aria-current="page"` on the active link.
- Mobile menus: `aria-expanded` and `aria-controls` on the toggle button.

### Dialogs and Modals

Use the shared `Modal` component (`components/ui/Modal.tsx`) which provides:

- `role="dialog"` and `aria-modal="true"`
- `aria-labelledby` pointing to the dialog title
- Focus trapping via `focus-trap-react`
- Focus restoration to the trigger element on close
- Escape key handling

```tsx
<Modal isOpen onClose={handleClose} title="Confirm" ariaLabel="Confirm action">
  {/* content */}
</Modal>
```

### Tooltips

Use `role="tooltip"` on the tooltip element. The trigger should describe the tooltip content:

```tsx
<button aria-describedby="tooltip-id">Info</button>
<div id="tooltip-id" role="tooltip">Explanation text</div>
```

The `GlossaryTerm` component provides an inline tooltip pattern with:
- `tabIndex={0}` on the trigger for keyboard access
- `aria-label="${term}: ${definition}"` on the trigger
- `role="tooltip"` on the tooltip element
- Enter/Space to toggle, click-outside to close

### Status and Live Regions

| Pattern | ARIA Attribute | Example Component |
|---------|---------------|-------------------|
| Dynamic content updates | `aria-live="polite"` | `AnimatedCounter`, `HealthGauge` |
| Important alerts | `role="alert"`, `aria-live="assertive"` | `OfflineBanner`, `NetworkMismatchBanner`, `Toast` |
| Status indicators | `role="status"`, `aria-label` | `StatusBadge` |
| Loading states | `aria-busy="true"` | `SkeletonCollateralCard` |

### Forms

All form components in `components/ui/FormField.tsx` follow these patterns:

- `aria-invalid={!!error}` on invalid inputs
- `aria-describedby` linking input to its error message
- Errors use `role="alert"`
- Required indicators use `aria-hidden="true"`
- `RadioGroup` uses `<fieldset>` + `<legend>` with `aria-describedby`

```tsx
<Input
  aria-invalid={!!error}
  aria-describedby={error ? "field-id-error" : undefined}
/>
{error && <FieldError id="field-id-error" role="alert">{error}</FieldError>}
```

### Decorative Icons

All icons are hidden from assistive technology:

```tsx
<Icon aria-hidden="true" />
```

### Skip Navigation

The `SkipToContent` component renders a skip link that is visually hidden until focused:

```tsx
<SkipToContent href="#main-content" />
```

Every page's main content area should have `id="main-content"`.

### Keyboard Shortcuts

The `KeyboardShortcutsProvider` provides app-wide shortcuts (`?`, `h`, `d`, `b`, `r`, `Escape`). It:

- Uses `useKeyboardShortcuts` hook with `Shortcut` interface (`key`, `label`, `hint`, `action`)
- Skips shortcuts when focus is in an input/textarea/select
- Ignores Ctrl/Alt/Meta modifier combinations
- Shows a `ShortcutsHelpModal` with `role="dialog"` listing all shortcuts

---

## Design Tokens

Use the semantic design tokens from `src/lib/design-tokens.ts` instead of raw color values:

```tsx
import { colors } from "@/lib/design-tokens";

// Bad: raw hex
className="text-[#5C3D2E]"

// Good: semantic token
className={colors.text.primary}
```

All token values meet WCAG 2.1 AA contrast ratios in both light and dark modes.

---

## Running Accessibility Tests

### 1. Contrast Audit

```bash
npm run audit:contrast
```

Verifies all color combinations meet 4.5:1 (normal text) and 3:1 (large text) requirements.

### 2. Jest Accessibility Tests (jest-axe)

```bash
npm test -- --testPathPattern=accessibility
```

Runs `jest-axe` checks on component render output. Write tests for new components:

```tsx
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

it("has no accessibility violations", async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 3. Playwright Accessibility Tests (axe-core)

Start the app, then:

```bash
npm run test:a11y
```

Runs full-page axe-core audits via Playwright. Configured in `playwright-a11y.config.ts`.

### 4. Manual Checks

Test with a screen reader (VoiceOver on macOS, NVDA on Windows) to verify:

- All interactive elements are reachable via Tab
- Dynamic content changes are announced
- Forms show clear error messages

---

## Common Accessibility Mistakes to Avoid

| Mistake | Why It Fails | Fix |
|---------|-------------|-----|
| Using color alone to convey status | Screen readers cannot see color | Add text labels or `aria-label` |
| Missing focus indicators | Keyboard users cannot see where they are | Use `focus:ring-2 focus:ring-offset-2` |
| Non-semantic click handlers on `<div>` | Not keyboard accessible or screen reader friendly | Use `<button>` or add `role="button"` + `tabIndex` + keyboard handler |
| Forgetting `alt` text on images | Screen readers read the filename | Provide meaningful `alt` or `aria-hidden="true"` for decorative images |
| Inaccessible custom tooltips | Not keyboard discoverable | Add `tabIndex={0}`, `aria-describedby`, handle Enter/Space |
| Missing labels on form inputs | Screen readers cannot identify the field | Use `<label>` with `htmlFor` or `aria-label` |
| Overriding browser focus styles | Removes visible focus indicator | Only override to enhance, never remove `:focus-visible` |
| Using `aria-live="assertive"` unnecessarily | Interrupts the user's current task | Use `aria-live="polite"` for most dynamic updates |
| Not testing dark mode | Contrast may fail in dark theme | Test all color combinations in both themes |

---

## Pre-PR Accessibility Checklist

- [ ] All interactive elements are keyboard accessible (Tab order, Enter/Space activation)
- [ ] Forms have proper `<label>` elements with `htmlFor` or `aria-label`
- [ ] Error messages use `role="alert"` and are linked via `aria-describedby`
- [ ] Images have meaningful `alt` text or `aria-hidden="true"` if decorative
- [ ] Color is not the sole means of conveying information
- [ ] Focus indicators are visible (check `:focus-visible` styles)
- [ ] Semantic HTML elements are used (`<nav>`, `<main>`, `<button>`, `<h1>`-`<h6>`)
- [ ] ARIA landmarks have descriptive labels (`aria-label` on `<nav>`, `<aside>`)
- [ ] Dynamic content uses `aria-live` regions appropriately
- [ ] Contrast audit passes: `npm run audit:contrast`
- [ ] Jest a11y tests pass: `npm test -- --testPathPattern=accessibility`
- [ ] Component renders correctly in both light and dark mode
- [ ] No `axe-core` violations in Playwright audit: `npm run test:a11y`

---

## Related

- [ACCESSIBILITY_IMPLEMENTATION.md](../../ACCESSIBILITY_IMPLEMENTATION.md) — summary of completed accessibility work
- [docs/ACCESSIBILITY_AUDIT.md](../ACCESSIBILITY_AUDIT.md) — detailed audit report with contrast ratios
- [Design Tokens](../../frontend/src/lib/design-tokens.ts) — semantic color and typography tokens
- [Frontend CI](../../.github/workflows/frontend-ci.yml) — enforces Lighthouse accessibility score >= 90
