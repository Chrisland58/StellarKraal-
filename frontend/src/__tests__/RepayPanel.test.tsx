import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RepayPanel from "../components/RepayPanel";
import { ToastProvider, ToastContainer } from "../components/toast";

jest.mock('@stellar/freighter-api', () => ({
  signTransaction: jest.fn(),
}));
jest.mock('../lib/stellarUtils', () => ({
  submitSignedXdr: jest.fn(),
  healthColor: jest.fn(),
  formatStroops: jest.fn((stroops: number) => `${stroops / 1e7} XLM`),
}));

import { signTransaction } from '@stellar/freighter-api';
import { submitSignedXdr } from '../lib/stellarUtils';

const mockSign = signTransaction as jest.Mock;
const mockSubmit = submitSignedXdr as jest.Mock;

/** Typed global fetch accessor for mocking without triggering no-explicit-any */
type GlobalWithFetch = typeof globalThis & { fetch: jest.Mock };

function setGlobalFetch(fn: jest.Mock): void {
  (globalThis as GlobalWithFetch).fetch = fn;
}

function getGlobalFetch(): jest.Mock {
  return (globalThis as GlobalWithFetch).fetch;
}

/** Repayment-preview response stub */
function makePreviewResponse() {
  return {
    ok: true,
    json: async () => ({
      breakdown: {
        principal: 99,
        interest: 0,
        fees: 0,
        remaining_balance: 99,
      },
      fully_repaid: false,
      projected_health_factor_bps: 15000,
    }),
  };
}

/** POST /api/loan/repay success response stub */
function makeRepayResponse() {
  return {
    ok: true,
    json: async () => ({ xdr: 'test-xdr' }),
  };
}

/**
 * Route fetch calls by URL so tests are not brittle to call order.
 * preview   → /api/loan/repayment-preview
 * repay     → /api/loan/repay
 */
function makeFetchRouter(
  options: {
    repayResponse?: ReturnType<typeof makeRepayResponse> | { reject: Error };
  } = {}
): jest.Mock {
  return jest.fn().mockImplementation((url: string) => {
    if (url.includes('repayment-preview')) {
      return Promise.resolve(makePreviewResponse());
    }
    if (url.includes('/repay')) {
      const r = options.repayResponse;
      if (r && 'reject' in r) {
        return Promise.reject(r.reject);
      }
      return Promise.resolve(options.repayResponse ?? makeRepayResponse());
    }
    return Promise.reject(new Error(`Unmocked URL: ${url}`));
  });
}

function renderPanel(props: { initialLoanId?: string; initialAmount?: string } = {}) {
  return render(
    <ToastProvider>
      <RepayPanel walletAddress="GTEST" />
      <ToastContainer />
    </ToastProvider>
  );
}

describe("RepayPanel", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders loan ID and amount inputs and repay button", () => {
    renderPanel();
    expect(screen.getByPlaceholderText("Loan ID")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Amount (stroops)")).toBeInTheDocument();
    expect(screen.getByText("Repay")).toBeInTheDocument();
  });

  it("shows loading indicator while server is confirming", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ xdr: "test-xdr" }),
    });
    mockSign.mockResolvedValue({ signedTxXdr: "signed-xdr" });
    mockSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 200))
    );

    renderPanel();
    fireEvent.change(screen.getByPlaceholderText("Loan ID"), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("Amount (stroops)"), { target: { value: "100" } });
    fireEvent.click(screen.getByText("Repay"));

    expect(await screen.findByText("Processing…")).toBeTruthy();
  });

  it("shows success toast after server confirms", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ xdr: "test-xdr" }),
    });
    mockSign.mockResolvedValue({ signedTxXdr: "signed-xdr" });
    mockSubmit.mockResolvedValue("tx-hash");

    renderPanel();
    fireEvent.change(screen.getByPlaceholderText("Loan ID"), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("Amount (stroops)"), { target: { value: "100" } });
    fireEvent.click(screen.getByText("Repay"));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Repayment submitted successfully!")
    );
  });

  it("shows error toast on API error", async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    renderPanel();
    fireEvent.change(screen.getByPlaceholderText("Loan ID"), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("Amount (stroops)"), { target: { value: "100" } });
    fireEvent.click(screen.getByText("Repay"));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Network error")
    );
  });

  it("clears inputs after successful repayment", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ xdr: "test-xdr" }),
    });
    mockSign.mockResolvedValue({ signedTxXdr: "signed-xdr" });
    mockSubmit.mockResolvedValue("tx-hash");

    renderPanel();
    const loanIdInput = screen.getByPlaceholderText("Loan ID") as HTMLInputElement;
    const amountInput = screen.getByPlaceholderText("Amount (stroops)") as HTMLInputElement;
    fireEvent.change(loanIdInput, { target: { value: "1" } });
    fireEvent.change(amountInput, { target: { value: "100" } });
    fireEvent.click(screen.getByText("Repay"));

    await waitFor(() => expect(loanIdInput.value).toBe(""));
    expect(amountInput.value).toBe("");
  });

  // ── Outstanding balance display ─────────────────────────────────────────

  it('shows outstanding balance after loan ID is entered', async () => {
    setGlobalFetch(makeFetchRouter());

    render(
      <ToastProvider>
        <RepayPanel walletAddress="GTEST" initialLoanId="1" />
      </ToastProvider>
    );

    await waitFor(() => expect(screen.getByTestId('outstanding-balance')).toBeTruthy());
  });

  it('shows skeleton (aria-hidden shimmer) while balance is loading', () => {
    // Never resolve the preview — keeps loading state permanently
    setGlobalFetch(jest.fn().mockImplementation(() => new Promise(() => {})));

    render(
      <ToastProvider>
        <RepayPanel walletAddress="GTEST" initialLoanId="5" />
      </ToastProvider>
    );

    // aria-hidden skeleton shimmers should be in the document
    const skeletons = document.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
