import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StepReview from "../components/wizard/steps/StepReview";
import { LoanWizardProvider } from "@/context/LoanWizardContext";

function renderWithWizard(ui: React.ReactElement) {
  return render(<LoanWizardProvider>{ui}</LoanWizardProvider>);
}

describe("StepReview", () => {
  const defaultState = {
    animalType: "cattle" as const,
    count: "2",
    appraisedValue: "20000000",
    collateralId: "col-001",
    loanAmount: "10000000",
    loanTermDays: "30",
    step: 3,
    loading: false,
    error: null,
    collaterals: [],
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("renders loan summary with total amount", () => {
    renderWithWizard(<StepReview />);
    expect(screen.getByText("Review Loan Terms")).toBeTruthy();
    expect(screen.getByText(/You are borrowing/)).toBeTruthy();
  });

  it("shows amount breakdown tooltip when info icon is clicked", () => {
    renderWithWizard(<StepReview />);
    const infoBtn = screen.getByRole("button", { name: /amount breakdown/i });
    fireEvent.click(infoBtn);
    expect(screen.getByRole("tooltip")).toBeTruthy();
    expect(screen.getByText("Principal")).toBeTruthy();
    expect(screen.getByText("Origination Fee")).toBeTruthy();
    expect(screen.getByText("Est. First Interest")).toBeTruthy();
  });

  it("calculates breakdown values correctly", () => {
    renderWithWizard(<StepReview />);
    const infoBtn = screen.getByRole("button", { name: /amount breakdown/i });
    fireEvent.click(infoBtn);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("1.00 XLM"); // principal 10_000_000 / 1e7
    expect(tooltip).toHaveTextContent("0.50 XLM"); // fee 500_000 / 1e7 (5% of 10M)
    expect(tooltip).toHaveTextContent("0.10 XLM"); // est interest 100_000 / 1e7 (1% of 10M)
  });

  it("toggles tooltip on Enter key", () => {
    renderWithWizard(<StepReview />);
    const infoBtn = screen.getByRole("button", { name: /amount breakdown/i });
    fireEvent.keyDown(infoBtn, { key: "Enter" });
    expect(screen.getByRole("tooltip")).toBeTruthy();
  });

  it("toggles tooltip on Space key", () => {
    renderWithWizard(<StepReview />);
    const infoBtn = screen.getByRole("button", { name: /amount breakdown/i });
    fireEvent.keyDown(infoBtn, { key: " " });
    expect(screen.getByRole("tooltip")).toBeTruthy();
  });

  it("closes tooltip on Escape key", () => {
    renderWithWizard(<StepReview />);
    const infoBtn = screen.getByRole("button", { name: /amount breakdown/i });
    fireEvent.click(infoBtn);
    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.keyDown(infoBtn, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("shows simplified and detailed views", () => {
    renderWithWizard(<StepReview />);
    const toggleBtn = screen.getByRole("button", { name: /show full terms/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByText("Fee Amount")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /show simplified view/i }));
    expect(screen.getByText(/You are borrowing/)).toBeTruthy();
  });
});
