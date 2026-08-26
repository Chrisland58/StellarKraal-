import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright visual regression configuration (#566)
 *
 * Captures screenshot baselines for key pages at desktop (1280×800) and
 * mobile (375×667) viewports, in both light and dark mode.
 *
 * Generating / updating baselines:
 *   npx playwright test -c playwright.visual.config.ts --update-snapshots
 *
 * Running diff checks (CI):
 *   npx playwright test -c playwright.visual.config.ts
 *
 * CI will fail if any screenshot differs by more than 0.1% of pixels
 * (controlled by maxDiffPixelRatio: 0.001 in the test file).
 */

const useExternalServer = process.env.PLAYWRIGHT_EXTERNAL_SERVER === "1";

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,           // No retries — screenshot diffs should fail fast
  workers: 1,           // Serial to keep screenshots deterministic
  reporter: [
    ["html", { outputFolder: "playwright-report/visual" }],
    ["json", { outputFile: "test-results/visual-results.json" }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    // Store diff images alongside the baseline snapshots so they can be
    // uploaded as CI artifacts on failure.
    screenshot: "only-on-failure",
  },
  // Snapshot output lives in tests/visual/__snapshots__ — committed to the repo
  snapshotPathTemplate:
    "{testDir}/__snapshots__/{testFilePath}/{arg}-{projectName}{ext}",
  projects: [
    {
      name: "desktop-light",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        colorScheme: "light",
      },
    },
    {
      name: "desktop-dark",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        colorScheme: "dark",
      },
    },
    {
      name: "mobile-light",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 375, height: 667 },
        colorScheme: "light",
      },
    },
    {
      name: "mobile-dark",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 375, height: 667 },
        colorScheme: "dark",
      },
    },
  ],
  webServer: useExternalServer
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
