# Visual Regression Baselines

This directory stores the committed baseline screenshots used by the visual
regression tests (`tests/visual/visual-regression.spec.ts`).

## Generating baselines (first time or after an intentional UI change)

```bash
cd frontend
npx playwright test -c playwright.visual.config.ts --update-snapshots
```

Playwright generates one PNG per page × viewport × theme combination:

| File pattern | Viewports | Themes |
|---|---|---|
| `dashboard-*.png` | 1280×800, 375×667 | light, dark |
| `collateral-page-*.png` | 1280×800, 375×667 | light, dark |
| `loan-wizard-step1-*.png` | 1280×800, 375×667 | light, dark |

After generation, **commit the PNG files**:

```bash
git add frontend/tests/visual/__snapshots__
git commit -m "chore(visual): update visual regression baselines"
```

## Running diff checks (CI)

```bash
cd frontend
npx playwright test -c playwright.visual.config.ts
```

CI fails if any screenshot differs by more than **0.1% of total pixels**
(`maxDiffPixelRatio: 0.001`).

Diff images are uploaded as CI artifacts on failure so you can inspect
what changed.
