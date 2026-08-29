/**
 * Tests for the Dashboard tab navigation.
 * Covers: tab switching, URL hash persistence, keyboard navigation, lazy loading.
 */
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardClient from "@/app/dashboard/DashboardClient";

// Mock useRouter
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock components
jest.mock("@/components/GlossaryTerm", () => ({
  GlossaryTerm: ({ termKey }: { termKey: string }) => <span>{termKey}</span>,
}));

jest.mock("@/components/WalletConnect", () => ({
  __esModule: true,
  default: ({ onConnect }: { onConnect: (wallet: string) => void }) => (
    <button onClick={() => onConnect("GTEST123")}>Connect Wallet</button>
  ),
}));

jest.mock("@/components/CollateralCard", () => ({
  __esModule: true,
  default: ({ walletAddress }: { walletAddress: string }) => (
    <div data-testid="collateral-card">Collateral Card: {walletAddress}</div>
  ),
}));

jest.mock("@/components/RepayPanel", () => ({
  __esModule: true,
  default: ({ walletAddress }: { walletAddress: string }) => (
    <div data-testid="repay-panel">Repay Panel: {walletAddress}</div>
  ),
}));

jest.mock("@/components/LoanRepaymentCalculator", () => ({
  __esModule: true,
  default: ({ onProceed }: { onProceed: (loanId: string, amount: string) => void }) => (
    <div data-testid="loan-calculator">
      <button onClick={() => onProceed("LOAN123", "100")}>Proceed</button>
    </div>
  ),
}));

jest.mock("@/components/TransactionHistory", () => ({
  __esModule: true,
  default: ({ walletAddress }: { walletAddress: string }) => (
    <div data-testid="transaction-history">Transaction History: {walletAddress}</div>
  ),
}));

jest.mock("@/components/SkeletonHealthDashboard", () => ({
  __esModule: true,
  default: () => <div data-testid="skeleton">Skeleton</div>,
}));

jest.mock("@/components/HealthGauge", () => ({
  __esModule: true,
  default: ({ value }: { value: number }) => <div data-testid="health-gauge">Health: {value}</div>,
}));

jest.mock("@/components/HelpMenu", () => ({
  __esModule: true,
  default: ({ onShowOnboarding }: { onShowOnboarding: () => void }) => (
    <button onClick={onShowOnboarding}>Help</button>
  ),
}));

jest.mock("@/components/OnboardingModal", () => ({
  __esModule: true,
  default: () => <div>Onboarding Modal</div>,
}));

jest.mock("@/hooks/useHealthFactor", () => ({
  useHealthFactor: () => ({
    healthFactor: 1.5,
    loading: false,
    refresh: jest.fn(),
  }),
}));

