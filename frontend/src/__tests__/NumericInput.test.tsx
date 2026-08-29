/**
 * Unit tests for NumericInput — #567
 *
 * Verifies:
 *  - Only numeric input is accepted (non-numeric chars are stripped)
 *  - Value is displayed with thousands separator (e.g. "10,000")
 *  - Underlying form value remains a plain number string
 *  - Mobile numeric keyboard is indicated (inputMode="numeric")
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NumericInput from "../components/NumericInput";

describe("NumericInput (#567)", () => {
  // ── Numeric-only input ───────────────────────────────────────────────────

  it("accepts numeric characters and passes the raw digit string to onChange", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<NumericInput label="Amount" value="" onChange={handleChange} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.clear(input);
    await user.type(input, "12345");

    // Last onChange call should carry the plain digit string
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    expect(lastCall[0].target.value).toBe("12345");
  });

  it("strips non-numeric characters from typed input", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<NumericInput label="Amount" value="" onChange={handleChange} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.clear(input);
    await user.type(input, "1a2b3c");

    // All non-digit chars must be stripped; plain value should be "123"
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    expect(lastCall[0].target.value).toBe("123");
  });

  it("strips special characters and spaces from typed input", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<NumericInput label="Amount" value="" onChange={handleChange} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    await user.clear(input);
    await user.type(input, "10 000!@#");

    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    expect(lastCall[0].target.value).toBe("10000");
  });

  // ── Thousands separator display ──────────────────────────────────────────

  it("displays the value with a thousands separator", () => {
    render(<NumericInput label="Amount" value="10000" onChange={jest.fn()} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;
    // Should render "10,000" (en-US format) in the visible input
    expect(input.value).toBe("10,000");
  });

  it("displays large values with thousands separators", () => {
    render(
      <NumericInput label="Amount" value="1200000" onChange={jest.fn()} />
    );
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;
    expect(input.value).toBe("1,200,000");
  });

  it("displays empty string when value is empty", () => {
    render(<NumericInput label="Amount" value="" onChange={jest.fn()} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;
    expect(input.value).toBe("");
  });

  // ── Mobile numeric keyboard ──────────────────────────────────────────────

  it("sets inputMode to numeric for mobile keyboard", () => {
    render(<NumericInput label="Amount" value="" onChange={jest.fn()} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;
    expect(input.getAttribute("inputMode")).toBe("numeric");
  });

  it("uses type=text (not type=number) so formatting is not blocked by the browser", () => {
    render(<NumericInput label="Amount" value="" onChange={jest.fn()} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;
    expect(input.type).toBe("text");
  });

  // ── Sync with external value changes ────────────────────────────────────

  it("updates the displayed formatted value when the external value prop changes", () => {
    const { rerender } = render(
      <NumericInput label="Amount" value="5000" onChange={jest.fn()} />
    );
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;
    expect(input.value).toBe("5,000");

    rerender(<NumericInput label="Amount" value="10000" onChange={jest.fn()} />);
    expect(input.value).toBe("10,000");
  });

  // ── Pasted formatted numbers ─────────────────────────────────────────────

  it("strips commas from a pasted formatted number", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<NumericInput label="Amount" value="" onChange={handleChange} />);
    const input = screen.getByLabelText(/amount/i) as HTMLInputElement;

    // Simulate pasting "10,000"
    await user.click(input);
    await user.paste("10,000");

    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    expect(lastCall[0].target.value).toBe("10000");
  });
});
