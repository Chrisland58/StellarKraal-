# Dark Mode Developer Guide

StellarKraal ships full light/dark mode support built on Tailwind CSS's `class` strategy and CSS custom properties. This guide explains how the system works, how to add dark mode support to new components, and how to test it locally.

---

## How It Works

### Tailwind `class` strategy

`tailwind.config.js` sets `darkMode: "class"`. Dark mode activates when the `dark` class is present on the `<html>` element — not automatically on OS preference change. This gives the app explicit control over when the theme switches.

### Flash-free initialisation — `ThemeScript`

The biggest challenge with client-side dark mode is the "flash of wrong theme" (FWOT): the page briefly renders in the wrong theme before React hydrates. StellarKraal prevents this with a small inline blocking script injected into `<body>` **before the first paint**.

The script is exported as `ThemeScript` from `frontend/src/components/ThemeProvider.tsx`:

```tsx
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var stored = localStorage.getItem('theme');
        var preferred = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark' : 'light';
        var theme = stored || preferred;
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
```

It is inserted in `frontend/src/app/layout.tsx` as the first child of `<body>`, before `ThemeProvider`:

```tsx
<body ...>
  <ThemeScript />          {/* ← runs before first paint */}
  <ThemeProvider>
    ...
  </ThemeProvider>
</body>
```

Because this is a synchronous blocking script, it sets (or clears) the `dark` class before the browser lays out a single pixel. `<html>` carries `suppressHydrationWarning` to prevent a React mismatch warning from the class toggle.

### Preference resolution order

1. `localStorage.getItem('theme')` — explicit user choice, persisted across sessions.
2. `window.matchMedia('(prefers-color-scheme: dark)')` — OS/browser preference.
3. Light mode default.

### `ThemeProvider` and `useTheme`

`ThemeProvider` is a React context provider that exposes the active theme and a `toggle` function. On mount it reads the class already applied by `ThemeScript`, so there is never a hydration mismatch.

```tsx
// Read the current theme or toggle it from any component:
import { useTheme } from "@/components/ThemeProvider";

const { theme, toggle } = useTheme();
// theme: "light" | "dark"
// toggle(): flips theme, persists to localStorage, updates <html> class
```

The provider also listens for OS `prefers-color-scheme` changes and applies them automatically — but only when the user has not manually set a preference (i.e. no `localStorage` key).

### `ThemeToggle` component

`ThemeToggle` (`frontend/src/components/ThemeToggle.tsx`) consumes `useTheme()` and renders a 44×44 px accessible button in the Navbar:

```tsx
<button
  onClick={toggle}
  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
  className="rounded-lg p-2 min-h-[44px] min-w-[44px] ..."
>
  <span aria-hidden="true">{isDark ? "☀️" : "🌙"}</span>
</button>
```

The `aria-label` updates dynamically so screen-reader users always know what the button will do.

---

## CSS Custom Properties and Design Tokens

All theme colors are defined as CSS custom properties in `frontend/src/app/globals.css`. The `:root` block defines light mode; the `.dark` block overrides them. Components reference the variables rather than hard-coded color values so they automatically adapt when the theme changes.

### Color variables

| Variable | Light | Dark | Role |
|----------|-------|------|------|
| `--color-bg` | `#FEFCF8` | `#1A1007` | Page background |
| `--color-bg-card` | `#FFFFFF` | `#2A1B0B` | Card / panel surface |
| `--color-text` | `#3D2810` | `#FDF6EC` | Primary text |
| `--color-text-muted` | `#8B5A1F` | `#D4A05A` | Secondary / muted text |
| `--color-border` | `#F0D9B8` | `#3D2810` | Default border |
| `--color-border-strong` | `#D4A05A` | `#5D3C15` | Strong border |
| `--color-gold` | `#D97706` | `#F8CA47` | Accent, focus ring |
| `--color-nav-bg` | `#FEFCF8` | `#2A1B0B` | Navigation background |

### Semantic design tokens

A full set of intent-based tokens (prefixed `--token-`) is also defined in `globals.css`. Prefer these over raw color variables in new components:

| Token | Light | Dark | Intent |
|-------|-------|------|--------|
| `--token-primary` | `#5D3C15` | `#F0D9B8` | Primary interactive color |
| `--token-accent` | `#D97706` | `#F8CA47` | Accent / highlight |
| `--token-danger` | `#DC2626` | `#F87171` | Error / destructive |
| `--token-success` | `#16A34A` | `#4ADE80` | Success state |
| `--token-warning` | `#D97706` | `#FBD049` | Warning state |
| `--token-surface` | `#FDF6EC` | `#2A1B0B` | Card surface |
| `--token-text` | `#3D2810` | `#FDF6EC` | Body text |
| `--token-text-muted` | `#8B5A1F` | `#D4A05A` | Secondary text |
| `--token-border` | `#F0D9B8` | `#3D2810` | Default border |

These tokens are also exported as TypeScript constants in `frontend/src/lib/design-tokens.ts` for use in inline styles, Storybook stories, and test assertions.

### Focus rings

