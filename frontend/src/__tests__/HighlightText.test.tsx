import React from "react";
import { render, screen } from "@testing-library/react";
import HighlightText from "../components/HighlightText";

describe("HighlightText", () => {
  it("wraps the matching substring in a <mark>", () => {
    render(<HighlightText text="cattle" query="cat" />);
    const mark = screen.getByText("cat", { selector: "mark" });
    expect(mark).toBeTruthy();
  });

  it("renders plain text when query is empty", () => {
    const { container } = render(<HighlightText text="cattle" query="" />);
    expect(container.querySelector("mark")).toBeNull();
    expect(container.textContent).toBe("cattle");
  });

  it("matches case-insensitively", () => {
    render(<HighlightText text="Goat Farm" query="goat" />);
    const mark = screen.getByText("Goat", { selector: "mark" });
    expect(mark).toBeTruthy();
  });
});