jest.mock("@/hooks/useOnboarding", () => ({
  useOnboarding: () => ({
    showOnboarding: false,
    openOnboarding: jest.fn(),
    closeOnboarding: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.resetAllMocks();
  window.location.hash = "";
});

describe("DashboardClient Tabs", () => {
  it("renders all four tabs", async () => {
    render(<DashboardClient />);

    const connectBtn = screen.getByRole("button", { name: /Connect Wallet/i });
    await userEvent.click(connectBtn);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Overview/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Loans/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Collateral/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Transactions/i })).toBeInTheDocument();
    });
  });

  it("shows overview tab content by default", async () => {
    render(<DashboardClient />);

    const connectBtn = screen.getByRole("button", { name: /Connect Wallet/i });
    await userEvent.click(connectBtn);

    await waitFor(() => {
      expect(screen.getByTestId("collateral-card")).toBeInTheDocument();
      expect(screen.getByTestId("loan-calculator")).toBeInTheDocument();
    });
  });

  it("switches to loans tab when clicked", async () => {
    render(<DashboardClient />);

    const connectBtn = screen.getByRole("button", { name: /Connect Wallet/i });
    await userEvent.click(connectBtn);

    const loansTab = await screen.findByRole("tab", { name: /Loans/i });
    await userEvent.click(loansTab);

    await waitFor(() => {
      expect(loansTab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByTestId("repay-panel")).toBeInTheDocument();
    });
  });

  it("switches to collateral tab when clicked", async () => {
    render(<DashboardClient />);

    const connectBtn = screen.getByRole("button", { name: /Connect Wallet/i });
    await userEvent.click(connectBtn);

    const collateralTab = await screen.findByRole("tab", { name: /Collateral/i });
    await userEvent.click(collateralTab);

    await waitFor(() => {
      expect(collateralTab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByTestId("collateral-card")).toBeInTheDocument();
    });
  });

  it("switches to transactions tab when clicked", async () => {
    render(<DashboardClient />);

    const connectBtn = screen.getByRole("button", { name: /Connect Wallet/i });
    await userEvent.click(connectBtn);

    const transactionsTab = await screen.findByRole("tab", { name: /Transactions/i });
    await userEvent.click(transactionsTab);

    await waitFor(() => {
      expect(transactionsTab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByTestId("transaction-history")).toBeInTheDocument();
    });
  });

  it("persists active tab in URL hash", async () => {
    render(<DashboardClient />);

    const connectBtn = screen.getByRole("button", { name: /Connect Wallet/i });
    await userEvent.click(connectBtn);

    const loansTab = await screen.findByRole("tab", { name: /Loans/i });
    await userEvent.click(loansTab);

    await waitFor(() => {
      expect(window.location.hash).toBe("#loans");
    });
  });

  it("restores tab from URL hash on page load", async () => {
    window.location.hash = "#collateral";

    render(<DashboardClient />);

    const connectBtn = screen.getByRole("button", { name: /Connect Wallet/i });
    await userEvent.click(connectBtn);

    const collateralTab = await screen.findByRole("tab", { name: /Collateral/i });
    await waitFor(() => {
      expect(collateralTab).toHaveAttribute("aria-selected", "true");
    });
  });

  it("navigates tabs with arrow keys", async () => {
    render(<DashboardClient />);

    const connectBtn = screen.getByRole("button", { name: /Connect Wallet/i });
    await userEvent.click(connectBtn);

    const overviewTab = await screen.findByRole("tab", { name: /Overview/i });
    overviewTab.focus();

    await userEvent.keyboard("{ArrowRight}");

    const loansTab = await screen.findByRole("tab", { name: /Loans/i });
    await waitFor(() => {
      expect(loansTab).toHaveAttribute("aria-selected", "true");
    });
  });

  it("navigates tabs backwards with left arrow key", async () => {
    render(<DashboardClient />);

    const connectBtn = screen.getByRole("button", { name: /Connect Wallet/i });
    await userEvent.click(connectBtn);

    const loansTab = await screen.findByRole("tab", { name: /Loans/i });
    loansTab.focus();

    await userEvent.keyboard("{ArrowLeft}");

    const overviewTab = await screen.findByRole("tab", { name: /Overview/i });
    await waitFor(() => {
      expect(overviewTab).toHaveAttribute("aria-selected", "true");
    });
  });

  it("switches to loans tab when proceeding to repay", async () => {
    render(<DashboardClient />);

    const connectBtn = screen.getByRole("button", { name: /Connect Wallet/i });
    await userEvent.click(connectBtn);

    const proceedBtn = await screen.findByRole("button", { name: /Proceed/i });
    await userEvent.click(proceedBtn);

    const loansTab = await screen.findByRole("tab", { name: /Loans/i });
    await waitFor(() => {
      expect(loansTab).toHaveAttribute("aria-selected", "true");
    });
  });

  it("lazy loads tab content - only active tab content renders", async () => {
    render(<DashboardClient />);

    const connectBtn = screen.getByRole("button", { name: /Connect Wallet/i });
    await userEvent.click(connectBtn);

    await waitFor(() => {
      expect(screen.getByTestId("collateral-card")).toBeInTheDocument();
    });

    // Transactions tab content should not be rendered initially
    expect(screen.queryByTestId("transaction-history")).not.toBeInTheDocument();

    const transactionsTab = await screen.findByRole("tab", { name: /Transactions/i });
    await userEvent.click(transactionsTab);

    await waitFor(() => {
      expect(screen.getByTestId("transaction-history")).toBeInTheDocument();
    });
  });

  it("has proper accessibility attributes on tabs", async () => {
    render(<DashboardClient />);

    const connectBtn = screen.getByRole("button", { name: /Connect Wallet/i });
    await userEvent.click(connectBtn);

    const tablist = await screen.findByRole("tablist");
    expect(tablist).toHaveAttribute("aria-label", "Dashboard sections");

    const overviewTab = screen.getByRole("tab", { name: /Overview/i });
    expect(overviewTab).toHaveAttribute("aria-selected");
    expect(overviewTab).toHaveAttribute("aria-controls", "overview-panel");
  });
});
