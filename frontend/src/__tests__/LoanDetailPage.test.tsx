import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import LoanDetailPage from "@/app/loans/[id]/page";

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "loan-001" }),
}));

jest.mock("next/link", () => {
  const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  );
  Link.displayName = "Link";
  return Link;
});

jest.mock("@/components/DetailSkeleton", () => ({
  default: () => <div data-testid="detail-skeleton" />,
}));

jest.mock("@/components/ErrorState", () => ({
  default: ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div role="alert">
      <p>{message}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

const mockLoan = {
  loan: {
    id: "loan-001",
    borrower: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
    collateral_id: "col-001",
    amount: 15_000_000,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  collateral: null,
  onChainStatus: null,
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe("LoanDetailPage", () => {
  it("renders loan details when data is available", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockLoan,
    } as Response);

    render(<LoanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/loan-001/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.getByText(/col-001/)).toBeInTheDocument();
  });

  it("renders 404 error when loan is not found", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 404,
      ok: false,
    } as Response);

    render(<LoanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Loan Not Found/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/loan-001/)).toBeInTheDocument();
  });

  it("renders network error state with retry", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    render(<LoanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Could not load loan/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  describe("copy loan ID (#864)", () => {
    it("renders a copy button next to the loan ID", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => mockLoan,
      } as Response);

      render(<LoanDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/loan-001/i)).toBeInTheDocument();
      });

      const copyBtn = screen.getByRole("button", { name: /copy loan id/i });
      expect(copyBtn).toBeInTheDocument();
    });

    it("copies the loan ID to clipboard and shows Copied feedback", async () => {
      const clipboardMock = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: clipboardMock },
        writable: true,
        configurable: true,
      });

      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => mockLoan,
      } as Response);

      render(<LoanDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/loan-001/i)).toBeInTheDocument();
      });

      const copyBtn = screen.getByRole("button", { name: /copy loan id/i });
      fireEvent.click(copyBtn);

      expect(clipboardMock).toHaveBeenCalledWith("loan-001");
      expect(screen.getByRole("button", { name: /loan id copied/i })).toBeInTheDocument();
    });
  });
});
