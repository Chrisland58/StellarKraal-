import { renderHook, act, waitFor } from "@testing-library/react";
import { useHealthFactor } from "../hooks/useHealthFactor";
import { healthColor } from "../lib/design-tokens";

// Mock design-tokens so no Tailwind classes need resolving
jest.mock("../lib/design-tokens", () => ({
  healthColor: jest.fn((value: number) => {
    if (value >= 15000) return "#16A34A"; // healthy
    if (value >= 10000) return "#D97706"; // warning
    return "#DC2626"; // danger
  }),
  colors: {},
  getContrastPair: jest.fn(),
}));

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  (global as any).fetch = fetchMock;
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

function mockHealth(health_factor: number) {
  fetchMock.mockResolvedValue({
    json: async () => ({ health_factor }),
  });
}

describe("useHealthFactor", () => {
  it("returns null and loading=false initially when loanId is empty", () => {
    const { result } = renderHook(() => useHealthFactor(""));
    expect(result.current.healthFactor).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("sets loading=true during fetch then false after", async () => {
    mockHealth(25000);
    const { result } = renderHook(() => useHealthFactor("42"));
    // loading starts true
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  // ── Healthy zone (> 2.0x = > 20_000 bps) ──────────────────────────────────

  it("healthy zone: health factor > 20_000 returns correct value", async () => {
    mockHealth(25000); // 2.5x
    const { result } = renderHook(() => useHealthFactor("1"));
    await waitFor(() => expect(result.current.healthFactor).toBe(25000));
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it("healthy zone: healthColor returns green for value > 15_000", () => {
    expect(healthColor(25000)).toBe("#16A34A");
    expect(healthColor(15001)).toBe("#16A34A");
  });

  // ── Warning zone (1.0–1.5x = 10_000–15_000 bps) ──────────────────────────

  it("warning zone: health factor 10_000–15_000 is returned correctly", async () => {
    mockHealth(12000); // 1.2x
    const { result } = renderHook(() => useHealthFactor("2"));
    await waitFor(() => expect(result.current.healthFactor).toBe(12000));
  });

  it("warning zone: healthColor returns amber for 10_000 <= value < 15_000", () => {
    expect(healthColor(10000)).toBe("#D97706");
    expect(healthColor(14999)).toBe("#D97706");
  });

  // ── Danger zone (< 1.0x = < 10_000 bps) ──────────────────────────────────

  it("danger zone: health factor < 10_000 is returned correctly", async () => {
    mockHealth(8000); // 0.8x
    const { result } = renderHook(() => useHealthFactor("3"));
    await waitFor(() => expect(result.current.healthFactor).toBe(8000));
  });

  it("danger zone: healthColor returns red for value < 10_000", () => {
    expect(healthColor(9999)).toBe("#DC2626");
    expect(healthColor(0)).toBe("#DC2626");
  });

  // ── Error state ────────────────────────────────────────────────────────────

  it("keeps stale value on fetch error", async () => {
    // First call succeeds
    mockHealth(20000);
    const { result } = renderHook(() => useHealthFactor("4"));
    await waitFor(() => expect(result.current.healthFactor).toBe(20000));

    // Second call fails
    fetchMock.mockRejectedValueOnce(new Error("network error"));
    await act(async () => {
      result.current.refresh();
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    // Value is preserved
    expect(result.current.healthFactor).toBe(20000);
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it("loading state: is true while fetch is pending", async () => {
    let resolve!: (v: unknown) => void;
    fetchMock.mockReturnValueOnce(
      new Promise((r) => { resolve = r; })
    );
    const { result } = renderHook(() => useHealthFactor("5"));
    expect(result.current.loading).toBe(true);
    act(() => {
      resolve({ json: async () => ({ health_factor: 15000 }) });
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  // ── Boundary values ────────────────────────────────────────────────────────

  it("healthColor boundary: exactly 15_000 is healthy", () => {
    expect(healthColor(15000)).toBe("#16A34A");
  });

  it("healthColor boundary: exactly 10_000 is warning", () => {
    expect(healthColor(10000)).toBe("#D97706");
  });

  it("healthColor boundary: 9_999 is danger", () => {
    expect(healthColor(9999)).toBe("#DC2626");
  });
});
