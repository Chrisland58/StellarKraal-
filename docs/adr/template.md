# Architecture Decision Record — Template & Guide

This document serves two purposes:

1. **How-to guide** — explains when to write an ADR, what goes in each section, and how the review process works.
2. **Blank template** — copy the "Blank Template" section at the bottom to start a new ADR.

---

## How-to Guide

### What is an ADR?

An Architecture Decision Record (ADR) is a short document that captures a significant technical decision: the context that led to it, what was decided, what alternatives were considered, and the consequences.

ADRs are immutable once accepted. If a decision is reversed, the old ADR is marked **Superseded** and a new one is written.

---

### When to Write an ADR

Write an ADR whenever a change:

| Scenario | ADR required? |
|----------|---------------|
| Alters the Soroban contract's public ABI (adds/removes/renames a `#[contractimpl]` function) | ✅ Yes |
| Changes persistent storage layout (adds or renames a `DataKey` variant) | ✅ Yes |
| Introduces a new oracle, price feed, or liquidation mechanism | ✅ Yes |
| Modifies governance or admin controls (pause, upgrade, admin transfer) | ✅ Yes |
| Involves a breaking protocol change requiring a migration guide | ✅ Yes |
| Selects a new runtime dependency or third-party service that the team will rely on long-term | ✅ Yes |
| Adds a new error code or adjusts a non-breaking constant | ❌ No (clear PR description is enough) |
| Fixes a bug or improves test coverage without changing API shape | ❌ No |
| Makes a documentation-only change | ❌ No |

If you are unsure, open a discussion on the PR and ask a maintainer.

---

### Section-by-Section Guidance

#### Title

Use the format `ADR-NNN: Short descriptive title`. Increment NNN from the last ADR in `docs/adr/`.

#### Date

The date you opened the PR proposing the ADR (`YYYY-MM-DD`).

#### Status

One of:

| Value | Meaning |
|-------|---------|
| `Proposed` | PR is open; decision not yet merged |
| `Accepted` | Merged; decision is in force |
| `Deprecated` | Decision was reversed, but no replacement ADR exists |
| `Superseded by ADR-NNN` | Replaced by a newer ADR; link to it |

Start all new ADRs with **Proposed**. Change to **Accepted** when the PR is merged (or when the team explicitly agrees).

#### Context

One to three paragraphs explaining:

- What problem or situation led to this decision.
- Any constraints (technical, business, regulatory, timeline).
- What would happen if no decision were made.

Keep this factual and concise. Do not argue for the chosen option here — save that for Consequences.

#### Decision

State the decision in one or two sentences: _"We will use X."_ Be direct. This is the most important part of the ADR.

If the decision is conditional (e.g. _"We will use X unless Y"_), say so explicitly.

#### Alternatives Considered

List every option that was seriously evaluated. For each, explain why it was not chosen. Entries should be brief — two or three sentences each. This section prevents future contributors from re-opening discussions that have already been had.

| Option | Reason not chosen |
|--------|-------------------|
| Option A | … |
| Option B | … |

#### Consequences

Split into Positive and Negative/Trade-offs subsections. Be honest about the downsides — that is what makes an ADR credible and useful.

**Positive** — what this decision enables, simplifies, or fixes.

**Negative / Trade-offs** — what becomes harder, more expensive, or less flexible. Include any migration cost, performance impact, or new operational burden.

---

### Review Process

