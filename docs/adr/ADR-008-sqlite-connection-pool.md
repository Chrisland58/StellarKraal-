# ADR-008: Connection Pooling for Off-Chain and RPC Access

**Date:** 2026-07-27
**Status:** Accepted

## Context

The backend maintains two categories of pooled connections that were added incrementally without a recorded decision:

1. A **PostgreSQL connection pool** (`backend/src/db/database.ts`), used when `DATABASE_URL` points at Postgres (staging/prod), created via the `pg` driver's `Pool` with `max: 10`.
2. A **Soroban RPC connection pool** (`backend/src/utils/connectionPool.ts`), used for all calls to the Soroban JSON-RPC endpoint, with configurable `min`/`max` size, retry-with-backoff, and pool exhaustion handling. Its metrics are exposed under the `db_pool_*` names (`dbPoolAcquiredTotal`, `dbPoolAvailable`, `dbPoolWaitMs`).

SQLite itself (the default local/dev driver, see [ADR-003](ADR-003-sqlite.md)) does not use a network-style connection pool: it is a single embedded file accessed synchronously in-process, so there is no connection handshake to amortize.

## Decision

- Do **not** pool SQLite connections. The SQLite driver opens a single in-process handle; pooling would add complexity without a corresponding benefit for a single-writer, file-backed database.
- Pool **PostgreSQL** connections (via `pg.Pool`) because Postgres is used in staging/production, is accessed over the network, and benefits from reusing established connections under concurrent requests.
- Pool **Soroban RPC** connections because each RPC call is a network round trip to the Stellar network, and the pool bounds concurrent outstanding requests while allowing burst capacity up to `max`.

## Alternatives Considered

| Option | Reason not chosen |
|--------|-------------------|
| Pool SQLite handles like network connections | SQLite access is in-process and synchronous; pooling adds overhead and lock contention risk with no throughput benefit |
| Single shared RPC client with no pool | Under load, a single client serializes RPC calls and has no backpressure/exhaustion signal; the pool gives bounded concurrency and retry semantics |
| Unbounded RPC client creation per request | Risks exhausting file descriptors / RPC provider rate limits under load |

## Consequences

**Positive:**
- Postgres and Soroban RPC usage scale under concurrent load without per-call connection setup cost.
- Pool exhaustion is an explicit, observable failure (`PoolExhaustedError`) rather than unbounded resource growth.
- SQLite path stays simple, matching its intended use as the zero-dependency local/dev database.

**Negative / Trade-offs:**
- Two different pooling implementations exist (`pg.Pool` for Postgres, a custom pool for Soroban RPC) rather than one shared abstraction.
- If SQLite is ever used under high write concurrency in production, its lack of pooling/queueing could become a bottleneck — see [ADR-003](ADR-003-sqlite.md) for the scaling trade-off already accepted there.
