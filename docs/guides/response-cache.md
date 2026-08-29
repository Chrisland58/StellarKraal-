# Response Cache Middleware

The StellarKraal backend includes an in-process response cache for read-heavy GET endpoints. This guide explains which endpoints are cached, how the cache key is constructed, how to bypass or manually invalidate the cache, and how it behaves under high load.

Source: `backend/src/utils/responseCache.ts`

---

## Cached endpoints

| Endpoint | Middleware | TTL | Notes |
|---|---|---|---|
| `GET /api/loans` | `responseCacheMiddleware` | 30 s | Paginated loan listing |
| `GET /api/collateral` | `responseCacheMiddleware` | 30 s | Paginated, filterable collateral listing |

All other endpoints are not cached. The middleware is applied at the route level in `backend/src/index.ts`.

---

## Cache key construction

Each cache entry is keyed by a string that uniquely identifies the combination of path, query parameters, and authenticated user:

```
<request.path>?<sorted-query-string>::<user.publicKey>
```

For example, a request to `GET /api/loans?page=1&pageSize=20` from wallet `GABC...` produces:

```
/api/loans?page=1&pageSize=20::GABC...
```

An unauthenticated request (no JWT / no decoded user) uses the literal string `anonymous` as the user segment:

```
/api/collateral?status=available::anonymous
```

This means:
- Two users requesting the same path see **different** cache entries — no data leakage between accounts.
- Changing any query parameter produces a new cache entry.

---

## Cache TTL and expiry

The default TTL is **30 seconds** (`DEFAULT_CACHE_TTL_MS = 30_000`). Expiry is checked lazily on read: when a cache hit is found, the middleware computes `now - cachedAt` and serves the entry only if it is within the TTL window. Expired entries remain in the `Map` until overwritten or the process restarts.

To use a custom TTL for a specific route, call `createResponseCacheMiddleware(ttlMs)`:

```typescript
import { createResponseCacheMiddleware } from './utils/responseCache';

// Cache this route for 10 seconds instead of 30
app.get('/api/some-route', createResponseCacheMiddleware(10_000), handler);
```

---

## Cache response headers

Every response from a cached endpoint includes an `X-Cache` header:

| Value | Meaning |
|---|---|
| `HIT` | Response was served from the cache. No handler or DB query was executed. |
| `MISS` | Response was computed by the handler and the result was stored in the cache. |

Use these headers when debugging unexpected stale data or investigating performance regressions.

---

## Bypassing the cache

Clients can bypass the cache for a single request using standard HTTP cache-control headers. The middleware honours both:

```http
Cache-Control: no-cache
```

or:

```http
Pragma: no-cache
```

When either header is present:
- The cache is not checked on the way in (no `HIT`).
- The response is not written to the cache on the way out.
- The `X-Cache` header is still set to `MISS`.

This is useful when a client needs guaranteed fresh data immediately after a write operation.

---

## Manual cache invalidation

Application code can invalidate cache entries by path prefix using `invalidateCache`:

```typescript
import { invalidateCache } from './utils/responseCache';

// Invalidate all cached entries under /api/loans
invalidateCache('/api/loans');
```

This iterates the in-memory store and deletes every key that starts with the given prefix, regardless of user or query string. The number of evicted entries is logged at `debug` level.

The backend calls `invalidateCache('/api/loans')` automatically after the following write operations:

- `POST /api/loan/request` — new loan created

If you add a new write endpoint that modifies loan or collateral state, call `invalidateCache` with the appropriate prefix at the end of the handler to prevent stale reads.

---

## Behaviour under high load (thundering herd)

The current implementation does **not** include thundering-herd (cache stampede) protection. When a cached entry expires and multiple concurrent requests arrive simultaneously:

1. All requests result in a cache `MISS`.
2. All requests execute the handler in parallel.
3. The last writer wins — all computed responses are stored, overwriting each other.

This means the database and/or smart contract RPC may receive a brief burst of identical queries when the TTL expires. With a 30-second TTL this burst is bounded in frequency.

**Mitigations available if thundering herd becomes a problem:**

- Increase the TTL for high-traffic endpoints using `createResponseCacheMiddleware(ttlMs)`.
- Add a mutex / single-flight pattern so only one request recomputes an expired entry while others wait.
- Move to a distributed cache (Redis) with built-in locking primitives for multi-instance deployments.

---

## Multi-instance deployments

The cache is backed by an **in-process `Map`**. This means:

- Each backend process has its own independent cache.
- A request routed to instance A will not benefit from a cache entry populated by instance B.
- Invalidation via `invalidateCache` only affects the calling process.

For multi-instance deployments behind a load balancer, either use sticky sessions (route each user consistently to one instance) or replace the in-memory store with a shared cache (Redis with the same key scheme).

---

## Adding the cache to a new endpoint

```typescript
import { responseCacheMiddleware } from './utils/responseCache';
// or for a custom TTL:
import { createResponseCacheMiddleware } from './utils/responseCache';

app.get(
  '/api/some-new-route',
  responseCacheMiddleware,          // use default 30 s TTL
  asyncHandler(async (req, res) => {
    // handler logic
  })
);
```

Remember to call `invalidateCache('/api/some-new-route')` from any write endpoint that changes the data returned by this route.

---

## Related

- [Performance Tuning Guide](../performance-tuning.md)
- [Observability — Loki & Grafana](../observability.md)
- Source: `backend/src/utils/responseCache.ts`
