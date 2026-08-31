# API Rate Limits and Retry Behaviour

StellarKraal's backend protects its API and Soroban smart contract RPC endpoints from abuse, denial of service, and traffic spikes using [`express-rate-limit`](https://github.com/express-rate-limit/express-rate-limit). Rate limits are enforced **per client IP** across several functional tiers. Every HTTP request passes through the **global** limiter first; sensitive authentication and write routes apply additional, stricter limits.

Implementation: `backend/src/middleware/rateLimit.ts`, mounted in `backend/src/index.ts` and `backend/src/routes/v1.ts`.

---

## Rate Limit Tiers

| Tier | Limiter | Default Limit | Sliding Window | Configurable via Env |
|------|---------|---------------|----------------|----------------------|
| **Global** | `globalLimiter` | 60 req / min | 60 seconds | `RATE_LIMIT_GLOBAL` |
| **Auth** | `authLimiter` | 10 req / min | 60 seconds | `RATE_LIMIT_AUTH` (default: `10`) |
| **Read** | `readLimiter` | 100 req / min | 60 seconds | `RATE_LIMIT_READ` (default: `100`) |
| **Write** | `writeLimiter` | 10 req / min | 60 seconds | `RATE_LIMIT_WRITE` (default: `10`) |

### Tier Breakdown & Endpoints

1. **Global Tier (`globalLimiter`)**
   - Applies to all HTTP routes on the application, including `/metrics`, `/api/*`, `/api/v1/*`, and `/api/docs`.
   - Default: `60` requests per minute per IP.

2. **Auth Tier (`authLimiter`)**
   - Protects cryptographic challenge generation, signature verification, and JWT issuance:
     - `GET /api/auth/challenge`
     - `POST /api/auth/login`
     - `POST /api/auth/refresh`
   - Default: `10` requests per minute per IP.

3. **Read Tier (`readLimiter`)**
   - Protects standard data retrieval endpoints under `/api/v1`:
     - `GET /api/v1/health`
     - `GET /api/v1/loan/:id`
     - `GET /api/v1/health/:loanId`
     - `GET /api/v1/loans`
     - `GET /api/v1/collateral/:id`
     - `GET /api/v1/settings/:wallet`
     - `GET /api/v1/admin/webhooks`
     - `GET /api/v1/admin/webhooks/logs`
   - Default: `100` requests per minute per IP.

4. **Write Tier (`writeLimiter`)**
   - Applied to state-mutating and contract transaction-building endpoints:
     - `POST /api/v1/collateral/register`
     - `POST /api/v1/loan/request`
     - `POST /api/v1/loan/repay`
     - `POST /api/v1/loan/liquidate`
   - Default: `10` requests per minute per IP.

> [!NOTE]
> **Limiter Stacking:** When an endpoint is protected by both a specific limiter (e.g., `writeLimiter`) and the global limiter, each request increments both counters. A request will be rejected if either limiter's quota is exhausted.

---

## Response Headers

StellarKraal uses modern [IETF RFC draft standard headers](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers) (`standardHeaders: true`, `legacyHeaders: false`):

| Header | Type | Description |
|--------|------|-------------|
| `RateLimit-Limit` | Integer | The total quota granted in the current window for the limiter handling the request. |
| `RateLimit-Remaining` | Integer | Number of requests remaining in the current window before rate-limiting occurs. |
| `RateLimit-Reset` | Integer | Number of seconds remaining until the rate limit window resets. |
| `RateLimit-Policy` | String | Expressed quota policy in the format `<limit>;w=<window_seconds>`. |
| `Retry-After` | Integer | Present on `429 Too Many Requests` responses. Indicates the number of seconds the client must wait before retrying. |

---

## Realistic Response Header Examples

### 1. Global Tier (`GET /api/v1/health`)

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
RateLimit-Limit: 60
RateLimit-Remaining: 57
RateLimit-Reset: 42
RateLimit-Policy: 60;w=60
Date: Sat, 29 Aug 2026 01:00:00 GMT

{
  "status": "ok",
  "version": "1.0.0"
}
```

### 2. Auth Tier (`POST /api/auth/login`)

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
RateLimit-Limit: 10
RateLimit-Remaining: 8
RateLimit-Reset: 54
RateLimit-Policy: 10;w=60
Date: Sat, 29 Aug 2026 01:00:06 GMT

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### 3. Read Tier (`GET /api/v1/loans`)

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
RateLimit-Limit: 100
RateLimit-Remaining: 92
RateLimit-Reset: 35
RateLimit-Policy: 100;w=60
Date: Sat, 29 Aug 2026 01:00:25 GMT

{
  "loans": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

### 4. Write Tier (`POST /api/v1/collateral/register`)

```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
RateLimit-Limit: 10
RateLimit-Remaining: 6
RateLimit-Reset: 28
RateLimit-Policy: 10;w=60
Date: Sat, 29 Aug 2026 01:00:32 GMT

