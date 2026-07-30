import React from "react";
import { render } from "@testing-library/react";
import DetailSkeleton from "../components/DetailSkeleton";

describe("DetailSkeleton", () => {
  it("renders a busy, labelled placeholder", () => {
    const { container } = render(<DetailSkeleton />);
    const main = container.querySelector('main[aria-busy="true"]');
    expect(main).toBeTruthy();
    expect(main?.getAttribute("aria-label")).toBe("Loading collateral details");
  });

  it("renders shimmer placeholders", () => {
    const { container } = render(<DetailSkeleton />);
    expect(container.querySelectorAll(".skeleton-shimmer").length).toBeGreaterThan(0);
  });
});
