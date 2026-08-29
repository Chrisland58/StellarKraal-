/**
 * PrintDateScript tests — #811
 *
 * Verifies that PrintDateScript sets data-print-date on document.body
 * and that it returns null (no DOM output).
 */
import React from "react";
import { render, act } from "@testing-library/react";
import PrintDateScript from "../components/PrintDateScript";

describe("PrintDateScript (#811)", () => {
  it("sets data-print-date on document.body after mount", async () => {
    await act(async () => {
      render(<PrintDateScript />);
    });
    const attr = document.body.getAttribute("data-print-date");
    expect(attr).toBeTruthy();
    // Should be a valid date-like string (e.g. "August 26, 2026")
    expect(attr).toMatch(/\d{4}/);
  });

  it("renders nothing to the DOM", async () => {
    await act(async () => {
      const { container } = render(<PrintDateScript />);
      expect(container.firstChild).toBeNull();
    });
  });

  afterEach(() => {
    // Clean up the attribute between tests
    document.body.removeAttribute("data-print-date");
  });
});
