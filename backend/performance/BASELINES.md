# Performance Baselines

This document defines the baseline p99 response times for critical API endpoints.
These baselines are used by CI to detect performance regressions.

## Baseline Response Times (p99)

| Endpoint | Method | Baseline p99 (ms) | Regression Threshold (+20%) | Description |
|----------|--------|-------------------|----------------------------|-------------|
| `/api/v1/loans` | GET | 50 | 60 | Retrieve loan listings |
| `/api/v1/collateral` | GET | 50 | 60 | Retrieve collateral listings |
| `/api/v1/loans` | POST | 100 | 120 | Request a new loan |

## Test Configuration

- **Concurrent Users**: 50
- **Test Duration**: 30 seconds
- **Primary Metric**: p99 latency
- **Failure Threshold**: 20% increase over baseline p99

## CI Integration

The benchmark comparison CI step runs on every pull request against `main`.
The build **fails** if any endpoint's p99 latency exceeds the baseline by more
than 20%.

Results are reported as a GitHub Actions step summary with a diff table showing
current vs baseline values and the percentage change.

## Updating Baselines

Baselines can be updated by pushing to the special branch `update-benchmarks`.
This triggers a CI workflow that:

1. Runs the full benchmark suite
2. Generates new baseline values from the results
3. Updates this file with the measured p99 values
4. Commits and pushes the updated baselines

To manually update baselines:

1. Run benchmarks locally: `node performance/benchmarks.js`
2. Review the output `benchmark-results.json`
3. Update the p99 values in the table above
4. Update the corresponding values in `performance/benchmarks.js`
5. Commit changes to the `update-benchmarks` branch

## Interpreting Results

- **p50 (median)**: Half of requests complete faster than this
- **p75**: 75% of requests complete faster than this
- **p90**: 90% of requests complete faster than this
- **p95**: 95% of requests complete faster than this
- **p99**: 99% of requests complete faster than this (**primary CI metric**)
- **max**: Slowest request in the test

We use p99 as the primary metric because it captures tail latency that affects
the worst-off users, providing a stricter quality gate than p95.