`globals.css` applies a global `*:focus-visible` rule using `--token-accent` (gold). The ring appears only for keyboard navigation (suppressed for mouse via `:focus-visible`) and meets WCAG 1.4.11 in both themes:

```css
*:focus-visible {
  outline: 3px solid var(--token-accent);
  outline-offset: 2px;
  border-radius: 4px;
}
```

---

## Adding Dark Mode to New Components

### Option 1 — CSS variable inline styles (preferred for layout)

```tsx
<div
  style={{
    backgroundColor: "var(--color-bg-card)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
  }}
>
  Content
</div>
```

Variables resolve automatically for the active theme. No extra class needed.

### Option 2 — Tailwind `dark:` variants (preferred for utility classes)

```tsx
<button className="bg-white dark:bg-[#2A1B0B] text-brown-700 dark:text-[#FDF6EC]">
  Click me
</button>
```

Use `dark:` prefix to provide an override for any Tailwind utility when the `dark` class is active on `<html>`.

### Option 3 — `useTheme` hook (for behaviour changes)

When a component needs to do more than change colour — e.g. swap an image, adjust a chart palette — consume `useTheme()`:

```tsx
import { useTheme } from "@/components/ThemeProvider";

export function ChartWrapper() {
  const { theme } = useTheme();
  const chartTheme = theme === "dark" ? darkChartConfig : lightChartConfig;
  return <Chart config={chartTheme} />;
}
```

### Legacy class overrides

`globals.css` includes a `.dark` override block that rewrites common legacy Tailwind classes (`bg-white`, `bg-cream`, `text-brown`, etc.) to CSS variable values. These ensure existing components adapt without per-component changes. New components should use CSS variables or semantic tokens directly rather than relying on these overrides.

---

## Contrast Requirements (WCAG 2.1 AA)

All new color combinations must pass:
- Normal text (< 18 pt or < 14 pt bold): **4.5:1** minimum.
- Large text (≥ 18 pt or ≥ 14 pt bold): **3:1** minimum.
- Non-text UI (borders, icons, focus rings): **3:1** minimum.

All current token combinations are documented with their contrast ratios in [`docs/dark-mode-audit.md`](../dark-mode-audit.md). Every combination currently passes WCAG AA.

When adding a new color pair:
1. Calculate the ratio using the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) or equivalent tool.
2. Add the combination and ratio to `docs/dark-mode-audit.md` in your PR description.
3. Ensure the color is defined in both `:root` (light) and `.dark` (dark) blocks in `globals.css`.

---

## Testing Dark Mode Locally

### Toggle in the browser

1. Start the dev server: `cd frontend && npm run dev`
2. Open `http://localhost:3000`
3. Click the moon/sun icon (🌙/☀️) in the Navbar to toggle themes.
4. The preference is written to `localStorage`. To reset to OS default: open DevTools console and run `localStorage.removeItem('theme')`, then reload.

### Simulate OS preference via DevTools

**Chrome:** DevTools → More tools → Rendering → Emulate CSS media feature `prefers-color-scheme`.

**Firefox:** DevTools → Responsive Design Mode → toggle the sun/moon icon in the toolbar.

Clear `localStorage` first to ensure the OS override takes effect.

### Automated contrast audit

```bash
cd frontend
npm run audit:contrast
```

This script checks all token combinations against WCAG requirements and writes a JSON report to `frontend/audit-reports/`. It also runs in CI via the [Accessibility workflow](../../.github/workflows/accessibility.yml) on every push to `main` and `develop`.

### Unit tests

```bash
cd frontend
npm test -- --testPathPattern=ThemeProvider
```

`frontend/src/__tests__/ThemeProvider.test.tsx` covers:
- `ThemeScript` inline script generation.
- `ThemeProvider` state initialisation from the `dark` class applied by `ThemeScript`.
- `toggle()` updating both `localStorage` and the `<html>` class.

---

## High Contrast Mode (Windows Forced Colors)

`globals.css` includes a `@supports (forced-colors: active)` block for Windows High Contrast Mode. It ensures interactive elements use system `CanvasText`/`Canvas` colors, and focus/hover states use `Highlight`/`HighlightText`. This is independent of the StellarKraal dark mode toggle — it activates at the OS level and overrides both themes.

---

## Further Reading

- [`docs/dark-mode-audit.md`](../dark-mode-audit.md) — WCAG AA contrast ratios for all current token combinations.
- [`docs/guides/accessibility.md`](accessibility.md) — ARIA patterns, testing, and pre-PR accessibility checklist.
- [`frontend/src/lib/design-tokens.ts`](../../frontend/src/lib/design-tokens.ts) — TypeScript token exports.
- [`frontend/src/app/globals.css`](../../frontend/src/app/globals.css) — All CSS custom property definitions (`:root` and `.dark`).
- [`frontend/src/components/ThemeProvider.tsx`](../../frontend/src/components/ThemeProvider.tsx) — `ThemeProvider`, `ThemeScript`, `useTheme`.
- [`frontend/src/components/ThemeToggle.tsx`](../../frontend/src/components/ThemeToggle.tsx) — Toggle button component.