{
  "collateralId": "128",
  "status": "registered"
}
```

### 5. Exceeded Limit (429 Response)

When a client exhausts its quota within the 60-second window:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json; charset=utf-8
Retry-After: 60
RateLimit-Limit: 10
RateLimit-Remaining: 0
RateLimit-Reset: 60
RateLimit-Policy: 10;w=60
Date: Sat, 29 Aug 2026 01:00:45 GMT

{
  "error": "Too many requests",
  "retryAfter": 60
}
```

---

## `Retry-After` Header and Backoff Handling

When encountering an `HTTP 429 Too Many Requests` response:

1. **Check the `Retry-After` Header**: The server specifies the required delay in seconds. For StellarKraal, this is an integer (delta-seconds, e.g., `60`).
2. **Inspect the Body Payload**: The JSON error response payload mirrors this value in the `retryAfter` numerical field:
   ```json
   {
     "error": "Too many requests",
     "retryAfter": 60
   }
   ```
3. **Respect Server Delay**: The client application must pause all non-essential traffic for at least the specified number of seconds before attempting the request again.
4. **Apply Jitter**: Add a small randomized delay (jitter) to prevent synchronized retries across multiple concurrent clients (avoiding the *thundering herd* effect).

---

## Retry Algorithm with Exponential Backoff (Pseudocode)

When interacting with rate-limited APIs, clients should implement an exponential backoff algorithm with full jitter:

```text
Algorithm: RequestWithExponentialBackoffAndJitter

Input:
  request: HTTP Request object
  maxRetries: Maximum number of retry attempts (default: 5)
  baseDelayMs: Initial retry delay in milliseconds (default: 1000 ms)
  maxDelayMs: Maximum backoff ceiling in milliseconds (default: 30000 ms)

Output:
  HTTP Response object or Throws Exception

Begin:
  attempt := 0

  While attempt <= maxRetries Do:
    response := ExecuteHTTPRequest(request)

    // Return immediately on success or client errors other than 429
    If response.statusCode != 429 And response.statusCode < 500 Then:
      Return response
    End If

    attempt := attempt + 1
    If attempt > maxRetries Then:
      Throw Exception("Max retries exceeded for request. Last status: " + response.statusCode)
    End If

    // Determine sleep duration
    If response.statusCode == 429 And response.headers.has("Retry-After") Then:
      retryAfterSeconds := ParseInteger(response.headers.get("Retry-After"))
      // Convert to milliseconds and add a random jitter (0 - 500 ms)
      sleepMs := (retryAfterSeconds * 1000) + RandomInt(0, 500)
    Else:
      // Exponential backoff: baseDelay * 2^(attempt - 1)
      calculatedBackoff := Min(maxDelayMs, baseDelayMs * (2 ^ (attempt - 1)))
      // Full jitter: random duration between 0 and calculatedBackoff
      sleepMs := RandomFloat(0, 1) * calculatedBackoff
    End If

    Sleep(sleepMs)
  End While
End
```

---

## Client Implementation Examples

### JavaScript / TypeScript Example (Fetch API with Retry Logic)

The following example implements a reusable `fetchWithRetry` utility using native `fetch`:

```typescript
interface RequestOptions extends RequestInit {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

/**
 * Execute an HTTP request with automatic rate limit (429) & server error (5xx) retries.
 */
async function fetchWithRetry(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const {
    maxRetries = 5,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    ...fetchOptions
  } = options;

  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(url, fetchOptions);

      // Return immediately for non-retryable status codes
      if (response.status !== 429 && response.status < 500) {
        return response;
      }

      attempt++;
      if (attempt > maxRetries) {
        return response; // Return response after retries exhausted for caller handling
      }

      let delayMs: number;

      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("Retry-After");
        if (retryAfterHeader) {
          const seconds = parseInt(retryAfterHeader, 10);
          delayMs = (isNaN(seconds) ? 60 : seconds) * 1000 + Math.random() * 500;
        } else {
          // Attempt parsing JSON payload { retryAfter: number }
          try {
            const cloned = response.clone();
            const body = await cloned.json();
            const seconds = typeof body.retryAfter === "number" ? body.retryAfter : 60;
            delayMs = seconds * 1000 + Math.random() * 500;
          } catch {
            delayMs = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
          }
        }
      } else {
        // Exponential backoff with full jitter for 5xx errors
        const expBackoff = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
        delayMs = Math.random() * expBackoff;
      }

      console.warn(
        `[StellarKraal API] Request to ${url} encountered status ${response.status}. ` +
        `Retrying in ${Math.round(delayMs)}ms (attempt ${attempt}/${maxRetries})...`
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (error) {
      attempt++;
      if (attempt > maxRetries) {
        throw error;
      }
      const expBackoff = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
      const delayMs = Math.random() * expBackoff;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

// Example usage:
async function registerCollateral() {
  const response = await fetchWithRetry("http://localhost:3001/api/v1/collateral/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_JWT_TOKEN",
      "Idempotency-Key": "req_unique_id_12345"
    },
    body: JSON.stringify({
      animalType: "cattle",
      count: 10,
      location: "Barn A-12"
    })
  });

  if (!response.ok) {
    throw new Error(`Registration failed with status ${response.status}`);
  }

  const data = await response.json();
  console.log("Registered collateral:", data);
}
```

