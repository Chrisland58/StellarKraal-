/**
 * Tests for FieldTooltip component — #1095
 *
 * Verifies:
 * - Tooltip hidden by default
 * - Shows on hover (mouseenter/mouseleave)
 * - Shows on keyboard focus/blur
 * - Toggle on click
 * - Closes on Escape
 * - role='tooltip' and aria-describedby applied correctly
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FieldTooltip from "../components/FieldTooltip";

const TOOLTIP_CONTENT = "LTV is how much you borrow vs your collateral value.";

describe("FieldTooltip (#1095)", () => {
  it("does not show tooltip content by default", () => {
    render(<FieldTooltip content={TOOLTIP_CONTENT} />);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("renders the info icon button with default aria-label", () => {
    render(<FieldTooltip content={TOOLTIP_CONTENT} />);
    const btn = screen.getByRole("button", { name: /more information/i });
    expect(btn).toBeDefined();
  });

  it("accepts a custom aria-label", () => {
    render(<FieldTooltip content={TOOLTIP_CONTENT} label="What is LTV?" />);
    const btn = screen.getByRole("button", { name: /what is ltv/i });
    expect(btn).toBeDefined();
  });

  it("shows tooltip on mouseenter", () => {
    render(<FieldTooltip content={TOOLTIP_CONTENT} />);
    const btn = screen.getByRole("button");
    fireEvent.mouseEnter(btn);
    expect(screen.getByRole("tooltip")).toBeDefined();
    expect(screen.getByText(TOOLTIP_CONTENT)).toBeDefined();
  });

  it("hides tooltip on mouseleave", () => {
    render(<FieldTooltip content={TOOLTIP_CONTENT} />);
    const btn = screen.getByRole("button");
    fireEvent.mouseEnter(btn);
    expect(screen.getByRole("tooltip")).toBeDefined();
    fireEvent.mouseLeave(btn);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("shows tooltip on focus", () => {
    render(<FieldTooltip content={TOOLTIP_CONTENT} />);
    const btn = screen.getByRole("button");
    fireEvent.focus(btn);
    expect(screen.getByRole("tooltip")).toBeDefined();
  });

  it("hides tooltip on blur", () => {
    render(<FieldTooltip content={TOOLTIP_CONTENT} />);
    const btn = screen.getByRole("button");
    fireEvent.focus(btn);
    fireEvent.blur(btn);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("toggles tooltip on click", () => {
    render(<FieldTooltip content={TOOLTIP_CONTENT} />);
    const btn = screen.getByRole("button");
    // First click: opens
    fireEvent.click(btn);
    expect(screen.getByRole("tooltip")).toBeDefined();
    // Second click: closes
    fireEvent.click(btn);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("closes tooltip on Escape keydown", () => {
    render(<FieldTooltip content={TOOLTIP_CONTENT} />);
    const btn = screen.getByRole("button");
    fireEvent.focus(btn);
    expect(screen.getByRole("tooltip")).toBeDefined();
    fireEvent.keyDown(btn, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("sets aria-describedby on button when tooltip is visible", () => {
    render(<FieldTooltip content={TOOLTIP_CONTENT} />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-describedby")).toBeNull();

    fireEvent.mouseEnter(btn);
    const describedBy = btn.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.id).toBe(describedBy);
  });

  it("sets aria-expanded=false by default and true when open", () => {
    render(<FieldTooltip content={TOOLTIP_CONTENT} />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-expanded")).toBe("false");

    fireEvent.mouseEnter(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });
});
