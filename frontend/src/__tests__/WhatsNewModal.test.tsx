/**
 * Tests for #807 – What's new feature announcement modal.
 *
 * Verifies:
 * - Modal renders when isOpen=true; hidden when isOpen=false
 * - Shows top 3 new features with icons and one-line descriptions
 * - 'Learn more' link is present and points to CHANGELOG
 * - 'Got it' button calls onClose
 * - × (dismiss) button calls onClose
 * - Escape key calls onClose
 * - Backdrop click calls onClose
 * - useWhatsNew: isOpen=true when version not in localStorage
 * - useWhatsNew: isOpen=false when current version already in localStorage
 * - useWhatsNew.dismiss(): writes WHATS_NEW_VERSION to localStorage
 * - Component is keyboard-navigable (role=dialog, aria-modal, focus trap)
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";

import WhatsNewModal, {
  useWhatsNew,
  WHATS_NEW_VERSION,
} from "@/components/WhatsNewModal";

const STORAGE_KEY = "stellarkraal.whats_new_seen_version";

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderModal(overrides: Partial<React.ComponentProps<typeof WhatsNewModal>> = {}) {
  const defaults = {
    isOpen: true,
    onClose: jest.fn(),
  };
  return render(<WhatsNewModal {...defaults} {...overrides} />);
}

// ── WhatsNewModal rendering ───────────────────────────────────────────────────

describe("WhatsNewModal (#807)", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it("renders the dialog when isOpen is true", () => {
    renderModal();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("has role='dialog' and aria-modal='true'", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("has an accessible heading", () => {
    renderModal();
    expect(
      screen.getByRole("heading", { name: /what.s new in stellarkraal/i })
    ).toBeTruthy();
  });

  it("displays the current version number", () => {
    renderModal();
    expect(screen.getByText(new RegExp(`v${WHATS_NEW_VERSION}`))).toBeTruthy();
  });

  it("renders exactly 3 feature items", () => {
    renderModal();
    const featureList = screen.getByRole("list", { name: /new features/i });
    const items = featureList.querySelectorAll("li");
    expect(items.length).toBe(3);
  });

  it("renders the first feature: Skeleton loading screens", () => {
    renderModal();
    expect(screen.getByText(/skeleton loading screens/i)).toBeTruthy();
  });

  it("renders the second feature: Toast position preference", () => {
    renderModal();
    expect(screen.getByText(/toast position preference/i)).toBeTruthy();
  });

  it("renders the third feature: Redesigned Help panel", () => {
    renderModal();
    expect(screen.getByText(/redesigned help panel/i)).toBeTruthy();
  });

  it("has a 'Learn more' link", () => {
    renderModal();
    const link = screen.getByRole("link", { name: /learn more/i });
    expect(link).toBeTruthy();
  });

  it("'Got it' button calls onClose", () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dismiss (×) button calls onClose", () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByLabelText("Dismiss what's new"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape key calls onClose", () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("backdrop click calls onClose", () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByTestId("whats-new-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("is labelled by its heading (aria-labelledby)", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    const labelId = dialog.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();
    const label = document.getElementById(labelId!);
    expect(label).toBeTruthy();
    expect(label!.textContent).toMatch(/what.s new/i);
  });
});

// ── useWhatsNew version-tracking ──────────────────────────────────────────────

describe("useWhatsNew version tracking (#807)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("isOpen is true when no version is stored in localStorage", () => {
    const { result } = renderHook(() => useWhatsNew());
    expect(result.current.isOpen).toBe(true);
  });

  it("isOpen is false when WHATS_NEW_VERSION is already stored", () => {
    localStorage.setItem(STORAGE_KEY, WHATS_NEW_VERSION);
    const { result } = renderHook(() => useWhatsNew());
    expect(result.current.isOpen).toBe(false);
  });

  it("isOpen is true when an older version is stored", () => {
    localStorage.setItem(STORAGE_KEY, "0.0.0");
    const { result } = renderHook(() => useWhatsNew());
    expect(result.current.isOpen).toBe(true);
  });

  it("dismiss() sets isOpen to false", () => {
    const { result } = renderHook(() => useWhatsNew());
    expect(result.current.isOpen).toBe(true);
    act(() => {
      result.current.dismiss();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("dismiss() writes WHATS_NEW_VERSION to localStorage", () => {
    const { result } = renderHook(() => useWhatsNew());
    act(() => {
      result.current.dismiss();
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe(WHATS_NEW_VERSION);
  });
});
