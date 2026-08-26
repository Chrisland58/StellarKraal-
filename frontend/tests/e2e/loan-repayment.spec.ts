import { test, expect } from "@playwright/test";

/**
 * E2E: Loan Repayment Flow  (#565)
 *
 * Acceptance criteria:
 *  ✅  Test mocks Freighter wallet API responses
 *  ✅  Test navigates to an active loan and submits a repayment
 *  ✅  Test asserts the loan status changes to Repaid
 *  ✅  Test covers the error case where the transaction is rejected
 *  ✅  Test runs in CI without a real wallet extension
 *
 * Approach:
 *  - All wallet interaction is mocked via window.__STELLARKRAAL_E2E__
 *    (same convention as wallet-collateral-loan.spec.ts)
 *  - All backend HTTP calls are intercepted with page.route
 *  - No real wallet extension or running backend is required
 */

const WALLET_ADDRESS = "GTESTWALLETADDRESS1234567890ABCDEFGH1234567890";
const LOAN_ID = "1";

const ORIGINAL_OUTSTANDING = 200_000;
const REPAY_AMOUNT = 50_000;
const UPDATED_OUTSTANDING = ORIGINAL_OUTSTANDING - REPAY_AMOUNT;

// ── Shared wallet-injection helper ────────────────────────────────────────────

/** Injects a fully-mocked Freighter-compatible wallet bridge into the page. */
async function injectMockWallet(
  page: Parameters<typeof test>[1] extends { page: infer P } ? P : never,
  opts: { rejectSign?: boolean } = {}
) {
  await page.addInitScript(
    ({ walletAddress, rejectSign }) => {
      const state = { signCalls: 0, submitCalls: 0 };

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
          state.signCalls += 1;
          (window as Record<string, unknown>).__STELLARKRAAL_E2E_STATE__ = state;

          if (rejectSign) {
            throw new Error("User declined to sign the transaction.");
          }

          return { signedTxXdr: `${xdr}-signed` };
        },
        async submitSignedXdr() {
          state.submitCalls += 1;
          (window as Record<string, unknown>).__STELLARKRAAL_E2E_STATE__ = state;
          return "mock-tx-hash-repayment-1";
        },
      };
    },
    { walletAddress: WALLET_ADDRESS, rejectSign: opts.rejectSign ?? false }
  );
}

// ── Shared route-mock helper ──────────────────────────────────────────────────

/**
 * Sets up API route mocks.
 *
 * @param loanRef  - Object reference so mutations inside the handler are
 *                   visible to subsequent requests (simulates a live backend).
 */
