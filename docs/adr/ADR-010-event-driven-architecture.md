# ADR-010: Event-Driven Webhook Architecture

**Date:** 2026-07-27  
**Status:** Accepted

---

## Context

StellarKraal needs to notify external systems (dashboards, mobile apps, third-party integrations)
when significant protocol events occur: a loan is approved, a repayment is received, or a
position is liquidated. Without a notification mechanism, consumers must poll the REST API
continuously, wasting resources and introducing latency.

At the time of this decision, the platform is in early deployment targeting a single-region
setup with a modest request volume (< 100 concurrent users, < 50 loan events per minute). The
integration surface is small: internal dashboards and a handful of partner integrations.

Three delivery mechanisms were evaluated.

---

## Decision

Implement an **event-driven webhook system** where the backend fires HTTP POST callbacks to
registered URLs whenever a loan lifecycle event occurs.

The implementation is in `backend/src/webhooks.ts` and is called from route handlers via
`fireWebhooks(event, payload)`:

```typescript
// Route handler example (loan approved)
fireWebhooks('loan.approved', { borrower, collateral_id, amount });
```

### Design details

- **Per-webhook HMAC-SHA256 signatures** — every delivery includes an
  `X-StellarKraal-Signature: sha256=<hex>` header computed from the raw JSON body and a
  per-registration secret. Receivers verify this header to authenticate the delivery.
- **Optional AES-256-GCM payload encryption** — the key is derived from the webhook secret via
  HKDF-SHA256, providing confidentiality for sensitive event payloads.
- **Exponential-backoff retry** — up to 5 attempts with delays of 1 s, 2 s, 4 s, 8 s, 16 s.
  Non-2xx responses and network errors both trigger a retry.
- **Delivery log** — every attempt is recorded in an in-memory delivery log queryable at
  `GET /api/admin/webhooks/logs`.
- **In-memory registry** — registrations are stored in memory for the current deployment scale.
  See migration path below.

### Supported events

| Event | Trigger |
|-------|---------|
| `loan.approved` | `POST /api/loan/request` succeeds |
| `loan.liquidated` | `POST /api/loan/liquidate` succeeds |

Additional events (e.g. `loan.repaid`, `collateral.registered`) can be added by calling
`fireWebhooks` from the respective route handlers.

---

## Alternatives Considered

### Option A: Synchronous API callbacks (inline HTTP call per request)

The backend would call out to the consumer's URL synchronously during request handling.

| Pros | Cons |
|------|------|
| Simple implementation | Adds latency to every API request |
| Immediate delivery | External service failures cause backend request failures |
| No retry complexity | Tight coupling between backend availability and consumer availability |

**Not chosen** because a slow or unavailable consumer would degrade response times for all
borrowers. The backend should not be blocked on external HTTP calls in the hot path.

### Option B: Webhooks (chosen)

Fire-and-forget HTTP POSTs to registered URLs with retry logic, running asynchronously.

| Pros | Cons |
|------|------|
| Decoupled from request lifecycle | No delivery guarantee (at-most-once with retries) |
| Consumer failures don't affect API | In-memory state lost on restart |
| Low operational overhead | No fan-out to multiple independent consumers per event |
| Proven pattern for this scale | Retry state not persisted across restarts |

**Chosen** because it matches the current operational scale, requires no additional
infrastructure, and is the standard integration pattern expected by third-party developers.

### Option C: Message queue (e.g. AWS SQS, RabbitMQ)

Route all events through a durable message broker. Consumers pull from the queue.

| Pros | Cons |
|------|------|
| At-least-once delivery guarantee | Significant operational overhead at current scale |
| Durable across backend restarts | Adds infrastructure dependency (SQS, managed broker) |
| Fan-out to multiple consumers | Increases deployment complexity |
| Dead-letter queues for failed messages | Overkill for < 50 events/minute |

**Not chosen** at this stage. A message queue is the correct long-term solution but introduces
unnecessary complexity before the platform reaches the scale that justifies it.

---

## Consequences

**Positive:**
- Zero additional infrastructure required — webhooks run in-process.
- Third-party developers get a standard, well-understood integration mechanism.
- Signature verification lets consumers authenticate deliveries without sharing credentials.
- Payload encryption protects sensitive financial data in transit beyond TLS.

**Negative / Trade-offs:**
- **At-most-once delivery.** If the backend process restarts while a retry is pending, that
  delivery is lost. Consumers must be prepared for missed events (e.g. by reconciling against
  the REST API periodically).
- **In-memory registry.** Webhook registrations are lost on restart. A persistent store
  (SQLite table or database) should be added before production hardening.
- **No fan-out.** A single event cannot be reliably delivered to many independent consumers
  without scaling the retry executor.
- **No event ordering guarantee.** Concurrent events may arrive at consumers out of order.

---

## Migration Path to a Message Queue

When the platform grows to a point where durable delivery and fan-out are required (indicative
trigger: > 500 loan events/minute, or enterprise SLA requirements), migrate as follows:

1. **Add an SQS queue** (or equivalent) alongside the existing webhook system.
2. **Publish events to SQS** from `fireWebhooks`, in addition to direct HTTP delivery.
3. **Add an SQS consumer** (Lambda or long-polling worker) that reads from the queue and fans
   out to registered consumers.
4. **Deprecate direct webhook delivery** once the queue-backed path is proven stable.
5. **Migrate registrations to a persistent store** (DynamoDB, RDS, or the existing SQLite DB)
   as part of step 1.

The `fireWebhooks` abstraction in `backend/src/webhooks.ts` provides a single insertion point
for this change — callers do not need to be updated.

Reference: [AWS SQS documentation](https://docs.aws.amazon.com/sqs/)

---

## Related Documents

- [Webhook Encryption](../WEBHOOK_ENCRYPTION.md) — AES-256-GCM encryption details
- [Webhook Retry](../WEBHOOK_RETRY.md) — retry policy and delivery log
- [ADR-002 — JWT Auth](ADR-002-jwt-auth.md) — authentication strategy
- [ADR-003 — SQLite](ADR-003-sqlite.md) — off-chain database (relevant for registry migration)
