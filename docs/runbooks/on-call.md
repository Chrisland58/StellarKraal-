# On-Call Incident Response Runbook

This runbook covers the four most common production incidents for StellarKraal on-call engineers. Each section follows the same structure: **detection signals → investigation steps → mitigation actions → escalation path**.

For rotation schedule, SLAs, alert channels, and post-incident review process see [docs/ON_CALL_ROTATION.md](../ON_CALL_ROTATION.md).

---

## Quick Reference

| Incident | Alert rule | Runbook section |
|----------|-----------|----------------|
| Soroban RPC outage | `rpc-failure`, `rpc-circuit-open` | [RPC Outage](#1-rpc-outage) |
| Contract error spike | `5xx-spike` | [Contract Error Spike](#2-contract-error-spike) |
| DB connection exhaustion | `db-error`, `DbPoolExhaustion` | [DB Connection Exhaustion](#3-db-connection-exhaustion) |
| High liquidation rate | `liquidation-failure` | [High Liquidation Rate](#4-high-liquidation-rate) |

---

## 1. RPC Outage

### Description

The backend cannot reach the Soroban JSON-RPC node (`RPC_URL`). All write operations (collateral registration, loan requests, repayments, liquidations) that require XDR construction will fail. Read operations that hit the chain (health factor checks) will also fail.

### Detection Signals

| Signal | Where to look |
|--------|--------------|
| `rpc-failure` or `rpc-circuit-open` alert in `#alerts` | Slack |
| `rpc_call_duration_seconds` histogram goes silent or spikes | Grafana → **StellarKraal Backend** → *RPC Call Latency (p95)* panel |
| Errors containing `fetch failed`, `ECONNREFUSED`, or `Cannot connect to RPC_URL` | Grafana → **StellarKraal Logs** → *RPC Failures* panel — LogQL: `{service="backend"} \|= "rpc" \|= "error"` |
| `GET /api/health` returns `rpc: unreachable` | `curl https://api-staging.stellarkraal.example.com/api/health` |

**Grafana alert link:** `http://localhost:3200/alerting` → filter by rule `rpc-failure`

### Investigation Steps

1. **Check Stellar network status** at [https://status.stellar.org](https://status.stellar.org). If there is a network-wide incident, this is the root cause — proceed to mitigation step 3.
2. **Verify RPC connectivity** from the backend host:
   ```bash
   curl -s -X POST \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
     "$RPC_URL"
   ```
   A healthy response contains `"status":"healthy"`. A connection error or timeout confirms the RPC is unreachable.
3. **Check circuit breaker state** in the backend logs:
   ```
   # LogQL (Grafana → Explore)
   {service="backend"} |= "circuit" | level="warn" or level="error"
   ```
   The circuit breaker opens after repeated failures and stays open until the RPC recovers.
4. **Confirm the `RPC_URL` environment variable** is correct for the environment:
   ```bash
   docker compose exec backend printenv RPC_URL
   ```
5. **Check network egress** — DNS resolution and firewall rules from the backend container to the RPC endpoint.

### Mitigation Actions

1. **If the Stellar network is down**: Post a status update in `#incidents` and on the public status page. No action is required on the backend. Monitor the Stellar status page and re-check every 10 minutes.
2. **If the primary RPC is down but the network is healthy**: Switch to a secondary RPC provider by updating `RPC_URL` in the deployment secrets (or `.env` for staging):
   ```bash
   # Example: Staging — update the GitHub Environment secret, then redeploy
   # Or for a live hotfix on the running container:
   docker compose stop backend
   # Edit .env or override RPC_URL
   docker compose up -d backend
   ```
3. **Restart the backend** after an RPC URL change to clear stale connection pools:
   ```bash
   docker compose restart backend
   ```
4. **Confirm recovery**: poll `GET /api/health` until `rpc` shows `healthy`, and verify the `rpc-failure` alert clears in Grafana.

### Escalation Path

| Condition | Action |
|-----------|--------|
| All known RPC endpoints unreachable and Stellar network is healthy | Escalate to **Platform / Infrastructure Engineer** |
| Downtime > 15 minutes | Escalate to **Engineering Lead**; open a P1 incident issue in GitHub |
| Circuit breaker remains open after RPC recovery | Page **Lead Backend Engineer** — may require backend restart or code change |

See the [escalation contacts table](../ON_CALL_ROTATION.md#escalation-path) for specific contacts.

---

## 2. Contract Error Spike

### Description

A sudden increase in HTTP 5xx responses from contract-related endpoints (`/api/v1/collateral/register`, `/api/v1/loan/request`, `/api/v1/loan/repay`, `/api/v1/admin/liquidate`). May indicate a bad deployment, a contract invocation error, or an on-chain state inconsistency.

### Detection Signals

| Signal | Where to look |
|--------|--------------|
| `5xx-spike` or `HighErrorRate` alert in `#alerts` | Slack / PagerDuty |
| Error rate panel spike (> 1% of total requests) | Grafana → **StellarKraal Backend** → *Error Rate (5xx/s)* panel — PromQL: `sum(rate(http_requests_total{status_code=~"5.."}[1m]))` |
| `ContractInvocationError`, `XDR decode error`, or `SimulationError` in logs | Grafana → **StellarKraal Logs** → *Errors* panel — LogQL: `{container="backend"} \|= "error" \| level="error"` |
| Rolling 5xx counter threshold exceeded | Backend log: `5xx spike detected` (emitted when ≥ 10 errors occur in a 60s window) |

**Grafana alert link:** `http://localhost:3200/alerting` → filter by rule `5xx-spike`

### Investigation Steps

1. **Identify the failing route** by filtering the error logs by route:
   ```
   # LogQL (Grafana → Explore)
   {service="backend"} | json | status >= 500 | line_format "{{.route}} {{.message}}"
   ```
2. **Check if the error is limited to contract write paths** (register, request, repay, liquidate) or affects all routes. Pure-read failures point to the DB or an auth issue.
3. **Read recent error messages** to identify the pattern:
   - `SimulationError` / `invoke_contract` failure → contract logic or state issue
   - `XDR decode error` / `base64` → malformed input or a contract ABI change
   - `SequenceNumberMismatch` → account sequence conflict; usually self-resolving
   - `Unauthorized` / `401` → JWT issue; check auth middleware
4. **Check for recent deployments** — look at GitHub Actions deploy workflow for the last successful run time and compare with when the errors started.
5. **Check the contract invocation failure runbook** for deeper diagnosis: [docs/runbooks/contract-invocation-failure.md](./contract-invocation-failure.md).

### Mitigation Actions

1. **For a bad deployment**: roll back immediately using the [deployment rollback runbook](./deployment-rollback.md).
2. **For a contract ABI change** that was not backward-compatible: roll back the contract deployment and coordinate with the smart contract team.
3. **For sequence number mismatches**: these typically self-resolve within 1–2 ledger cycles. If they persist after 2 minutes, restart the backend to reset the account sequence cache.
4. **For an isolated endpoint spike** with no deployment correlation: check if the specific collateral or loan ID in the errors reveals a data anomaly, then escalate to the smart contract team.
5. **Confirm recovery**: watch the *Error Rate (5xx/s)* panel in Grafana drop to baseline and verify the `5xx-spike` alert clears.

### Escalation Path

| Condition | Action |
|-----------|--------|
| Errors clearly linked to a contract change | Escalate to **Smart Contract / Blockchain Engineering** |
| All 5xx tied to a deployment within the last 2 hours | Trigger rollback per [deployment-rollback.md](./deployment-rollback.md), notify **Engineering Lead** |
| Error rate > 5% and no clear cause found within 20 minutes | Escalate to **Engineering Lead**; open P1 incident issue |

---

## 3. DB Connection Exhaustion

### Description

The SQLite/PostgreSQL connection pool is fully utilised, causing new requests to wait or fail with `PoolExhaustedError`. Affects all database-backed routes.

### Detection Signals

| Signal | Where to look |
|--------|--------------|
| `db-error` or `DbPoolExhaustion` alert | Slack |
| `db_pool_available` gauge drops to 0 | Grafana → **StellarKraal Backend** → *DB Pool — Available Connections* panel — PromQL: `db_pool_available` |
| High acquire wait latency | Grafana → **StellarKraal Backend** → *DB Pool — Acquire Wait Latency (p95)* panel — PromQL: `histogram_quantile(0.95, sum(rate(db_pool_wait_ms_bucket[5m])) by (le))` |
| `PoolExhaustedError` in backend logs | Grafana → **StellarKraal Logs** → *Errors* panel — LogQL: `{container="backend"} \|= "PoolExhaustedError"` |
| Cascade of 503 responses | Grafana → **StellarKraal Backend** → *Error Rate (5xx/s)* panel |

**Grafana alert link:** `http://localhost:3200/alerting` → filter by rule `DbPoolExhaustion`

### Investigation Steps

1. **Confirm pool exhaustion**: check `db_pool_available` and `db_pool_acquired_total` in Grafana. A flat zero on `db_pool_available` combined with a rising `db_pool_acquired_total` confirms the pool is saturated.
2. **Check for long-running queries**: look for queries that acquired a connection and never released it:
   ```
   # LogQL (Grafana → Explore)
   {service="backend"} |= "acquire" | json | duration > 5000
   ```
3. **Check total request rate** in the *Request Rate (req/s)* panel. A sudden traffic spike will exhaust the pool; this is a capacity issue rather than a code bug.
4. **Look for leaked connections**: the pool is configured with a max size and an idle-timeout. If `db_pool_acquired_total` increases monotonically without a matching `db_pool_available` recovery, a connection is likely being held open by an unhandled promise rejection.
5. **Check disk space** for SQLite deployments — a full disk causes write failures that can leave connections hanging:
   ```bash
   df -h
   ```

### Mitigation Actions

1. **If caused by a traffic spike**: restart the backend to drain the pool, then scale horizontally or increase `DB_POOL_MAX` in the environment variables (see [docs/guides/connection-pool.md](../guides/connection-pool.md)):
   ```bash
   docker compose restart backend
   ```
2. **If caused by a code-level connection leak**: identify the leaky route from the logs and deploy a hotfix. In the interim, restart the backend to release held connections.
3. **If disk is full**: free up disk space immediately (`docker system prune` for build cache, or archive and delete old log files), then restart the backend.
4. **For PostgreSQL (production/staging)**: check `pg_stat_activity` for long-running or idle transactions:
   ```sql
   SELECT pid, state, wait_event_type, query_start, query
   FROM pg_stat_activity
   WHERE state != 'idle'
   ORDER BY query_start;
   ```
   Terminate blocking sessions with `SELECT pg_terminate_backend(pid)` if safe.
5. **Confirm recovery**: watch `db_pool_available` recover to a non-zero value and `db_pool_wait_ms` p95 drop.

### Escalation Path

| Condition | Action |
|-----------|--------|
| Pool exhaustion not resolved after restart | Escalate to **Lead Backend Engineer** for connection leak investigation |
| Disk full in production | Escalate to **Platform / Infrastructure Engineer** immediately |
| PostgreSQL blocking sessions requiring manual termination | Escalate to **Lead Backend Engineer** or **DBA** |
| Outage > 15 minutes | Escalate to **Engineering Lead**; open P1 incident issue |

See the [db-failure runbook](./db-failure.md) for additional database-specific steps.

---

## 4. High Liquidation Rate

### Description

An abnormally high number of loans are being flagged for liquidation or the liquidation worker is failing. May indicate a price feed oracle anomaly, a contract state issue, or a genuine market event.

### Detection Signals

| Signal | Where to look |
|--------|--------------|
| `liquidation-failure` alert | Slack |
| Unusual spike in liquidation events in logs | Grafana → **StellarKraal Logs** → *All Logs* panel — LogQL: `{container="backend"} \|= "liquidat"` |
| High volume of `POST /api/v1/admin/liquidate` calls | Grafana → **StellarKraal Backend** → *Request Rate (req/s)* panel, filtered to route `/api/v1/admin/liquidate` |
| Error messages from the liquidation engine | Grafana → **StellarKraal Logs** → *Errors* panel — LogQL: `{service="backend"} \|= "liquidation" \| level="error"` |
| `liquidation-failure` metric | PromQL: `stellarkraal_alert_fired{rule="liquidation-failure"}` |

**Grafana alert link:** `http://localhost:3200/alerting` → filter by rule `liquidation-failure`

### Investigation Steps

1. **Distinguish between two scenarios**:
   - **Scenario A**: many loans are being *successfully* liquidated (engine working, genuine market stress event)
   - **Scenario B**: the liquidation worker is *failing* (engine errors, on-chain revert, or config issue)
   
   Check the liquidation logs and error rate to tell them apart.

2. **For Scenario A — genuine liquidation surge**:
   - Check the oracle price feed for the collateral assets. A stale or manipulated price feed can cause spurious liquidations.
   - Review the health factor calculation: [docs/protocol/liquidation.md](../protocol/liquidation.md).
   - Verify the TWAP mechanism is operating normally: [docs/protocol/twap-mechanism.md](../protocol/twap-mechanism.md).
   - Check [docs/adr/ADR-007-oracle-twap.md](../adr/ADR-007-oracle-twap.md) for the expected TWAP behaviour under price shocks.

3. **For Scenario B — liquidation worker failures**:
   ```
   # LogQL (Grafana → Explore) — liquidation errors
   {service="backend"} |= "liquidation" | level="error"
   ```
   Common error patterns:
   - `HealthFactor calculation error` → likely a missing or zero oracle price
   - `invoke_contract failed` → on-chain issue; check RPC state
   - `loan not found` / `invalid state` → database inconsistency
   - `already liquidated` → duplicate trigger; harmless but investigate the source

4. **Check the contract invocation failure runbook** for on-chain errors: [docs/runbooks/contract-invocation-failure.md](./contract-invocation-failure.md).

5. **Review recent loan records** in the DB to understand the scale:
   ```bash
   # Via the admin endpoint (requires admin JWT)
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     "https://api-staging.stellarkraal.example.com/api/v1/admin/loans?status=liquidated&limit=50"
   ```

### Mitigation Actions

**Scenario A — genuine market stress:**

1. This is expected protocol behaviour. Confirm the oracle and TWAP are functioning correctly.
2. If a price oracle anomaly is suspected (e.g., a single oracle reporting an outlier), this may require a smart contract configuration change. Escalate to **Smart Contract / Blockchain Engineering** immediately.
3. Post a user communication update if a large number of borrowers are affected.
4. No backend restart is required unless the worker is also erroring.

**Scenario B — worker failures:**

1. **If the RPC is unreachable**: follow the [RPC Outage](#1-rpc-outage) runbook first.
2. **If the issue is database-related**: follow the [DB Connection Exhaustion](#3-db-connection-exhaustion) runbook.
3. **If the worker is stuck or has crashed**: restart the backend to reinitialise the worker:
   ```bash
   docker compose restart backend
   ```
4. **For persistent failures after restart**: check for contract state inconsistencies and escalate to the smart contract team.

See the dedicated [liquidation-failure runbook](./liquidation-failure.md) for additional steps.

### Escalation Path

| Condition | Action |
|-----------|--------|
| Oracle price feed anomaly suspected | Escalate to **Smart Contract / Blockchain Engineering** immediately |
| Large-scale unexpected liquidations (> 10% of active loans in < 1 hour) | Escalate to **CTO / project owner**; consider pausing liquidations via feature flag |
| Worker persistently failing after restart | Escalate to **Lead Backend Engineer** and **Smart Contract team** |
| Outage > 15 minutes | Escalate to **Engineering Lead**; open P1 incident issue |

---

## Common Commands Reference

```bash
# Check running services
docker compose ps

# Tail backend logs (live)
docker compose logs -f backend

# Restart a single service
docker compose restart backend

# Check backend health
curl http://localhost:3001/api/health

# Check pool metrics
curl http://localhost:3001/metrics | grep db_pool

# Check RPC connectivity
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
  "$RPC_URL"
```

---

## Related Documents

- [On-Call Rotation](../ON_CALL_ROTATION.md) — schedule, SLAs, escalation contacts, post-incident review
- [Observability Stack](../observability.md) — Grafana dashboards, Prometheus metrics, Loki log queries
- [RPC Failure Runbook](./rpc-failure.md) — detailed RPC diagnostics
- [DB Failure Runbook](./db-failure.md) — SQLite/PostgreSQL diagnostics and restore procedure
- [Liquidation Failure Runbook](./liquidation-failure.md) — liquidation engine deep-dive
- [High Error Rate Runbook](./high-error-rate.md) — 5xx spike triage
- [Contract Invocation Failure Runbook](./contract-invocation-failure.md) — Soroban error codes
- [Deployment Rollback Runbook](./deployment-rollback.md) — rolling back a bad release
- [Container Logs Runbook](./container-logs.md) — accessing Docker and Loki logs
