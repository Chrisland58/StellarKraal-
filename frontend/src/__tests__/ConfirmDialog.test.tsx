/**
 * ConfirmDialog tests — #810
 *
 * Verifies:
 *   - default variant renders confirm button with secondary (gold) style
 *   - destructive variant renders confirm button with danger style
 *   - cancel button always uses ghost/neutral style
 *   - destructive confirm button has aria-label describing the consequence
 *   - onConfirm / onCancel callbacks fire correctly
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmDialog from "../components/ConfirmDialog";

// focus-trap-react needs a working DOM — mock it so tests don't need jsdom full setup
jest.mock("focus-trap-react", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseProps = {
  open: true,
  title: "Test dialog",
  message: "Are you sure?",
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe("ConfirmDialog — default variant", () => {
  it("renders the dialog title", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByText("Test dialog")).toBeTruthy();
  });

  it("renders the dialog message", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByText("Are you sure?")).toBeTruthy();
  });

  it("renders a confirm button labelled 'Confirm'", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByRole("button", { name: /^confirm$/i })).toBeTruthy();
  });

  it("renders a cancel button labelled 'Cancel'", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeTruthy();
  });

  it("confirm button uses secondary (non-danger) styling", () => {
    render(<ConfirmDialog {...baseProps} variant="default" />);
    const confirmBtn = screen.getByRole("button", { name: /^confirm$/i });
    // secondary variant has gold background class
    expect(confirmBtn.className).toContain("bg-gold-600");
    expect(confirmBtn.className).not.toContain("bg-error");
  });

  it("calls onConfirm when confirm button is clicked", () => {
    render(<ConfirmDialog {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(<ConfirmDialog {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("accepts custom confirmLabel and cancelLabel", () => {
    render(
      <ConfirmDialog
        {...baseProps}
        confirmLabel="Yes, proceed"
        cancelLabel="No, go back"
      />
    );
    expect(screen.getByRole("button", { name: /yes, proceed/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /no, go back/i })).toBeTruthy();
  });
});

describe("ConfirmDialog — destructive variant", () => {
  it("confirm button uses the danger style", () => {
    render(<ConfirmDialog {...baseProps} variant="destructive" confirmLabel="Delete" />);
    const confirmBtn = screen.getByRole("button", { name: /delete/i });
    expect(confirmBtn.className).toContain("bg-error");
  });

  it("confirm button does NOT use secondary/gold style", () => {
    render(<ConfirmDialog {...baseProps} variant="destructive" confirmLabel="Delete" />);
    const confirmBtn = screen.getByRole("button", { name: /delete/i });
    expect(confirmBtn.className).not.toContain("bg-gold-600");
  });

  it("destructive confirm button has aria-label describing the consequence", () => {
    render(
      <ConfirmDialog
        {...baseProps}
        variant="destructive"
        confirmLabel="Delete"
        destructiveAriaLabel="Delete this loan permanently"
      />
    );
    const confirmBtn = screen.getByRole("button", { name: /delete this loan permanently/i });
    expect(confirmBtn).toBeTruthy();
  });

  it("falls back to confirmLabel as aria-label when destructiveAriaLabel is omitted", () => {
    render(
      <ConfirmDialog
        {...baseProps}
        variant="destructive"
        confirmLabel="Remove"
      />
    );
    // The button should be findable by its confirmLabel text
    const confirmBtn = screen.getByRole("button", { name: /remove/i });
    expect(confirmBtn.getAttribute("aria-label")).toBe("Remove");
  });

  it("cancel button always uses ghost/neutral style regardless of variant", () => {
    render(<ConfirmDialog {...baseProps} variant="destructive" />);
    const cancelBtn = screen.getByRole("button", { name: /^cancel$/i });
    // ghost variant has border class
    expect(cancelBtn.className).toContain("border-brown-300");
  });

  it("calls onConfirm when destructive confirm button is clicked", () => {
    render(
      <ConfirmDialog {...baseProps} variant="destructive" confirmLabel="Delete" />
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe("ConfirmDialog — closed state", () => {
  it("renders nothing when open=false", () => {
    const { container } = render(<ConfirmDialog {...baseProps} open={false} />);
    expect(container.firstChild).toBeNull();
  });
});
