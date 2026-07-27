/**
 * Component tests for CollateralGrid.
 * Covers loading, populated, empty, card click, and health indicator states.
 * Closes #362, #779
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CollateralGrid from "../components/CollateralGrid";
import { makeCollateral } from "./fixtures";

const mockCollateral = [
  makeCollateral({ id: "col-1", animal_type: "cattle", count: 3, appraised_value: 10_000_000, createdAt: "2026-01-15T00:00:00.000Z" }),
  makeCollateral({ id: "col-2", animal_type: "goat", count: 10, appraised_value: 5_000_000, createdAt: "2026-02-01T00:00:00.000Z" }),
];

describe("CollateralGrid", () => {
  describe("loading state", () => {
    it("renders skeleton cards while loading", () => {
      const { container } = render(
        <CollateralGrid collaterals={[]} loading={true} onCardClick={jest.fn()} />
      );
      const pulseCards = container.querySelectorAll(".animate-pulse");
      expect(pulseCards.length).toBeGreaterThan(0);
    });

    it("does not render collateral data while loading", () => {
      render(
        <CollateralGrid collaterals={mockCollateral} loading={true} onCardClick={jest.fn()} />
      );
      expect(screen.queryByText("cattle")).toBeNull();
    });
  });

  describe("populated state", () => {
    it("renders a card for each collateral item", () => {
      render(
        <CollateralGrid collaterals={mockCollateral} loading={false} onCardClick={jest.fn()} />
      );
      expect(screen.getByText("cattle")).toBeTruthy();
      expect(screen.getByText("goat")).toBeTruthy();
    });

    it("displays the count badge", () => {
      render(
        <CollateralGrid collaterals={mockCollateral} loading={false} onCardClick={jest.fn()} />
      );
      expect(screen.getByText("3x")).toBeTruthy();
      expect(screen.getByText("10x")).toBeTruthy();
    });

    it("displays appraised value in XLM", () => {
      render(
        <CollateralGrid collaterals={mockCollateral} loading={false} onCardClick={jest.fn()} />
      );
      // 10_000_000 stroops / 1e7 = 1.00 XLM
      expect(screen.getByText("1.00 XLM")).toBeTruthy();
    });

    it("displays the correct animal icon for cattle", () => {
      render(
        <CollateralGrid collaterals={[mockCollateral[0]]} loading={false} onCardClick={jest.fn()} />
      );
      expect(screen.getByText("🐄")).toBeTruthy();
    });

    it("displays the correct animal icon for goat", () => {
      render(
        <CollateralGrid collaterals={[mockCollateral[1]]} loading={false} onCardClick={jest.fn()} />
      );
      expect(screen.getByText("🐐")).toBeTruthy();
    });

    it("displays fallback icon for unknown animal type", () => {
      const unknown = makeCollateral({ id: "col-x", animal_type: "llama" });
      render(
        <CollateralGrid collaterals={[unknown]} loading={false} onCardClick={jest.fn()} />
      );
      expect(screen.getByText("🐾")).toBeTruthy();
    });

    it("shows truncated collateral ID", () => {
      render(
        <CollateralGrid collaterals={[mockCollateral[0]]} loading={false} onCardClick={jest.fn()} />
      );
      // id "col-1" sliced to 8 chars = "col-1" (shorter than 8)
      expect(screen.getByText(/ID: col-1/)).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("renders an empty grid with no cards when collaterals is empty", () => {
      const { container } = render(
        <CollateralGrid collaterals={[]} loading={false} onCardClick={jest.fn()} />
      );
      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBe(0);
    });
  });

  describe("card click interaction", () => {
    it("calls onCardClick with the correct id when a card is clicked", () => {
      const onCardClick = jest.fn();
      render(
        <CollateralGrid collaterals={mockCollateral} loading={false} onCardClick={onCardClick} />
      );
      fireEvent.click(screen.getByText("cattle").closest("button")!);
      expect(onCardClick).toHaveBeenCalledWith("col-1");
    });

    it("calls onCardClick for each card independently", () => {
      const onCardClick = jest.fn();
      render(
        <CollateralGrid collaterals={mockCollateral} loading={false} onCardClick={onCardClick} />
      );
      fireEvent.click(screen.getByText("goat").closest("button")!);
      expect(onCardClick).toHaveBeenCalledWith("col-2");
    });
  });

  describe("health indicator (#779)", () => {
    it("shows green dot for healthy loans (health_factor_bps >= 15000)", () => {
      const healthy = makeCollateral({
        id: "col-healthy",
        animal_type: "cattle",
        health_factor_bps: 18000,
      });
      const { container } = render(
        <CollateralGrid collaterals={[healthy]} loading={false} onCardClick={jest.fn()} />
      );
      const healthDot = container.querySelector('[role="img"][aria-label*="Loan health"]');
      expect(healthDot).toBeTruthy();
      const dot = healthDot?.querySelector("div");
      expect(dot?.style.backgroundColor).toBe("rgb(22, 163, 74)"); // #16A34A green
    });

    it("shows yellow dot for moderate loans (health_factor_bps >= 10000 and < 15000)", () => {
      const moderate = makeCollateral({
        id: "col-moderate",
        animal_type: "goat",
        health_factor_bps: 12000,
      });
      const { container } = render(
        <CollateralGrid collaterals={[moderate]} loading={false} onCardClick={jest.fn()} />
      );
      const healthDot = container.querySelector('[role="img"][aria-label*="Loan health"]');
      expect(healthDot).toBeTruthy();
      const dot = healthDot?.querySelector("div");
      expect(dot?.style.backgroundColor).toBe("rgb(217, 119, 6)"); // #D97706 yellow
    });

    it("shows red dot for at-risk loans (health_factor_bps < 10000)", () => {
      const atRisk = makeCollateral({
        id: "col-risk",
        animal_type: "sheep",
        health_factor_bps: 9500,
      });
      const { container } = render(
        <CollateralGrid collaterals={[atRisk]} loading={false} onCardClick={jest.fn()} />
      );
      const healthDot = container.querySelector('[role="img"][aria-label*="Loan health"]');
      expect(healthDot).toBeTruthy();
      const dot = healthDot?.querySelector("div");
      expect(dot?.style.backgroundColor).toBe("rgb(220, 38, 38)"); // #DC2626 red
    });

    it("does not show health indicator when collateral is not pledged", () => {
      const unpledged = makeCollateral({
        id: "col-unpledged",
        animal_type: "cattle",
        health_factor_bps: null,
      });
      const { container } = render(
        <CollateralGrid collaterals={[unpledged]} loading={false} onCardClick={jest.fn()} />
      );
      const healthDot = container.querySelector('[role="img"][aria-label*="Loan health"]');
      expect(healthDot).toBeNull();
    });

    it("does not show health indicator when health_factor_bps is undefined", () => {
      const undefined = makeCollateral({
        id: "col-undefined",
        animal_type: "cattle",
      });
      const { container } = render(
        <CollateralGrid collaterals={[undefined]} loading={false} onCardClick={jest.fn()} />
      );
      const healthDot = container.querySelector('[role="img"][aria-label*="Loan health"]');
      expect(healthDot).toBeNull();
    });

    it("shows tooltip with health factor value", () => {
      const withHealth = makeCollateral({
        id: "col-tooltip",
        animal_type: "cattle",
        health_factor_bps: 15500,
      });
      render(
        <CollateralGrid collaterals={[withHealth]} loading={false} onCardClick={jest.fn()} />
      );
      expect(screen.getByText("Loan health: 1.55")).toBeTruthy();
    });
  });
});
