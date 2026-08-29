import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import StepCollateral from "../components/wizard/steps/StepCollateral";
import { LoanWizardProvider } from "../context/LoanWizardContext";

jest.mock("../lib/freighterClient", () => ({ signTransaction: jest.fn() }));
jest.mock("../lib/stellarUtils", () => ({ submitSignedXdr: jest.fn() }));

function renderStep() {
  return render(
    <LoanWizardProvider>
      <StepCollateral walletAddress="GTEST" />
    </LoanWizardProvider>
  );
}

describe("StepCollateral drag-and-drop", () => {
  it("renders a list of collateral items", () => {
    renderStep();
    expect(screen.getByRole("list", { name: /collateral items/i })).toBeTruthy();
  });

  it("drag handle has aria-label='Drag to reorder'", () => {
    renderStep();
    const handles = screen.getAllByRole("button", { name: /drag to reorder/i });
    expect(handles.length).toBeGreaterThanOrEqual(1);
  });

  it("adds a second collateral item", () => {
    renderStep();
    fireEvent.click(screen.getByText(/add another collateral item/i));
    expect(screen.getAllByRole("button", { name: /drag to reorder/i })).toHaveLength(2);
  });

  it("reorders items via ArrowDown keyboard shortcut", () => {
    renderStep();
    // Add a second item
    fireEvent.click(screen.getByText(/add another collateral item/i));
    // Fill first item with distinct count so we can identify order
    const [count1, count2] = screen.getAllByPlaceholderText("Count");
    fireEvent.change(count1, { target: { value: "3" } });
    fireEvent.change(count2, { target: { value: "7" } });

    // Move first item down via ArrowDown
    const handles = screen.getAllByRole("button", { name: /drag to reorder/i });
    fireEvent.keyDown(handles[0], { key: "ArrowDown" });

    // After reorder, second count input should now be "3"
    const counts = screen.getAllByPlaceholderText("Count") as HTMLInputElement[];
    expect(counts[0].value).toBe("7");
    expect(counts[1].value).toBe("3");
  });

  it("reorders items via ArrowUp keyboard shortcut", () => {
    renderStep();
    fireEvent.click(screen.getByText(/add another collateral item/i));
    const [count1, count2] = screen.getAllByPlaceholderText("Count");
    fireEvent.change(count1, { target: { value: "3" } });
    fireEvent.change(count2, { target: { value: "7" } });

    // Move second item up
    const handles = screen.getAllByRole("button", { name: /drag to reorder/i });
    fireEvent.keyDown(handles[1], { key: "ArrowUp" });

    const counts = screen.getAllByPlaceholderText("Count") as HTMLInputElement[];
    expect(counts[0].value).toBe("7");
    expect(counts[1].value).toBe("3");
  });

  it("drag handle emits onPointerDown (touch/pointer support)", () => {
    renderStep();
    const handle = screen.getByRole("button", { name: /drag to reorder/i });
    // Should not throw
    fireEvent.pointerDown(handle);
  });

  it("shows validation error when count is empty", async () => {
    renderStep();
    await act(async () => {
      fireEvent.click(screen.getByText(/register & continue/i));
    });
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("removes an item when remove button is clicked", () => {
    renderStep();
    fireEvent.click(screen.getByText(/add another collateral item/i));
    const removeButtons = screen.getAllByRole("button", { name: /remove item/i });
    expect(removeButtons).toHaveLength(2);
    fireEvent.click(removeButtons[0]);
    expect(screen.queryAllByRole("button", { name: /remove item/i })).toHaveLength(0);
  });
});
