# Testing Strategy

This document describes the overall testing approach for StellarKraal, covering unit tests, integration tests, end-to-end tests, and contract (smart contract) tests. It reflects the actual test files and CI configuration in the repository.

---

## Test Layers

### Unit Tests

**Pattern:** `*.test.ts` (excluding `*.integration.test.ts`)  
**Runner:** Jest + ts-jest  
**Location:** `backend/src/`

Unit tests cover individual modules in isolation using mocks for external dependencies (database, logger, Stellar SDK). They run fast and are the primary coverage gate.

Examples:
- `src/interestRate.test.ts` — interest rate calculation logic
- `src/loanStateMachine.test.ts` — loan state transition rules
- `src/middleware/auth.test.ts` — JWT middleware and auth routes
- `src/jobs/healthFactorJob.test.ts` — cron job health factor logic
- `src/db/database.sql-injection.test.ts` — parameterised query hardening

**Coverage thresholds** (enforced in CI):

| Metric | Threshold |
|--------|-----------|
| Lines | 70% |
| Functions | 70% |
| Branches | 70% |
| Statements | 70% |

Run locally:
```bash
cd backend
npm test                  # all unit tests
npm run test:coverage     # with coverage report (integration tests excluded)
```

---

### Integration Tests

**Pattern:** `*.integration.test.ts`  
**Runner:** Jest (`--runInBand` to prevent parallel DB conflicts)  
**Location:** `backend/src/`

Integration tests exercise full request/response cycles through Express using `supertest`. They use a real in-process SQLite database (seeded fresh per suite) and stub out only the Stellar RPC network.

Examples:
- `src/loan-lifecycle.integration.test.ts` — originate → repay → close lifecycle
- `src/loan-lifecycle-full.integration.test.ts` — full lifecycle including liquidation
- `src/collateral.integration.test.ts` — collateral CRUD and ownership
- `src/collateral.appraisals.integration.test.ts` — appraisal submission and cache
- `src/admin.liquidation.integration.test.ts` — admin liquidation endpoints
- `src/deduplication.integration.test.ts` — idempotency key deduplication

Run locally:
```bash
cd backend
npx jest --runInBand --testMatch="**/*.integration.test.ts"
```

---

### Smart Contract Tests

**Language:** Rust  
**Framework:** Soroban test harness (native)  
**Location:** `contracts/stellarkraal/`

Contract tests run against the Soroban test environment without deploying to a network. They cover:
- Collateral registration, appraisal submission, oracle price aggregation
- Loan origination, repayment, and liquidation eligibility
- TWAP calculation and staleness guards
- Access control (admin-only operations)

Run locally (requires Rust + wasm32 target):
```bash
cargo test --manifest-path contracts/stellarkraal/Cargo.toml
```

---

### End-to-End Tests

**Location:** `__tests__/`, `tests/`  
**Framework:** Varies by suite (see individual test files)

E2E tests validate full stack behaviour across the frontend, backend, and contract layer. They are run against a test environment (see `docker-compose.test.yml`).

---

### Benchmark / Performance Tests

**Location:** `backend/src/benchmarkComparison.test.ts`, `backend/performance/`

Performance regression tests run via Jest and compare against baselines documented in `backend/performance/BASELINES.md`. See `docs/PERFORMANCE_BENCHMARKS.md` for thresholds.

---

## Naming Convention

| Test type | File suffix | Example |
|-----------|-------------|---------|
| Unit | `.test.ts` | `interestRate.test.ts` |
| Integration | `.integration.test.ts` | `loan-lifecycle.integration.test.ts` |
| Benchmark (Jest) | `.test.ts` | `benchmarkComparison.test.ts` |

New test files must follow the suffix convention of their neighbouring files.

---

## Test Environment

The test environment is configured via `backend/src/jest.setup.ts` and the `jest` section of `backend/package.json`.

Key settings:
- `testEnvironment: "node"`
- `preset: "ts-jest"` with TypeScript diagnostics disabled for test speed
- `setupFiles: ["./src/jest.setup.ts"]`
- `--forceExit` to prevent hanging after async tests

Environment variables for integration tests (see `docker-compose.test.yml`):
```
NODE_ENV=test
JWT_SECRET=change-me-to-a-strong-jwt-secret-min-32-chars
APPRAISAL_CACHE_TTL_MS=300000
```

---

## CI / GitHub Actions

### Backend CI (`backend-ci.yml`)

Triggered on push/PR to `main` for changes under `backend/` or the workflow file itself.

Steps:
1. Install dependencies (`npm ci`)
2. Lint (`npm run lint` — zero warnings enforced)
3. Compile TypeScript (`npm run build`)
4. Run unit tests (`npm test`)
5. Generate and validate Prometheus alert rules

### Integration Tests (`integration-tests.yml`)

Triggered on push/PR to `main`.

Steps:
1. Install dependencies
2. Run integration tests (`jest --runInBand --testMatch="**/*.integration.test.ts" --testTimeout=60000`)
3. Annotate PR with failed test names and messages
4. Upload coverage artifact

All tests must pass in CI before merging. The integration test workflow uploads results as a JSON artifact to `backend/coverage/`.

---

## Writing Tests

**Unit tests** should:
- Mock external dependencies (database, logger, Stellar SDK) using `jest.mock`
- Cover edge cases and error branches, not just happy paths
- Assert on observable behaviour (return values, side effects, error messages) — not on implementation internals

**Integration tests** should:
- Use `supertest` to make real HTTP requests through the Express app
- Reset shared state (database, in-memory stores) in `beforeEach`/`afterEach`
- Test the full HTTP contract: status codes, response bodies, headers

**Assertions** should verify behaviour, not just that a function ran without throwing. Prefer `expect(result).toBe(expected)` over `expect(fn).not.toThrow()` alone.

---

## Fuzzing

See [`docs/testing/fuzzing.md`](./testing/fuzzing.md) for the property-based and fuzz testing strategy applied to input validation and business logic edge cases.

---

## Related Docs

- [`backend/performance/README.md`](../backend/performance/README.md) — benchmark setup
- [`docs/PERFORMANCE_BENCHMARKS.md`](./PERFORMANCE_BENCHMARKS.md) — baseline thresholds
- [`docs/testing/fuzzing.md`](./testing/fuzzing.md) — fuzz testing
- [`.github/workflows/backend-ci.yml`](../.github/workflows/backend-ci.yml)
- [`.github/workflows/integration-tests.yml`](../.github/workflows/integration-tests.yml)
