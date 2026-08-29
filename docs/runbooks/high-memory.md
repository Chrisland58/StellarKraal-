# Runbook: High Memory Usage

## Incident Description

The backend process is consuming abnormally high memory, risking OOM kills, container restarts, or degraded performance across all endpoints.

## Detection

- **Alert**: `HighMemoryUsage` fires when `process_resident_memory_bytes` (from Node.js default metrics) exceeds the configured threshold for more than 5 minutes.
- **Grafana**: Open the **Backend Metrics** dashboard (`http://localhost:3000/d/stellarkraal-backend`) and check the **Memory** panel — look for a sustained upward trend or a sharp spike.
- **Logs**: Container runtime logs (`docker logs <backend-container>`) may show `JavaScript heap out of memory` or `Killed` messages.
- **Prometheus query** (run in Grafana Explore):
  ```promql
  process_resident_memory_bytes{job="backend"}
  ```

## Impact Assessment

| Severity | Symptom |
|----------|---------|
| Warning | Memory growing steadily; no immediate failures |
| Critical | Process near container memory limit; requests queuing or failing |
| Fatal | Container OOM-killed; service down until restart |

## Common Root Causes and Diagnosis Steps

### 1. DB Connection Pool Leak

**Symptoms**: `db_pool_available` gauge stays near zero; memory grows in proportion to request throughput.

**Diagnosis:**
```promql
# Check idle connections remaining
db_pool_available

# Check acquire rate vs. release rate
rate(db_pool_acquired_total[5m])
```

Then in Loki (Grafana Explore):
```logql
{service="backend"} |= "PoolExhaustedError"
```

**Resolution:**
1. Identify the endpoint triggering the most pool acquisitions in Grafana (group `db_pool_acquired_total` by `route`).
2. Review that endpoint's handler for missing `await` on DB calls or unhandled exceptions that skip connection release.
3. Temporarily reduce `DB_POOL_SIZE` in `.env` to ease pressure while the fix is prepared.
4. Deploy the fix and verify `db_pool_available` stabilises.

---

### 2. Response / Appraisal Cache Growth

**Symptoms**: Memory grows gradually after deployment; correlates with unique URL or collateral ID cardinality; no pool errors.

**Diagnosis:**
```promql
# Heap used
nodejs_heap_size_used_bytes{job="backend"}
```

In Loki:
```logql
{service="backend"} |= "cache" | json | line_format "{{.message}}"
```

Check environment variable:
```bash
echo $RESPONSE_CACHE_TTL_SECONDS   # default 60
echo $APPRAISAL_CACHE_TTL_MS       # default 30000
```

**Resolution:**
1. If the appraisal cache is unbounded, call `invalidateAll()` via the admin endpoint to free cached entries immediately.
2. Lower `APPRAISAL_CACHE_TTL_MS` or `RESPONSE_CACHE_TTL_SECONDS` in `.env` to reduce cache lifetime.
3. If the cache is growing without bound (no eviction), open an issue to add a max-size cap.
4. Restart the container to reclaim memory while the long-term fix is developed.

---

### 3. Large Query Result Sets

**Symptoms**: Memory spikes on specific endpoints (e.g., `GET /api/v1/collateral`, `GET /api/v1/loans`) under high load; spikes correlate with requests.

**Diagnosis:**

In Grafana, filter `http_request_duration_seconds` by route and look for outlier p99 values during the memory spike window.

In Loki:
```logql
{service="backend"} |= "api_request" | json | status >= 200 | status < 300
  | line_format "{{.path}} {{.durationMs}}"
```

**Resolution:**
1. Verify the problematic endpoint enforces `limit`/`offset` pagination — check that it uses the `parsePagination` utility and does not fetch unbounded rows.
2. Add or lower the default `limit` in the route handler if it is currently missing.
3. If query results are legitimately large, consider streaming the response rather than buffering it in memory.
4. Apply a `QUERY_RESULT_LIMIT` environment variable guard in the DB layer as a safety net.

---

### 4. Event Listener Backlog

**Symptoms**: Memory grows after a long RPC outage or restart; `lastLedger` resets to `0` causing a full replay of all historical events.

**Diagnosis:**
```logql
{service="backend"} |= "event_listener" | json
```

Look for repeated `contract.event.received` entries at high frequency shortly after startup.

**Resolution:**
1. Stop the listener: the `stopEventListener()` call in `gracefulShutdown` handles this automatically on `SIGTERM`.
2. If replaying manually, set `EVENT_POLL_INTERVAL_MS` higher (e.g. `30000`) temporarily to throttle ingestion.
3. Consider persisting `lastLedger` to the database so replays start from the last processed ledger, not ledger 0.

---

## Step-by-Step Diagnosis Using Metrics and Logs

1. **Confirm the symptom** — verify `process_resident_memory_bytes` is abnormally high in Grafana.
2. **Check DB pool** — query `db_pool_available`; if it's 0, follow the [DB Connection Pool Leak](#1-db-connection-pool-leak) path.
3. **Check heap details** — look at `nodejs_heap_size_used_bytes` and `nodejs_external_memory_bytes` for heap vs. native allocation.
4. **Correlate with traffic** — overlay memory with `rate(http_requests_total[1m])` to check if the spike is traffic-driven.
5. **Check event listener** — search Loki for `event_listener` entries around the spike start time.
6. **Check cache sizes** — if no pool or listener issue, the cache is the most likely cause; see [Response / Appraisal Cache Growth](#2-response--appraisal-cache-growth).
7. **If cause still unclear** — enable `DEBUG=*` logging by setting `LOG_LEVEL=debug` in `.env` and restarting the service to surface verbose internal state.

---

## Resolution Steps Summary

| Root cause | Immediate action | Long-term fix |
|------------|-----------------|---------------|
| DB pool leak | Reduce `DB_POOL_SIZE`; restart | Fix handler missing connection release |
| Cache growth | Call `invalidateAll()`; lower TTL | Add max-size eviction |
| Large query results | Restart to reclaim; enforce pagination | Add `limit` guard to handler |
| Event listener replay | Restart with higher `EVENT_POLL_INTERVAL_MS` | Persist `lastLedger` to DB |

---

## Escalation Path

1. **0–10 min**: Follow the diagnosis steps above and attempt the immediate resolution.
2. **10–20 min**: If memory continues to grow and the container is near its limit, force a rolling restart:
   ```bash
   docker compose restart backend
   ```
   or on ECS Fargate: stop the task to trigger an automatic replacement.
3. **20+ min**: If the issue recurs after restart, page the **Backend Engineering Team** in `#incidents` on Slack with:
   - Screenshot of the Grafana memory panel
   - Relevant Loki log snippets
   - Which root-cause path was investigated and ruled out

---

## Related

- [DB Connection Pool Guide](../guides/connection-pool.md)
- [Observability Stack](../observability.md)
- [High Error Rate Runbook](high-error-rate.md)
- [DB Failure Runbook](db-failure.md)
- [Container Logs Runbook](container-logs.md)
