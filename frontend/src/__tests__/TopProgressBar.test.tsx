/**
 * Tests for TopProgressBar / useTopProgressBar — Issue #570
 */
import React, { Suspense } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { useTopProgressBar } from "@/hooks/useTopProgressBar";

// ── Mock next/navigation ─────────────────────────────────────────────────────
let mockPathname = "/";
let mockSearch = "";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => ({ toString: () => mockSearch }),
}));

// ── helpers ──────────────────────────────────────────────────────────────────

function setRoute(path: string, search = "") {
  mockPathname = path;
  mockSearch = search;
}

beforeEach(() => {
  jest.useFakeTimers();
  setRoute("/");
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// ── useTopProgressBar ─────────────────────────────────────────────────────────

describe("useTopProgressBar (#570)", () => {
  it("starts with progress=0 and visible=false", () => {
    const { result } = renderHook(() => useTopProgressBar());
    expect(result.current.progress).toBe(0);
    expect(result.current.visible).toBe(false);
  });

  it("becomes visible and progresses after a route change", async () => {
    const { result, rerender } = renderHook(() => useTopProgressBar());

    // First render establishes the previous route
    act(() => { jest.advanceTimersByTime(0); });
    expect(result.current.visible).toBe(false);

    // Simulate navigation
    setRoute("/collateral");
    rerender();

    act(() => { jest.advanceTimersByTime(0); });

    expect(result.current.visible).toBe(true);
    expect(result.current.progress).toBeGreaterThan(0);
  });

  it("progress is clamped between 0 and 100", () => {
    const { result } = renderHook(() => useTopProgressBar());
    act(() => { jest.advanceTimersByTime(5000); });
    expect(result.current.progress).toBeGreaterThanOrEqual(0);
    expect(result.current.progress).toBeLessThanOrEqual(100);
  });
});

// ── TopProgressBar component ─────────────────────────────────────────────────

jest.mock("@/hooks/useTopProgressBar", () => ({
  useTopProgressBar: jest.fn(),
}));

const { useTopProgressBar: mockHook } = jest.requireMock(
  "@/hooks/useTopProgressBar"
) as { useTopProgressBar: jest.Mock };

// TopProgressBar uses Suspense internally — we need a wrapper
function WrappedBar() {
  return (
    <Suspense fallback={null}>
      {/* Dynamic import would be overkill in tests; import directly */}
      {React.createElement(
        require("@/components/TopProgressBar").default
      )}
    </Suspense>
  );
}

describe("TopProgressBar component (#570)", () => {
  it("renders nothing when visible is false", () => {
    mockHook.mockReturnValue({ visible: false, progress: 0 });
    const { container } = render(<WrappedBar />);
    expect(screen.queryByTestId("top-progress-bar")).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it("renders the bar when visible is true", async () => {
    mockHook.mockReturnValue({ visible: true, progress: 50 });
    render(<WrappedBar />);
    await waitFor(() => {
      expect(screen.getByTestId("top-progress-bar")).toBeInTheDocument();
    });
  });

  it("bar has aria-hidden=true (hidden from screen readers)", async () => {
    mockHook.mockReturnValue({ visible: true, progress: 50 });
    render(<WrappedBar />);
    await waitFor(() => {
      const bar = screen.getByTestId("top-progress-bar");
      expect(bar).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("bar width reflects progress value", async () => {
    mockHook.mockReturnValue({ visible: true, progress: 65 });
    render(<WrappedBar />);
    await waitFor(() => {
      const bar = screen.getByTestId("top-progress-bar");
      // The inner div carries the width style
      const inner = bar.firstElementChild as HTMLElement;
      expect(inner?.style.width).toBe("65%");
    });
  });

  it("bar is position:fixed so it introduces no layout shift", async () => {
    mockHook.mockReturnValue({ visible: true, progress: 30 });
    render(<WrappedBar />);
    await waitFor(() => {
      const bar = screen.getByTestId("top-progress-bar");
      expect(bar).toHaveStyle("position: fixed");
    });
  });
});
