# Test Coverage Requirements

This document defines the minimum test coverage thresholds for each module in the StellarKraal
project, explains what is excluded from measurement, and describes how coverage is enforced in CI.

---

## Minimum Coverage Thresholds

| Module | Lines | Functions | Branches | Statements |
|--------|-------|-----------|----------|------------|
| **Backend** (`backend/src/`) | 80% | 80% | 80% | 80% |
| **Frontend** (`frontend/src/`) | 70% | 70% | 70% | 70% |
| **Smart contract** (`contracts/stellarkraal/src/`) | 90% | 90% | 90% | 90% |

> **Note:** The backend `package.json` currently enforces 70% as the CI gate. The 80% target
> is the aspirational goal for new code and will be raised in the next milestone once the
> in-progress integration test suite is complete. Any PR that **reduces** coverage below its
> current measured value should be rejected.

### Rationale

- **Backend (80%):** The Express API handles financial logic (loan origination, fee calculation,
  liquidation). Higher coverage catches regressions in business-critical paths.
- **Frontend (70%):** UI components are tested with React Testing Library. Some presentational
  components and responsive layout code are inherently harder to unit-test; 70% balances
  confidence with pragmatism.
- **Smart contract (90%):** On-chain logic is immutable once deployed. A missed branch in the
  Rust/Soroban contract can result in locked funds or protocol insolvency. Near-complete
  coverage is required before any deployment.

---

## What Is Excluded from Coverage

### Backend

The following paths are excluded from Jest coverage collection (see `collectCoverageFrom` in
`backend/package.json`):

| Pattern | Reason |
|---------|--------|
| `src/**/*.test.ts` | Test files do not need to cover themselves. |
| `src/**/*.integration.test.ts` | Integration tests excluded from the unit-coverage gate (they run separately). |
| `src/**/*.d.ts` | TypeScript declaration files contain no executable code. |
| `src/benchmark.js` | Performance benchmark script; not part of application logic. |

Additional exclusions that are reasonable to add to `collectCoverageFrom` as the project grows:

- Generated migration files (`src/db/migrations/**`)
- Auto-generated OpenAPI boilerplate

### Frontend

Jest is configured in `frontend/package.json`. Recommended exclusions:

| Pattern | Reason |
|---------|--------|
| `src/**/*.test.{ts,tsx}` | Test files. |
| `src/**/*.stories.{ts,tsx}` | Storybook story files (if added in future). |
| `src/app/layout.tsx`, `src/app/page.tsx` | Root Next.js layout/page files are integration-tested via Playwright, not unit-tested. |
| `src/**/*.d.ts` | Type declarations. |

### Smart Contract

`cargo test` with `llvm-cov` (or `cargo-tarpaulin`) excludes:

| Pattern | Reason |
|---------|--------|
| `#[cfg(test)] mod tests` | The test module itself is not counted. |
| `fuzz/` targets | Fuzz targets are exercised separately via `cargo fuzz`. |
| `test_snapshots/` | Snapshot fixtures, not production code. |

---

## How Coverage Is Measured

### Backend

```bash
# Run from backend/
npm run test:coverage
```

This runs Jest with `--coverage` and the `collectCoverageFrom` and `coverageThreshold` settings
in `backend/package.json`. The report is written to `backend/coverage/`.

Integration tests are excluded from the unit-coverage gate by the
`--testPathIgnorePatterns=integration.test.ts` flag in the `test:coverage` script. They still
run under `npm test` (the default script used in CI).

### Frontend

```bash
# Run from frontend/
npm run test:coverage   # or: npx jest --coverage
```

Coverage is collected from `src/**/*.{ts,tsx}` excluding test files. The report is written to
`frontend/coverage/`.

### Smart Contract

```bash
# Run from contracts/stellarkraal/
cargo test
```

For line/branch coverage reporting, use `cargo-llvm-cov`:

```bash
cargo llvm-cov --all-features --workspace --lcov --output-path lcov.info
```

The CI `contracts-ci.yml` workflow runs `cargo test` and fails the build if any test fails.
Coverage reporting via `llvm-cov` is run separately in the `rust-ci.yml` workflow.

---

## How Coverage Is Enforced in CI

### Backend CI (`.github/workflows/backend-ci.yml`)

1. Runs `npm test` (all tests including integration tests).
2. Runs `npm run test:coverage` to generate the coverage report.
3. Jest enforces `coverageThreshold` — the build **fails** if any metric falls below the
   configured minimum. The failure message names the specific metric and the shortfall.

### Frontend CI (`.github/workflows/frontend-ci.yml`)

1. Runs `npm test -- --coverage` as part of the build step.
2. Coverage thresholds are enforced via Jest configuration in `frontend/package.json`.

### Contract CI (`.github/workflows/contracts-ci.yml` and `rust-ci.yml`)

1. `cargo test` must pass with zero failures.
2. `cargo clippy -- -D warnings` enforces linting.
3. Coverage is measured with `cargo-llvm-cov` in a separate step; the 90% threshold is checked
   in that step.

---

## Writing Good Tests

Coverage percentage is a floor, not a goal. When adding tests, aim for meaningful assertions:

- **Verify behaviour, not execution.** Assert on return values, side-effects, and emitted events
  — not merely that a function was called.
- **Test error paths.** Missing branch coverage often means unhappy paths (invalid input, missing
  records, auth failures) are untested.
- **Keep tests independent.** Each test should set up its own state and not rely on test
  execution order.
- **Use factories and fixtures.** Reuse `tests/fixtures.ts` (backend) rather than duplicating
  setup boilerplate.

### Naming convention

| Layer | Convention | Example |
|-------|-----------|---------|
| Backend unit | `*.test.ts` | `webhooks.test.ts` |
| Backend integration | `*.integration.test.ts` | `loan-lifecycle.integration.test.ts` |
| Frontend component | `*.test.tsx` | `LoanCard.test.tsx` |
| Contract | `#[test]` in `src/tests.rs` | `fn test_request_loan_success()` |

---

## Related Documents

- [Fuzzing Guide](fuzzing.md) — property-based and fuzz testing for the smart contract
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — general contribution guidelines
- [Smart Contract Interface](../contracts/stellarkraal-interface.md) — contract ABI for
  integration test reference
