# Audit Middleware Guide

The audit middleware (`backend/src/middleware/audit.ts`) logs every HTTP request to a rotating audit log file. This document explains what is logged, how sensitive fields are redacted, and how to extend the audit schema.

---

## Security Impact

The audit log contains request metadata (method, path, status, duration, client IP, and request body) but **never** stores raw credentials or full wallet addresses in production. PII masking and field redaction are applied automatically before any data is written to disk or shipped to a log aggregator. Audit log files are stored under `logs/` and rotated daily with a 30-day retention window and gzip compression — treat this directory as sensitive data.

---

## What Is Logged

Every request produces one structured JSON log entry **after the response is sent** (on the `finish` event). The entry shape is:

```json
{
  "timestamp": "2026-08-26T11:00:00.000Z",
  "level": "info",
  "message": "api_request",
  "requestId": "a1b2c3d4-...",
  "method": "POST",
  "path": "/api/v1/loans",
  "status": 201,
  "durationMs": 42.3,
  "body": { "collateral_id": "12", "amount": 5000000 },
  "ip": "::1"
}
```

| Field | Type | Always present | Description |
|-------|------|---------------|-------------|
| `timestamp` | ISO 8601 string | ✓ | When the log entry was written |
| `message` | `"api_request"` | ✓ | Constant identifier for audit entries |
| `requestId` | UUID string | ✓ | Correlation ID from the `requestId` middleware |
| `method` | HTTP verb | ✓ | `GET`, `POST`, `PATCH`, etc. |
| `path` | URL path | ✓ | Path without query string |
| `status` | integer | ✓ | HTTP response status code |
| `durationMs` | float | ✓ | Round-trip time in milliseconds (2 d.p.) |
| `body` | object | GET requests omitted | Redacted request body |
| `ip` | string | ✓ | Client IP as seen by Express |

`GET` requests do not include a `body` field (`undefined`).

---

## The `redact` Function

The `redact(obj, depth?)` function is exported from `audit.ts` and is responsible for sanitising request bodies before they are logged. It is a recursive object walker that applies two types of masking:

### 1. Field-name redaction

Any key whose name (case-insensitive) appears in the `REDACTED_FIELDS` set has its value replaced with `"[REDACTED]"`:

```typescript
const REDACTED_FIELDS = new Set([
  "password", "secret", "private_key", "privatekey", "seed",
  "mnemonic", "token", "authorization", "api_key", "apikey",
  "secret_key", "secretkey", "signing_key", "signingkey",
]);
```

This applies to any nesting depth (up to depth 5 to prevent runaway recursion on malformed payloads).

**Example:**
```js
redact({ amount: 5000, authorization: "Bearer eyJ..." })
// → { amount: 5000, authorization: "[REDACTED]" }
```

### 2. Value-level masking (production only)

In `NODE_ENV === "production"` two additional transformations run on **string values**:

| Pattern | Replacement | Purpose |
|---------|-------------|---------|
| Stellar public key (`G` + 55 base-32 chars) | `GABC...WXYZ` (first 4 + last 4) | Prevent wallet address enumeration via logs |
| JWT token (three base64url segments) | `[REDACTED]` | Prevent session hijacking via log access |

In development and test environments these replacements are **not applied**, so logs remain fully readable for debugging.

---

## Log Transport and Rotation

The audit logger uses `winston-daily-rotate-file`:

| Setting | Value |
|---------|-------|
| Log directory | `logs/` (or `AUDIT_LOG_DIR` env var) |
| Filename pattern | `audit-YYYY-MM-DD.log` |
| Rotation | Daily |
| Retention | 30 days |
| Compression | gzip after rotation |

In non-production environments a console transport is added alongside the file transport so audit events appear in the terminal.

---

## How to Add New Fields to Audit Logs

To capture additional request or response metadata, edit the `res.on("finish", ...)` callback inside `auditMiddleware` in `backend/src/middleware/audit.ts`:

```typescript
res.on("finish", () => {
  const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

  auditLogger.info("api_request", {
    requestId: (req as any).requestId,
    method: req.method,
    path: req.path,
    status: res.statusCode,
    durationMs: Math.round(durationMs * 100) / 100,
    body: req.method !== "GET" ? redact(req.body) : undefined,
    ip: req.ip,
    // ── add new fields here ──────────────────────────────────────────
    userId: (req as any).userId,        // example: user ID from JWT
    userAgent: req.headers["user-agent"], // example: client user-agent
  });
});
```

**Guidelines when adding fields:**

1. **PII fields** (e.g. user email, wallet address): pass them through `redact()` or `maskString()` explicitly, or add their key to `REDACTED_FIELDS`.
2. **Numeric/boolean fields** (e.g. response size, authenticated flag): safe to log directly.
3. **Headers**: only log specific headers; never log the full `req.headers` object as it may contain `Authorization` or `Cookie`.
4. **Large payloads**: truncate or summarise before logging to avoid audit log bloat.

After adding a field, update the corresponding test in `backend/src/middleware/audit.test.ts` to assert the new field is present (or redacted when expected).

---

## Registering the Middleware

`auditMiddleware` is registered globally in `backend/src/index.ts` alongside the other request-level middleware:

```typescript
import { auditMiddleware } from './middleware/audit';

app.use(auditMiddleware);
```

It must be registered **after** `requestId` middleware (so `req.requestId` is available) and **before** route handlers.

---

## Related

- [`backend/src/middleware/audit.ts`](../../backend/src/middleware/audit.ts) — source code
- [`backend/src/middleware/audit.test.ts`](../../backend/src/middleware/audit.test.ts) — unit tests
- [Observability Stack](../observability.md) — how audit logs integrate with Promtail/Loki
- [API Error Code Reference](../api-error-codes.md) — status codes that appear in `status` field
