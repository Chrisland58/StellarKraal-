# API Pagination Guide

The StellarKraal API uses **page/offset-based pagination** on all list endpoints. This guide explains the pagination model, the request and response shape, how to iterate through all pages, and why this approach was chosen.

---

## Pagination Model

List endpoints accept two optional query parameters:

| Parameter | Type | Default | Maximum | Description |
|-----------|------|---------|---------|-------------|
| `page` | integer | `1` | — | 1-indexed page number |
| `pageSize` / `limit` | integer | `20` | `100` | Records to return per page |

Both `pageSize` and `limit` are accepted as aliases; `pageSize` is the preferred name for new integrations. The server caps any value above `100` at `100` regardless of what is sent.

Every list response includes a pagination envelope:

```json
{
  "api_version": "v1",
  "data": [...],
  "total": 87,
  "page": 2,
  "limit": 20,
  "pageSize": 20
}
```

| Field | Type | Description |
|-------|------|-------------|
| `data` | array | Records for this page |
| `total` | integer | Total matching records (across all pages) |
| `page` | integer | Current page number (1-indexed) |
| `limit` | integer | Page size used for this request |
| `pageSize` | integer | Same as `limit`; present for consistency |

---

## Why Page/Offset Pagination

The API uses page/offset rather than cursor-based pagination for the following reasons:

**Random-access by page number.** Offset pagination lets callers jump directly to any page (e.g. "page 5 of 10") and supports UI patterns such as numbered pagers. Cursor-based pagination only supports sequential forward/backward traversal.

**Simpler implementation for the current dataset size.** All paginated collections (loans, collateral, transactions, audit entries) are stored in-memory or in a single SQLite/PostgreSQL table scoped to a single user. Row counts are small enough that offset scans are not a performance concern.

**Stable ordering within a request.** Results are sorted by creation date descending (newest first) and the sort is stable, so the same `page=N&limit=M` request returns the same records unless the underlying data has changed.

**When to prefer cursor pagination.** Cursor-based pagination avoids "page drift" — the problem where inserting a new record between requests shifts which rows fall on each page. If the API evolves to serve very large, frequently-updated collections, cursors should be considered. See the trade-off table below.

| Property | Page/offset (current) | Cursor-based |
|----------|-----------------------|--------------|
| Jump to arbitrary page | ✅ Yes | ❌ No |
| Total count available | ✅ Yes | ❌ Not always |
| Stable under inserts | ❌ Page drift possible | ✅ Stable |
| Efficient on large tables | ❌ OFFSET scans slow | ✅ Indexed seek |
| Implementation complexity | Low | Higher |

---

## Example: List Loans

### Request — first page

```http
GET /api/v1/loans?page=1&pageSize=5
Authorization: Bearer <token>
```

### Response

```json
{
  "api_version": "v1",
  "data": [
    {
      "id": "loan-042",
      "borrower": "GCKFBEIYV2U22IO2BJ4KVJOIP7XPWQGQFKKWXR6DUOLAHCI23CMFEFZ",
      "collateral_id": "col-017",
      "amount": 5000000,
      "status": "active",
      "createdAt": "2026-07-20T14:32:00.000Z"
    },
    {
      "id": "loan-041",
      "borrower": "GCKFBEIYV2U22IO2BJ4KVJOIP7XPWQGQFKKWXR6DUOLAHCI23CMFEFZ",
      "collateral_id": "col-015",
      "amount": 3000000,
      "status": "repaid",
      "createdAt": "2026-07-18T09:10:00.000Z"
    }
    // ... 3 more records
  ],
  "total": 42,
  "page": 1,
  "limit": 5,
  "pageSize": 5
}
```

### Request — next page

```http
GET /api/v1/loans?page=2&pageSize=5
Authorization: Bearer <token>
```

Increment `page` by 1. The response shape is identical; `data` contains the next 5 records.

---

## Example: List Collateral with Filters

Pagination parameters can be combined with filter parameters:

```http
GET /api/v1/collateral?status=registered&page=1&limit=20
Authorization: Bearer <token>
```

Available filters vary by endpoint — see the [OpenAPI spec](http://localhost:3001/api/docs) for the full parameter list per route.

---

## Iterating Through All Pages

To fetch all records, loop until `data` is empty or you have accumulated `total` records:

```typescript
async function fetchAllLoans(token: string): Promise<Loan[]> {
  const PAGE_SIZE = 100; // use maximum page size for efficiency
  const all: Loan[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `/api/v1/loans?page=${page}&pageSize=${PAGE_SIZE}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const body = await res.json();

    all.push(...body.data);

    // Stop when we have all records or received an empty page
    if (all.length >= body.total || body.data.length === 0) {
      break;
    }
    page++;
  }

  return all;
}
```

You can also calculate the total number of pages upfront:

```typescript
const totalPages = Math.ceil(total / pageSize);
```

---

## Deprecation Warning — Unpaginated Requests

Calling `GET /api/v1/loans` **without** any pagination parameters returns all loans but includes a deprecation header:

```
Deprecation: true
Sunset: Tue, 31 Dec 2026 23:59:59 GMT
Warning: 299 - "Unpaginated loan listing is deprecated; use ?page=1&pageSize=20"
Link: </api/v1/loans?page=1&pageSize=20>; rel="successor-version"
```

Always pass explicit `page` and `pageSize` parameters. Unpaginated requests will stop working after the sunset date.

---

## Validation Errors

The API returns `400 Bad Request` with a `{ "error": "..." }` body for invalid pagination parameters:

| Condition | Error message |
|-----------|---------------|
| `page` is not a positive integer | `"Invalid pagination parameters"` |
| `limit`/`pageSize` is not a positive integer | `"Invalid pagination parameters"` |
| `page` or `limit` is not a number | `"Invalid pagination parameters"` |
| `status` filter is not a valid value | `"status must be one of: pending, active, at_risk, repaid, liquidated"` |
| `from`/`to` date is not a valid ISO date | `"from must be a valid ISO date"` / `"to must be a valid ISO date"` |

Example error response:

```json
{
  "api_version": "v1",
  "error": "Invalid pagination parameters"
}
```

---

## Paginated Endpoints

| Endpoint | Filters available |
|----------|-------------------|
| `GET /api/v1/loans` | `status`, `borrowerAddress`, `from`, `to` |
| `GET /api/v1/collateral` | `status`, `ownerId` |
| `GET /api/v1/transactions` | `type`, `loanId`, `collateralId`, `from`, `to` |
| `GET /api/v1/admin/audit` | `action`, `actorId`, `from`, `to` (90-day range limit) |

---

## Further Reading

- [API Quickstart](api-quickstart.md) — Base URL, auth flow, and common operations.
- [OpenAPI spec](http://localhost:3001/api/docs) — Full parameter reference for every endpoint.
- [Rate limits](rate-limits.md) — Global, auth, read, and write tiers; headers and retry behavior.
