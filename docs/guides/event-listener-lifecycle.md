# Event Listener Lifecycle

The contract event listener polls the Soroban RPC for on-chain events and synchronises the local database. This guide documents how to safely start and stop the listener, how it behaves on restart, and how to configure its polling interval.

The listener is implemented in [`backend/src/contractEventListener.ts`](../../backend/src/contractEventListener.ts).

---

## When the Listener Starts

The listener starts automatically during **server boot**, called from `backend/src/index.ts` after the database migrations have completed and the Express server is listening:

```typescript
// backend/src/index.ts (simplified)
await runDbMigrations();
server.listen(PORT, () => {
  logger.info("server_started", { port: PORT });
  startEventListener();   // ← starts the polling loop
});
```

`startEventListener()` validates that `CONTRACT_ID` is set. If it is not set, the listener logs a `event_listener_disabled` warning and returns immediately without starting — the rest of the server continues to function normally.

On successful start, the listener emits:
```json
{
  "message": "event_listener_started",
  "eventType": "contract.event.listener_started",
  "contractId": "C...",
  "intervalMs": 5000
}
```

---

## When the Listener Stops

The listener stops as part of the **graceful shutdown** sequence triggered by `SIGTERM` or `SIGINT` (e.g. `docker stop`, Kubernetes pod termination, or `Ctrl+C`). The shutdown handler in `backend/src/index.ts` calls `stopEventListener()` before draining in-flight HTTP requests:

```typescript
// backend/src/index.ts (simplified)
process.on("SIGTERM", async () => {
  stopEventListener();    // ← stops the polling loop
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
});
```

`stopEventListener()` clears the internal `setTimeout` timer, sets the `pollTimer` reference to `null`, and emits:
```json
{
  "message": "event_listener_stopped",
  "eventType": "contract.event.listener_stopped",
  "contractId": "C...",
  "ledger": 12345
}
```

It is safe to call `stopEventListener()` multiple times (idempotent — a second call is a no-op if no timer is active).

---

## Polling Interval Configuration

The listener runs a `setTimeout`-based loop (not `setInterval`) so each poll waits for the previous one to complete before scheduling the next. This prevents RPC calls from piling up if the network is slow.

| Environment variable | Default | Description |
|---------------------|---------|-------------|
| `EVENT_POLL_INTERVAL_MS` | `5000` | Milliseconds between poll cycles |
| `EVENT_LISTENER_LOG_LEVEL` | `info` | Log verbosity: `debug`, `info`, `warn`, `error` |

The interval can be overridden at startup:

```typescript
startEventListener(10_000); // poll every 10 seconds
```

Or via environment variable before starting the server:
```bash
EVENT_POLL_INTERVAL_MS=10000 npm start
```

**Recommendations:**

- **Testnet / development**: `5000 ms` (default) — low latency, acceptable RPC load.
- **Production mainnet**: `10000–30000 ms` — reduces RPC costs while still catching events within one ledger close (~5 s per ledger).
- **After a long outage / restart with full replay**: temporarily increase to `30000 ms` to throttle event ingestion and avoid memory pressure.

---

## Missed Events and Replay on Restart

The listener tracks the last processed ledger in a module-level variable:

```typescript
let lastLedger = 0; // in-memory only, resets to 0 on process restart
```

### First poll after startup (`lastLedger === 0`)

The listener uses `cursor: "0"`, which instructs the RPC to return **all historical events** for the contract from the beginning. This means every restart triggers a full replay of the entire event history.

The store functions (`insertCollateral`, `insertLoan`, etc.) are **idempotent** — replaying an event that was already persisted results in an upsert, not a duplicate. So a full replay is safe, just slower.

### Subsequent polls (`lastLedger > 0`)

Each poll fetches only events with `startLedger: lastLedger + 1`, processing only new events since the last cycle.

```typescript
const eventsRequest = lastLedger > 0
  ? { startLedger: lastLedger + 1, filters: [...] }
  : { cursor: "0",                 filters: [...] };
```

### Persistent cursor (future improvement)

The current implementation does not persist `lastLedger` to the database. After a restart, the cursor resets to `0` and a full replay occurs. For high-volume deployments where full replay is too slow, the cursor should be stored in the database and restored on startup. Track progress on this in the relevant GitHub issue.

---

## Sequence: Startup and Shutdown

```
Server process start
│
├─ runDbMigrations()          — apply any pending DB migrations
├─ server.listen(PORT)        — begin accepting HTTP connections
└─ startEventListener()       — begin polling loop
      │
      └─ tick()               — first poll (lastLedger = 0, full replay)
            │
            ├─ poll()         — RPC call: getEvents(cursor="0", ...)
            ├─ handleEvent()  — process each returned event
            ├─ lastLedger = N — advance cursor
            └─ setTimeout(tick, 5000)  — schedule next poll
                  │
                  └─ ... repeats ...

SIGTERM / SIGINT received
│
├─ stopEventListener()        — clearTimeout(pollTimer)
├─ server.close()             — stop accepting new connections
├─ drain in-flight requests   — wait up to SHUTDOWN_TIMEOUT_MS
└─ process.exit(0)
```

---

## Error Handling

| Error type | Behaviour |
|-----------|-----------|
| RPC network error | Logged as `contract.event.poll_error`; listener schedules next poll normally (does not crash) |
| Event parse error | Logged as `contract.event.parse_error`; the failing event is skipped; listener continues |
| `CONTRACT_ID` unset | `startEventListener()` logs `event_listener_disabled` and returns; listener never starts |
| `stopEventListener()` called twice | No-op; safe |

The listener **never throws** to the caller. All errors are caught internally and logged as structured entries.

---

## Manual Control (Development / Testing)

The listener can be started and stopped programmatically without a full server restart:

```typescript
import { startEventListener, stopEventListener } from './contractEventListener';

// Start with a custom interval
startEventListener(2000);

// Stop (e.g. in test teardown)
stopEventListener();
```

In tests, `stopEventListener()` is called in `afterEach`/`afterAll` to prevent timer leaks between test cases.

---

## Related

- [`contractEventListener.ts`](../../backend/src/contractEventListener.ts) — source code
- [`contractEventListener.test.ts`](../../backend/src/contractEventListener.test.ts) — unit tests
- [Contract Event Listener Architecture](contract-event-listener.md) — polling architecture, event types, and DB sync details
- [Observability Stack](../observability.md) — how listener logs flow to Loki/Grafana
- [High Memory Runbook](../runbooks/high-memory.md) — diagnosing memory growth caused by event replay
