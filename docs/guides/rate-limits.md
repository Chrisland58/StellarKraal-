# API rate limits

StellarKraal’s backend uses [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) with multiple limiters. Limits are enforced **per client IP** (default `express-rate-limit` keying). Every HTTP request passes through the **global** limiter first; some routes apply an additional, stricter limiter.

Implementation: `backend/src/middleware/rateLimit.ts`, mounted in `backend/src/index.ts` and `backend/src/routes/v1.ts`.

## Overview

| Tier | Limiter | Default max / window | Configurable via env |
|------|---------|----------------------|----------------------|
| Global | `globalLimiter` | 60 requests / 1 minute | `RATE_LIMIT_GLOBAL` |
| Auth | `authLimiter` | 10 requests / 1 minute | No (fixed in code) |
| Read | *(none — uses global only)* | Same as global | `RATE_LIMIT_GLOBAL` |
| Write | `writeLimiter` | 10 requests / 1 minute | `RATE_LIMIT_WRITE` |

**Window duration:** all limiters use a **60 second** sliding window (`windowMs = 60 * 1000`).

**Stacking:** stricter limiters apply **in addition** to the global limiter. For example, each `POST /api/auth/login` consumes one slot on both the global counter and the auth counter.

Defaults are defined in `backend/src/config.ts` and `env.example`:

- `RATE_LIMIT_GLOBAL=60`
- `RATE_LIMIT_WRITE=10`

## Global tier

- **Middleware:** `globalLimiter` in `backend/src/index.ts` (`app.use(globalLimiter)`).
- **Limit:** `RATE_LIMIT_GLOBAL` (default **60** requests per minute).
- **Endpoints:** all routes on the Express app, including `/metrics`, `/api/*`, `/api/v1/*`, and static API docs at `/api/docs`.

## Auth tier

- **Middleware:** `authLimiter` mounted as `app.use("/api/auth", authLimiter, authRouter)`.
- **Limit:** **10** requests per minute (hard-coded; not overridden by environment variables).
- **Endpoints:**
  - `GET /api/auth/challenge`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`

Auth routes are also counted against the **global** tier.

## Read tier

There is **no separate read limiter** in the codebase. `GET` and other non-write traffic is limited only by the **global** tier (`RATE_LIMIT_GLOBAL`, default 60/min).

**`/api/v1` read routes** (global limit only):

| Method | Path |
|--------|------|
| `GET` | `/api/v1/health` |
| `GET` | `/api/v1/loan/:id` |
| `GET` | `/api/v1/health/:loanId` |
| `GET` | `/api/v1/loans` |
| `GET` | `/api/v1/admin/webhooks` |
| `GET` | `/api/v1/admin/webhooks/logs` |
| `GET` | `/api/v1/settings/:wallet` |

Legacy unversioned read routes under `/api/*` in `backend/src/index.ts` (for example `GET /api/health`, `GET /api/loans`, `GET /api/transactions`) are subject to the same global limit.

## Write tier

- **Middleware:** `writeLimiter` on selected routes in `backend/src/routes/v1.ts`.
- **Limit:** `RATE_LIMIT_WRITE` (default **10** requests per minute).
- **Endpoints** (each route also counts toward the global limit):

| Method | Path |
|--------|------|
| `POST` | `/api/v1/collateral/register` |
| `POST` | `/api/v1/loan/request` |
| `POST` | `/api/v1/loan/repay` |
| `POST` | `/api/v1/loan/liquidate` |

Other `POST`/`PUT`/`DELETE` handlers (including legacy `/api/*` writes and v1 routes such as `POST /api/v1/oracle/price-update` or `POST /api/v1/webhooks`) are **not** wrapped with `writeLimiter`; they are only subject to the **global** tier unless noted above.

## Retry behavior

When a limit is exceeded, the server responds with:

- **HTTP status:** `429 Too Many Requests`
- **Body (JSON):** `{ "error": "Too many requests", "retryAfter": 60 }`
- **`Retry-After` header:** set by `express-rate-limit` (seconds until the client can retry; aligned with the one-minute window in tests)

Clients should back off and retry after the time indicated by `Retry-After` (or the `retryAfter` field in the JSON body). Counters reset when the current window expires.

## Rate-limit response headers

All limiters set `standardHeaders: true` and `legacyHeaders: false`, so responses use the [RateLimit draft headers](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers):

| Header | Meaning |
|--------|---------|
| `RateLimit-Limit` | Maximum requests allowed in the window for this limiter |
| `RateLimit-Remaining` | Requests remaining in the current window |
| `RateLimit-Reset` | Time when the window resets (Unix timestamp) |

On `429` responses, **`Retry-After`** is also sent.

When multiple limiters apply, the client may see headers from the limiter that handled the request; each limiter maintains its own counter.

## Examples

### Successful read within global limit

```bash
curl -s -D - -o /dev/null http://localhost:3001/api/v1/health
```

Expect `200` and headers such as `RateLimit-Limit: 60` (if `RATE_LIMIT_GLOBAL` is unset).

### Exceeding the auth limit

After more than **10** requests in one minute to `/api/auth/challenge` from the same IP:

```bash
curl -s http://localhost:3001/api/auth/challenge
# ... repeat until 429
```

Expect `429`, `Retry-After`, and body `{"error":"Too many requests","retryAfter":60}`.

### Write limit on loan request

`POST /api/v1/loan/request` is limited to **10** writes per minute per IP (`RATE_LIMIT_WRITE`) in addition to the global cap. Integrations that burst contract-building calls should queue or backoff when `RateLimit-Remaining` approaches zero.

## Related documentation

- [API Quickstart](./api-quickstart.md)
- Interactive OpenAPI UI: `/api/docs` when the backend is running
- Environment variables: `env.example`, [Local development setup](../development/local-setup.md)
