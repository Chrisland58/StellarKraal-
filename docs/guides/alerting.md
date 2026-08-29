# Monitoring and Alerting Guide

This guide explains how the StellarKraal backend produces production alerts, how alert rules are structured, and how to add a new rule.

Alerts flow from `backend/src/utils/alertRules.ts` (rule definitions) through `backend/src/utils/alerting.ts` (dispatch logic) to Slack and PagerDuty.

---

## Overview

```
Application code
      │
      ▼
fireAlert(rule, message, meta)     ← backend/src/utils/alerting.ts
      │
      ├──► Slack webhook            ← SLACK_WEBHOOK_URL env var
      │
      └──► PagerDuty Events v2 API  ← PAGERDUTY_ROUTING_KEY env var (only if rule.pagerduty = true)
```

Alerts are deduplicated using an in-memory cooldown: once a rule fires, it cannot fire again until its `cooldownMs` window expires. This prevents alert fatigue during sustained incidents.

---

## Alert rule structure

Each rule is defined in `backend/src/utils/alertRules.ts` as an object conforming to the `AlertRule` interface:

```typescript
export interface AlertRule {
  id: string;        // Unique identifier, used as the dedup key
  name: string;      // Human-readable name shown in Slack / PagerDuty
  severity: AlertSeverity;  // "warning" | "critical"
  cooldownMs: number;       // Minimum ms between successive firings of this rule
  runbook: string;          // Filename (relative to RUNBOOK_BASE_URL) for on-call runbook
  pagerduty?: boolean;      // If true, escalates to PagerDuty in addition to Slack
}
```

### Built-in rules

| Rule key | ID | Severity | Cooldown | PagerDuty | Runbook |
|---|---|---|---|---|---|
| `rpcFailure` | `rpc-failure` | critical | 5 min | No | `rpc-failure.md` |
| `rpcCircuitOpen` | `rpc-circuit-open` | critical | 10 min | No | `rpc-failure.md` |
| `dbError` | `db-error` | critical | 5 min | No | `db-error.md` |
| `liquidationFailure` | `liquidation-failure` | critical | 2 min | No | `liquidation-failure.md` |
| `fivexxSpike` | `5xx-spike` | critical | 1 min | **Yes** | `5xx-spike.md` |
| `backupFailure` | `backup-failure` | critical | 1 hour | **Yes** | `restore-procedure.md` |

Runbook files are in `docs/runbooks/`.

---

## Cooldown and deduplication

Cooldown is enforced in-process using a `Map<ruleId, lastFiredTimestamp>`. When `fireAlert` is called:

1. The rule's `id` is looked up in the map.
2. If `now - lastFired < cooldownMs`, the alert is silently dropped.
3. Otherwise the timestamp is updated and the alert is dispatched.

This means a 5-minute cooldown rule that fires at 10:00 will not fire again until 10:05, even if the underlying condition is continuously triggered.

> **Important:** The cooldown state is in-process and resets on restart. A restart during an incident will allow the next occurrence to fire immediately, regardless of recent history.

---

## Slack integration

Slack alerts are sent to the webhook URL configured in `SLACK_WEBHOOK_URL`. If the variable is not set, Slack delivery is silently skipped.

