/**
 * Tests for #806 – HelpMenu redesigned as a slide-over panel.
 *
 * Verifies:
 * - Panel renders when isOpen=true, hidden when isOpen=false
 * - role="dialog" and aria-modal="true" present on open panel
 * - Panel contains: FAQ link, Glossary link, Help & Guides link, contact section
 * - Clicking the overlay calls onClose
 * - Pressing Escape calls onClose
 * - Close button calls onClose
 * - onShowOnboarding is called when "Getting Started Guide" is clicked
 * - Mobile full-width (sm:w-80) class present on panel
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HelpMenu from "@/components/HelpMenu";

function renderHelpMenu(
  overrides: Partial<React.ComponentProps<typeof HelpMenu>> = {}
) {
  const defaults = {
    isOpen: true,
    onClose: jest.fn(),
    onShowOnboarding: jest.fn(),
  };
  return render(<HelpMenu {...defaults} {...overrides} />);
}

describe("HelpMenu slide-over panel (#806)", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = renderHelpMenu({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it("renders the panel when isOpen is true", () => {
    renderHelpMenu();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("has role='dialog' and aria-modal='true'", () => {
    renderHelpMenu();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("has an accessible heading inside the dialog", () => {
    renderHelpMenu();
    expect(screen.getByRole("heading", { name: /help/i })).toBeTruthy();
  });

  it("renders a FAQ link", () => {
    renderHelpMenu();
    expect(screen.getByRole("link", { name: /faq/i })).toBeTruthy();
  });

  it("renders a Glossary link", () => {
    renderHelpMenu();
    expect(screen.getByRole("link", { name: /glossary/i })).toBeTruthy();
  });

  it("renders a Help & Guides link", () => {
    renderHelpMenu();
    const link = screen.getByRole("link", { name: /help.*guides/i });
    expect(link).toBeTruthy();
  });

  it("renders a contact/support section", () => {
    renderHelpMenu();
    expect(screen.getByText(/support@stellarkraal\.io/i)).toBeTruthy();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();
    renderHelpMenu({ onClose });
    fireEvent.click(screen.getByLabelText("Close help panel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the overlay is clicked", () => {
    const onClose = jest.fn();
    renderHelpMenu({ onClose });
    fireEvent.click(screen.getByTestId("help-overlay"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = jest.fn();
    renderHelpMenu({ onClose });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onShowOnboarding and onClose when 'Getting Started Guide' is clicked", () => {
    const onClose = jest.fn();
    const onShowOnboarding = jest.fn();
    renderHelpMenu({ onClose, onShowOnboarding });
    fireEvent.click(screen.getByText(/show getting started guide/i));
    expect(onShowOnboarding).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("panel has the full-width on mobile class (w-full)", () => {
    renderHelpMenu();
    const panel = screen.getByTestId("help-panel");
    expect(panel.className).toContain("w-full");
  });

  it("panel is accessible via aria-labelledby", () => {
    renderHelpMenu();
    const dialog = screen.getByRole("dialog");
    const labelId = dialog.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();
    const label = document.getElementById(labelId!);
    expect(label).toBeTruthy();
    expect(label!.textContent).toMatch(/help/i);
  });
});
