# Observability Stack

StellarKraal uses a three-pillar observability stack: **Prometheus** for
metrics, **Loki + Promtail** for logs, and **Grafana** for dashboards and
alerting. This document covers architecture, configuration, every custom
metric, and how to extend the stack.

---

## Architecture

```
backend ──┐
           ├─► Docker json-file logs ──► Promtail ──► Loki ──► Grafana
frontend ──┘

backend ──► prom-client registry ──► GET /metrics ──► Prometheus ──► Grafana
```

| Pillar | Tool | Purpose |
|--------|------|---------|
| Metrics | [Prometheus](https://prometheus.io/) | Scrapes numeric time-series from the backend `/metrics` endpoint |
| Logs | [Loki](https://grafana.com/oss/loki/) + [Promtail](https://grafana.com/docs/loki/latest/send-data/promtail/) | Aggregates structured logs from all Docker containers |
| Dashboards | [Grafana](https://grafana.com/oss/grafana/) | Visualises metrics and logs, fires alert notifications |

---

## Service URLs

### Local development

All services are defined in `docker-compose.yml`. Start the full stack:

```bash
docker compose up --build
```

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3200 | Anonymous viewer (no login) |
| Loki | http://localhost:3100 | — |
| Backend API | http://localhost:3001 | — |
| Prometheus | (not yet provisioned — see [Known Gaps](#known-gaps)) | — |

### Staging

Staging mirrors production. Observability services are deployed separately
(via Kubernetes Helm charts or equivalent). Access is restricted to VPN/SSO.

| Service | URL |
|---------|-----|
| Grafana | `https://grafana-staging.stellarkraal.example.com` |
| Prometheus | `https://prometheus-staging.stellarkraal.example.com` |
| Loki | `https://loki-staging.stellarkraal.example.com` |

Staging uses the same dashboard JSON files as local dev. Datasource URLs
point to the staging Loki/Prometheus endpoints rather than Docker service
names.

---

## Metrics (Prometheus)

### How it works

The backend uses [`prom-client`](https://github.com/siimon/prom-client) to
expose a Prometheus-compatible metrics registry. A middleware instruments
every HTTP request, and the connection pool reports DB metrics in real time.

The registry is exported at `GET /metrics` (exposed on port 3001 alongside
the API).

### Custom metrics

All custom metrics are defined in
[`backend/src/metrics.ts`](../backend/src/metrics.ts) and registered on a
dedicated `Registry` instance.

#### HTTP metrics

| Metric | Type | Labels | Buckets | Description |
|--------|------|--------|---------|-------------|
| `http_requests_total` | Counter | `method`, `route`, `status_code` | — | Total HTTP requests served since process start |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status_code` | 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s | Request latency distribution |
| `http_active_connections` | Gauge | — | — | Number of concurrent connections right now |

**Instrumentation location:** inline middleware in
[`backend/src/index.ts`](../backend/src/index.ts) (lines ~211–223). Every
request increments `httpActiveConnections`, starts a duration timer, and
on `res.finish` records the count and latency with the route + status
labels.

#### RPC metrics

| Metric | Type | Labels | Buckets | Description |
|--------|------|--------|---------|-------------|
| `rpc_call_duration_seconds` | Histogram | `operation`, `status` | 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s, 10s | Soroban RPC call latency |

> **Note:** This metric is defined but not yet instrumented. See
> [Known Gaps](#known-gaps).

#### Database pool metrics

| Metric | Type | Labels | Buckets | Description |
|--------|------|--------|---------|-------------|
| `db_pool_acquired_total` | Counter | — | — | Total connections acquired from the pool since start |
| `db_pool_available` | Gauge | — | — | Current idle connections available in the pool |
| `db_pool_wait_ms` | Histogram | — | 0, 1, 5, 10, 25, 50, 100, 250, 500ms | Time waiting for a connection from the pool |

**Instrumentation location:** [`backend/src/utils/connectionPool.ts`](../backend/src/utils/connectionPool.ts). Metrics are updated on every `acquire()` and `release()` call.

#### Default Node.js metrics

`prom-client` also collects built-in Node.js metrics automatically:
`process_cpu_seconds_total`, `process_resident_memory_bytes`,
`nodejs_heap_size_total_bytes`, `nodejs_eventloop_lag_seconds`, etc. These
are included in every `/metrics` scrape.

### Prometheus alert rules

Alert rules are defined in
[`observability/prometheus-rules.yml`](../observability/prometheus-rules.yml)
and auto-generated from
[`backend/src/utils/alertRules.ts`](../backend/src/utils/alertRules.ts) via
`npm run generate:alert-rules`.

| Alert | Severity | Condition | For | Runbook |
|-------|----------|-----------|-----|---------|
| `HighP99Latency` | warning | p99 HTTP latency > 1s | 2 min | [Dashboard](#grafana-dashboards) |
| `HighErrorRate` | critical | 5xx rate > 1% of total | 1 min | [Dashboard](#grafana-dashboards) |
| `DbPoolExhaustion` | critical | `db_pool_available == 0` | 30s | [Dashboard](#grafana-dashboards) |
| `RpcFailure` | critical | `stellarkraal_alert_fired{rule="rpc-failure"}` | 5 min | [rpc-failure.md](runbooks/rpc-failure.md) |
| `RpcCircuitOpen` | critical | `stellarkraal_alert_fired{rule="rpc-circuit-open"}` | 10 min | [rpc-failure.md](runbooks/rpc-failure.md) |
| `DbError` | critical | `stellarkraal_alert_fired{rule="db-error"}` | 5 min | [db-error.md](runbooks/db-failure.md) |
| `LiquidationFailure` | critical | `stellarkraal_alert_fired{rule="liquidation-failure"}` | 2 min | [liquidation-failure.md](runbooks/liquidation-failure.md) |
| `5xxSpike` | critical | `stellarkraal_alert_fired{rule="5xx-spike"}` | 1 min | [5xx-spike.md](runbooks/high-error-rate.md) |
| `BackupFailure` | critical | `stellarkraal_alert_fired{rule="backup-failure"}` | 60 min | [restore-procedure.md](recovery/restore-procedure.md) |

### Alerting pipeline

Application-level alerts fire via
[`backend/src/utils/alerting.ts`](../backend/src/utils/alerting.ts):

1. The `fireAlert()` function checks a per-rule cooldown to prevent
   alert fatigue.
2. It sends to **Slack** (via `SLACK_WEBHOOK_URL` env var) and optionally
   **PagerDuty** (via `PAGERDUTY_ROUTING_KEY` for rules with
   `pagerduty: true`).
3. Each alert includes a link to the relevant runbook and the Grafana
   dashboard.

Environment variables for alerting are listed in
[`docs/guides/environment-variables.md`](guides/environment-variables.md).

---

## Logs (Loki + Promtail)

### How it works

Docker containers write logs to the `json-file` log driver. Promtail
discovers containers via the Docker socket, extracts labels
(`service`, `container`, `level`), and pushes log streams to Loki. Grafana
queries Loki via the LogQL language.

### Configuration files

| File | Purpose |
|------|---------|
| [`observability/promtail-config.yml`](../observability/promtail-config.yml) | Promtail scrape config — Docker socket discovery, relabeling, JSON pipeline |
| [`observability/grafana-datasources.yml`](../observability/grafana-datasources.yml) | Grafana datasource provisioning (Loki) |
| [`observability/grafana-dashboards.yml`](../observability/grafana-dashboards.yml) | Grafana dashboard provisioning — reads JSON from `/var/lib/grafana/dashboards` |

### Log labels

Promtail extracts these labels from container metadata:

| Label | Source | Example |
|-------|--------|---------|
| `service` | Docker container label `tag` | `backend`, `frontend` |
| `container` | Docker container name | `backend`, `frontend` |
| `stream` | Docker log stream | `stdout`, `stderr` |
| `level` | Parsed from JSON log line | `info`, `error`, `warn` |

### Useful LogQL queries

| Purpose | LogQL |
|---------|-------|
| All backend logs | `{container="backend"}` |
| All errors | `{container=~"backend\|frontend"} \| level="error"` |
| Slow requests (>1s) | `{service="backend"} \| json \| duration > 1000` |
| RPC failures | `{service="backend"} \|~ "rpc" \| level="error"` |
| Auth failures | `{container="backend"} \|= "Unauthorized"` |
| Loan liquidations | `{container="backend"} \|= "liquidat"` |
| Rate-limited requests | `{container="backend"} \|= "Too many requests"` |

---

## Grafana Dashboards

### Dashboard files

| Dashboard | File | UID | Panels |
|-----------|------|-----|--------|
| StellarKraal Backend | [`grafana/dashboards/backend.json`](../grafana/dashboards/backend.json) | `stellarkraal-backend` | 9 panels (metrics) |
| StellarKraal Logs | [`grafana/dashboards/logs.json`](../grafana/dashboards/logs.json) | `stellarkraal-logs` | 4 panels (log streams) |

### Backend dashboard panels

The backend dashboard (`grafana/dashboards/backend.json`) contains:

| Panel | Type | PromQL / Description |
|-------|------|----------------------|
| Request Rate (req/s) | timeseries | `sum(rate(http_requests_total[1m])) by (route)` |
| Error Rate (5xx/s) | timeseries | `sum(rate(http_requests_total{status_code=~"5.."}[1m]))` |
| Latency Percentiles (p50/p95/p99) | timeseries | `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` |
| Active Connections | stat | `http_active_connections` |
| RPC Call Latency (p95) | timeseries | `histogram_quantile(0.95, sum(rate(rpc_call_duration_seconds_bucket[5m])) by (le, operation))` |
| DB Pool — Available Connections | stat | `db_pool_available` |
| DB Pool — Acquired Total | stat | `db_pool_acquired_total` |
| DB Pool — Acquire Wait Latency (p95) | timeseries | `histogram_quantile(0.95, sum(rate(db_pool_wait_ms_bucket[5m])) by (le))` |
| Alert Rules | text | Markdown table of all Prometheus alert rules |

### Logs dashboard panels

The logs dashboard (`grafana/dashboards/logs.json`) contains:

| Panel | Type | LogQL |
|-------|------|-------|
| All Logs | logs | `{container=~"backend\|frontend"}` |
| Errors | logs | `{container=~"backend\|frontend"} \|= "error" \| level="error"` |
| Slow Requests (>1s) | logs | `{service="backend"} \| json \| duration > 1000` |
| RPC Failures | logs | `{service="backend"} \|= "rpc" \|= "error"` |

### Accessing dashboards

1. Start the stack: `docker compose up --build`
2. Open Grafana: http://localhost:3200
3. Navigate to **Dashboards** in the sidebar:
   - **StellarKraal Backend** — real-time metrics (requires Prometheus; see Known Gaps)
   - **StellarKraal Logs** — live log streaming from Loki

---

## How to Add a New Metric

### 1. Define the metric

Add a new metric in [`backend/src/metrics.ts`](../backend/src/metrics.ts):

```typescript
export const myNewCounter = new Counter({
  name: "my_new_counter_total",
  help: "Description of what this counter tracks",
  labelNames: ["label1", "label2"] as const,
  registers: [registry],
});
```

Supported types:
- **Counter** — monotonically increasing value (e.g. request count)
- **Gauge** — value that can go up and down (e.g. pool size)
- **Histogram** — value distribution with configurable buckets (e.g. latency)

### 2. Instrument the code

Import and use the metric where the event occurs:

```typescript
import { myNewCounter } from "./metrics";

// Increment
myNewCounter.inc();
myNewCounter.inc({ label1: "value1", label2: "value2" });

// For histograms
import { myNewHistogram } from "./metrics";
myNewHistogram.observe(durationInSeconds);
```

### 3. Add a test

Add a test in [`backend/src/metrics.test.ts`](../backend/src/metrics.test.ts)
following the existing pattern:

```typescript
it("my_new_counter increments", async () => {
  const before = await myNewCounter.get();
  myNewCounter.inc();
  const after = await myNewCounter.get();
  expect(after.values[0].value).toBe(before.values[0].value + 1);
});
```

### 4. Add a dashboard panel

Edit the relevant dashboard JSON in `grafana/dashboards/`. Add a new panel
object to the `panels` array:

```json
{
  "id": 10,
  "title": "My New Metric",
  "type": "timeseries",
  "gridPos": { "x": 0, "y": 28, "w": 12, "h": 8 },
  "targets": [
    {
      "expr": "rate(my_new_counter_total[1m])",
      "legendFormat": "{{label1}}"
    }
  ]
}
```

Grid positions use a 24-column layout. See the [Grafana panel JSON
docs](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/add-panels/)
for reference.

### 5. Add an alert rule (optional)

Add the rule to [`backend/src/utils/alertRules.ts`](../backend/src/utils/alertRules.ts):

```typescript
myNewAlert: {
  id: "my-new-alert",
  name: "My New Alert",
  severity: "warning",
  cooldownMs: 5 * 60 * 1000,
  runbook: "my-new-alert.md",
  pagerduty: false,
},
```

Then regenerate the Prometheus rules file:

```bash
cd backend && npm run generate:alert-rules
```

This updates `observability/prometheus-rules.yml` with the new rule. The CI
pipeline validates the file with `promtool check rules`.

---

## How to Add a Dashboard Panel

1. Open Grafana at http://localhost:3200
2. Navigate to the target dashboard (e.g. **StellarKraal Backend**)
3. Click **Add panel** → choose visualization type
4. Enter the PromQL or LogQL query
5. Adjust panel title, legend, thresholds as needed
6. Click **Apply** → **Save dashboard**

To export the updated dashboard JSON back to the repo:

1. Click the **Share** icon → **Export**
2. Toggle **Export for sharing externally**
3. Save the JSON to `grafana/dashboards/<name>.json`
4. Commit the file — Grafana auto-reloads from the mounted volume every 30s

---

## Configuration Reference

### Docker Compose services

| Service | Image | Port | Config |
|---------|-------|------|--------|
| `loki` | `grafana/loki:2.9.4` | 3100 | Built-in local config |
| `promtail` | `grafana/promtail:2.9.4` | 9080 (internal) | `observability/promtail-config.yml` |
| `grafana` | `grafana/grafana:10.4.2` | 3200 → 3000 | Datasource + dashboard provisioning |

### Grafana provisioning

| File | Mounted at | Purpose |
|------|------------|---------|
| `observability/grafana-datasources.yml` | `/etc/grafana/provisioning/datasources/datasources.yml` | Loki datasource |
| `observability/grafana-dashboards.yml` | `/etc/grafana/provisioning/dashboards/dashboards.yml` | Dashboard file provider |
| `grafana/dashboards/*.json` | `/var/lib/grafana/dashboards/` | Dashboard definitions |

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SLACK_WEBHOOK_URL` | — | Slack incoming webhook URL for alert notifications |
| `PAGERDUTY_ROUTING_KEY` | — | PagerDuty integration key for critical alerts |
| `RUNBOOK_BASE_URL` | `https://github.com/teslims2/StellarKraal-/blob/main/docs/runbooks` | Base URL for runbook links in alerts |

---

## Production Deployment

Replace the Docker socket-based Promtail setup with infrastructure-native
log shipping:

| Infrastructure | Recommended approach |
|----------------|---------------------|
| Kubernetes | Promtail DaemonSet or Grafana Alloy agent |
| VMs (AWS/GCP) | Promtail installed via systemd, or CloudWatch → Loki |
| Docker Swarm | Promtail service with `/var/run/docker.sock` mount |

Key production changes:

1. **Grafana auth** — set `GF_AUTH_ANONYMOUS_ENABLED=false` and configure
   SSO or local users.
2. **Loki storage** — use S3/GCS object storage for production-grade log
   retention (the default filesystem backend is fine for dev only).
3. **Prometheus** — deploy a Prometheus server that scrapes
   `http://backend:3001/metrics` at 15s intervals.
4. **Network** — restrict Loki (3100) and Prometheus (9090) to internal
   network only.
5. **Alert routing** — configure `SLACK_WEBHOOK_URL` and
   `PAGERDUTY_ROUTING_KEY` as secrets in your deployment platform.

---

## Known Gaps

The following items are identified gaps in the current observability setup:

| Gap | Impact | Workaround |
|-----|--------|------------|
| **No Prometheus service** in `docker-compose.yml` | Backend dashboard panels are empty in local dev | Deploy Prometheus locally or use Grafana Cloud |
| **No Prometheus datasource** in `grafana-dashboards.yml` | Grafana cannot query Prometheus metrics | Add a Prometheus datasource pointing to your Prometheus instance |
| **`rpc_call_duration_seconds`** is defined but not instrumented | RPC latency panels are empty | Instrument the RPC client wrapper in `utils/rpcClient.ts` |
| **`stellarkraal_alert_fired`** metric referenced in alert rules is not emitted | 6 of 9 alerts will never fire | Emit the metric from `fireAlert()` in `utils/alerting.ts` |

These gaps are tracked as GitHub issues and are outside the scope of this
documentation update.

---

## File Map

| File | Purpose |
|------|---------|
| `backend/src/metrics.ts` | Metric definitions (prom-client registry) |
| `backend/src/metrics.test.ts` | Unit tests for metric registration and recording |
| `backend/src/index.ts` | HTTP instrumentation middleware (~lines 211–223) |
| `backend/src/utils/connectionPool.ts` | DB pool metric instrumentation |
| `backend/src/utils/alerting.ts` | Alert dispatch (Slack + PagerDuty) |
| `backend/src/utils/alertRules.ts` | Alert rule definitions (source of truth) |
| `observability/promtail-config.yml` | Promtail scrape + pipeline config |
| `observability/grafana-datasources.yml` | Grafana datasource provisioning |
| `observability/grafana-dashboards.yml` | Grafana dashboard provisioning |
| `observability/prometheus-rules.yml` | Prometheus alert rules (auto-generated) |
| `grafana/dashboards/backend.json` | Backend metrics dashboard |
| `grafana/dashboards/logs.json` | Log streaming dashboard |

---

## Related

- Prometheus metrics: [`docs/protocol/liquidation.md`](protocol/liquidation.md) *(see also `GET /metrics` endpoint)*
- Backend logger: [`backend/src/utils/logger.ts`](../backend/src/utils/logger.ts)
- Alerting configuration: [`docs/guides/alerting.md`](guides/alerting.md) — how alert rules are structured and how to add new ones
