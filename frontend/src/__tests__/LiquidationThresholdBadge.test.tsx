/**
 * Tests for LiquidationThresholdBadge — Issue #697
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import LiquidationThresholdBadge from "@/components/LiquidationThresholdBadge";

describe("LiquidationThresholdBadge (#697)", () => {
  it("renders nothing when thresholdBps is null", () => {
    const { container } = render(<LiquidationThresholdBadge thresholdBps={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when thresholdBps is undefined", () => {
    const { container } = render(<LiquidationThresholdBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("displays the initialised threshold value (8000 bps → 80%)", () => {
    render(<LiquidationThresholdBadge thresholdBps={8000} />);
    // 8000 bps = 80%
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("displays updated threshold after set_liquidation_threshold (7500 bps → 75%)", () => {
    render(<LiquidationThresholdBadge thresholdBps={7500} />);
    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("shows the 'Liquidation Threshold' label", () => {
    render(<LiquidationThresholdBadge thresholdBps={8000} />);
    expect(screen.getByText(/liquidation threshold/i)).toBeInTheDocument();
  });

  it("has accessible aria-label containing the threshold percentage", () => {
    render(<LiquidationThresholdBadge thresholdBps={8000} />);
    expect(
      screen.getByLabelText(/liquidation threshold: 80%/i)
    ).toBeInTheDocument();
  });

  it("handles an edge-case threshold of 10000 bps (100%)", () => {
    render(<LiquidationThresholdBadge thresholdBps={10000} />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("handles a threshold of 5000 bps (50%)", () => {
    render(<LiquidationThresholdBadge thresholdBps={5000} />);
    expect(screen.getByText("50")).toBeInTheDocument();
  });
});
