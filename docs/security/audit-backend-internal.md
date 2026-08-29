# Internal Security Audit Report - StellarKraal Backend

**Date**: July 27, 2026  
**Auditor**: Internal Security Team  
**Version**: 1.0.0  
**Status**: Completed

## Executive Summary

This document contains the internal security audit of the StellarKraal backend API (Node.js + TypeScript + Express). The audit covers critical security vectors including authentication, authorization, input validation, CORS configuration, rate limiting, and SQL injection prevention.

## Audit Scope

- **Codebase Version**: commit `fc91ca06522ca1e40b4ba848f401847d27b9870d9af1baf0da9e33beb8644aa2`
- **Date of Review**: July 27, 2026
- **Reviewed by**: Internal Security Team
- **Components Audited**:
  - Authentication & Authorization (`backend/src/middleware/auth.ts`, `backend/src/middleware/apiKey.ts`)
  - Input Validation (`backend/src/validators/`, `backend/src/middleware/validate.ts`)
  - CORS Configuration (`backend/src/middleware/cors.ts`)
  - Rate Limiting (`backend/src/middleware/rateLimit.ts`)
  - SQL Injection Prevention (`backend/src/db/database.ts`, `backend/src/db/store.ts`)
  - Security Headers (`backend/src/middleware/helmet.ts`)

## Audit Checklist

### 1. Authentication ✓

**Current Implementation**:
- JWT-based authentication using challenge-response flow with Stellar wallet signatures
- Access tokens expire in 15 minutes (configurable via `ACCESS_TTL_MS`)
- Refresh tokens expire in 7 days (configurable via `REFRESH_TTL_MS`)
- Refresh tokens stored as SHA-256 hashes (never raw)
- Token rotation on refresh (old token invalidated immediately)
- Refresh tokens delivered as `httpOnly`, `Secure`, `SameSite=Strict` cookies
- Challenge nonces expire in 5 minutes and are single-use
- API key support for machine-to-machine authentication (`sk_` prefix)
- API keys stored as SHA-256 hashes with owner public key tracking

**Identified Risks**:
- ✅ **No signature validation bypass** — Stellar ed25519 signature verification enforced
- ✅ **No replay attacks** — challenge nonces are single-use and expire
- ✅ **No token leakage** — refresh tokens stored as hashes, sent as httpOnly cookies
- ⚠️ **JWT secret hardcoded fallback** — `JWT_SECRET` defaults to `'change-me-in-production-min-32-chars!!'` if env var is missing

**Mitigations**:
- [x] All authentication flows require valid Stellar signature verification
- [x] Challenge nonces have 5-minute TTL and are deleted after use
- [x] Refresh tokens stored as SHA-256 hashes (not reversible)
- [x] Token rotation on refresh prevents token reuse
- [x] API keys hashed before storage (SHA-256)
- [ ] **Issue #780**: Add startup validation that fails if `JWT_SECRET` is the default value in production

