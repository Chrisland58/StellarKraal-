# ADR-008: Webhook-Based Event Delivery for Loan Lifecycle Notifications

**Date:** 2026-07-26  
**Status:** Accepted

## Context

StellarKraal's loan lifecycle produces critical state transitions — a loan is approved, activated, repaid, or liquidated — that downstream systems (risk monitors, accounting services, borrower notification tools, third-party integrators) need to react to promptly. These systems are external to the StellarKraal backend and run in separate processes, often across network boundaries.

Before this ADR, the only way for external systems to learn about loan state changes was to **poll the backend API** for status updates. This has several problems:

- **Latency:** Polling intervals create a gap between the actual event and the consumer's awareness. A loan being liquidated might go unnoticed for minutes.
- **Wasted load:** Most poll requests return "no change," consuming backend resources and network bandwidth for no productive result.
- **Consumer complexity:** Each integration must implement polling logic, deduplication, and backoff — boilerplate that every consumer duplicates independently.
- **No delivery guarantee:** Polling is inherently "at most once" — if a consumer is down during a poll window, the event is silently lost.

The webhook system was implemented (in `backend/src/webhooks.ts`) to address these problems without a recorded architectural decision. This ADR captures the why, the design choices, and the trade-offs so that contributors and forks understand the webhook subsystem without reverse-engineering the code.

## Decision

We adopt **HTTP webhook callbacks** as the primary mechanism for pushing loan lifecycle events to external consumers.

### Event model

When a loan state transition occurs, the backend fires an event to all registered webhook URLs. The current event types are:

| Event | Fired from | When |
|-------|-----------|------|
| `loan.approved` | `services/loanService.ts` → `requestLoan()` | Loan request transaction is built |
| `loan.repaid` | `services/loanService.ts` → `repayLoan()` | Repayment transaction is built |
| `loan.liquidated` | `services/loanService.ts` → `liquidateLoan()` | Liquidation transaction is built |
| `loan.activated` | Contract event listener | On-chain loan activation confirmed |

### Payload format

Every delivery is a JSON POST body with the following envelope:

```json
{
  "event": "loan.approved",
  "payload": {
    "borrower": "GABC...",
    "collateral_ids": [1, 2],
    "amount": 1000
  },
  "timestamp": 1690000000000
}
```

- `event` — the event type string (e.g. `loan.approved`).
- `payload` — event-specific data object.
- `timestamp` — Unix epoch milliseconds when the event was generated.

For webhooks registered with `encrypt: true`, the body instead contains:

```json
{
  "event": "loan.approved",
  "encrypted_payload": "hex...",
  "iv": "hex...",
  "auth_tag": "hex...",
  "timestamp": 1690000000000
}
```

The plaintext payload is encrypted with AES-256-GCM using a key derived from the webhook secret via HKDF-SHA256. Receivers decrypt with the same secret returned at registration time.

### Delivery and retry strategy

Each delivery is an HTTP POST with:

- `Content-Type: application/json`
- `X-StellarKraal-Signature: sha256=<hex>` — HMAC-SHA256 of the raw JSON body using the per-webhook secret. Receivers **must** verify this header before processing.

Retry behavior:

- **Maximum 5 attempts** per delivery.
- **Exponential backoff:** delay = `2^attempt × 1000ms` (1s, 2s, 4s, 8s, 16s).
- **No dead-letter queue:** after 5 failed attempts, the delivery is abandoned. The `DeliveryLog` retains the final error for inspection.
- **Fire-and-forget:** `fireWebhooks()` returns immediately after scheduling; delivery runs asynchronously via `setTimeout`.

### Registration and management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/webhooks` | POST | Register a new webhook URL. Returns `{ id, url, secret, createdAt }`. The `secret` is returned **once** — store it securely. |
| `/api/v1/webhooks/:id` | DELETE | Deregister a webhook by ID. Returns 204 on success, 404 if not found. |
| `/api/v1/admin/webhooks` | GET | List all registered webhooks (secret omitted). |
| `/api/v1/admin/webhooks/logs` | GET | List recent delivery log entries (webhookId, event, attempts, lastStatus, lastError, deliveredAt). |

### Security model

- **HMAC-SHA256 signature verification:** Each delivery includes `X-StellarKraal-Signature` computed as `sha256=<hex>` over the raw body using the per-webhook secret. Receivers should use `timingSafeEqual` to compare signatures.
- **Optional AES-256-GCM encryption:** Webhooks registered with `encrypt: true` encrypt the payload body. The encryption key is derived from the registration secret via HKDF-SHA256. This provides confidentiality for payloads traversing untrusted networks.
- **One-time secret:** The HMAC secret is returned only at registration time and is never stored in a retrievable form. This limits the blast radius of a webhook store compromise — the store holds IDs and URLs but not the secrets needed to forge signatures.
- **URL validation:** Registration rejects non-HTTP/HTTPS URLs and invalid URL formats, preventing SSRF-style abuse at the registration boundary.

## Alternatives Considered