1. **Open a PR** with the new ADR file. Set status to **Proposed**.
   - File name: `docs/adr/ADR-NNN-short-title.md`
   - Add a row to the ADR table in [`README.md`](../../README.md#architecture-decision-records).
   - Reference the ADR in the PR description.

2. **Assign reviewers.** ADRs that affect the Soroban contract require at least one maintainer with contract expertise. ADRs that affect the backend or frontend require one domain reviewer each.

3. **Discussion period.** Allow at least 48 hours for asynchronous review. Significant decisions should stay open for one week.

4. **Resolve feedback.** Update the ADR based on reviewer comments. Do not force-push history; add new commits.

5. **Merge.** Change status to **Accepted** in the same commit that merges the PR.

6. **Superseding an ADR.** If a new decision replaces an old one:
   - Change the old ADR's status to `Superseded by ADR-NNN`.
   - Reference the old ADR in the new ADR's Context section.

---

## Filled Example ADR

The following is a complete, realistic example that demonstrates all required sections. It is illustrative — it does not reflect an actual pending decision.

---

# ADR-010: Use Redis for Session-Based Rate-Limit State

**Date:** 2026-07-01  
**Status:** Accepted

## Context

The current in-process rate limiter stores counters in a JavaScript `Map` that lives in the backend process memory. This works for a single-instance deployment, but the staging and production environments run two or more backend containers behind an ALB. Each container keeps its own counter, which means a single client can send `N × limit` requests per window (one limit per container) without triggering the rate limit.

As we scale to three ECS Fargate tasks for the backend, the observed bypass rate in load tests exceeded 2× the intended threshold. The fix must work across all running instances without requiring a synchronous call that adds significant latency to every request.

## Decision

We will store rate-limit counters in Redis using the existing `ioredis` client already present in `backend/src/`. Counter keys will expire automatically using Redis TTL, and each container will read/write the shared counter on every request that is subject to rate limiting.

## Alternatives Considered

| Option | Reason not chosen |
|--------|-------------------|
| Sticky sessions (ALB session affinity) | Routes each client to the same container, but breaks on container restarts and increases hot-spot risk under bursty traffic. Does not scale beyond the current number of containers. |
| Database-backed counters (SQLite / Postgres) | Durable but adds a write to the primary database on every request. The additional write load was measured at ~800 extra writes/second under peak traffic, which would exceed the SQLite write throughput budget. |
| Distributed lock with optimistic retry | Correct but requires retries that add latency spikes. Redis atomic INCR+EXPIRE eliminates the need for locking. |
| Move rate limiting to the ALB / WAF layer | Would require AWS WAF (additional cost) and makes per-endpoint limits harder to configure in code. |

## Consequences

**Positive:**
- Rate-limit enforcement is consistent across all backend replicas.
- Redis INCR is O(1) and adds < 1 ms of latency in the same availability zone.
- Counter TTL is managed automatically by Redis; no background cleanup job needed.
- The `ioredis` client is already a production dependency — no new library introduced.
- Redis can be shared with the session store and future caching layers.

**Negative / Trade-offs:**
- Redis becomes a new required infrastructure dependency. If Redis is unavailable, the rate limiter must fail open (allow all requests) or fail closed (block all requests). We will fail open with a logged alert to avoid outage cascades.
- Local development now requires a Redis instance. `docker-compose.yml` will be updated to include a Redis service; developers without Docker must install Redis manually.
- Adds operational overhead: Redis needs monitoring, backups (AOF), and a restart policy in ECS.
- Counter values are lost on a Redis restart unless AOF persistence is enabled. A brief window of under-enforcement after a restart is acceptable given the security model.

---

## Blank Template

Copy the section below into a new file `docs/adr/ADR-NNN-short-title.md`, increment NNN, and fill in all sections.

```markdown
# ADR-NNN: Title

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Deprecated | Superseded by [ADR-NNN](ADR-NNN-title.md)

## Context

What is the issue or situation that motivates this decision?

## Decision

What was decided?

## Alternatives Considered

| Option | Reason not chosen |
|--------|-------------------|
| Option A | … |
| Option B | … |

## Consequences

**Positive:**
- …

**Negative / Trade-offs:**
- …
```

After creating the file:

1. Add a row to the ADR table in [`README.md`](../../README.md#architecture-decision-records).
2. Set the status to **Proposed** and open a PR.
3. Follow the [Review Process](#review-process) above.
