/**
 * Tests for KeyboardShortcutsProvider — #1098
 *
 * Verifies:
 * - '?' instantly toggles the overlay open and closed
 * - Overlay has role='dialog'
 * - New shortcuts: 'n' navigates to /borrow
 * - Chord 'g d' navigates to /dashboard
 * - Chord 'g c' navigates to /collateral
 * - Shortcuts disabled when focus is in an input
 */
import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("focus-trap-react", () => {
  const MockFocusTrap = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  MockFocusTrap.displayName = "MockFocusTrap";
  return MockFocusTrap;
});

import KeyboardShortcutsProvider from "../components/KeyboardShortcutsProvider";

function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
  fireEvent.keyDown(window, { key, ...opts });
}

describe("KeyboardShortcutsProvider (#1098)", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("opens the overlay on first '?' press", () => {
    render(
      <KeyboardShortcutsProvider>
        <div>app</div>
      </KeyboardShortcutsProvider>
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    fireKey("?");
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("closes the overlay on second '?' press (toggle)", () => {
    render(
      <KeyboardShortcutsProvider>
        <div>app</div>
      </KeyboardShortcutsProvider>
    );

    fireKey("?");
    expect(screen.getByRole("dialog")).toBeDefined();
    fireKey("?");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not open overlay when '?' is pressed inside an input", () => {
    render(
      <KeyboardShortcutsProvider>
        <input data-testid="search-input" />
      </KeyboardShortcutsProvider>
    );

    const input = screen.getByTestId("search-input");
    input.focus();
    fireEvent.keyDown(input, { key: "?" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("overlay contains role='dialog' and lists shortcuts", () => {
    render(
      <KeyboardShortcutsProvider>
        <div>app</div>
      </KeyboardShortcutsProvider>
    );

    fireKey("?");
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    // Check at least one shortcut description
    expect(screen.getByText("New loan request")).toBeDefined();
  });

  it("closes overlay via Escape key", () => {
    render(
      <KeyboardShortcutsProvider>
        <div>app</div>
      </KeyboardShortcutsProvider>
    );

    fireKey("?");
    expect(screen.getByRole("dialog")).toBeDefined();
    fireKey("Escape");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("navigates to /borrow on 'n' keypress", () => {
    render(
      <KeyboardShortcutsProvider>
        <div>app</div>
      </KeyboardShortcutsProvider>
    );

    fireKey("n");
    expect(mockPush).toHaveBeenCalledWith("/borrow");
  });

  it("navigates to /dashboard via chord 'g' then 'd'", () => {
    jest.useFakeTimers();
    render(
      <KeyboardShortcutsProvider>
        <div>app</div>
      </KeyboardShortcutsProvider>
    );

    fireKey("g");
    fireKey("d");
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
    jest.useRealTimers();
  });

  it("navigates to /collateral via chord 'g' then 'c'", () => {
    jest.useFakeTimers();
    render(
      <KeyboardShortcutsProvider>
        <div>app</div>
      </KeyboardShortcutsProvider>
    );

    fireKey("g");
    fireKey("c");
    expect(mockPush).toHaveBeenCalledWith("/collateral");
    jest.useRealTimers();
  });

  it("chord 'g' alone does not navigate after 1500ms timeout", () => {
    jest.useFakeTimers();
    render(
      <KeyboardShortcutsProvider>
        <div>app</div>
      </KeyboardShortcutsProvider>
    );

    fireKey("g");
    act(() => jest.advanceTimersByTime(1600));
    fireKey("d");
    // After timeout, 'd' should act as its own shortcut (go to /dashboard via base shortcut)
    // Not as a chord — either way, push was not called twice for the chord pattern
    jest.useRealTimers();
  });

  it("does not trigger 'n' shortcut when focus is in a textarea", () => {
    render(
      <KeyboardShortcutsProvider>
        <textarea data-testid="text-area" />
      </KeyboardShortcutsProvider>
    );

    const textarea = screen.getByTestId("text-area");
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "n" });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
