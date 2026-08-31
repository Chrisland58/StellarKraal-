import { renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { useKeyboardShortcuts, Shortcut } from "@/hooks/useKeyboardShortcuts";

function key(k: string, opts: Partial<KeyboardEventInit> = {}) {
  fireEvent.keyDown(window, { key: k, ...opts });
}

describe("useKeyboardShortcuts", () => {
  let action: jest.Mock;
  let shortcuts: Shortcut[];

  beforeEach(() => {
    action = jest.fn();
    shortcuts = [{ key: "b", hint: "B", label: "Borrow", action }];
  });

  it("calls action when matching key is pressed", () => {
    renderHook(() => useKeyboardShortcuts(shortcuts));
    key("b");
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("does not call action for unregistered keys", () => {
    renderHook(() => useKeyboardShortcuts(shortcuts));
    key("x");
    expect(action).not.toHaveBeenCalled();
  });

  it("ignores keys when Ctrl is held", () => {
    renderHook(() => useKeyboardShortcuts(shortcuts));
    key("b", { ctrlKey: true });
    expect(action).not.toHaveBeenCalled();
  });

  it("ignores keys when Alt is held", () => {
    renderHook(() => useKeyboardShortcuts(shortcuts));
    key("b", { altKey: true });
    expect(action).not.toHaveBeenCalled();
  });

  it("ignores keys when Meta is held", () => {
    renderHook(() => useKeyboardShortcuts(shortcuts));
    key("b", { metaKey: true });
    expect(action).not.toHaveBeenCalled();
  });

  it("ignores keys when an input is focused", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useKeyboardShortcuts(shortcuts));
    key("b");
    expect(action).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("ignores keys when a dialog is present in the DOM", () => {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    document.body.appendChild(dialog);

    renderHook(() => useKeyboardShortcuts(shortcuts));
    key("b");
    expect(action).not.toHaveBeenCalled();

    document.body.removeChild(dialog);
  });

  it("removes listener on unmount", () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));
    unmount();
    key("b");
    expect(action).not.toHaveBeenCalled();
  });

  // ── Shift+C (wallet connect shortcut) ─────────────────────────────────────

  it("calls action on Shift+C (shift shortcut)", () => {
    const shiftAction = jest.fn();
    const shiftShortcuts: Shortcut[] = [
      { key: "C", shift: true, hint: "Shift+C", label: "Connect wallet", action: shiftAction },
    ];
    renderHook(() => useKeyboardShortcuts(shiftShortcuts));
    // Browser reports key='C' (uppercase) when Shift is held
    key("C", { shiftKey: true });
    expect(shiftAction).toHaveBeenCalledTimes(1);
  });

  it("does not call shift shortcut without shiftKey", () => {
    const shiftAction = jest.fn();
    const shiftShortcuts: Shortcut[] = [
      { key: "C", shift: true, hint: "Shift+C", label: "Connect wallet", action: shiftAction },
    ];
    renderHook(() => useKeyboardShortcuts(shiftShortcuts));
    // Press 'C' without Shift — should not trigger the shift-guarded shortcut
    key("C", { shiftKey: false });
    expect(shiftAction).not.toHaveBeenCalled();
  });

  it("does not call shift shortcut when focus is in input", () => {
    const shiftAction = jest.fn();
    const shiftShortcuts: Shortcut[] = [
      { key: "C", shift: true, hint: "Shift+C", label: "Connect wallet", action: shiftAction },
    ];

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useKeyboardShortcuts(shiftShortcuts));
    key("C", { shiftKey: true });
    expect(shiftAction).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });
});
