/**
 * Tests for CollateralCard.
 *
 * Covers:
 *  - Basic render (Loan Lookup form)
 *  - Fetch and display loan data (via fetchWithRetry)
 *  - Loading / disabled state
 *  - Error display
 *  - id prop → entire card wrapped in a Next.js Link with correct href
 *  - Pointer cursor applied when id is provided
 *  - Focus ring present for keyboard navigation
 *  - Enter key triggers navigation (href is correct)
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import CollateralCard from "../components/CollateralCard";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock next/link so it renders as a plain <a> in jsdom
jest.mock("next/link", () => {
  const MockLink = ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

// Mock the toast hook so we don't need a provider
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};
jest.mock("@/components/toast", () => ({
  useToast: () => mockToast,
}));

// Mock fetchWithRetry so we control responses in tests
const mockFetchWithRetry = jest.fn();
jest.mock("@/lib/fetchWithRetry", () => ({
  fetchWithRetry: (...args: unknown[]) => mockFetchWithRetry(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeOkResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => body,
  });
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockFetchWithRetry.mockReset();
  mockToast.error.mockReset();
  mockToast.warning.mockReset();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("CollateralCard", () => {
  describe("basic rendering", () => {
    it("renders the loan lookup form", () => {
      render(<CollateralCard walletAddress="GTEST" />);
      expect(screen.getByPlaceholderText("Loan ID")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Fetch" })).toBeTruthy();
    });

    it("shows the 'Loan Lookup' heading", () => {
      render(<CollateralCard walletAddress="GTEST" />);
      expect(screen.getByText("Loan Lookup")).toBeTruthy();
    });
  });

  describe("fetch behaviour", () => {
    it("calls fetchWithRetry with the correct URL when Fetch is clicked", async () => {
      mockFetchWithRetry.mockReturnValue(makeOkResponse({ id: 1 }));

      render(<CollateralCard walletAddress="GTEST" />);
      fireEvent.change(screen.getByPlaceholderText("Loan ID"), {
        target: { value: "loan-42" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Fetch" }));

      await waitFor(() => expect(mockFetchWithRetry).toHaveBeenCalled());
      const [url] = mockFetchWithRetry.mock.calls[0] as [string, unknown];
      expect(url).toMatch(/\/api\/loan\/loan-42$/);
    });

    it("displays JSON data after a successful fetch", async () => {
      mockFetchWithRetry.mockReturnValue(makeOkResponse({ id: 42, status: "active" }));

      render(<CollateralCard walletAddress="GTEST" />);
      fireEvent.change(screen.getByPlaceholderText("Loan ID"), {
        target: { value: "42" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Fetch" }));

      await waitFor(() =>
        expect(screen.getByText(/"status": "active"/)).toBeTruthy()
      );
    });

    it("shows loading state (Fetching…) while the request is in flight", async () => {
      let resolveRequest!: (v: unknown) => void;
      mockFetchWithRetry.mockReturnValue(
        new Promise((r) => { resolveRequest = r; })
      );

      render(<CollateralCard walletAddress="GTEST" />);
      fireEvent.change(screen.getByPlaceholderText("Loan ID"), {
        target: { value: "1" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Fetch" }));

      expect(screen.getByText("Fetching…")).toBeTruthy();

      // Resolve the pending promise to avoid act() warnings
      await act(async () => {
        resolveRequest({ ok: true, status: 200, json: async () => ({}) });
        await Promise.resolve();
      });
    });

    it("disables the Fetch button while loading", async () => {
      let resolveRequest!: (v: unknown) => void;
      mockFetchWithRetry.mockReturnValue(
        new Promise((r) => { resolveRequest = r; })
      );

      render(<CollateralCard walletAddress="GTEST" />);
      fireEvent.change(screen.getByPlaceholderText("Loan ID"), {
        target: { value: "1" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Fetch" }));

      const btn = screen.getByText("Fetching…").closest("button")!;
      expect(btn.disabled).toBe(true);

      // Resolve to avoid act() warnings
      await act(async () => {
        resolveRequest({ ok: true, status: 200, json: async () => ({}) });
        await Promise.resolve();
      });
    });

    it("shows an error message when the response is not ok", async () => {
      mockFetchWithRetry.mockReturnValue(
        Promise.resolve({ ok: false, status: 404, json: async () => ({}) })
      );

      render(<CollateralCard walletAddress="GTEST" />);
      fireEvent.change(screen.getByPlaceholderText("Loan ID"), {
        target: { value: "bad-id" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Fetch" }));

      await waitFor(() =>
        expect(screen.getByRole("alert")).toBeTruthy()
      );
    });
  });

  describe("id prop → navigable Link", () => {
    it("wraps the entire card in a Link when id prop is provided", () => {
      render(<CollateralCard walletAddress="GTEST" id="col-123" />);

      // The outer element rendered by our MockLink is an <a>
      const link = screen.getByRole("link", { name: /col-123/i });
      expect(link).toBeTruthy();
    });

    it("sets href to /dashboard/collateral/[id]", () => {
      render(<CollateralCard walletAddress="GTEST" id="col-123" />);

      const link = screen.getByRole("link", { name: /col-123/i }) as HTMLAnchorElement;
      expect(link.href).toContain("/dashboard/collateral/col-123");
    });

    it("sets the correct href when id is a different value", () => {
      render(<CollateralCard walletAddress="GTEST" id="abc-999" />);

      const link = screen.getByRole("link", { name: /abc-999/i }) as HTMLAnchorElement;
      expect(link.href).toContain("/dashboard/collateral/abc-999");
    });

    it("applies cursor-pointer class when id is provided", () => {
      render(<CollateralCard walletAddress="GTEST" id="col-123" />);

      const link = screen.getByRole("link", { name: /col-123/i });
      expect(link.className).toContain("cursor-pointer");
    });

    it("applies focus-visible ring class for keyboard navigation", () => {
      render(<CollateralCard walletAddress="GTEST" id="col-123" />);

      const link = screen.getByRole("link", { name: /col-123/i });
      // The focus-visible ring is defined via Tailwind classes
      expect(link.className).toContain("focus-visible:ring-2");
    });

    it("does NOT render a wrapping link when id is not provided", () => {
      render(<CollateralCard walletAddress="GTEST" />);

      // The inner "View collateral detail" link should NOT exist yet (no collateralId typed)
      const links = screen.queryAllByRole("link");
      // There should be no links at all until a collateralId is entered
      expect(links).toHaveLength(0);
    });

    it("the card Link renders as a block element", () => {
      render(<CollateralCard walletAddress="GTEST" id="col-123" />);

      const link = screen.getByRole("link", { name: /col-123/i });
      expect(link.className).toContain("block");
    });

    it("keyboard Enter key activates navigation (link has correct href)", () => {
      render(<CollateralCard walletAddress="GTEST" id="col-fire" />);

      const link = screen.getByRole("link", { name: /col-fire/i }) as HTMLAnchorElement;
      // A native <a> with an href responds to Enter — verify href is set correctly
      expect(link.href).toContain("/dashboard/collateral/col-fire");
      // Simulating keydown Enter on a link with href should not throw
      expect(() => fireEvent.keyDown(link, { key: "Enter", code: "Enter" })).not.toThrow();
    });
  });
});
