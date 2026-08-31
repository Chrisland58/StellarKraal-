import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoanWizard from "../components/wizard/LoanWizard";

// Suppress expected console.error noise from React's error boundary
beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => {
  (console.error as jest.Mock).mockRestore();
  jest.clearAllMocks();
  localStorage.clear();
});

// Lightweight step stubs — LoanWizard's own orchestration (step switching,
// per-step ErrorBoundary wrapping, retry) is what's under test here, not
// the real steps' internals (covered by their own test files).
jest.mock("../components/wizard/steps/StepCollateral", () => {
  return function StepCollateral() {
    return <div>Collateral step content</div>;
  };
});

let stepAmountShouldThrow = false;
jest.mock("../components/wizard/steps/StepAmount", () => {
  return function StepAmount() {
    if (stepAmountShouldThrow) throw new Error("boom in amount step");
    return <div>Amount step content</div>;
  };
});

jest.mock("../components/wizard/steps/StepReview", () => {
  return function StepReview() {
    return <div>Review step content</div>;
  };
});

jest.mock("../components/wizard/steps/StepConfirm", () => {
  return function StepConfirm() {
    return <div>Confirm step content</div>;
  };
});

describe("LoanWizard error boundaries (#522)", () => {
  beforeEach(() => {
    stepAmountShouldThrow = false;
  });

  it("renders the first step normally with no error UI", () => {
    render(<LoanWizard walletAddress="GTEST" />);
    expect(screen.getByText("Collateral step content")).toBeTruthy();
    expect(screen.queryByText(/something went wrong/i)).toBeNull();
  });

  it("shows a scoped fallback when a step throws, without crashing the rest of the wizard", () => {
    stepAmountShouldThrow = true;
    // Force the wizard straight to step 2 via saved state so we don't need
    // to drive StepCollateral's real validation to advance.
    localStorage.setItem(
      "loan_wizard_state",
      JSON.stringify({
        walletAddress: "GTEST",
        data: {
          animalType: "cattle",
          count: "2",
          appraisedValue: "1000",
          collateralId: "1",
          loanAmount: "",
          loanTermDays: "30",
          step: 2,
          loading: false,
          error: null,
        },
        timestamp: new Date().toISOString(),
      })
    );

    render(<LoanWizard walletAddress="GTEST" />);
    expect(screen.getByText(/amount.*something went wrong/i)).toBeTruthy();
    // The rest of the wizard chrome (progress header) still renders.
    expect(screen.getByText(/loan request/i)).toBeTruthy();
  });

  it("retry from a crashed step navigates back to the previous step", async () => {
    const user = userEvent.setup();
    stepAmountShouldThrow = true;
    localStorage.setItem(
      "loan_wizard_state",
      JSON.stringify({
        walletAddress: "GTEST",
        data: {
          animalType: "cattle",
          count: "2",
          appraisedValue: "1000",
          collateralId: "1",
          loanAmount: "",
          loanTermDays: "30",
          step: 2,
          loading: false,
          error: null,
        },
        timestamp: new Date().toISOString(),
      })
    );

    render(<LoanWizard walletAddress="GTEST" />);
    expect(screen.getByText(/something went wrong/i)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /back to previous step/i }));

    expect(screen.getByText("Collateral step content")).toBeTruthy();
    expect(screen.queryByText(/something went wrong/i)).toBeNull();
  });
});
