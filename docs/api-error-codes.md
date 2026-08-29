# API Error Code Reference

All error responses from the StellarKraal API use the following JSON envelope:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "correlationId": "uuid-for-tracing"
}
```

Rate-limit and validation errors may include additional fields (`retryAfter`, `details`). The `correlationId` is echoed from the `X-Request-ID` request header (or generated server-side) and should be included in any bug reports.

---

## HTTP Status Codes

| Status | Meaning |
|--------|---------|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request — invalid input or missing required fields |
| `401` | Unauthenticated — missing, expired, or invalid credentials |
| `403` | Forbidden — authenticated but not authorised for this resource |
| `404` | Resource not found |
| `409` | Conflict — e.g. collateral already pledged |
| `429` | Too many requests — rate limit exceeded |
| `500` | Internal server error |
| `502` | Bad gateway — upstream RPC/contract call failed |
| `503` | Service unavailable — DB unreachable or server is shutting down |

---

## Application Error Codes

These appear in the `code` field of the response body.

### General

| Code | HTTP | Description |
|------|------|-------------|
| `INTERNAL_ERROR` | 500 | Unhandled server error. Check the `correlationId` in server logs for the stack trace. |

### Authentication & Authorisation (`/api/auth/*`)

| Code | HTTP | Description |
|------|------|-------------|
| — | 400 | `walletAddress` and `signedChallenge` (with `nonce` and `signature`) are required for login. |
| — | 401 | Challenge nonce is invalid or expired (5-minute TTL). Fetch a new challenge and retry. |
| — | 401 | Stellar ed25519 signature verification failed. |
| — | 401 | Invalid wallet address format. |
| `MISSING_TOKEN` | 400 | Refresh token cookie is absent on `POST /api/v1/auth/refresh`. |
| `INVALID_TOKEN` | 401 | Refresh token is invalid, revoked, or expired (7-day TTL by default). |
| — | 401 | JWT access token is expired (`expired`). Call `/api/v1/auth/refresh`. |
| — | 401 | JWT signature is invalid. |
| — | 401 | `Authorization: Bearer <token>` header is missing on a protected route. |
| — | 401 | API key (`sk_…`) is invalid or has been revoked. |
| — | 401 | `Authentication required` — no authenticated user on an admin route. |
| — | 403 | Forbidden — API key owner does not match the resource owner. |

### Collateral

| Code | HTTP | Description |
|------|------|-------------|
| — | 400 | Validation failed — see `details` array for field-level errors (Zod issues). |
| — | 404 | `Collateral not found` — the given collateral ID does not exist. |
| — | 400 | Collateral does not belong to the authenticated user. |
| — | 409 | Collateral is already pledged to another active loan. |

### Loans

| Code | HTTP | Description |
|------|------|-------------|
| — | 400 | Validation failed — see `details` for field-level errors. |
| — | 400 | `Idempotency-Key` header is required for repay requests. |
| — | 400 | `page` must be a positive integer. |
| — | 400 | `pageSize` must be between 1 and 100. |
| — | 404 | `Loan <id> not found`. |

### Contract / Soroban Errors

These are returned when the Soroban smart contract rejects an operation. They map to the `Error` enum in `contracts/stellarkraal/src/lib.rs`.

| Contract Code | HTTP | Message |
|---------------|------|---------|
| `#1` | 502 | Contract is not initialized |
| `#2` | 502 | Contract is already initialized |
| `#3` | 502 | Unauthorized: caller does not have the required permissions |
| `#4` | 400 | Insufficient collateral: loan amount exceeds the maximum allowed by the LTV ratio |
| `#5` | 404 | Loan not found |
| `#6` | 404 | Collateral not found |
| `#7` | 400 | Health factor is safe: loan is not eligible for liquidation |
| `#8` | 400 | Invalid amount: value must be positive and must not cause overflow |
| `#9` | 409 | Loan is already closed |
| `#10` | 400 | Invalid fee rate: rate exceeds the protocol maximum of 5% |
| `#11` | 400 | Exceeds close factor: repay amount is above the close-factor cap |
| `#12` | 400 | Invalid close factor: value must be between 1 and 10 000 bps |
| `#13` | 503 | Contract is paused — new operations are temporarily disabled |
| `#14` | 409 | Oracle is already registered |
| `#15` | 409 | Oracle limit reached: maximum number of oracles has been registered |
| `#16` | 404 | Oracle not found |
| `#17` | 502 | Insufficient oracle quorum: not enough valid price submissions |
| `#18` | 400 | Invalid price: price value is out of bounds or otherwise invalid |
| `#19` | 400 | Contract is not paused |

### Rate Limiting

| HTTP | Description |
|------|-------------|
| `429` | Too many requests. The response includes `Retry-After: 60` (seconds) and `retryAfter: 60` in the body. |

Rate limit windows are 1 minute. Default limits (all configurable via env):

| Limiter | Default | Env var |
|---------|---------|---------|
| Global | 60 req/min | `RATE_LIMIT_GLOBAL` |
| Auth routes | 10 req/min | `RATE_LIMIT_AUTH` |
| Read routes | 100 req/min | `RATE_LIMIT_READ` |
| Write routes | 10 req/min | `RATE_LIMIT_WRITE` |

### Infrastructure

| HTTP | Description |
|------|-------------|
| `503` | Server is shutting down — retry after a few seconds. |
| `503` | `/api/health` returns `degraded` with `db: "unreachable"` or `rpcReachable: false` when backing services are down. |

---

## Tracing Errors

Every response includes a `correlationId` (or `X-Request-ID` header on success responses). Use this value when querying logs:

```bash
# Grafana / Loki
{job="backend"} | json | correlationId="<your-id>"
```

---

## Related

- [Troubleshooting Guide](troubleshooting.md)
- [API Versioning Strategy](api-versioning-strategy.md)
- [Smart Contract Interface](contracts/stellarkraal-interface.md)
- [Soroban error source](../backend/src/utils/sorobanErrors.ts)
- [Error handler source](../backend/src/middleware/errorHandler.ts)
