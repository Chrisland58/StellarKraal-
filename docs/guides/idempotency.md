# Idempotency Keys

Some write endpoints in the StellarKraal API require an `Idempotency-Key` header to prevent duplicate submissions when clients retry requests. This guide explains what idempotency keys are, which endpoints require them, how to generate them correctly, and what to expect when a key is replayed.

---

## Why idempotency keys matter

Network retries are normal. If a client sends `POST /api/loan/repay` and the connection drops before the response arrives, the client cannot know whether the server processed the request. Without idempotency, retrying risks submitting the same repayment twice.

With an idempotency key the server stores the original response for 24 hours. Any retry with the same key receives the cached response immediately, without re-executing the business logic or re-building the Soroban transaction.

---

## Endpoints that require `Idempotency-Key`

| Endpoint | Required | Notes |
|----------|----------|-------|
| `POST /api/loan/repay` | **Yes** | Returns `400` if the header is absent |
| All other `POST` endpoints | No | Optional but harmless to include |

---

## Key generation

Use a **UUID v4** for each unique logical operation. A UUID v4 is a 128-bit random identifier, giving effectively zero collision probability across retries.

### JavaScript / TypeScript

```typescript
import { v4 as uuidv4 } from 'uuid';

const idempotencyKey = uuidv4();
// e.g. "550e8400-e29b-41d4-a716-446655440000"
```

### Shell / curl

```bash
KEY=$(uuidv4)
# or:
KEY=$(node -e "console.log(require('crypto').randomUUID())")

curl -X POST https://api.stellarkraal.example.com/api/loan/repay \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"borrower":"GABC...","loan_id":42,"amount":500}'
```

### Key rules

- Must be a **non-empty string** of any format (UUID v4 recommended).
- Should be generated **once per logical attempt**, then reused verbatim on retries.
- Do **not** generate a new key for each HTTP retry — that defeats the purpose.
- Keys are scoped globally on the server; do not reuse the same key for a different operation.

---

## How replay works

When the server receives a request whose `Idempotency-Key` matches a cached entry:

1. It returns the **original HTTP status code and body** immediately.
2. It sets the response header `X-Idempotent-Replayed: true`.
3. No Soroban transaction is rebuilt or submitted.

The 24-hour TTL starts from the first successful storage of the key. After expiry the entry is evicted and the key can be reused (though reuse after expiry is not recommended).

```
First request                    Retry (same key, within 24 h)
─────────────                    ─────────────────────────────
POST /api/loan/repay             POST /api/loan/repay
Idempotency-Key: <key>   →  →   Idempotency-Key: <key>
                                                   ↓
                         ← ← ←  HTTP 200  X-Idempotent-Replayed: true
                                 { "xdr": "..." }   (cached body)
```

---

## Error responses

### Missing header

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Idempotency-Key header is required for repay requests"
}
```

### Invalid header value (empty string)

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Validation failed",
  "details": [...]
}
```

---

## Frontend integration example

The StellarKraal frontend generates the key before the user confirms the repayment and stores it for the duration of the repayment flow. If the network call fails and is retried, the same key is passed:

```typescript
// Generate once per repayment intent
const idempotencyKey = crypto.randomUUID();

async function submitRepayment(borrower: string, loanId: number, amount: number) {
  const response = await fetch('/api/loan/repay', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,   // same key on every retry
    },
    body: JSON.stringify({ borrower, loan_id: loanId, amount }),
  });

  if (response.headers.get('X-Idempotent-Replayed') === 'true') {
    console.log('Replayed from cache — no duplicate submission');
  }

  return response.json();
}
```

---

## Implementation details

The idempotency cache is backed by an **in-process `Map`** in `backend/src/middleware/idempotency.ts`. Entries are keyed by the raw header value and store:

| Field | Description |
|-------|-------------|
| `status` | Original HTTP status code |
| `body` | Original JSON response body |
| `createdAt` | Unix timestamp (ms) of first storage |

TTL is enforced lazily: entries are checked and evicted on read, not on a background timer.

> **Note:** Because the store is in-process, idempotency keys are **not shared across multiple backend instances**. If you run more than one backend process behind a load balancer, use sticky sessions or replace the in-memory store with a distributed cache (Redis, DynamoDB) to ensure the same key always reaches the same instance.

---

## Related

- [API Error Code Reference](../api-error-codes.md)
- [How to Repay a Loan](repay-loan.md)
- OpenAPI spec: `backend/openapi.json` — `/loan/repay` entry documents the header and replay response headers
