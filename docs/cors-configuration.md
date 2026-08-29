# CORS Configuration

This document explains how the StellarKraal backend handles Cross-Origin Resource Sharing (CORS), which origins are permitted, and how to configure them correctly for each environment.

---

## Overview

CORS is applied by `backend/src/middleware/cors.ts` as the first middleware in the Express stack (after Helmet). It reads allowed origins from environment variables at startup and validates them immediately — misconfigured origins cause the process to exit rather than silently accept or reject requests at runtime.

---

## How Origins Are Resolved

The middleware uses two env vars, with `ALLOWED_ORIGINS` taking precedence:

```
ALLOWED_ORIGINS  (comma-separated list of HTTP(S) URLs)
    ↓ if not set
FRONTEND_URL     (single HTTP(S) URL)
    ↓ if not set in production
CORS blocked     (warning logged at startup)
```

### `ALLOWED_ORIGINS`

Comma-separated list of origins to allow. Parsed and validated once at module load.

```bash
ALLOWED_ORIGINS=https://app.stellarkraal.example.com,https://staging.stellarkraal.example.com
```

Rules enforced at startup:

| Check | Development / Test | Production |
|-------|--------------------|-----------|
| Wildcard `*` | ✅ Allowed | ❌ Startup error |
| HTTP origins | ✅ Allowed | ✅ Allowed |
| HTTPS origins | ✅ Allowed | ✅ Allowed |
| Invalid pattern (e.g. no scheme, `ftp://`) | ❌ Startup error | ❌ Startup error |

Whitespace around each entry is stripped automatically.

### `FRONTEND_URL`

Fallback when `ALLOWED_ORIGINS` is not set. Accepts a single origin.

```bash
FRONTEND_URL=https://app.stellarkraal.example.com
```

In development, if neither variable is set, non-auth routes accept any origin (`*`) and auth routes use `credentials: true` (which implicitly restricts to the request origin). In production, neither variable being set logs a warning and blocks all cross-origin requests.

---

## Credentials

The `credentials: true` CORS option (which allows cookies and `Authorization` headers to be sent cross-origin) is only enabled for **API routes** (`/api/*` except `/api/health`). Static paths and the health endpoint use `credentials: false`.

This means:

- Auth routes (`/api/auth/*`, `/api/v1/auth/refresh`) support credentialed requests — browsers will send the `refreshToken` cookie and JWT header.
- Non-credentialed routes cannot be widened to `*` while `credentials: true` is active (this is a browser security constraint, not an application limit).

---

## `maxAge`

Preflight responses are cached by the browser for **600 seconds** (10 minutes). This reduces OPTIONS request overhead for clients that make many cross-origin calls.

---

## Per-Environment Configuration

### Local development

```bash
# Allow all origins — convenient for dev tools and local frontends
ALLOWED_ORIGINS=*
# or leave unset (same effect in development)
```

### Staging

```bash
ALLOWED_ORIGINS=https://staging.stellarkraal.example.com,https://app.stellarkraal.example.com
```

Or use the single-origin fallback:

```bash
FRONTEND_URL=https://staging.stellarkraal.example.com
```

### Production

```bash
# Must be HTTPS; wildcard is rejected
ALLOWED_ORIGINS=https://app.stellarkraal.example.com
```

If you deploy multiple frontend domains (e.g. A/B environments, white-label), list them all in `ALLOWED_ORIGINS`.

---

## Diagnosing CORS Errors

### Symptom: `Access-Control-Allow-Origin` header absent

1. Check that `ALLOWED_ORIGINS` or `FRONTEND_URL` is set and matches the origin in the request exactly (scheme + hostname + port).
2. Check the startup logs — an invalid pattern causes an immediate crash before any request is served.
3. Confirm the request origin is not using HTTP when only HTTPS is listed.

### Symptom: `Credentialed requests require exactly one Allow-Origin`

A wildcard `*` was used on a route that sends credentials (`Authorization` header or cookie). Set a specific origin in `ALLOWED_ORIGINS` instead.

### Symptom: `OPTIONS` preflight returns 4xx

The preflight hits the same CORS middleware. Ensure the origin is in the allowed list and that the requested method/headers are standard (`Content-Type`, `Authorization`).

### Check the running config

```bash
# Confirm what the process sees at startup
docker compose logs backend | grep -i "cors\|ALLOWED_ORIGINS\|FRONTEND_URL"
```

---

## Source References

- Middleware implementation: [`backend/src/middleware/cors.ts`](../backend/src/middleware/cors.ts)
- `ALLOWED_ORIGINS` format and examples: [`ALLOWED_ORIGINS/README.md`](../ALLOWED_ORIGINS/README.md)
- All env var defaults and validation: [`backend/src/config.ts`](../backend/src/config.ts)
- Troubleshooting CORS runtime errors: [`docs/troubleshooting.md`](troubleshooting.md)
