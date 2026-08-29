# Load Testing Against a Live Environment

`docs/PERFORMANCE_BENCHMARKS.md` covers on-chain CPU-budget benchmarks for the smart
contract. This guide covers load testing the running backend/frontend stack (e.g.
staging) instead of the contract in isolation.

## Prerequisites

- A deployed target environment (staging URL) — see `STAGING.md`.
- A load testing tool such as [k6](https://k6.io/) or [Artillery](https://www.artillery.io/).
  Install it locally per that tool's own docs; do not add it as a project dependency.
- Valid staging credentials/test accounts that will not affect production data.

## What to test

- **Read paths**: loan listing, FAQ, health factor lookups — safe to run at higher RPS.
- **Write paths**: loan request, repayment, collateral registration — run at low
  concurrency against staging only, never production, since these mutate on-chain and
  database state.

## Running a basic k6 script

```bash
k6 run --vus 20 --duration 30s load-test.js
```

Where `load-test.js` targets the staging base URL (from `STAGING.md`) and exercises the
endpoints you want to measure, e.g.:

```js
import http from 'k6/http';

export default function () {
  http.get('https://<staging-host>/api/loans');
}
```

## Metrics to capture

- p50/p95/p99 response latency per endpoint.
- Error rate (non-2xx responses).
- Backend CPU/memory during the run (via existing observability dashboards, see
  `docs/observability.md`).
- Database connection/pool saturation, if applicable.

## Reporting results

- Record the run configuration (VUs, duration, target environment, date) alongside the
  results.
- Compare against previous runs to catch regressions.
- File a follow-up issue if p95 latency or error rate regresses beyond acceptable
  thresholds, referencing the run data.

## Safety notes

- Never run write-path load tests against production.
- Coordinate with whoever owns the staging environment before a large run so it isn't
  mistaken for an incident.
