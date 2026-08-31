import { test, expect } from "@playwright/test";

/**
 * E2E: Offline banner behaviour (#535)
 *
 * Acceptance criteria:
 *  ✅  Form submit buttons are disabled when the browser goes offline
 *  ✅  OfflineBanner is visible at the top of the page when offline
 *  ✅  Banner disappears automatically when connectivity is restored
 *  ✅  Submit button re-enables once back online
 *
 * Simulates offline mode via Playwright's `context.setOffline(true)`, which
 * flips `navigator.onLine` to `false` and fires the `offline`/`online`
 * window events the app listens to (see useNetworkStatus).
 */

const WALLET_ADDRESS = "GTESTWALLETADDRESS1234567890ABCDEFGH1234567890";

test.describe("offline form submission behaviour (E2E) — #535", () => {
  test("disables the collateral registration submit button while offline and re-enables it when back online", async ({
    page,
    context,
  }) => {
    await page.addInitScript(
      ({ walletAddress }) => {
        window.__STELLARKRAAL_E2E__ = {
          async isConnected() {
            return { isConnected: true };
          },
          async isAllowed() {
            return { isAllowed: true };
          },
          async setAllowed() {
            return { isAllowed: true };
          },
          async getAddress() {
            return { address: walletAddress };
          },
          async signTransaction(xdr: string) {
            return { signedTxXdr: `${xdr}-signed` };
          },
          async submitSignedXdr() {
            return "mock-tx-hash";
          },
        };
      },
      { walletAddress: WALLET_ADDRESS }
    );

    await page.route("**/api/loans", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    );
    await page.route("**/api/transactions**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      })
    );
    await page.route("**/api/health/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ health_factor: 1.5 }),
      })
    );

    await page.goto("/borrow");
    await page.getByRole("button", { name: /connect freighter wallet/i }).click();
    await expect(page.getByText(WALLET_ADDRESS.slice(0, 8))).toBeVisible();

    const submitButton = page.getByRole("button", { name: /register collateral/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    // No offline banner while online.
    await expect(page.getByRole("alert").filter({ hasText: /you are offline/i })).toHaveCount(0);

    // ── Go offline ────────────────────────────────────────────────────────────
    await context.setOffline(true);

    await expect(page.getByRole("alert").filter({ hasText: /you are offline/i })).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // ── Back online ───────────────────────────────────────────────────────────
    await context.setOffline(false);

    await expect(page.getByRole("alert").filter({ hasText: /you are offline/i })).toHaveCount(0);
    await expect(submitButton).toBeEnabled();
  });
});
