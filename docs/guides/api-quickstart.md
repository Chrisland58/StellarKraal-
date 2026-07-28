# API Quickstart

StellarKraal exposes a versioned REST API for livestock-backed lending on Stellar/Soroban.

## Base URL

- **Local:** `http://localhost:3001` (see `PORT` in `.env`)
- **Versioned prefix:** `/api/v1` (recommended for new integrations)
- **OpenAPI / Swagger UI:** `http://localhost:3001/api/docs` (served from `backend/openapi.json`)

## Authentication

Wallet-based JWT flow (challenge → sign → login). See [ADR-002: JWT-Based Authentication Strategy](../adr/ADR-002-jwt-auth.md).

- `GET /api/auth/challenge` — obtain a one-time challenge
- `POST /api/auth/login` — submit signature and receive JWT
- `POST /api/auth/refresh` — rotate tokens

Protected `POST`/`PUT`/`DELETE` routes require `Authorization: Bearer <token>` except `/api/auth/*`.

## Typical flow

1. Register collateral: `POST /api/v1/collateral/register` → unsigned XDR to sign with Freighter.
2. Request a loan: `POST /api/v1/loan/request`.
3. Monitor position: `GET /api/v1/loan/:id`, `GET /api/v1/health/:loanId`.
4. Repay: `POST /api/v1/loan/repay`.

Write endpoints return JSON with an `xdr` field for client-side signing and submission to the network.

## Rate limits

All clients are subject to per-IP rate limits (global, auth, and write tiers). See **[Rate limits](./rate-limits.md)** for limits, headers, and retry behavior.

## Further reading

- [Local development setup](../development/local-setup.md)
- [Troubleshooting](../troubleshooting.md)
- [Liquidation protocol](../protocol/liquidation.md)
