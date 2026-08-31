/**
 * fetchWithRetry — exponential-backoff wrapper around the Fetch API.
 *
 * Behaviour:
 *  - Max 3 attempts (initial + 2 retries).
 *  - Backoff delays: 1 s, 2 s, 4 s (powers of 2 starting at 1 s).
 *  - Retries ONLY on network errors (fetch throws) and 5xx responses.
 *  - 4xx responses are treated as permanent failures and are NOT retried.
 *  - Calls `onRetry(attempt)` before each retry so callers can show a toast.
 *  - Calls `onError(message)` when all attempts are exhausted.
 */

export interface RetryToastCallbacks {
  /** Called before every retry, with the 1-based attempt number (1 = first retry). */
  onRetry?: (attempt: number) => void;
  /** Called once all retries are exhausted with the final error message. */
  onError?: (message: string) => void;
}

export interface FetchWithRetryOptions extends RequestInit {
  /** Maximum number of total attempts (default: 3). */
  maxAttempts?: number;
  /** Base delay in milliseconds for exponential backoff (default: 1000). */
  baseDelayMs?: number;
  toast?: RetryToastCallbacks;
}

/** Resolves after `ms` milliseconds. Wraps in a `setTimeout` so Jest fake timers can control it. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns `true` when the response should trigger a retry (5xx server errors).
 * 4xx responses are permanent client errors and must NOT be retried.
 */
function isRetryableStatus(status: number): boolean {
  return status >= 500 && status <= 599;
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const { maxAttempts = 3, baseDelayMs = 1000, toast, ...fetchOptions } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      // Non-retryable failure (e.g. 4xx) — return as-is so callers can handle it.
      if (!response.ok && !isRetryableStatus(response.status)) {
        return response;
      }

      // Success OR 5xx that we'll retry below.
      if (response.ok) {
        return response;
      }

      // 5xx — treat as a network-like failure so the retry logic below applies.
      lastError = new Error(`Server error: ${response.status}`);
    } catch (err) {
      // Network error (fetch itself threw — e.g. no connectivity).
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    // If we still have retries left, wait and notify the caller.
    if (attempt < maxAttempts) {
      const waitMs = baseDelayMs * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      toast?.onRetry?.(attempt);
      await delay(waitMs);
    }
  }

  // All attempts exhausted — notify caller and re-throw.
  const message = lastError?.message ?? 'Request failed after retries';
  toast?.onError?.(message);
  throw lastError ?? new Error(message);
}
