# Appraisal Cache

This document explains the caching strategy, TTL behaviour, staleness model, and invalidation conditions for `backend/src/utils/appraisalCache.ts`. It is intended for API consumers and developers integrating with the collateral appraisal subsystem.

---

## Purpose

The appraisal cache is an in-process, in-memory key-value store that caches collateral appraisal values keyed by `collateralId`. It exists as a performance layer so the backend can serve appraisal values without re-querying the oracle or the database on every request.

> **The appraisal cache is never authoritative for on-chain enforcement.** LTV calculations, health factor checks, and liquidation eligibility are always derived from the on-chain oracle price (median/TWAP). See [ADR-006](./adr/ADR-006-oracle-design.md) for the full oracle design.

---

## Cache Entry Shape

```ts
interface CacheEntry {
  value: number;    // appraised value
  cachedAt: number; // Unix timestamp (ms) when the entry was stored
  stale: boolean;   // true if age > TTL at read time
}
```

`getAppraisal` always returns a `CacheEntry` or `null`. It never mutates the stored entry — the `stale` flag is computed at read time and returned on a copy.

---

## TTL Behaviour

The default TTL is **5 minutes** (`300 000 ms`). It is configurable at runtime via `configureCacheTTL(ms)`.

This default is also exposed as an environment variable for the test environment:
```
APPRAISAL_CACHE_TTL_MS=300000
```

### Staleness model

The cache uses a **soft expiry** model: entries are **not evicted** when the TTL expires. Instead, `getAppraisal` returns the entry with `stale: true`. The caller is responsible for deciding whether to use a stale value (acceptable for UI hints) or to trigger a refresh.

```
Time →   0        TTL      TTL+Δ
          │────────│────────│
Entry:   FRESH    STALE    STALE (still in cache, not evicted)
```

This avoids a thundering-herd problem where many concurrent requests simultaneously miss after expiry and all attempt to re-fetch.

### TTL timeline example

```
t=0       setAppraisal("col-1", 1500)   → stored, cachedAt = 0
t=4:59    getAppraisal("col-1")         → { value: 1500, stale: false }
t=5:00    getAppraisal("col-1")         → { value: 1500, stale: true  }
t=5:00    invalidateAppraisal("col-1")  → entry removed
t=5:00    getAppraisal("col-1")         → null (cache miss)
```

---

## API

### `getAppraisal(collateralId: string): CacheEntry | null`

Returns the cached entry for a collateral ID, or `null` on a cache miss.

- If the entry age exceeds the TTL, the returned copy has `stale: true`. The stored entry is not modified.
- Emits structured log events: `appraisal_cache_hit`, `appraisal_cache_miss`, `appraisal_cache_stale`.

### `setAppraisal(collateralId: string, value: number): void`

Stores or overwrites an appraisal value. Sets `cachedAt` to `Date.now()`.

### `invalidateAppraisal(collateralId: string): void`

Removes a single entry. Safe to call for a non-existent key (no-op, no log). Emits `appraisal_cache_invalidated` when an entry is deleted.

### `invalidateAll(): void`

Clears all entries. Emits `appraisal_cache_invalidated_all` with the count of removed entries. Call this on a global oracle price update event.

### `configureCacheTTL(ms: number): void`

Overrides the default 5-minute TTL. Affects both new entries and staleness evaluation of existing entries on subsequent reads.

---

## Invalidation Conditions

| Trigger | Action | Description |
|---------|--------|-------------|
| Oracle price update for a specific asset | `invalidateAppraisal(collateralId)` | Called when the contract event listener detects a new price for a single collateral |
| Global oracle price update | `invalidateAll()` | Called when a bulk price update is detected |
| TTL expiry | No eviction — `stale: true` on read | Caller decides whether to refresh |
| Server restart | All entries lost | Cache is purely in-memory; no persistence |

---

## Log Events

All log events are emitted at `debug` level (hit/miss/stale) or `info` level (invalidation) via the Winston logger.

| Event | Level | Fields |
|-------|-------|--------|
| `appraisal_cache_hit` | debug | `collateralId`, `ageMs` |
| `appraisal_cache_miss` | debug | `collateralId` |
| `appraisal_cache_stale` | debug | `collateralId`, `ageMs` |
| `appraisal_cache_invalidated` | info | `collateralId` |
| `appraisal_cache_invalidated_all` | info | `count` |

---

## Relationship to the On-Chain Oracle

The off-chain appraisal cache and the on-chain oracle serve different purposes:

| | Off-chain cache | On-chain oracle |
|-|----------------|-----------------|
| Source | `appraisalCache.ts` | Soroban contract (`submit_oracle_prices`) |
| Authority | Non-authoritative (UX/performance) | Authoritative (enforces LTV, liquidations) |
| TTL | 5 min (default) | Staleness enforced per-submission on-chain |
| Invalidation | On oracle event or TTL expiry | N/A — contract rejects stale submissions |
| Failure impact | Stale UX only | Blocks origination / liquidation |

A missed or delayed cache invalidation surfaces only as stale data in the UI. It cannot cause unsafe lending because on-chain enforcement is independent of this cache.

For the full oracle design — including median aggregation, TWAP, quorum, and deviation bounds — see [ADR-006](./adr/ADR-006-oracle-design.md).

---

## Testing

Unit tests for the cache are in `backend/src/utils/appraisalCache.test.ts`. They cover:
- Cache hit and miss
- TTL and stale flag behaviour (using Jest fake timers)
- `configureCacheTTL` affecting subsequent reads
- Targeted and bulk invalidation
- Log event emission via mocked logger

---

## Related Docs

- [ADR-006: Oracle Design](./adr/ADR-006-oracle-design.md)
- [ADR-005: Collateral Appraisal Model](./adr/ADR-005-collateral-appraisal-model.md)
- [`backend/src/utils/appraisalCache.ts`](../backend/src/utils/appraisalCache.ts)
