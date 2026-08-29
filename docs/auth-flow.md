# JWT Authentication Flow

This document describes the full authentication flow implemented in `backend/src/middleware/auth.ts`. See [ADR-002](./adr/ADR-002-jwt-auth.md) for the architectural decision record.

## Threat Model

- **Replay attacks** — challenges are single-use and expire after 5 minutes.
- **Token forgery** — access tokens are HS256-signed with `JWT_SECRET`; a wrong or missing secret produces a 401.
- **Refresh token theft** — refresh tokens are stored as SHA-256 hashes server-side. The raw token is only ever sent as an `HttpOnly; Secure; SameSite=Strict` cookie, making it inaccessible to JavaScript.
- **Refresh token reuse** — tokens are rotated on every `/refresh` call. Using an already-rotated token returns 401, which can signal a stolen token.
- **Long-lived credential abuse** — access tokens expire in 15 minutes; refresh tokens expire in 7 days.
- **Machine-to-machine key exposure** — API keys are stored as SHA-256 hashes in memory; the raw value is shown once at creation and never retrievable again.

---

## Environment Variables

All secrets are loaded from environment variables. Never hardcode values.

| Variable | Description | Default (dev only) |
|----------|-------------|-------------------|
| `JWT_SECRET` | HS256 signing secret (min 32 chars) | `change-me-in-production-min-32-chars!!` |
| `ACCESS_TTL_MS` | Access token TTL in milliseconds | `900000` (15 min) |
| `REFRESH_TTL_MS` | Refresh token TTL in milliseconds | `604800000` (7 days) |

See `.env.example` for the full list.

---

## Authentication Methods

The backend supports two authentication paths. Both result in `req.user = { publicKey }` being set on the request.

### 1. Wallet-Based JWT (end-user)

Used by the Next.js frontend when a Stellar wallet (e.g. Freighter) is connected.

### 2. API Key (machine-to-machine)

Used for server-to-server calls. Keys are prefixed `sk_`, stored hashed (SHA-256), and passed as `Authorization: Bearer sk_<key>`. See `backend/src/middleware/apiKey.ts`.

---

## Wallet Auth Flow

```
Client                              Backend
  │                                    │
  │  GET /api/auth/challenge            │
  │ ─────────────────────────────────► │  randomBytes(32) → hex nonce
  │                                    │  challenges.set(nonce, now + 5min)
  │ ◄─────────────────────────────────  │  { challenge: "<64-char hex>" }
  │                                    │
  │  Sign challenge with Stellar wallet │
  │  (ed25519 private key, off-backend) │
  │                                    │
  │  POST /api/auth/login               │
  │  { walletAddress, signedChallenge:  │
  │    { nonce, signature } }           │
  │ ─────────────────────────────────► │
  │                                    │  1. Look up nonce in challenges map
  │                                    │  2. Reject if missing or expired
  │                                    │  3. challenges.delete(nonce)  ← single-use
  │                                    │  4. Keypair.fromPublicKey(walletAddress)
  │                                    │     .verify(nonce, signature)
  │                                    │  5. issueTokens(walletAddress)
  │                                    │     - signJwt({ sub, iat, exp })  HS256
  │                                    │     - randomBytes(32) → rawRefresh
  │                                    │     - store SHA-256(rawRefresh) → { publicKey, exp }
  │                                    │     - setRefreshCookie(res, rawRefresh)
  │ ◄─────────────────────────────────  │  { accessToken, expiresIn: 900 }
  │  Set-Cookie: refreshToken=<raw>     │  (HttpOnly; Secure; SameSite=Strict;
  │             Path=/api/v1/auth/refresh│   Path=/api/v1/auth/refresh)
  │                                    │
  │  Authorization: Bearer <accessToken>│
  │ ─────────────────────────────────► │  jwtMiddleware → verifyJwt → req.user
  │ ◄─────────────────────────────────  │  Protected response
```

---

## Token Refresh Flow

Access tokens are short-lived (15 min). The frontend uses the httpOnly cookie to silently refresh without re-prompting the wallet.

```
Client                              Backend
  │                                    │
  │  POST /api/v1/auth/refresh          │
  │  Cookie: refreshToken=<raw>         │
  │ ─────────────────────────────────► │
  │                                    │  1. Extract raw token from Cookie header
  │                                    │  2. SHA-256(raw) → look up in refreshTokens map
  │                                    │  3. Reject if missing or exp < now  → 401
  │                                    │  4. refreshTokens.delete(oldHash)   ← rotate
  │                                    │  5. issueTokens(publicKey)
  │                                    │     - new accessToken
  │                                    │     - new rawRefresh + hash stored
  │                                    │     - setRefreshCookie(res, newRawRefresh)
  │ ◄─────────────────────────────────  │  { accessToken, expiresIn: 900 }
  │  Set-Cookie: refreshToken=<newRaw>  │
```

### Refresh Error Codes

| HTTP | `error` field | Cause |
|------|--------------|-------|
| `400` | `MISSING_TOKEN` | `refreshToken` cookie absent |
| `401` | `INVALID_TOKEN` | Token not found, expired, or already rotated |

---

## JWT Middleware

`jwtMiddleware` is mounted at the app level in `src/index.ts`. It protects all mutating routes and specific read routes.

**Protected methods:** `POST`, `PUT`, `DELETE`, `PATCH`

**Protected GET patterns:**
- `/api/loans/:id`
- `/api/collateral`
- `/api/v1/loans/summary`

**Public routes (always bypassed):**
- Any path starting with `/api/auth/`
- `GET /api/health`
- `GET /api/v1/health`

**Decision logic:**

```
Authorization header present?
  No  → 401 { error: "Authorization header required" }
  Yes →
    Starts with "Bearer sk_"?
      Yes → API key path → authenticateApiKey(header)
              Valid → req.user = { publicKey }; next()
              Invalid/revoked → 401 { error: "Invalid or revoked API key" }
      No  → JWT path → verifyJwt(token)
              Valid → req.user = { publicKey: payload.sub }; next()
              Expired → 401 { error: "Token expired" }
              Invalid → 401 { error: "Invalid token" }
```

---

## API Key Flow (M2M)

```
Operator                            Backend
  │                                    │
  │  POST /api/v1/admin/api-keys        │
  │  Authorization: Bearer <JWT>        │
  │ ─────────────────────────────────► │  Requires JWT auth (jwtMiddleware)
  │                                    │  raw = "sk_" + randomBytes(32).hex
  │                                    │  store: id → { ownerPublicKey, SHA-256(raw), createdAt }
  │ ◄─────────────────────────────────  │  { id, key: raw }  ← shown once only
  │                                    │
  │  DELETE /api/v1/admin/api-keys/:id  │
  │  Authorization: Bearer <JWT>        │
  │ ─────────────────────────────────► │  record.revokedAt = now
  │ ◄─────────────────────────────────  │  { message: "API key revoked" }
```

Keys are revoked immediately and in-memory. A server restart clears all keys — persistence is not currently implemented.

---

## Implementation Reference

| File | Purpose |
|------|---------|
| `backend/src/middleware/auth.ts` | Challenge issuance, login, refresh, JWT middleware |
| `backend/src/middleware/apiKey.ts` | API key management and authentication |
| `backend/src/middleware/auth.test.ts` | Jest integration tests for the full auth flow |
| `backend/src/middleware/apiKey.test.ts` | Jest tests for API key creation and revocation |

---

## Related Docs

- [ADR-002: JWT-Based Authentication Strategy](./adr/ADR-002-jwt-auth.md)
- [Security Policy](../SECURITY.md)
- [`.env.example`](../.env.example)
