# ADR-009: API v2 Design — REST vs GraphQL vs tRPC

| Field       | Value                        |
|-------------|------------------------------|
| Status      | **Accepted**                 |
| Date        | 2026-08-29                   |
| Deciders    | StellarKraal Core Team       |
| Issue       | [#1103](https://github.com/teslims2/StellarKraal-/issues/1103) |
| Supersedes  | —                            |

---

## Context

StellarKraal's current API (`/api/v1/*`) is a set of plain Express REST endpoints that were
designed for rapid prototyping. As the product moves toward a production release, several pain
points have emerged:

1. **Over-fetching / under-fetching** — dashboard clients fetch entire loan objects when they
   only need a subset of fields, increasing payload size over slow mobile connections common in
   our target African markets.
2. **No type-safety across the boundary** — the TypeScript frontend has no compile-time
   guarantees that API shapes match what the backend actually returns.
3. **Versioning friction** — adding new fields requires duplicating or patching existing
   endpoint handlers, with no structured migration path.
4. **Schema documentation** — there is currently no machine-readable contract (OpenAPI, GraphQL
   schema, etc.) that third-party integrators can consume.

The team evaluated three alternatives for API v2.

---

## Options Considered

### Option A — REST (enhanced, OpenAPI-documented)

**Description:** Retain Express REST conventions but add:
- `zod`-based request/response validation exported as an OpenAPI 3.1 spec
- Versioned router (`/api/v2/*`)
- Consistent envelope `{ data, meta, errors }`

**Pros for StellarKraal:**
- Zero new runtime dependencies — the team already knows Express
- OpenAPI spec enables auto-generated client SDKs and Swagger UI for external integrators
- Easy to deploy behind the existing Nginx reverse proxy
- Incremental migration: v1 and v2 can coexist during transition
- Widest ecosystem support; well understood by community contributors

**Cons:**
- Over-fetching still possible for complex queries (e.g. dashboard page needs loan + health +
  collateral in a single render)
- Versioning discipline must be enforced manually
- No end-to-end type safety without additional codegen tooling

---

### Option B — GraphQL (Apollo Server)

**Description:** Replace REST endpoints with a single GraphQL endpoint. Types defined in SDL,
resolvers map to existing `db/store` functions. Apollo Studio for documentation.

**Pros for StellarKraal:**
- Precise field selection eliminates over-fetching — beneficial on low-bandwidth connections
- Self-documenting schema; introspection works out of the box
- Single endpoint simplifies API gateway / proxy config

**Cons:**
- Significant migration effort: all existing clients must be rewritten
- Apollo Server adds ~4–6 MB to the Docker image; a concern for low-resource deployment targets
- N+1 query problem requires `DataLoader` — adds complexity for a small team
- Mutations for on-chain actions (which require async Stellar transaction signing) do not map
  cleanly to GraphQL's synchronous request/response model
- Overkill for the current ~8 endpoints; GraphQL's value scales with query complexity
- Unfamiliar to the current team, increasing ramp-up time and review friction

---

### Option C — tRPC

**Description:** Replace Express REST with tRPC procedures shared between backend and Next.js
frontend. Types are inferred end-to-end; no schema file needed.

**Pros for StellarKraal:**
- Best-in-class end-to-end type safety with zero codegen — TypeScript infers procedure types
  automatically
- Rapid iteration: adding a new procedure requires one function definition
- Native React Query integration fits Next.js 14 data fetching patterns

**Cons:**
- **Tight coupling to the TypeScript/Next.js monorepo** — rules out any future non-TS client
  (mobile app, third-party integrator) without an additional adapter layer
- StellarKraal backend is currently a standalone Express service with its own `package.json`
  and Docker container; sharing tRPC router types across containers requires a monorepo
  restructure or a published shared package
- Incompatible with the planned external partner API (agri-insurers, MFIs) which will consume
  JSON/HTTP, not tRPC procedures
- Community/tooling ecosystem significantly smaller than REST or GraphQL
- Migration requires rewriting all existing `fetch` calls in the frontend

---

## Decision

**Option A — REST with OpenAPI documentation** is selected for API v2.

### Rationale

1. **Compatibility first.** StellarKraal targets external integrators (insurance companies,
   micro-finance institutions, mobile money operators) who expect conventional JSON/HTTP APIs.
   OpenAPI documentation provides a machine-readable contract they can immediately consume
   without onboarding to a GraphQL client or a tRPC monorepo.

2. **Incremental, low-risk migration.** The `/api/v1` routes continue to work during the
   transition; individual endpoints can be promoted to v2 one at a time after adding `zod`
   validation. No big-bang rewrite is needed.

3. **Team velocity.** The team is already proficient in Express and TypeScript. Introducing
   GraphQL or restructuring for tRPC would consume sprint capacity that is better spent on
   on-chain feature work and market testing.

4. **Payload concerns are addressed by pagination and projection params.** REST endpoints can
   accept `?fields=` query parameters and return paginated responses, which resolves the
   over-fetching concern without the operational overhead of GraphQL.

5. **Docker image size matters.** Deployment targets include resource-constrained VPS instances
   in West and East Africa. Keeping the backend image lean (no Apollo runtime) directly supports
   the infrastructure strategy.

---

## Consequences

### Positive
- External partners can integrate using any HTTP client or auto-generated SDK from the OpenAPI
  spec.
- `zod` schemas serve as the single source of truth for both runtime validation and TypeScript
  types, reducing schema drift.
- Swagger UI (`/api/docs`) provides self-serve documentation for the development team and
  external evaluators.

### Negative / Trade-offs
- Over-fetching on complex dashboard views is not eliminated, only mitigated. If data access
  patterns grow significantly more complex, GraphQL can be re-evaluated.
- Manual versioning discipline is required; a `/api/v3` migration will need the same ADR
  process.

### Neutral
- The `/api/v1` router remains in place with a deprecation notice added to each endpoint
  response header (`Deprecation: true`, `Sunset: 2027-03-01`).
- A migration guide will be published alongside the v2 release.

---

## Implementation Plan

| Step | Owner | Target Sprint |
|------|-------|--------------|
| Add `zod` to backend dependencies | Backend lead | Sprint 14 |
| Define shared `zod` schemas for all request/response shapes | Backend lead | Sprint 14 |
| Implement `/api/v2` router with validated handlers | Backend lead | Sprint 15 |
| Generate OpenAPI 3.1 spec via `zod-to-openapi` | Backend lead | Sprint 15 |
| Serve Swagger UI at `/api/docs` | Backend lead | Sprint 15 |
| Update frontend `fetch` calls to `/api/v2` | Frontend lead | Sprint 16 |
| Add `Deprecation` headers to all `/api/v1` routes | Backend lead | Sprint 16 |

---

## References

- [OpenAPI Specification 3.1](https://spec.openapis.org/oas/v3.1.0)
- [zod documentation](https://zod.dev)
- [zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi)
- [GraphQL vs REST for microservices (thoughtworks.com)](https://www.thoughtworks.com/radar)
- [tRPC documentation](https://trpc.io/docs)
- Existing backend: `backend/src/routes/v1.ts`
- Existing frontend API calls: `frontend/src/components/LoanForm.tsx`, `RepayPanel.tsx`
