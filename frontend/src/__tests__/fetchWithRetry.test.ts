/**
 * Unit tests for fetchWithRetry.
 *
 * Covers:
 *  - Success on first attempt (no retries)
 *  - 4xx responses are NOT retried (returned immediately)
 *  - 5xx responses ARE retried up to maxAttempts
 *  - Network errors are retried up to maxAttempts
 *  - onRetry toast callback is called on each retry with correct attempt number
 *  - onError callback is called once after all retries are exhausted
 *  - Backoff delays follow the 1 s / 2 s pattern (using fake timers)
 *  - Total fetch call count equals maxAttempts on total failure
 *  - Throws after all attempts fail
 */

import { fetchWithRetry } from '@/lib/fetchWithRetry';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeResponse(status: number, ok: boolean): Response {
  return { ok, status, json: async () => ({}) } as unknown as Response;
}

/**
 * Run the fetchWithRetry promise to completion, advancing fake timers as needed.
 * Returns the settled result (value or error).
 */
async function runToCompletion<T>(
  promise: Promise<T>,
): Promise<{ value: T; error?: never } | { value?: never; error: unknown }> {
  // Attach catch early to prevent unhandled rejection warnings.
  const settled = promise.then(
    (value) => ({ value } as { value: T }),
    (error) => ({ error } as { error: unknown }),
  );
  // Advance all timers so backoff delays resolve.
  await jest.runAllTimersAsync();
  return settled;
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('fetchWithRetry', () => {
  describe('successful requests', () => {
    it('resolves immediately on a 200 response without retrying', async () => {
      const mockFetch = jest.fn().mockResolvedValue(makeResponse(200, true));
      global.fetch = mockFetch;

      const result = await runToCompletion(fetchWithRetry('/api/test'));
      expect(result.error).toBeUndefined();
      expect((result.value as Response).status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('4xx responses (non-retryable)', () => {
    it('returns a 404 response immediately without retrying', async () => {
      const mockFetch = jest.fn().mockResolvedValue(makeResponse(404, false));
      global.fetch = mockFetch;

      const result = await runToCompletion(fetchWithRetry('/api/test'));
      expect(result.error).toBeUndefined();
      expect((result.value as Response).status).toBe(404);
      // Must NOT retry
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('returns a 401 response immediately without retrying', async () => {
      const mockFetch = jest.fn().mockResolvedValue(makeResponse(401, false));
      global.fetch = mockFetch;

      const result = await runToCompletion(fetchWithRetry('/api/test'));
      expect((result.value as Response).status).toBe(401);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('does not call onRetry or onError for 4xx', async () => {
      const mockFetch = jest.fn().mockResolvedValue(makeResponse(400, false));
      global.fetch = mockFetch;
      const onRetry = jest.fn();
      const onError = jest.fn();

      await runToCompletion(fetchWithRetry('/api/test', { toast: { onRetry, onError } }));
      expect(onRetry).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('5xx responses (retryable)', () => {
    it('retries a 500 response up to maxAttempts and then throws', async () => {
      const mockFetch = jest.fn().mockResolvedValue(makeResponse(500, false));
      global.fetch = mockFetch;

      const result = await runToCompletion(fetchWithRetry('/api/test', { maxAttempts: 3 }));
      expect(result.error).toBeDefined();
      expect((result.error as Error).message).toBe('Server error: 500');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('succeeds on the second attempt after an initial 503', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce(makeResponse(503, false))
        .mockResolvedValueOnce(makeResponse(200, true));
      global.fetch = mockFetch;

      const result = await runToCompletion(fetchWithRetry('/api/test'));
      expect(result.error).toBeUndefined();
      expect((result.value as Response).status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('network errors (retryable)', () => {
    it('retries on TypeError (network failure) up to maxAttempts', async () => {
      const networkError = new TypeError('Failed to fetch');
      const mockFetch = jest.fn().mockRejectedValue(networkError);
      global.fetch = mockFetch;

      const result = await runToCompletion(fetchWithRetry('/api/test', { maxAttempts: 3 }));
      expect(result.error).toBeDefined();
      expect((result.error as TypeError).message).toBe('Failed to fetch');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('succeeds if the network error clears on retry', async () => {
      const mockFetch = jest
        .fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(makeResponse(200, true));
      global.fetch = mockFetch;

      const result = await runToCompletion(fetchWithRetry('/api/test'));
      expect(result.error).toBeUndefined();
      expect((result.value as Response).status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('toast callbacks', () => {
    it('calls onRetry before each retry with the correct attempt number', async () => {
      const mockFetch = jest.fn().mockResolvedValue(makeResponse(500, false));
      global.fetch = mockFetch;
      const onRetry = jest.fn();

      await runToCompletion(
        fetchWithRetry('/api/test', { maxAttempts: 3, toast: { onRetry } }),
      );

      // 3 attempts → 2 retries → onRetry called twice: attempt 1 and attempt 2
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1);
      expect(onRetry).toHaveBeenNthCalledWith(2, 2);
    });

    it('calls onError once after all retries are exhausted', async () => {
      const mockFetch = jest.fn().mockResolvedValue(makeResponse(500, false));
      global.fetch = mockFetch;
      const onError = jest.fn();

      await runToCompletion(
        fetchWithRetry('/api/test', { maxAttempts: 3, toast: { onError } }),
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith('Server error: 500');
    });

    it('calls onError with the network error message', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new TypeError('Network offline'));
      global.fetch = mockFetch;
      const onError = jest.fn();

      await runToCompletion(
        fetchWithRetry('/api/test', { maxAttempts: 2, toast: { onError } }),
      );

      expect(onError).toHaveBeenCalledWith('Network offline');
    });
  });

  describe('backoff timing', () => {
    it('waits 1 s before the first retry (backoff delay = baseDelayMs * 2^0)', async () => {
      // Track recorded delays via a spy on the delay helper (setTimeout)
      const delays: number[] = [];
      const origSetTimeout = globalThis.setTimeout;
      jest
        .spyOn(globalThis, 'setTimeout')
        .mockImplementation(
          (
            fn: (...args: unknown[]) => void,
            ms?: number,
            ...args: unknown[]
          ) => {
            if (ms !== undefined && ms >= 100) delays.push(ms);
            // Fake timers are already installed; call the real impl with 0ms
            // so Jest can control advancement.
            return origSetTimeout(fn, 0, ...args);
          },
        );

      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce(makeResponse(500, false))
        .mockResolvedValueOnce(makeResponse(200, true));
      global.fetch = mockFetch;

      await runToCompletion(fetchWithRetry('/api/test', { baseDelayMs: 1000 }));

      jest.restoreAllMocks();
      // First retry → delay = 1000 ms
      expect(delays[0]).toBe(1000);
    });

    it('waits 2 s before the second retry (backoff delay = baseDelayMs * 2^1)', async () => {
      const delays: number[] = [];
      const origSetTimeout = globalThis.setTimeout;
      jest
        .spyOn(globalThis, 'setTimeout')
        .mockImplementation(
          (
            fn: (...args: unknown[]) => void,
            ms?: number,
            ...args: unknown[]
          ) => {
            if (ms !== undefined && ms >= 100) delays.push(ms);
            return origSetTimeout(fn, 0, ...args);
          },
        );

      const mockFetch = jest.fn().mockResolvedValue(makeResponse(500, false));
      global.fetch = mockFetch;

      await runToCompletion(fetchWithRetry('/api/test', { maxAttempts: 3, baseDelayMs: 1000 }));

      jest.restoreAllMocks();
      // Delays for 3 attempts: 1000 ms (before attempt 2) and 2000 ms (before attempt 3)
      expect(delays).toEqual([1000, 2000]);
    });

    it('the third backoff delay would be 4 s (2^2 * baseDelayMs)', async () => {
      const delays: number[] = [];
      const origSetTimeout = globalThis.setTimeout;
      jest
        .spyOn(globalThis, 'setTimeout')
        .mockImplementation(
          (
            fn: (...args: unknown[]) => void,
            ms?: number,
            ...args: unknown[]
          ) => {
            if (ms !== undefined && ms >= 100) delays.push(ms);
            return origSetTimeout(fn, 0, ...args);
          },
        );

      const mockFetch = jest.fn().mockResolvedValue(makeResponse(500, false));
      global.fetch = mockFetch;

      await runToCompletion(fetchWithRetry('/api/test', { maxAttempts: 4, baseDelayMs: 1000 }));

      jest.restoreAllMocks();
      // 4 attempts → 3 retries → delays: 1000, 2000, 4000
      expect(delays).toEqual([1000, 2000, 4000]);
    });
  });

  describe('maxAttempts option', () => {
    it('respects a custom maxAttempts value', async () => {
      const mockFetch = jest.fn().mockResolvedValue(makeResponse(500, false));
      global.fetch = mockFetch;

      await runToCompletion(fetchWithRetry('/api/test', { maxAttempts: 5 }));
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it('does not retry at all when maxAttempts is 1', async () => {
      const mockFetch = jest.fn().mockResolvedValue(makeResponse(500, false));
      global.fetch = mockFetch;
      const onRetry = jest.fn();

      await runToCompletion(
        fetchWithRetry('/api/test', { maxAttempts: 1, toast: { onRetry } }),
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(onRetry).not.toHaveBeenCalled();
    });
  });
});