| Option | Reason not chosen |
|--------|-------------------|
| **Server-Sent Events (SSE)** | SSE requires a persistent HTTP connection between the consumer and the backend. This is viable for same-server or same-network consumers but fails for cross-network integrations where firewalls, load balancers, and connection timeouts make long-lived connections unreliable. SSE also does not survive backend restarts — all connected consumers are disconnected and must reconnect. Webhooks use standard request/response HTTP that works through any network topology and does not require connection state. |
| **GraphQL subscriptions** | GraphQL subscriptions (WebSocket-based) would provide real-time event delivery with typed schemas. However, they require the backend to maintain WebSocket connections and GraphQL subscription infrastructure, adding significant complexity to the backend. The StellarKraal backend is a REST API; adding a GraphQL layer solely for webhook-style events would introduce a second API paradigm, a WebSocket server, and a dependency on a GraphQL subscription library — all to solve a problem that HTTP POST already solves simply. Consumers would also need a GraphQL client, raising the integration barrier. |
| **Message queue (RabbitMQ, Kafka)** | A message queue would decouple event production from delivery, provide durable message storage, dead-letter queues, and consumer groups. This is the right architecture at scale, but introduces a heavy infrastructure dependency (running and maintaining a message broker) that is not justified at the current scale. The in-memory webhook store with delivery logs provides the same visibility without infrastructure overhead. If the protocol scales to thousands of consumers per event type, this should be revisited. |
| **Pull-based polling with ETags** | ETag-based conditional polling reduces bandwidth but does not solve the latency problem (consumers still poll at intervals) or the delivery guarantee problem (events can be missed between polls). It adds HTTP caching complexity without addressing the core motivation. |
| **Email / SMS notifications** | Narrower than webhooks — serves end-user notifications but cannot integrate with arbitrary backend systems. Webhooks are a general-purpose primitive; email/SMS can be built on top of them by registering a webhook URL that forwards to an email/SMS service. |

## Consequences

**Positive:**

- External systems receive events in real time (sub-second after the state transition) without polling infrastructure.
- The HMAC signature scheme provides strong message authentication — consumers can trust that a delivery originated from StellarKraal and was not tampered with in transit.
- The optional encryption mode provides confidentiality for sensitive loan data (borrower keys, amounts) without requiring TLS at the transport layer, useful for consumers behind strict network policies.
- Delivery logs (`/admin/webhooks/logs`) provide operational visibility into delivery success rates, retry exhaustion, and error patterns — enabling monitoring and alerting without additional tooling.
- The registration model (URL + one-time secret) is simple enough for third-party integrators to adopt in minutes while maintaining cryptographic security.
- Fire-and-forget async delivery keeps the hot path (loan request, repayment, liquidation) unblocked by slow or unavailable consumers.

**Negative / Trade-offs:**

- **No dead-letter queue:** after 5 failed retries, the event is silently lost. Consumers must implement their own reconciliation (e.g. polling the loan status API periodically) to catch missed events. This is acceptable at current scale but should be replaced with a durable queue when reliability requirements increase.
- **In-memory storage:** the webhook registry and delivery logs live in process memory and are lost on restart. This is acceptable for a single-instance deployment but will need a database-backed store for multi-instance or horizontally scaled deployments.
- **No per-event filtering:** consumers receive all event types and must filter client-side. A future improvement could add topic-based filtering at registration time (e.g. only `loan.liquidated`).
- **No delivery ordering guarantee:** concurrent state transitions may result in out-of-order deliveries (e.g. `loan.repaid` arriving before `loan.approved`). Consumers should use the `timestamp` field and event type to handle ordering.
- **Admin endpoints are unprotected:** `GET /api/v1/admin/webhooks` and `GET /api/v1/admin/webhooks/logs` have no authentication middleware. At production scale, these should be gated behind admin JWT auth.

## Security Considerations

- **Signature verification is mandatory:** consumers must verify `X-StellarKraal-Signature` using the per-webhook secret before processing any payload. Failure to do so allows an attacker who discovers the webhook URL (but not the secret) to inject forged events.
- **Timing-safe comparison:** signature verification must use `crypto.timingSafeEqual` to prevent timing side-channel attacks that could leak the expected signature.
- **One-time secret exposure:** the secret is returned only at registration. If a consumer loses it, the webhook must be deleted and re-registered. There is no secret rotation mechanism — noted as a future improvement.
- **Encrypted payload mode:** AES-256-GCM encryption protects payload confidentiality. The key is derived from the same registration secret via HKDF-SHA256, so compromising the secret compromises both the signature and the encryption. This is by design — the secret is the single trust anchor.
- **URL validation:** registration rejects non-HTTP/HTTPS protocols and malformed URLs, but does not validate that the URL is reachable or that it points to a legitimate service. An attacker who controls the webhook URL receives all events (including encrypted ones) and can attempt to decrypt them if they also compromise the secret.
- **Webhook store compromise:** if the in-memory store is compromised (e.g. via a process memory dump), the attacker gains webhook IDs and URLs but not secrets. The attacker can deregister webhooks (causing denial of delivery) but cannot forge signatures.
- **Retry back-pressure:** the exponential backoff (up to 16s) means a slow or unavailable consumer can cause up to ~31 seconds of async delivery attempts per event. At high event rates, this can create memory pressure from queued delivery promises. The current implementation does not bound the number of concurrent deliveries.

## Notes

- Implementation: `backend/src/webhooks.ts` — registration, delivery, encryption, retry logic.
- Route registration: `backend/src/routes/v1.ts` — POST/DELETE/GET endpoints.
- Events fired from: `backend/src/services/loanService.ts` — `requestLoan()`, `repayLoan()`, `liquidateLoan()`.
- Tests: `backend/src/webhooks.test.ts` (unit), `backend/src/webhooks.encryption.test.ts` (encryption round-trip), `backend/src/webhooks.events.test.ts` (event type integration).
- Related: [ADR-002](ADR-002-jwt-auth.md) (authentication strategy — webhooks use a separate HMAC model, not JWT).
- **Future improvements to consider:** durable storage (database-backed registry and logs), per-event topic filtering, delivery ordering guarantees, admin auth on management endpoints, secret rotation, dead-letter queue integration.
