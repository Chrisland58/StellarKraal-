/**
 * Tests for #804 – Skeleton screens for Dashboard, LoansPage, and CollateralPage.
 *
 * Verifies:
 * - Each skeleton renders without crashing
 * - aria-busy="true" is present (screen-reader friendly)
 * - Each skeleton contains the expected aria-label describing what is loading
 * - No visible text content leaks into the skeleton (skeletons are decorative)
 * - Skeleton elements use the skeleton-shimmer class for pulse animation
 */
import React from "react";
import { render, screen } from "@testing-library/react";

import SkeletonDashboard from "@/components/SkeletonDashboard";
import SkeletonLoansPage from "@/components/SkeletonLoansPage";
import SkeletonCollateralPage from "@/components/SkeletonCollateralPage";

describe("SkeletonDashboard (#804)", () => {
  it("renders without crashing", () => {
    const { container } = render(<SkeletonDashboard />);
    expect(container.firstChild).toBeTruthy();
  });

  it("has aria-busy='true' for screen-readers", () => {
    render(<SkeletonDashboard />);
    const region = screen.getByRole("main");
    expect(region).toHaveAttribute("aria-busy", "true");
  });

  it("has a descriptive aria-label", () => {
    render(<SkeletonDashboard />);
    const region = screen.getByLabelText("Loading dashboard");
    expect(region).toBeTruthy();
  });

  it("renders skeleton-shimmer elements for pulse animation", () => {
    const { container } = render(<SkeletonDashboard />);
    const shimmers = container.querySelectorAll(".skeleton-shimmer");
    expect(shimmers.length).toBeGreaterThan(0);
  });

  it("does not render real interactive content during loading", () => {
    render(<SkeletonDashboard />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("SkeletonLoansPage (#804)", () => {
  it("renders without crashing", () => {
    const { container } = render(<SkeletonLoansPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("has aria-busy='true' for screen-readers", () => {
    render(<SkeletonLoansPage />);
    const region = screen.getByRole("main");
    expect(region).toHaveAttribute("aria-busy", "true");
  });

  it("has a descriptive aria-label", () => {
    render(<SkeletonLoansPage />);
    expect(screen.getByLabelText("Loading loans")).toBeTruthy();
  });

  it("renders multiple skeleton rows matching expected layout", () => {
    const { container } = render(<SkeletonLoansPage />);
    const rows = container.querySelectorAll("li");
    // Expect 5 placeholder rows
    expect(rows.length).toBe(5);
  });

  it("renders skeleton-shimmer elements for pulse animation", () => {
    const { container } = render(<SkeletonLoansPage />);
    const shimmers = container.querySelectorAll(".skeleton-shimmer");
    expect(shimmers.length).toBeGreaterThan(0);
  });
});

describe("SkeletonCollateralPage (#804)", () => {
  it("renders without crashing", () => {
    const { container } = render(<SkeletonCollateralPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("has aria-busy='true' for screen-readers", () => {
    render(<SkeletonCollateralPage />);
    const region = screen.getByRole("main");
    expect(region).toHaveAttribute("aria-busy", "true");
  });

  it("has a descriptive aria-label", () => {
    render(<SkeletonCollateralPage />);
    expect(screen.getByLabelText("Loading collateral")).toBeTruthy();
  });

  it("renders multiple skeleton rows matching expected layout", () => {
    const { container } = render(<SkeletonCollateralPage />);
    const rows = container.querySelectorAll("li");
    // Expect 5 placeholder rows
    expect(rows.length).toBe(5);
  });

  it("renders skeleton-shimmer elements for pulse animation", () => {
    const { container } = render(<SkeletonCollateralPage />);
    const shimmers = container.querySelectorAll(".skeleton-shimmer");
    expect(shimmers.length).toBeGreaterThan(0);
  });
});
