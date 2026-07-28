# On-Call Rotation

## Overview

StellarKraal uses a weekly on-call rotation. The on-call engineer is the first responder for alerts fired by the uptime monitors (Slack `#alerts` channel and email).

Each rotation week has a **primary** on-call engineer (first responder) and a **secondary** (backup if the primary is unavailable). The secondary does not need to monitor alerts continuously but must be reachable within **30 minutes** when paged by the primary.

## Rotation Schedule

| Week | Primary | Secondary | Contact |
|------|---------|-----------|---------|
| Week 1 | — | — | — |
| Week 2 | — | — | — |
| Week 3 | — | — | — |
| Week 4 | — | — | — |

> Update this table with real names and contact details (phone, Slack handle, email) before going to production. Rotate primary/secondary forward each week (previous secondary becomes the next primary).

### Handoff

At the start of each week:

1. Primary confirms access to GitHub, Grafana, production/staging deploy workflows, and PagerDuty (if configured).
2. Primary posts the week’s assignment in `#alerts` or the team channel.
3. Outgoing primary shares any open incidents or known risks.

## Responsibilities

### Primary on-call

- Acknowledge alerts within **15 minutes** during business hours, **30 minutes** off-hours.
- Investigate and resolve or escalate within **1 hour**.
- Post a brief incident note in `#incidents` Slack channel for any outage > 5 minutes.
- File a post-mortem issue in GitHub for any P1 incident (full outage > 15 minutes).
- Follow the [incident response workflow](#incident-response-workflow) below.
- Update the public status page when user-facing impact is confirmed (see [Status Page](#status-page)).

### Secondary on-call

- Respond when the primary pages them or is unreachable after the acknowledgement SLA.
- Take over as incident commander if the primary loses connectivity.
- Cover primary duties during pre-arranged swaps (document the swap in `#incidents`).

Shared expectations (from the original rotation policy):

- Investigate and resolve or escalate within **1 hour**.
- Post a brief incident note in `#incidents` Slack channel for any outage > 5 minutes.
- File a post-mortem issue in GitHub for any P1 incident (full outage > 15 minutes).

## Alert Channels

| Channel | Purpose |
|---------|---------|
| Slack `#alerts` | Automated uptime alerts (2 consecutive failures) |
| Slack `#incidents` | Manual incident coordination |
| Email (`NOTIFICATION_EMAIL` secret) | Backup alert delivery |
| PagerDuty | Critical backend alerts when `PAGERDUTY_ROUTING_KEY` is set (see [Alerts](#alerts)) |

Uptime monitoring is driven by the [Uptime CI workflow](../.github/workflows/uptime.yml) (Upptime), which can notify Slack and email using repository secrets `SLACK_WEBHOOK` and `NOTIFICATION_EMAIL`.

## Escalation Path

1. **Primary** on-call engineer
2. **Secondary** on-call engineer (if primary is unavailable or needs support)
3. **Engineering lead**
4. **CTO / project owner**

### Escalation contacts

| Role | When to involve | Contact |
|------|-----------------|---------|
| Secondary on-call | Primary unreachable past SLA | *(fill in rotation table)* |
| Engineering lead | No resolution within 1 hour, or cross-team coordination | *(fill in)* |
| CTO / project owner | P1 outage > 15 minutes, regulatory/comms, or executive decision | *(fill in)* |
| Platform / Infrastructure | RPC or hosting issues per [rpc-failure.md](runbooks/rpc-failure.md) | *(fill in)* |
| Lead Backend Engineer | Database corruption / restore decisions per [db-failure.md](runbooks/db-failure.md) | *(fill in)* |
| Smart Contract / Blockchain Engineering | Liquidation or on-chain failures per [liquidation-failure.md](runbooks/liquidation-failure.md) | *(fill in)* |

Runbooks may name additional roles (for example **Engineering Manager** in [deployment-rollback.md](runbooks/deployment-rollback.md)); use the contacts your team maintains alongside this table.

## Tooling access

On-call engineers need access to:

| Tool | Purpose | Notes |
|------|---------|--------|
| **GitHub** (Actions, Issues) | Deployments, workflow re-runs, incident issues | See [deployment-rollback.md](runbooks/deployment-rollback.md) |
| **Docker / Docker Compose** | Service status and restarts | `docker compose -f docker-compose.prod.yml ps` |
| **Grafana** | Dashboards and log queries | Local: `http://localhost:3200` — see [observability.md](observability.md) |
| **Slack** | `#alerts`, `#incidents` | Webhook secrets documented in [secrets-rotation.md](security/secrets-rotation.md) |
| **PagerDuty** | Critical alert routing | Requires `PAGERDUTY_ROUTING_KEY` at deploy time |
| **Status page** | User communication | URLs in [Status Page](#status-page) below |

Staging URLs and secrets for non-production validation are listed in the [README](../README.md#staging-environment).

## Log access

| Environment | How to access |
|-------------|----------------|
| **Production containers** | [runbooks/container-logs.md](runbooks/container-logs.md) — `docker compose -f docker-compose.prod.yml logs` |
| **Centralized logs (Loki/Grafana)** | [observability.md](observability.md) — Promtail → Loki → Grafana; pre-built queries in `grafana/dashboards/logs.json` |
| **Backend application logs** | Winston logger (`backend/src/utils/logger.ts`); request-scoped logs include `requestId` matching the `X-Request-ID` response header |
| **Troubleshooting** | [troubleshooting.md](troubleshooting.md) for common setup and runtime errors |

## Metrics access

| Source | Endpoint / location | Access |
|--------|---------------------|--------|
| **Prometheus metrics** | `GET /metrics` on the backend | Optional `METRICS_TOKEN` bearer auth (see backend env) |
| **Grafana dashboards** | Loki + metrics panels | [observability.md](observability.md) |
| **Health check** | `GET /api/health` or `GET /api/v1/health` | Public; includes RPC reachability and pool stats |
| **High error rate** | Grafana / Prometheus | See [runbooks/high-error-rate.md](runbooks/high-error-rate.md) |

## Alerts

Backend alert rules are defined in `backend/src/utils/alertRules.ts` and delivered via `backend/src/utils/alerting.ts` (Slack `SLACK_WEBHOOK_URL`, optional PagerDuty `PAGERDUTY_ROUTING_KEY`). Slack messages include a runbook link built from `RUNBOOK_BASE_URL` (default: GitHub `docs/runbooks` path).

| Rule ID | Name | Severity | PagerDuty | Runbook file in repo |
|---------|------|----------|-----------|----------------------|
| `rpc-failure` | RPC Failure | critical | no | [rpc-failure.md](runbooks/rpc-failure.md) |
| `rpc-circuit-open` | RPC Circuit Breaker Opened | critical | no | [rpc-failure.md](runbooks/rpc-failure.md) |
| `db-error` | Database Error | critical | no | `db-error.md` *(see [db-failure.md](runbooks/db-failure.md))* |
| `liquidation-failure` | Liquidation Engine Failure | critical | no | [liquidation-failure.md](runbooks/liquidation-failure.md) |
| `5xx-spike` | 5xx Error Spike | critical | **yes** | `5xx-spike.md` *(see [high-error-rate.md](runbooks/high-error-rate.md))* |
| `backup-failure` | Database Backup Failed | critical | **yes** | [recovery/restore-procedure.md](recovery/restore-procedure.md) |

Additional detection: the backend tracks a rolling 60s window of 5xx responses and fires `fivexxSpike` when **≥ 10** errors occur in that window (`backend/src/index.ts`).

Uptime monitors (frontend/backend availability) are separate from application alert rules; they feed `#alerts` via Upptime as described above.

## Incident response workflow

1. **Acknowledge** the alert in Slack/PagerDuty and claim the incident in `#incidents`.
2. **Triage** severity (user impact, data risk, duration). Use the matching [runbook](#runbooks-index).
3. **Mitigate** — rollback, restart, failover RPC, scale, or disable a feature flag if applicable.
4. **Communicate** — short updates in `#incidents` every 15–30 minutes during active outages; update the status page for customer-visible issues.
5. **Resolve** — confirm metrics/logs are healthy; post an “all clear” in `#incidents`.
6. **Follow-up** — for P1 or any outage > 15 minutes, open a GitHub issue and complete a [post-incident review](#post-incident-review-process).

## Runbooks index

Use these operational runbooks before improvising remediation steps:

| Runbook | Use when |
|---------|----------|
| [high-error-rate.md](runbooks/high-error-rate.md) | Spike in HTTP 5xx responses |
| [rpc-failure.md](runbooks/rpc-failure.md) | Soroban RPC unreachable or circuit breaker open |
| [db-failure.md](runbooks/db-failure.md) | SQLite / off-chain DB errors |
| [liquidation-failure.md](runbooks/liquidation-failure.md) | Liquidation worker stalled or failing |
| [deployment-rollback.md](runbooks/deployment-rollback.md) | Bad deployment; need to revert release |
| [container-logs.md](runbooks/container-logs.md) | Need live or historical container logs |
| [recovery/restore-procedure.md](recovery/restore-procedure.md) | Backup failure or database restore |

### Quick checks (legacy shortcuts)

These steps remain useful for simple uptime failures; prefer the runbooks above for production incidents.

#### Frontend down

1. Check GitHub Actions for recent failed deployments.
2. Verify Docker container is running: `docker-compose ps`.
3. Check `frontend` container logs: `docker-compose logs frontend`.

#### Backend `/api/health` down

1. Check `backend` container logs: `docker-compose logs backend`.
2. Verify database connectivity (SQLite file permissions and disk space — see [db-failure.md](runbooks/db-failure.md)).
3. Check RPC connectivity to Stellar testnet/mainnet ([rpc-failure.md](runbooks/rpc-failure.md)).

#### Stellar RPC unreachable

1. Check [Stellar network status](https://status.stellar.org).
2. If network-wide issue, post status update on the public status page and wait.
3. If isolated, verify `RPC_URL` env var and network egress from the host.

## Post-incident review process

Required for **P1** incidents (full outage > 15 minutes) and recommended for repeated P2 issues.

1. Create a GitHub issue labelled `post-incident` within **2 business days**.
2. Schedule a blameless review (30–45 minutes) with primary, secondary, and engineering lead.
3. Copy the [template](#post-incident-review-template) into the issue or a shared doc.
4. Track action items to completion; link the issue from `#incidents` when closed.

## Post-incident review template

```markdown
# Post-incident review: [INCIDENT TITLE]

**Date:** YYYY-MM-DD  
**Duration:** HH:MM UTC – HH:MM UTC (X minutes)  
**Severity:** P1 / P2 / P3  
**Incident commander:** @handle  
**Responders:** @primary, @secondary, …

## Summary
(2–3 sentences: what broke and who was affected.)

## Impact
- User-facing symptoms:
- APIs / contracts affected:
- Data integrity concerns (yes/no):

## Timeline (UTC)
| Time | Event |
|------|--------|
| HH:MM | Alert fired / first report |
| HH:MM | Acknowledged |
| HH:MM | Mitigation started |
| HH:MM | Service restored |

## Root cause
(Technical explanation; link logs, commits, deploy IDs.)

## What went well
-

## What went poorly
-

## Action items
| Owner | Action | Due date |
|-------|--------|----------|
| | | |

## Supporting links
- Slack thread / `#incidents` permalink:
- Grafana snapshot:
- Related PRs / deploys:
```

## Status Page

Public status page: `https://status.stellarkraal.io` (or `https://firstJOASH.github.io/StellarKraal-`)

Displays current service status and 30-day uptime history.

## Related documentation

- [Observability (Loki/Grafana)](observability.md)
- [Troubleshooting](troubleshooting.md)
- [Secrets rotation](security/secrets-rotation.md)
- [Infrastructure limits](infrastructure.md)
