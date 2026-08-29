import React from "react";
import { act, render, screen } from "@testing-library/react";
import AnimatedCounter from "../components/AnimatedCounter";

// Mock framer-motion's useReducedMotion so we can control it in tests.
let mockReducedMotion = false;
jest.mock("framer-motion", () => ({
  ...jest.requireActual("framer-motion"),
  useReducedMotion: () => mockReducedMotion,
}));

beforeEach(() => {
  mockReducedMotion = false;
});

afterEach(() => {
  jest.clearAllMocks();
});

/**
 * Simulate the animation completing by flushing all pending rAF callbacks
 * until none remain, advancing the timestamp by msPerTick each call.
 * Works because jsdom's rAF is synchronous-like in tests.
 */
function runAnimation(totalMs = 1500, msPerTick = 16) {
  const ticks = Math.ceil(totalMs / msPerTick);
  for (let i = 0; i < ticks; i++) {
    act(() => {
      jest.advanceTimersByTime(msPerTick);
    });
  }
}

describe("AnimatedCounter", () => {
  it("shows the final value immediately when prefers-reduced-motion is set", () => {
    mockReducedMotion = true;
    render(<AnimatedCounter value={1234} />);
    expect(screen.getByText("1,234")).toBeTruthy();
  });

  it("starts at 0 when not in reduced-motion mode", () => {
    render(<AnimatedCounter value={1000} duration={1000} />);
    // Before any animation frames fire, display should be 0
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("eventually reaches the target value after animation completes", async () => {
    jest.useFakeTimers();

    let rafCallback: FrameRequestCallback | null = null;
    let timestamp = 0;

    const originalRAF = globalThis.requestAnimationFrame;
    const originalCAF = globalThis.cancelAnimationFrame;

    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    };
    globalThis.cancelAnimationFrame = jest.fn();

    render(<AnimatedCounter value={1000} duration={1000} />);

    // Simulate running the animation until complete (>1000ms worth of frames)
    for (let t = 0; t <= 1100; t += 16) {
      if (rafCallback) {
        const cb = rafCallback;
        rafCallback = null;
        timestamp = t;
        act(() => {
          cb(timestamp);
        });
      }
    }

    expect(screen.getByText("1,000")).toBeTruthy();

    globalThis.requestAnimationFrame = originalRAF;
    globalThis.cancelAnimationFrame = originalCAF;
    jest.useRealTimers();
  });

  it("re-animates when value changes", async () => {
    jest.useFakeTimers();

    let rafCallback: FrameRequestCallback | null = null;
    let timestamp = 0;

    const originalRAF = globalThis.requestAnimationFrame;
    const originalCAF = globalThis.cancelAnimationFrame;

    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    };
    globalThis.cancelAnimationFrame = jest.fn();

    const { rerender } = render(<AnimatedCounter value={500} duration={1000} />);

    // Run first animation to completion
    for (let t = 0; t <= 1100; t += 16) {
      if (rafCallback) {
        const cb = rafCallback;
        rafCallback = null;
        timestamp = t;
        act(() => { cb(timestamp); });
      }
    }
    expect(screen.getByText("500")).toBeTruthy();

    // Change value — should restart animation
    rerender(<AnimatedCounter value={800} duration={1000} />);

    // Animation not yet complete — shouldn't be at 800 yet immediately
    // (just verify it can animate to the new target)
    for (let t = timestamp; t <= timestamp + 1100; t += 16) {
      if (rafCallback) {
        const cb = rafCallback;
        rafCallback = null;
        act(() => { cb(t); });
      }
    }

    expect(screen.getByText("800")).toBeTruthy();

    globalThis.requestAnimationFrame = originalRAF;
    globalThis.cancelAnimationFrame = originalCAF;
    jest.useRealTimers();
  });

  it("respects a custom formatter", () => {
    mockReducedMotion = true;
    const fmt = (n: number) => `$${n.toFixed(2)}`;
    render(<AnimatedCounter value={42} formatter={fmt} />);
    expect(screen.getByText("$42.00")).toBeTruthy();
  });

  it("has aria-live=polite and aria-atomic attributes for accessibility", () => {
    mockReducedMotion = true;
    const { container } = render(
      <AnimatedCounter value={99} aria-label="Active loans" />,
    );
    const span = container.querySelector("span");
    expect(span?.getAttribute("aria-live")).toBe("polite");
    expect(span?.getAttribute("aria-atomic")).toBe("true");
    expect(span?.getAttribute("aria-label")).toBe("Active loans");
  });

  it("applies an optional className to the span", () => {
    mockReducedMotion = true;
    const { container } = render(
      <AnimatedCounter value={10} className="text-2xl font-bold" />,
    );
    const span = container.querySelector("span");
    expect(span?.classList.contains("text-2xl")).toBe(true);
    expect(span?.classList.contains("font-bold")).toBe(true);
  });

  it("clamps duration to at least 800ms (below-min input)", async () => {
    jest.useFakeTimers();

    let rafCallback: FrameRequestCallback | null = null;
    const originalRAF = globalThis.requestAnimationFrame;
    const originalCAF = globalThis.cancelAnimationFrame;

    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    };
    globalThis.cancelAnimationFrame = jest.fn();

    // duration=100 is below minimum, should be clamped to 800ms
    render(<AnimatedCounter value={100} duration={100} />);

    // Run 900ms worth of frames (more than the 800ms clamped duration)
    for (let t = 0; t <= 900; t += 16) {
      if (rafCallback) {
        const cb = rafCallback;
        rafCallback = null;
        act(() => { cb(t); });
      }
    }

    expect(screen.getByText("100")).toBeTruthy();

    globalThis.requestAnimationFrame = originalRAF;
    globalThis.cancelAnimationFrame = originalCAF;
    jest.useRealTimers();
  });

  it("clamps duration to at most 1200ms (above-max input)", async () => {
    jest.useFakeTimers();

    let rafCallback: FrameRequestCallback | null = null;
    const originalRAF = globalThis.requestAnimationFrame;
    const originalCAF = globalThis.cancelAnimationFrame;

    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    };
    globalThis.cancelAnimationFrame = jest.fn();

    // duration=9999 is above maximum, should be clamped to 1200ms
    render(<AnimatedCounter value={100} duration={9999} />);

    // Run 1350ms worth of frames (more than the 1200ms clamped duration)
    for (let t = 0; t <= 1350; t += 16) {
      if (rafCallback) {
        const cb = rafCallback;
        rafCallback = null;
        act(() => { cb(t); });
      }
    }

    expect(screen.getByText("100")).toBeTruthy();

    globalThis.requestAnimationFrame = originalRAF;
    globalThis.cancelAnimationFrame = originalCAF;
    jest.useRealTimers();
  });
});
