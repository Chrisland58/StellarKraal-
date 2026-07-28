# E2E Testing Guide

This guide explains how to run end-to-end (E2E) tests for the StellarKraal frontend locally using Playwright.

## Overview

The E2E tests are located in `frontend/tests/e2e/` and use [Playwright](https://playwright.dev/) to automate browser interactions. They test critical user journeys like connecting a wallet, registering collateral, and requesting loans.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or equivalent package manager
3. **Frontend dependencies installed** — run `cd frontend && npm install` from the project root

## Installing Playwright

Playwright is already listed as a dev dependency in `frontend/package.json`. To ensure it's installed:

```bash
cd frontend
npm install
```

To install browser binaries (required only once):

```bash
npx playwright install
```

## Configuration

Playwright configuration is defined in `frontend/playwright.e2e.config.ts`. Key settings:

- **Base URL**: `http://localhost:3000` (default) or override with `PLAYWRIGHT_BASE_URL` env var
- **Browser**: Chromium (Desktop Chrome configuration)
- **Test directory**: `frontend/tests/e2e/`
- **Reporter**: HTML reports in `playwright-report/e2e/` and JSON in `test-results/e2e-results.json`
- **Trace capture**: Enabled on first retry for debugging failures
- **Web server**: Playwright automatically starts `npm run dev` unless `PLAYWRIGHT_EXTERNAL_SERVER=1` is set

## Running Tests

### Run all E2E tests

```bash
cd frontend
npm run test:e2e
```

This command:
1. Starts the Next.js dev server at `http://localhost:3000`
2. Launches Chromium browser
3. Executes all tests in `tests/e2e/`
4. Generates an HTML report in `playwright-report/e2e/`

### Run a specific test file

```bash
cd frontend
npx playwright test -c playwright.e2e.config.ts tests/e2e/wallet-collateral-loan.spec.ts
```

### Run tests in headed mode (see browser)

```bash
cd frontend
npx playwright test -c playwright.e2e.config.ts --headed
```

This launches the browser visibly so you can watch the test execution.

### Run tests in debug mode

```bash
cd frontend
npx playwright test -c playwright.e2e.config.ts --debug
```

This opens Playwright Inspector, allowing you to step through tests line-by-line.

### Run tests with external server

If the dev server is already running (e.g., `npm run dev` in another terminal):

```bash
cd frontend
PLAYWRIGHT_EXTERNAL_SERVER=1 npm run test:e2e
```

This prevents Playwright from starting a duplicate server.

## Understanding Freighter Wallet Mocking

StellarKraal tests mock the Freighter wallet to avoid requiring a real wallet connection. The mock is injected via `page.addInitScript()` in each test.

### How it works

```typescript
await page.addInitScript(
  ({ walletAddress }) => {
    window.__STELLARKRAAL_E2E__ = {
      async isConnected() {
        return { isConnected: true };
      },
      async getAddress() {
        return { address: walletAddress };
      },
      async signTransaction(xdr: string) {
        return { signedTxXdr: `${xdr}-signed` };
      },
      // ... more methods
    };
  },
  { walletAddress: "GTESTWALLETADDRESS..." }
);
```

The mock object is injected into `window.__STELLARKRAAL_E2E__` before the application loads. The frontend checks for this object during development/testing and uses it instead of the real Freighter API.

### Mocking API responses

Tests also mock backend API calls using `page.route()`:

```typescript
await page.route("**/api/v1/collateral/register", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ xdr: "mock-collateral-xdr" }),
  });
});
```

This prevents tests from hitting the real backend and ensures reproducible results.

## Viewing Test Traces on Failure

Playwright captures traces automatically on test failure (first retry only). To inspect a trace:

1. After a test fails, look for `trace.zip` in the test results
2. Open the trace viewer:
   ```bash
   cd frontend
   npx playwright show-trace path/to/trace.zip
   ```

The trace viewer lets you:
- Step through each action (click, type, navigation)
- View the DOM tree at each step
- Inspect network requests
- See screenshots from each step

## HTML Report

After tests complete, open the HTML report:

```bash
cd frontend
npx playwright show-report
```

This opens an interactive report showing:
- Test results (passed/failed)
- Timeline and duration
- Screenshots from each step
- Error messages and stack traces

## CI Integration

In CI environments (GitHub Actions), tests run with:

- `retries: 2` — automatic retry on flaky failures
- `workers: 1` — sequential execution for consistency
- `forbidOnly: true` — `.only()` tests not allowed

Playwright reports are automatically uploaded as artifacts in the CI workflow.

## Troubleshooting

### Tests fail with "port 3000 already in use"

The dev server is already running or crashed without cleaning up the port.

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use external server mode
PLAYWRIGHT_EXTERNAL_SERVER=1 npm run test:e2e
```

### Wallet mock not detected

If tests fail because the wallet isn't mocked, ensure:
1. The frontend code checks for `window.__STELLARKRAAL_E2E__`
2. `page.addInitScript()` runs **before** navigating to the app
3. No JavaScript errors prevent the injection

**Solution:**
```bash
npx playwright test --debug  # Step through and inspect window object
```

### Tests hang or timeout

Tests have a default 30-second timeout. Long operations may exceed this.

**Solution:**
```typescript
// In your test
test("my test", async ({ page }) => {
  test.setTimeout(60_000); // Increase timeout to 60s
  // ... test code
});
```

### Screenshot or trace files not generated

Ensure Playwright is configured to capture these. Check `playwright.e2e.config.ts`:

```typescript
use: {
  trace: "on-first-retry",  // Capture traces on first retry
  screenshot: "only-on-failure", // Capture screenshots on failure
}
```

## Writing New E2E Tests

### Template

```typescript
import { test, expect } from "@playwright/test";

const WALLET_ADDRESS = "GTESTWALLETADDRESS...";

test("test description", async ({ page }) => {
  // Mock wallet
  await page.addInitScript(
    ({ walletAddress }) => {
      window.__STELLARKRAAL_E2E__ = {
        async getAddress() {
          return { address: walletAddress };
        },
        // ... other methods
      };
    },
    { walletAddress: WALLET_ADDRESS }
  );

  // Mock API responses
  await page.route("**/api/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ /* response */ }),
    });
  });

  // Navigate and interact
  await page.goto("/");
  await page.click("button:has-text('Connect Wallet')");
  await expect(page).toHaveURL("/dashboard");
});
```

### Best practices

- **Use `page.goto()` to navigate** — ensures clean state
- **Mock all external APIs** — tests must be isolated and reproducible
- **Use semantic selectors** — prefer `button:has-text()` over CSS classes
- **Assert on user-visible elements** — avoid testing implementation details
- **Keep tests focused** — one journey per test

## Related Documentation

- [Playwright documentation](https://playwright.dev/)
- [Design tokens guide](../guides/design-tokens.md) — for styling considerations
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — general contribution guidelines
