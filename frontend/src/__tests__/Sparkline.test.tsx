import React from "react";
import { render, screen } from "@testing-library/react";
import Sparkline from "../components/Sparkline";

const makePoint = (value: number, date = "2026-01-01T00:00:00.000Z") => ({ date, value });

describe("Sparkline", () => {
  it("returns null when fewer than 2 points exist", () => {
    const { container } = render(<Sparkline data={[makePoint(10)]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders an SVG when 2 or more points exist", () => {
    render(<Sparkline data={[makePoint(10), makePoint(20)]} />);
    expect(screen.getByRole("img", { name: /trend/i })).toBeTruthy();
  });

  it("applies increasing trend styling when last value > first value", () => {
    render(<Sparkline data={[makePoint(10), makePoint(20), makePoint(30)]} />);
    const svg = screen.getByRole("img", { name: /increasing/i });
    expect(svg.getAttribute("aria-label")).toContain("increasing");
    expect(svg.innerHTML).toContain("#16A34A");
  });

  it("applies decreasing trend styling when last value < first value", () => {
    render(<Sparkline data={[makePoint(30), makePoint(20), makePoint(10)]} />);
    const svg = screen.getByRole("img", { name: /decreasing/i });
    expect(svg.getAttribute("aria-label")).toContain("decreasing");
    expect(svg.innerHTML).toContain("#DC2626");
  });

  it("applies flat trend styling when values are equal", () => {
    render(<Sparkline data={[makePoint(20), makePoint(20), makePoint(20)]} />);
    const svg = screen.getByRole("img", { name: /flat/i });
    expect(svg.getAttribute("aria-label")).toContain("flat");
    expect(svg.innerHTML).toContain("#7c6d5a");
  });
});