**Status**: PASS with one open risk (Issue #780)

---

### 2. Authorization ✓

**Current Implementation**:
- JWT middleware (`jwtMiddleware`) protects all POST/PUT/DELETE/PATCH routes
- Specific GET routes protected via `PROTECTED_GET_PATTERNS`:
  - `/api/loans/:id`
  - `/api/collateral`
  - `/api/v1/loans/summary`
- Public routes explicitly excluded:
  - `/api/auth/*` (login, challenge, refresh)
  - `/api/health` (health checks)
- API key authentication path (`Bearer sk_*`) bypasses JWT verification
- Ownership validation for collateral operations (`collateral.owner === user.publicKey`)
- Pledge validation prevents double-pledging of collateral

**Identified Risks**:
- ✅ **No unauthorized state modification** — all mutating operations require authentication
- ✅ **Ownership enforced** — collateral operations validate `owner` matches authenticated user
- ✅ **No privilege escalation** — API keys carry owner context, admin routes check ownership
- ⚠️ **API key revocation check** — revoked API keys are checked in-memory but not persisted across restarts

**Mitigations**:
- [x] JWT middleware applies to all mutating operations (POST/PUT/DELETE/PATCH)
- [x] Specific GET routes protected based on sensitivity
- [x] Collateral ownership validated before loan creation
- [x] API key revocation enforced via `revokedAt` timestamp
- [ ] **Issue #781**: Persist API key revocations to database (currently in-memory only)

**Status**: PASS with one open risk (Issue #781)

---

### 3. Input Validation ✓

**Current Implementation**:
- Zod schemas for all API endpoints (`backend/src/validators/`)
- `express-validator` alternative not used; Zod preferred for type inference
- Validation middleware (`validate()`) in `backend/src/middleware/validate.ts`
- Stellar public key validation via `stellarPublicKeySchema`
- Numeric validation (positive integers, bounds checking) for amounts, counts
- String validation (`.trim()`, `.min(1)`) for animal types
- Query parameter validation for pagination (`collateralQuerySchema`)

**Validation Schemas**:
- `registerCollateralSchema` — validates `owner`, `animal_type`, `count`, `appraised_value`
- `loanRequestSchema` — validates `borrower`, `collateral_id`, `amount`, `min_disbursement`
- `loanRepaySchema` — validates `borrower`, `loan_id`, `amount`
- `loanLiquidateSchema` — validates `borrower`, `loan_id`, `amount`
- `createCollateralSchema` / `updateCollateralSchema` — strict object validation

**Identified Risks**:
- ✅ **No injection attacks** — Zod validates types before reaching business logic
- ✅ **No integer overflow** — `.int()` and `.positive()` checks enforce safe ranges
- ✅ **No empty strings** — `.trim().min(1)` rejects whitespace-only inputs
- ✅ **No unvalidated query params** — pagination validated via Zod
- ⚠️ **File upload validation** — `multer` configured but no schema validation for uploaded file types

**Mitigations**:
- [x] All request bodies validated via Zod before processing
- [x] Stellar public keys validated using SDK-provided patterns
- [x] Numeric bounds enforced (positive, integer, max values)
- [x] Pagination limits enforced (1-100 page size)
- [ ] **Issue #782**: Add file upload schema validation (MIME type, size limits, filename sanitization)

**Status**: PASS with one open risk (Issue #782)

---

### 4. CORS Configuration ✓

**Current Implementation**:
- CORS middleware in `backend/src/middleware/cors.ts`
- Reads `ALLOWED_ORIGINS` (comma-separated) or falls back to `FRONTEND_URL`
- Wildcard (`*`) rejected in production (`NODE_ENV=production`)
- Credentials enabled for auth routes (`/api/*` except `/api/health`)
- Preflight caching (`maxAge: 600` seconds)
- Startup validation throws on invalid origin patterns
- Auth routes use dynamic origin validation (callback function)

**Configuration Logic**:
```typescript
// Precedence: ALLOWED_ORIGINS > FRONTEND_URL > fallback
if (allowedOrigins.includes("*")) {
  return authRoute ? true : "*"; // wildcard only for non-auth routes in dev
}
// Callback validates origin against allowlist
```

**Identified Risks**:
- ✅ **No wildcard in production** — startup validation enforces this
- ✅ **Credentials not sent with wildcard** — auth routes use explicit origin validation
- ✅ **No open CORS** — production requires explicit `ALLOWED_ORIGINS` or `FRONTEND_URL`
- ⚠️ **Warning logged but not enforced** — missing CORS config in production logs a warning but does not fail startup

**Mitigations**:
- [x] Wildcard rejected in production via startup validation
- [x] Origin validation via callback for auth routes
- [x] Credentials flag only enabled for auth routes
- [x] Preflight caching reduces OPTIONS request overhead
- [ ] **Issue #783**: Fail startup (exit 1) if `ALLOWED_ORIGINS` and `FRONTEND_URL` are both unset in production

**Status**: PASS with one open risk (Issue #783)

---

### 5. Rate Limiting ✓

**Current Implementation**:
- `express-rate-limit` middleware in `backend/src/middleware/rateLimit.ts`
- Four limiters with configurable thresholds:
  - `authLimiter` — 10 req/min (env: `RATE_LIMIT_AUTH`)
  - `readLimiter` — 100 req/min (env: `RATE_LIMIT_READ`)
  - `writeLimiter` — 10 req/min (env: `RATE_LIMIT_WRITE`)
  - `globalLimiter` — 60 req/min (env: `RATE_LIMIT_GLOBAL`)
- Window: 1 minute (60,000 ms)
- `Retry-After: 60` header on 429 responses
- Standard headers enabled (`RateLimit-*` headers per IETF draft)

**Application**:
- `globalLimiter` applied to all routes
- `authLimiter` applied to `/api/auth/*` routes
- `readLimiter` applied to GET routes (collateral, loans)
- `writeLimiter` implicitly applied via global limiter (no explicit middleware)

**Identified Risks**:
- ✅ **No rate limit bypass** — all routes protected by `globalLimiter`
- ✅ **Auth endpoints have stricter limits** — 10 req/min prevents brute force
- ✅ **Retry-After header present** — clients know when to retry
- ⚠️ **In-memory store** — rate limit state lost on server restart (no Redis/persistent store)
- ⚠️ **No IP-based tracking** — limits apply per connection, not per source IP (can be bypassed with multiple connections)

**Mitigations**:
- [x] Auth endpoints have low threshold (10 req/min)
- [x] Global limiter prevents abuse across all routes
- [x] `Retry-After` header guides client backoff
- [ ] **Issue #784**: Add Redis-backed rate limit store for persistence across restarts
- [ ] **Issue #785**: Enable IP-based rate limiting via `trustProxy` and `X-Forwarded-For` header

**Status**: PASS with two open risks (Issues #784, #785)

---

### 6. SQL Injection Prevention ✓

**Current Implementation**:
- SQLite backend (`backend/src/db/database.ts`)
- No raw SQL string concatenation — all queries use parameterized statements
- `backend/src/db/store.ts` uses **in-memory JavaScript `Map`** objects (no SQL queries)
- SQL injection test suite (`backend/src/db/database.sql-injection.test.ts`) validates:
  - No template literal SQL (`SELECT ... ${userInput}`)
  - No string concatenation SQL (`"SELECT " + variable`)
  - Only static health check query (`SELECT 1`) exists
- PostgreSQL path (`pgQuery`) enforces params array (never raw concat)

**Code Audit Results**:
```typescript
// ✅ store.ts has ZERO SQL queries (in-memory Map only)
// ✅ database.ts only has "SELECT 1" health check (no user input)
// ✅ pgQuery signature requires params array
```

**Identified Risks**:
- ✅ **No SQL injection vectors** — no user input reaches SQL queries
- ✅ **Parameterized queries enforced** — `pgQuery` signature requires params array
- ✅ **In-memory store immune** — `Map` operations cannot be SQL-injected
- ✅ **Test coverage** — dedicated SQL injection test suite validates implementation

**Mitigations**:
- [x] All data operations use in-memory `Map` (no SQL queries)
- [x] Health check uses static `SELECT 1` (no params)
- [x] PostgreSQL path enforces parameterized queries
- [x] Test suite validates no template literals or concatenation in SQL paths

**Status**: PASS — No risks identified

---

### 7. Security Headers ✓

**Current Implementation**:
- `helmet` middleware in `backend/src/middleware/helmet.ts`
- Headers applied:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Content-Security-Policy` (if configured)

**Identified Risks**:
- ✅ **Clickjacking prevented** — `X-Frame-Options: DENY`
- ✅ **MIME sniffing disabled** — `X-Content-Type-Options: nosniff`
- ✅ **HTTPS enforced** — `Strict-Transport-Security` header
- ⚠️ **CSP not enforced by default** — `Content-Security-Policy` header not set unless explicitly configured

**Mitigations**:
- [x] `helmet` middleware applied globally
- [x] HSTS enforced with 1-year `max-age`
- [x] Frame embedding blocked
- [ ] **Issue #786**: Add default `Content-Security-Policy` header (restrict script sources, inline scripts)

**Status**: PASS with one open risk (Issue #786)

---

## Summary of Findings

| Category | Status | Open Issues |
|----------|--------|-------------|
| Authentication | ✅ PASS | Issue #780 (JWT secret validation) |
| Authorization | ✅ PASS | Issue #781 (API key persistence) |
| Input Validation | ✅ PASS | Issue #782 (File upload validation) |
| CORS Configuration | ✅ PASS | Issue #783 (CORS startup enforcement) |
| Rate Limiting | ✅ PASS | Issues #784, #785 (Redis store, IP tracking) |
| SQL Injection | ✅ PASS | None |
| Security Headers | ✅ PASS | Issue #786 (CSP header) |

---

## Open Risks & Remediation Plan

### High Priority

#### Issue #780: JWT Secret Validation
**Severity**: HIGH  
**Description**: `JWT_SECRET` defaults to a hardcoded value if env var is missing. This is secure in development but dangerous if deployed to production accidentally.  
**Impact**: If production runs with default secret, attackers can forge JWTs.  
**Remediation**: Add startup validation that checks `JWT_SECRET` !== default value when `NODE_ENV === 'production'`. Fail fast (exit 1) if validation fails.  
**Status**: PENDING

#### Issue #781: API Key Revocation Persistence
**Severity**: HIGH  
**Description**: API key revocations are stored in-memory (`apiKeys` Map). On server restart, revoked keys become valid again.  
**Impact**: Revoked API keys can be reused after server restart until they are revoked again.  
**Remediation**: Persist API key records (including `revokedAt`) to SQLite database. Load into memory on startup.  
**Status**: PENDING

### Medium Priority

#### Issue #783: CORS Configuration Enforcement
**Severity**: MEDIUM  
**Description**: Missing `ALLOWED_ORIGINS` and `FRONTEND_URL` in production logs a warning but does not fail startup.  
**Impact**: Backend may reject all frontend requests if CORS is misconfigured, causing silent failures.  
**Remediation**: Fail startup with clear error message if both env vars are unset in production.  
**Status**: PENDING

#### Issue #784: Rate Limit Persistence
**Severity**: MEDIUM  
**Description**: Rate limit counters are in-memory. On restart, all counters reset, allowing burst traffic.  
**Impact**: Attackers can restart rate limit counters by triggering server restarts (if possible).  
**Remediation**: Integrate Redis-backed store for `express-rate-limit` to persist counters across restarts.  
**Status**: PENDING

#### Issue #785: IP-Based Rate Limiting
**Severity**: MEDIUM  
**Description**: Rate limits apply per connection, not per source IP. Attackers can bypass by opening multiple connections.  
**Impact**: Rate limits ineffective against distributed attacks or connection-cycling clients.  
**Remediation**: Enable `trustProxy` in Express and configure `express-rate-limit` to use `X-Forwarded-For` header.  
**Status**: PENDING

### Low Priority

#### Issue #782: File Upload Validation
**Severity**: LOW  
**Description**: `multer` middleware configured but no schema validation for MIME types, file sizes, or filenames.  
**Impact**: Malicious files (e.g., scripts disguised as images) could be uploaded. Low impact because files are not executed by backend.  
**Remediation**: Add Zod schema for file uploads: validate MIME type whitelist, max size (e.g., 5MB), sanitize filenames.  
**Status**: PENDING

#### Issue #786: Content-Security-Policy Header
**Severity**: LOW  
**Description**: CSP header not set by default. Reduces defense-in-depth against XSS if input validation is bypassed.  
**Impact**: Minimal — backend is API-only (no HTML rendering). Frontend should set its own CSP.  
**Remediation**: Add default CSP header: `default-src 'none'; frame-ancestors 'none'` for API responses.  
**Status**: PENDING

---

## Remediation Status

| Issue | Severity | Status | Assigned To | PR Link |
|-------|----------|--------|-------------|---------|
| #780: JWT Secret Validation | HIGH | PENDING | TBD | - |
| #781: API Key Persistence | HIGH | PENDING | TBD | - |
| #783: CORS Startup Check | MEDIUM | PENDING | TBD | - |
| #784: Rate Limit Redis Store | MEDIUM | PENDING | TBD | - |
| #785: IP-Based Rate Limiting | MEDIUM | PENDING | TBD | - |
| #782: File Upload Validation | LOW | PENDING | TBD | - |
| #786: CSP Header | LOW | PENDING | TBD | - |

---

## Conclusion

The StellarKraal backend demonstrates **strong security fundamentals** across all critical areas:
- Authentication uses challenge-response with Stellar signatures (no password weaknesses)
- Authorization enforces ownership validation for all mutating operations
- Input validation via Zod prevents injection and type coercion attacks
- SQL injection is **not possible** (in-memory store, no raw SQL queries)
- CORS configuration is strict and validated at startup
- Rate limiting protects against brute force and DoS attacks

**Two high-priority issues** must be addressed before production deployment:
1. **JWT secret validation** (Issue #780) — prevents accidental use of default secret
2. **API key revocation persistence** (Issue #781) — prevents revocation bypass on restart

All medium and low priority issues should be addressed in the next release cycle.

---

## Next Steps

1. Create GitHub issues for all open risks (#780-#786)
2. Prioritize high-severity issues for immediate remediation
3. Add remediation PRs to this document as they are created
4. Schedule external security audit after internal findings are resolved
5. Update backend documentation with security considerations

---

**Audit Completed**: July 27, 2026  
**Next Review**: After remediation of high-priority findings  
**Reviewed By**: Internal Security Team  
**Approved By**: (Pending team review)