async function setupRouteMocks(
  page: Parameters<typeof test>[1] extends { page: infer P } ? P : never,
  loanRef: {
    id: string;
    borrower: string;
    status: "active" | "repaid" | string;
    outstandingBalance: number;
    createdAt: string;
  }
) {
  // Health factor — keep wallet/UI unblocked
  await page.route("**/api/health/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ health_factor: 1.8 }),
    })
  );

  // Transactions sidebar / recent history
  await page.route("**/api/transactions**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    })
  );

  // Loan list (used when navigating to /loans)
  await page.route("**/api/loans", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([loanRef]),
    })
  );

  // Loan detail (GET /api/loans/:id  or  /api/loan/:id)
  // We match both common patterns and return the current state of loanRef.
  await page.route("**/api/loans/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(loanRef),
    })
  );

  // Repayment history timeline
  await page.route("**/api/loans/**/repayments**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    })
  );

  // Repayment initiation — returns the XDR envelope the wallet must sign
  await page.route("**/api/loan/repay**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ xdr: "mock-repayment-xdr" }),
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("loan repayment flow (E2E) — #565", () => {
  // ── Happy path ──────────────────────────────────────────────────────────────
  test("navigates to active loan, submits repayment, wallet signs, loan shows updated balance", async ({
    page,
  }) => {
    // In-memory loan state — mutated after repayment to simulate backend update
    const loan = {
      id: LOAN_ID,
      borrower: WALLET_ADDRESS,
      status: "active" as const,
      outstandingBalance: ORIGINAL_OUTSTANDING,
      createdAt: new Date("2026-05-26T00:00:00Z").toISOString(),
    };

    await injectMockWallet(page);
    await setupRouteMocks(page, loan);

    // ── Navigate to active loan detail ────────────────────────────────────────
    await page.goto(`/loans/${LOAN_ID}`);

    // Loan #1 heading should be visible
    await expect(
      page.getByText(new RegExp(`Loan\\s*#?${LOAN_ID}`, "i"))
    ).toBeVisible();

    // Status badge should read "active"
    await expect(page.getByText(/active/i)).toBeVisible();

    // Outstanding balance should be present
    await expect(
      page.getByText(new RegExp(String(ORIGINAL_OUTSTANDING), "i"))
    ).toBeVisible();

    // ── Initiate repayment ────────────────────────────────────────────────────
    const repayButton = page.getByRole("button", { name: /repay/i });
    await expect(repayButton).toBeVisible();
    await repayButton.click();

    // Confirmation modal should appear
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/repay/i)).toBeVisible();

    // Fill amount if the modal exposes an amount input
    const amountInput = modal
      .getByPlaceholder(/amount/i)
      .or(modal.getByLabel(/amount/i));
    if ((await amountInput.count()) > 0) {
      await amountInput.first().fill(String(REPAY_AMOUNT));
    }

    // ── Confirm and sign ──────────────────────────────────────────────────────
    const confirmBtn = modal
      .getByRole("button", { name: /confirm/i })
      .or(modal.getByRole("button", { name: /repay/i }));
    await expect(confirmBtn.first()).toBeVisible();

    // Simulate backend state change before confirm so re-fetched loan is "repaid"
    loan.outstandingBalance = UPDATED_OUTSTANDING;
    loan.status = "repaid";

    await confirmBtn.first().click();

    // Wallet signTransaction must have been called
    await expect
      .poll(
        async () =>
          page.evaluate(
            () =>
              (
                window as unknown as {
                  __STELLARKRAAL_E2E_STATE__?: { signCalls: number };
                }
              ).__STELLARKRAAL_E2E_STATE__?.signCalls ?? 0
          ),
        { timeout: 10_000 }
      )
      .toBeGreaterThan(0);

    // submitSignedXdr must have been called
    await expect
      .poll(
        async () =>
          page.evaluate(
            () =>
              (
                window as unknown as {
                  __STELLARKRAAL_E2E_STATE__?: { submitCalls: number };
                }
              ).__STELLARKRAAL_E2E_STATE__?.submitCalls ?? 0
          ),
        { timeout: 10_000 }
      )
      .toBeGreaterThan(0);

    // Modal should close after successful submission
    await expect(modal).toBeHidden({ timeout: 15_000 });

    // ── Assert loan status changes to "Repaid" ────────────────────────────────
    await expect
      .poll(
        async () => {
          const bodyText = await page.locator("body").innerText();
          // Accept common capitalisation variants: "Repaid", "repaid", "REPAID"
          return /repaid/i.test(bodyText);
        },
        { timeout: 15_000 }
      )
      .toBeTruthy();

    // ── Assert updated outstanding balance ────────────────────────────────────
    await expect
      .poll(
        async () => {
          const bodyText = await page.locator("body").innerText();
          return bodyText.includes(String(UPDATED_OUTSTANDING));
        },
        { timeout: 15_000 }
      )
      .toBeTruthy();
  });

  // ── Error case: wallet rejects the transaction ──────────────────────────────
  test("shows error when user rejects the transaction in the wallet", async ({
    page,
  }) => {
    const loan = {
      id: LOAN_ID,
      borrower: WALLET_ADDRESS,
      status: "active" as const,
      outstandingBalance: ORIGINAL_OUTSTANDING,
      createdAt: new Date("2026-05-26T00:00:00Z").toISOString(),
    };

    // Wallet configured to throw on signTransaction (user clicked "Reject")
    await injectMockWallet(page, { rejectSign: true });
    await setupRouteMocks(page, loan);

    await page.goto(`/loans/${LOAN_ID}`);

    // Wait for the page to load
    await expect(
      page.getByText(new RegExp(`Loan\\s*#?${LOAN_ID}`, "i"))
    ).toBeVisible();

    // Click "Repay" to open modal
    const repayButton = page.getByRole("button", { name: /repay/i });
    await expect(repayButton).toBeVisible();
    await repayButton.click();

    // Confirm the repayment — this will invoke signTransaction which will throw
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    const confirmBtn = modal
      .getByRole("button", { name: /confirm/i })
      .or(modal.getByRole("button", { name: /repay/i }));
    await confirmBtn.first().click();

    // The UI must show an error message — accept common patterns:
    // "rejected", "declined", "failed", "error", "cancelled"
    await expect
      .poll(
        async () => {
          const bodyText = await page.locator("body").innerText();
          return /rejected|declined|failed|error|cancelled/i.test(bodyText);
        },
        { timeout: 15_000 }
      )
      .toBeTruthy();

    // Loan status must NOT have changed to "repaid"
    const bodyText = await page.locator("body").innerText();
    expect(/repaid/i.test(bodyText)).toBeFalsy();
  });
});
