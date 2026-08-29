# Tutorial: Integrating an External App with the StellarKraal API

This walks through using the StellarKraal backend API from an external application: registering
livestock collateral, requesting a loan, and monitoring loan status changes via webhooks instead
of polling.

All endpoints below are relative to the backend base path `/api/v1` (e.g.
`http://localhost:3001/api/v1` in local development).

## 1. Register collateral

```http
POST /api/v1/collateral/register
Content-Type: application/json

{
  "owner": "GABCD...WXYZ",
  "animal_type": "cattle",
  "count": 5,
  "appraised_value": 2500
}
```

- `owner` — the borrower's Stellar public key.
- `animal_type` — free-text species/category.
- `count` — number of animals in this collateral batch (positive integer).
- `appraised_value` — appraised value in the platform's base currency unit (positive integer).

A successful response returns the created collateral record, including its `id`, which you'll
need to look it up later via `GET /api/v1/collateral/:id`.

To register multiple batches in one call, use `POST /api/v1/collateral/register/batch` with
`{ "items": [ { ... }, { ... } ] }` (up to 50 entries).

## 2. Request a loan against the collateral

```http
POST /api/v1/loan/request
Content-Type: application/json

{
  "collateral_id": "<id from step 1>",
  "borrower": "GABCD...WXYZ",
  "amount": 1000
}
```

The loan is created on-chain via the Soroban contract; the response includes the loan `id` and
transaction result. You can fetch current on-chain loan state at any time with:

```http
GET /api/v1/loan/:id
GET /api/v1/health/:loanId   # health factor
```

Polling these endpoints works, but for production integrations prefer webhooks (below) so your
app is notified the moment loan state changes instead of on a polling interval.

## 3. Subscribe to loan status changes via webhooks

Register a webhook endpoint on your side to receive delivery of loan lifecycle events:

```http
POST /api/v1/webhooks
Content-Type: application/json

{ "url": "https://your-app.example.com/hooks/stellarkraal", "encrypt": false }
```

Response:

```json
{ "id": "wh_...", "url": "https://your-app.example.com/hooks/stellarkraal", "secret": "...", "createdAt": 1732000000000 }
```

Store `secret` securely — it is returned once and is required to verify deliveries. If you set
`"encrypt": true`, payloads are additionally encrypted with AES-256-GCM; see
[docs/WEBHOOK_ENCRYPTION.md](../WEBHOOK_ENCRYPTION.md) for the format and key derivation.

### Events you'll receive

Deliveries are `POST`ed to your `url` with a body like:

```json
{ "event": "loan.repaid", "payload": { "loanId": "...", "borrower": "GABCD...", "amount": 500, "timestamp": 1732000000000 }, "timestamp": 1732000000000 }
```

Loan lifecycle events include `loan.activated`, `loan.repaid`, and `loan.liquidated`. For the
full set of on-chain event schemas the backend listens for, see
[docs/protocol/events.md](../protocol/events.md).

### Verifying delivery authenticity

Every delivery includes an `X-StellarKraal-Signature` header. Verify it before trusting the
payload:

```js
const crypto = require("crypto");

function isValid(rawBody, signatureHeader, secret) {
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
}
```

Deliveries retry with backoff on failure; see [docs/WEBHOOK_RETRY.md](../WEBHOOK_RETRY.md) for
retry counts/timing and [docs/WEBHOOK_ENCRYPTION.md](../WEBHOOK_ENCRYPTION.md) for the encrypted
payload format.

### Managing your webhook

```http
GET    /api/v1/admin/webhooks         # list registered webhooks
GET    /api/v1/admin/webhooks/logs    # delivery attempt logs
DELETE /api/v1/webhooks/:id           # unregister
```

## Summary

1. `POST /api/v1/collateral/register` to register livestock as collateral.
2. `POST /api/v1/loan/request` to request a loan against it.
3. `POST /api/v1/webhooks` once, up front, to receive `loan.activated` / `loan.repaid` /
   `loan.liquidated` events instead of polling `GET /api/v1/loan/:id`.
4. Verify each delivery's `X-StellarKraal-Signature` before acting on it.