### Python Example (`requests` Client with Retry & Backoff)

The following example implements a production-ready Python client with rate limit awareness:

```python
import time
import random
import requests
from typing import Optional, Dict, Any

class StellarKraalClient:
    def __init__(
        self,
        base_url: str = "http://localhost:3001",
        api_token: Optional[str] = None,
        max_retries: int = 5,
        base_delay: float = 1.0,
        max_delay: float = 30.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.session = requests.Session()
        if api_token:
            self.session.headers.update({"Authorization": f"Bearer {api_token}"})

    def request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> requests.Response:
        url = f"{self.base_url}/{path.lstrip('/')}"
        attempt = 0

        while True:
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    params=params,
                    json=json,
                    headers=headers,
                    timeout=10,
                )

                # Inspect rate limit remaining headers
                remaining = response.headers.get("RateLimit-Remaining")
                if remaining and int(remaining) < 3:
                    print(f"Warning: Low rate limit remaining ({remaining} requests).")

                # If status is not 429 and not 5xx, return immediately
                if response.status_code != 429 and response.status_code < 500:
                    return response

                attempt += 1
                if attempt > self.max_retries:
                    return response

                # Determine backoff sleep duration
                if response.status_code == 429:
                    retry_after = response.headers.get("Retry-After")
                    if retry_after:
                        sleep_time = float(retry_after) + random.uniform(0.1, 0.5)
                    else:
                        try:
                            body = response.json()
                            sleep_time = float(body.get("retryAfter", 60)) + random.uniform(0.1, 0.5)
                        except Exception:
                            sleep_time = min(self.max_delay, self.base_delay * (2 ** (attempt - 1)))
                else:
                    # Exponential backoff with full jitter for 5xx
                    backoff = min(self.max_delay, self.base_delay * (2 ** (attempt - 1)))
                    sleep_time = random.uniform(0, backoff)

                print(
                    f"Request to {path} returned {response.status_code}. "
                    f"Retrying in {sleep_time:.2f}s (attempt {attempt}/{self.max_retries})..."
                )
                time.sleep(sleep_time)

            except requests.RequestException as exc:
                attempt += 1
                if attempt > self.max_retries:
                    raise exc
                backoff = min(self.max_delay, self.base_delay * (2 ** (attempt - 1)))
                sleep_time = random.uniform(0, backoff)
                time.sleep(sleep_time)

# Example usage:
if __name__ == "__main__":
    client = StellarKraalClient(base_url="http://localhost:3001", api_token="YOUR_TOKEN")
    
    # Query loans with retry handling
    response = client.request("GET", "/api/v1/loans")
    if response.status_code == 200:
        print("Loans retrieved:", response.json())
    else:
        print(f"Error {response.status_code}: {response.text}")
```

---

## Best Practices for Integrators

1. **Monitor `RateLimit-Remaining` Proactively**: If `RateLimit-Remaining` falls below 5, throttle or queue outgoing client requests locally rather than waiting for `429` errors.
2. **Utilize Idempotency Keys on Writes**: Always send an `Idempotency-Key` header with write requests (`POST /api/v1/loan/request`, `POST /api/v1/loan/repay`). If a write request times out or is retried after a 429 response, the backend ensures the operation is executed only once without duplicate side-effects.
3. **Cache Read Responses**: Endpoints like `GET /api/v1/loan/:id` and static data should be cached locally whenever possible to conserve rate limit quota.
4. **Avoid Batch Bursting**: Distribute batch operations over time using queues rather than dispatching concurrent parallel requests.

---

## Related Documentation

- [API Quickstart](./api-quickstart.md)
- [API Error Code Reference](../api-error-codes.md)
- [Idempotency Guide](./idempotency.md)
- [Response Caching Guide](./response-cache.md)
- Interactive OpenAPI UI: `/api/docs` when the backend is running

