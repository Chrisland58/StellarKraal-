/**
 * Unit tests for the 404 Not Found page (#564)
 *
 * Verifies:
 * - Navigation links to Dashboard, Borrow, and Collateral render correctly
 * - The "Go home" link renders
 * - The NotFoundPath client component renders the current path
 */
import React from "react";
import { render, screen } from "@testing-library/react";

// ── Mock next/navigation ──────────────────────────────────────────────────────
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/some/invalid/path"),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// ── Mock next/link ────────────────────────────────────────────────────────────
// next/link renders as a plain <a> in jest/jsdom so we just alias it
jest.mock("next/link", () => {
  const MockLink = ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

import NotFound from "../app/not-found";
import NotFoundPath from "../app/NotFoundPath";

describe("NotFound page (#564)", () => {
  describe("navigation links", () => {
    it("renders a link to Dashboard", () => {
      render(<NotFound />);
      const link = screen.getByRole("link", { name: /dashboard/i });
      expect(link).toBeDefined();
      expect(link.getAttribute("href")).toBe("/dashboard");
    });

    it("renders a link to Borrow", () => {
      render(<NotFound />);
      const link = screen.getByRole("link", { name: /borrow/i });
      expect(link).toBeDefined();
      expect(link.getAttribute("href")).toBe("/borrow");
    });

    it("renders a link to Collateral", () => {
      render(<NotFound />);
      const link = screen.getByRole("link", { name: /collateral/i });
      expect(link).toBeDefined();
      expect(link.getAttribute("href")).toBe("/collateral");
    });

    it('renders a "Go home" link to the root', () => {
      render(<NotFound />);
      const link = screen.getByRole("link", { name: /go home/i });
      expect(link).toBeDefined();
      expect(link.getAttribute("href")).toBe("/");
    });

    it("navigation landmark has accessible label", () => {
      render(<NotFound />);
      const nav = screen.getByRole("navigation", { name: /suggested pages/i });
      expect(nav).toBeDefined();
    });
  });

  describe("page heading", () => {
    it('renders the "404" heading', () => {
      render(<NotFound />);
      expect(screen.getByRole("heading", { name: /404/i })).toBeDefined();
    });

    it('renders the "Page not found" sub-heading', () => {
      render(<NotFound />);
      expect(screen.getByRole("heading", { name: /page not found/i })).toBeDefined();
    });
  });
});

describe("NotFoundPath component (#564)", () => {
  it("renders the current invalid path", () => {
    const { usePathname } = require("next/navigation");
    (usePathname as jest.Mock).mockReturnValue("/some/invalid/path");
    render(<NotFoundPath />);
    expect(screen.getByText("/some/invalid/path")).toBeDefined();
  });

  it("renders nothing when pathname is null/empty", () => {
    const { usePathname } = require("next/navigation");
    (usePathname as jest.Mock).mockReturnValue(null);
    const { container } = render(<NotFoundPath />);
    expect(container.firstChild).toBeNull();
  });
});