The Slack message format uses the [Attachments API](https://api.slack.com/reference/messaging/attachments):

- **Colour:** Red (`#dc2626`) for `critical`, amber (`#ca8a04`) for `warning`.
- **Title:** `[CRITICAL] Rule Name` (or `[WARNING]`).
- **Fields:** Runbook link + all metadata key-value pairs passed via `meta`.

To configure:
```bash
# In .env or CI/CD secrets:
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...
```

### Test a Slack webhook locally

```bash
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "StellarKraal alerting test"}'
```

---

## PagerDuty integration

PagerDuty is only contacted when `rule.pagerduty === true` **and** `PAGERDUTY_ROUTING_KEY` is set. The integration uses the [PagerDuty Events API v2](https://developer.pagerduty.com/docs/events-api-v2/trigger-events/).

Payload fields:

| Field | Value |
|---|---|
| `event_action` | `"trigger"` |
| `dedup_key` | The rule's `id` (used by PagerDuty for alert grouping) |
| `payload.severity` | Always `"critical"` |
| `payload.source` | `"stellarkraal-backend"` |
| `payload.custom_details` | The `meta` object plus the runbook URL |

To configure:
```bash
# In .env or CI/CD secrets:
PAGERDUTY_ROUTING_KEY=<integration-key-from-pagerduty-service>
```

The routing key is found under **Services → Integrations → Events API v2** in your PagerDuty account.

### Runbook base URL

Both Slack and PagerDuty include a runbook link. The base URL defaults to the public GitHub runbooks path and can be overridden:

```bash
RUNBOOK_BASE_URL=https://github.com/teslims2/StellarKraal-/blob/main/docs/runbooks
```

---

## Firing an alert from application code

```typescript
import { fireAlert } from './utils/alerting';
import { rules } from './utils/alertRules';

// Example: fire the rpcFailure alert with metadata
await fireAlert(rules.rpcFailure, 'Soroban RPC call timed out after 10 s', {
  endpoint: RPC_URL,
  retryCount: 3,
});
```

`fireAlert` is `async` and resolves after all channel deliveries are attempted (or failed gracefully). It will not throw even if Slack or PagerDuty are unreachable — delivery failures are logged as warnings.

---

## Adding a new alert rule

### Step 1 — Define the rule in `alertRules.ts`

Open `backend/src/utils/alertRules.ts` and add a new entry to the `rules` object:

```typescript
export const rules = {
  // ... existing rules ...

  oracleStale: {
    id: "oracle-stale",
    name: "Oracle Price Feed Stale",
    severity: "critical",
    cooldownMs: 15 * 60 * 1000,   // 15-minute cooldown
    runbook: "oracle-stale.md",
    pagerduty: false,
  },
} satisfies Record<string, AlertRule>;
```

Rules that affect financial correctness (e.g., oracle feeds, liquidation) should have short cooldowns and consider `pagerduty: true`.

### Step 2 — Write the runbook

Create `docs/runbooks/oracle-stale.md` with:
- A description of the alert condition.
- Immediate mitigation steps.
- Escalation path if mitigation fails.

### Step 3 — Fire the alert from the relevant code path

```typescript
import { fireAlert } from '../utils/alerting';
import { rules } from '../utils/alertRules';

// Inside your oracle polling logic:
if (priceAge > STALE_THRESHOLD_MS) {
  await fireAlert(rules.oracleStale, 'Oracle price feed has not updated', {
    lastUpdatedAt: new Date(lastUpdate).toISOString(),
    ageMs: priceAge,
  });
}
```

### Step 4 — Write a test

Add a test in the relevant `*.test.ts` file to assert that `fireAlert` is called with the correct rule and message when the condition is triggered:

```typescript
import * as alerting from '../utils/alerting';
jest.spyOn(alerting, 'fireAlert').mockResolvedValue();

// ... trigger the condition ...
expect(alerting.fireAlert).toHaveBeenCalledWith(
  rules.oracleStale,
  expect.stringContaining('not updated'),
  expect.objectContaining({ ageMs: expect.any(Number) })
);
```

---

## Environment variable reference

| Variable | Required | Description |
|---|---|---|
| `SLACK_WEBHOOK_URL` | No | Slack Incoming Webhook URL. Alerts are skipped if unset. |
| `PAGERDUTY_ROUTING_KEY` | No | PagerDuty Events v2 integration key. Required for `pagerduty: true` rules. |
| `RUNBOOK_BASE_URL` | No | Base URL prefix for runbook links. Defaults to the GitHub `docs/runbooks` path. |

---

## Related

- [Observability — Loki & Grafana](../observability.md)
- [Runbooks](../runbooks/)
- Source: `backend/src/utils/alerting.ts`, `backend/src/utils/alertRules.ts`
