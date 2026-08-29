import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import EmptyState from "../components/EmptyState";
import {
  EmptyLoansIllustration,
  EmptyCollateralIllustration,
  EmptyTransactionsIllustration,
} from "../components/illustrations";

describe("EmptyState", () => {
  const onCta = jest.fn();

  beforeEach(() => onCta.mockReset());

  it("renders illustration, message, and CTA", () => {
    render(
      <EmptyState
        illustration={<EmptyLoansIllustration />}
        heading="No Loans"
        message="You have no active loans"
        ctaLabel="Apply for a Loan"
        onCta={onCta}
      />
    );
    expect(screen.getByRole("status").textContent).toBe("You have no active loans");
    expect(screen.getByRole("button", { name: "Apply for a Loan" })).toBeTruthy();
    // illustration is now role="img" (#780) — the wrapper no longer hides it
    expect(screen.getByRole("img")).toBeTruthy();
  });

  it("calls onCta when CTA button is clicked", () => {
    render(
      <EmptyState
        illustration={<EmptyCollateralIllustration />}
        heading="No Collateral"
        message="No collateral registered"
        ctaLabel="Register Collateral"
        onCta={onCta}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Register Collateral" }));
    expect(onCta).toHaveBeenCalledTimes(1);
  });

  it("CTA button is keyboard focusable", () => {
    render(
      <EmptyState
        illustration={<EmptyTransactionsIllustration />}
        heading="No Transactions"
        message="No transactions yet"
        ctaLabel="View Loans"
        onCta={onCta}
      />
    );
    const btn = screen.getByRole("button", { name: "View Loans" });
    btn.focus();
    expect(document.activeElement).toBe(btn);
  });

  it("SVG illustrations now have role=img (not aria-hidden) — #780", () => {
    render(
      <EmptyState
        illustration={<EmptyLoansIllustration />}
        heading="msg heading"
        message="msg"
        ctaLabel="cta"
        onCta={onCta}
      />
    );
    // Post-#780: illustrations are accessible, not hidden
    const img = screen.getByRole("img");
    expect(img).toBeTruthy();
    expect(img.getAttribute("aria-label")).toBeTruthy();
  });

  it("renders correctly with each illustration variant", () => {
    const { rerender } = render(
      <EmptyState illustration={<EmptyLoansIllustration />} heading="H" message="Loans" ctaLabel="Go" onCta={onCta} />
    );
    expect(screen.getByRole("status").textContent).toBe("Loans");

    rerender(
      <EmptyState illustration={<EmptyCollateralIllustration />} heading="H" message="Collateral" ctaLabel="Go" onCta={onCta} />
    );
    expect(screen.getByRole("status").textContent).toBe("Collateral");

    rerender(
      <EmptyState illustration={<EmptyTransactionsIllustration />} heading="H" message="Transactions" ctaLabel="Go" onCta={onCta} />
    );
    expect(screen.getByRole("status").textContent).toBe("Transactions");
  });
});
