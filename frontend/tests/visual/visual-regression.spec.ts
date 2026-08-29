import { test, expect } from "@playwright/test";

/**
 * Visual regression tests (#566)
 *
 * Captures full-page screenshots of three key pages and compares them
 * against committed baselines.
 *
 * Pages covered:
 *   - Dashboard    /dashboard
 *   - Collateral   /collateral
 *   - LoanWizard   /borrow     (the wizard is rendered inside this page)
 *
 * Viewports / themes are driven by the Playwright project matrix in
 * playwright.visual.config.ts:
 *   desktop-light (1280×800), desktop-dark (1280×800)
 *   mobile-light  (375×667),  mobile-dark  (375×667)
 *
 * Threshold: CI fails if a screenshot diff exceeds 0.1% of total pixels
 * (maxDiffPixelRatio: 0.001).
 *
 * Generating / updating baselines:
 *   npx playwright test -c playwright.visual.config.ts --update-snapshots
 *
 * Baseline images are stored in:
 *   frontend/tests/visual/__snapshots__/
 * and must be committed to the repository.
 */

// ── Pixel-change threshold (0.1%) ──────────────────────────────────────────
const MAX_DIFF = { maxDiffPixelRatio: 0.001 };

// ── Shared helpers ─────────────────────────────────────────────────────────

/**
 * Apply the correct color-scheme class to <html> so Tailwind dark-mode
 * utility classes activate when the OS-level colorScheme project flag is set.
 */
async function applyTheme(
  page: Parameters<typeof test>[1] extends { page: infer P } ? P : never
) {
  const colorScheme = await page.evaluate(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  if (colorScheme === "dark") {
    // The app uses ThemeProvider which sets data-theme="dark" based on
    // OS preference or localStorage. Force it for deterministic screenshots.
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    });
  } else {
    await page.evaluate(() => {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.remove("dark");
    });
  }
}

/**
 * Wait for the page to be fully settled:
 * - No pending network requests
 * - No CSS animations in progress
 */
async function waitForPageReady(
  page: Parameters<typeof test>[1] extends { page: infer P } ? P : never
) {
  await page.waitForLoadState("networkidle");
  // Pause framer-motion / CSS transitions so screenshots are deterministic
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0ms !important;
        transition-duration: 0ms !important;
      }
    `,
  });
}

// ── Mock API routes shared across all visual tests ─────────────────────────

async function setupMocks(
  page: Parameters<typeof test>[1] extends { page: infer P } ? P : never
) {
  // Wallet — connected with a fixed address for stable screenshots
  await page.addInitScript(() => {
    window.__STELLARKRAAL_E2E__ = {
      async isConnected() { return { isConnected: true }; },
      async isAllowed()   { return { isAllowed: true }; },
      async setAllowed()  { return { isAllowed: true }; },
      async getAddress()  { return { address: "GVISUAL1234567890ABCDEF1234567890ABCDEF1234567" }; },
      async signTransaction(xdr: string) { return { signedTxXdr: `${xdr}-signed` }; },
      async submitSignedXdr() { return "visual-tx-hash"; },
    };
  });

  await page.route("**/api/health/**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ health_factor: 1.8 }) })
  );

  await page.route("**/api/transactions**", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          { id: "tx1", type: "repayment", amount: 50000, timestamp: "2026-05-20T10:00:00Z", txHash: "abc123" },
          { id: "tx2", type: "loan",      amount: 200000, timestamp: "2026-05-18T09:00:00Z", txHash: "def456" },
        ],
      }),
    })
  );

  await page.route("**/api/collateral**", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "101", animalType: "cattle", count: 5, appraisedValue: 500000, healthStatus: "good", createdAt: "2026-05-01T00:00:00Z" },
        { id: "102", animalType: "goat",   count: 10, appraisedValue: 120000, healthStatus: "fair", createdAt: "2026-05-02T00:00:00Z" },
      ]),
    })
  );

  await page.route("**/api/loans**", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "1", borrower: "GVISUAL1234567890ABCDEF1234567890ABCDEF1234567", amount: 200000, status: "active", createdAt: "2026-05-10T00:00:00Z", outstandingBalance: 200000 },
      ]),
    })
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────

test.describe("Dashboard visual regression", () => {
  test("matches baseline", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/dashboard");
    await waitForPageReady(page);
    await applyTheme(page);

    await expect(page).toHaveScreenshot("dashboard.png", {
      fullPage: true,
      ...MAX_DIFF,
    });
  });
});

// ── Collateral page ──────────────────────────────────────────────────────────

test.describe("CollateralPage visual regression", () => {
  test("matches baseline", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/collateral");
    await waitForPageReady(page);
    await applyTheme(page);

    await expect(page).toHaveScreenshot("collateral-page.png", {
      fullPage: true,
      ...MAX_DIFF,
    });
  });
});

// ── LoanWizard (Borrow page) ─────────────────────────────────────────────────

test.describe("LoanWizard visual regression", () => {
  test("step 1 (Collateral) matches baseline", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/borrow");
    await waitForPageReady(page);
    await applyTheme(page);

    // Wait for the wizard to fully render — connect-wallet button or step content
    await page
      .getByRole("button", { name: /connect|collateral|register/i })
      .first()
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => {/* page may not have this button — proceed anyway */});

    await expect(page).toHaveScreenshot("loan-wizard-step1.png", {
      fullPage: true,
      ...MAX_DIFF,
    });
  });
});
