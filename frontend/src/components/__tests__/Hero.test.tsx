import { render, screen } from "@testing-library/react";
import { Hero } from "../Hero";
import "@testing-library/jest-dom";

describe("Hero Component", () => {
  it("renders children correctly", () => {
    render(<Hero>Test Content</Hero>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies custom className to the container", () => {
    const { container } = render(<Hero className="custom-class">Test Content</Hero>);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("contains the dot-grid element", () => {
    const { container } = render(<Hero>Test Content</Hero>);
    const gridElement = container.querySelector(".dot-grid");
    expect(gridElement).toBeInTheDocument();
    expect(gridElement).toHaveAttribute("aria-hidden", "true");
  });
});
