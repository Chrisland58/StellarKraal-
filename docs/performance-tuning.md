# Performance Tuning Guide

This guide covers the knobs available to improve API throughput and latency beyond what the defaults provide. Read [performance/README.md](../backend/performance/README.md) first to understand how baselines and benchmarks work.

---

## Current Baselines (p99)

| Endpoint | Baseline | Regression threshold (+20%) |
|----------|----------|-----------------------------|
| `GET /api/v1/loans` | 50 ms | 60 ms |
| `GET /api/v1/collateral` | 50 ms | 60 ms |
| `POST /api/v1/loans` | 100 ms | 120 ms |

Benchmarks run 50 concurrent connections for 30 seconds. CI fails if p99 exceeds the threshold.

---

## Environment Variables

All performance-related env vars have sensible defaults. Override them in `.env` or your deployment config.

### Connection Pool

| Variable | Default | Description |
|----------|---------|-------------|
| `POOL_MIN` | `2` | Minimum number of kept-alive SQLite connections |
| `POOL_MAX` | `10` | Maximum concurrent connections before callers queue |

Increase `POOL_MAX` if you see connection wait times under sustained load. Keep it proportional to the CPU count of the host — SQLite is not parallel-safe for writes, so very large pools don't help for write-heavy workloads.

### Request Timeouts

| Variable | Default | Applies to |
|----------|---------|-----------|
| `TIMEOUT_GLOBAL_MS` | `10000` | All routes (global middleware) |
| `TIMEOUT_WRITE_MS` | `15000` | Write/mutation routes |
| `TIMEOUT_CONTRACT_MS` | `30000` | Soroban contract submission routes |

Lowering `TIMEOUT_GLOBAL_MS` improves tail-latency under overload by shedding slow requests early, but may cause false timeouts when the DB or RPC is under brief load spikes. Don't go below 2000 ms.

The contract timeout is deliberately long because transaction preparation and Soroban simulation can be slow (network round-trips, XDR serialisation). Reduce it only if your RPC endpoint is co-located.

### Rate Limits

| Variable | Default | Applies to |
|----------|---------|-----------|
| `RATE_LIMIT_GLOBAL` | `60` | All routes (requests/min/IP) |
| `RATE_LIMIT_AUTH` | `10` | Auth routes |
| `RATE_LIMIT_READ` | `100` | Read (GET) routes |
| `RATE_LIMIT_WRITE` | `10` | Write (POST/PUT/DELETE) routes |

Rate limits protect the API from individual abusive clients. They are not a substitute for capacity planning — if legitimate traffic consistently hits these limits, scale the service instead of raising the limits.

### Appraisal Cache

| Variable | Default | Description |
|----------|---------|-------------|
| `APPRAISAL_CACHE_TTL_MS` | `300000` | Time-to-live for cached collateral appraisal values (5 min) |

Appraisals are cached in-process to avoid redundant DB reads on every loan request. Increase the TTL if appraisal values change infrequently and reads are a bottleneck. Decrease it (or invalidate explicitly via `invalidateAll()`) when fresh values are required.

---

## Database Tuning

StellarKraal uses SQLite via a connection pool (`backend/src/utils/connectionPool.ts`).

### WAL Mode

Ensure the database file is in WAL (Write-Ahead Logging) mode for better read/write concurrency:

```sql
PRAGMA journal_mode=WAL;
```

This is applied automatically by the migration runner in development. Verify it in production with:

```bash
sqlite3 backend/dev.sqlite3 "PRAGMA journal_mode;"
# expected: wal
```

### Indexes

The migration `002_add_query_indexes.sql` adds indexes on the most common filter columns. If you add new filterable columns, add a corresponding index rather than relying on full-table scans.

### PostgreSQL (Production)

Set `DATABASE_URL` to a `postgres://` or `postgresql://` connection string to switch from SQLite to PostgreSQL. PostgreSQL handles concurrent writes better and is recommended for production.

With PostgreSQL, tune the connection pool (`POOL_MIN`/`POOL_MAX`) to stay within your database's `max_connections` limit. A pool of 10–20 is typical for a single-node backend.

---

## Response Caching

GET routes for `/api/loans` and `/api/collateral` use an in-process response cache (`backend/src/utils/responseCache.ts`). Cached responses bypass DB reads entirely.

The cache is invalidated automatically on write operations. If you have multiple backend instances behind a load balancer, each instance has its own cache — consider a shared cache (Redis) if stale reads across instances are a concern.

---

## Compression

The `compressionMiddleware` (`backend/src/middleware/compression.ts`) gzip-compresses responses above a threshold. It is applied globally. Ensure your reverse proxy or CDN does not decompress and re-compress responses, which would waste CPU.

---

## Graceful Shutdown

`SHUTDOWN_TIMEOUT_MS` (default 10 000 ms) controls how long the server waits for in-flight requests to finish before forcing exit. Under high concurrency, increase this to avoid cutting off slow contract submissions mid-flight.

---

## Identifying Bottlenecks

### 1. Run the benchmark suite

```bash
cd backend
npm run perf:test
```

Results land in `benchmark-results.json`. Compare p99 against baselines.

### 2. Check the Grafana dashboards

Grafana runs at `http://localhost:3200`. The backend dashboard shows:

- Request rate and error rate per route
- p50 / p95 / p99 latency histograms
- Active connections
- DB pool utilisation

### 3. Query Loki for slow requests

```
{job="backend"} | json | duration > 500
```

### 4. Profile the Node.js process

```bash
# Attach the built-in profiler
node --prof dist/index.js

# Convert the isolate log to readable output
node --prof-process isolate-*.log > profile.txt
```

Look for hot functions in the flamegraph. Common culprits: XDR serialisation, synchronous DB reads, and JSON stringify on large payloads.

---

## Updating Baselines

After a genuine performance improvement (not a regression), update the baselines so CI stays meaningful:

1. Run `npm run perf:test` and note the new p99 values.
2. Update `BASELINES` in `backend/performance/benchmarks.js`.
3. Update the table in `backend/performance/BASELINES.md`.
4. Commit with a message explaining why the baseline changed.

---

## Related

- [Benchmark README](../backend/performance/README.md)
- [Baselines](../backend/performance/BASELINES.md)
- [Request timeout docs](../backend/docs/REQUEST_TIMEOUT.md)
- [Observability](observability.md)
