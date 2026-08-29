/**
 * Tests for CollateralLocationSection — Issue #568
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import CollateralLocationSection from "@/components/CollateralLocationSection";

describe("CollateralLocationSection (#568)", () => {
  it("renders nothing when location is null", () => {
    const { container } = render(<CollateralLocationSection location={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when location is undefined", () => {
    const { container } = render(<CollateralLocationSection />);
    expect(container.firstChild).toBeNull();
  });

  it('renders section with "Location (coming soon)" heading when location is an empty string', () => {
    render(<CollateralLocationSection location="" />);
    expect(screen.getByRole("region", { name: /location/i })).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it("renders the heading at h2 level for correct heading hierarchy", () => {
    render(<CollateralLocationSection location="Nairobi, Kenya" />);
    const heading = screen.getByRole("heading", { level: 2, name: /location/i });
    expect(heading).toBeInTheDocument();
  });

  it("renders the map placeholder with descriptive label", () => {
    render(<CollateralLocationSection location="Nairobi, Kenya" />);
    expect(
      screen.getByRole("img", { name: /map placeholder/i })
    ).toBeInTheDocument();
  });

  it("displays the location text when provided", () => {
    render(<CollateralLocationSection location="Nairobi, Kenya" />);
    expect(screen.getByText("Nairobi, Kenya")).toBeInTheDocument();
  });

  it("does not display a location paragraph when location is empty string", () => {
    render(<CollateralLocationSection location="" />);
    // Empty string is falsy so the <p> should not render
    expect(screen.queryByText("Nairobi, Kenya")).not.toBeInTheDocument();
  });

  it("section is accessible via aria-labelledby", () => {
    render(<CollateralLocationSection location="Mombasa" />);
    const section = screen.getByRole("region", { name: /location/i });
    expect(section).toHaveAttribute("aria-labelledby", "location-section-heading");
  });
});
