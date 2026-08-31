/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CollateralStatusCard from "../CollateralStatusCard";

// next/image requires a mock in the Jest environment
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const baseProps = {
  id: "col-001",
  animalType: "cattle",
  count: 5,
  appraisedValue: 50_000_000_000, // 5,000 XLM
  status: "available" as const,
};

describe("CollateralStatusCard", () => {
  it("renders the animal type label", () => {
    render(<CollateralStatusCard {...baseProps} />);
    // Two occurrences expected: badge overlay + count line
    expect(screen.getAllByText(/cattle/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders the formatted appraised value", () => {
    render(<CollateralStatusCard {...baseProps} />);
    expect(screen.getByText(/5,000\.00 XLM/i)).toBeInTheDocument();
  });

  it("renders the collateral ID", () => {
    render(<CollateralStatusCard {...baseProps} />);
    expect(screen.getByText(/ID: col-001/i)).toBeInTheDocument();
  });

  it("shows the count with correct unit", () => {
    render(<CollateralStatusCard {...baseProps} count={1} />);
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/cattle/i)).toBeInTheDocument();
  });

  it("shows plural label when count > 1", () => {
    render(<CollateralStatusCard {...baseProps} count={5} />);
    expect(screen.getByText(/cattles/i)).toBeInTheDocument();
  });

  it("renders the status badge", () => {
    render(<CollateralStatusCard {...baseProps} status="available" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/available/i)).toBeInTheDocument();
  });

  it("renders a pledged status badge with correct label", () => {
    render(<CollateralStatusCard {...baseProps} status="pledged" />);
    expect(screen.getByText(/pledged/i)).toBeInTheDocument();
  });

  it("renders a liquidated status badge with correct label", () => {
    render(<CollateralStatusCard {...baseProps} status="liquidated" />);
    expect(screen.getByText(/liquidated/i)).toBeInTheDocument();
  });

  it("shows placeholder when no photoUrl is provided", () => {
    render(<CollateralStatusCard {...baseProps} />);
    expect(screen.getByText(/no photo/i)).toBeInTheDocument();
  });

  it("renders the photo image when photoUrl is provided", () => {
    render(
      <CollateralStatusCard
        {...baseProps}
        photoUrl="https://example.com/cow.jpg"
      />
    );
    const img = screen.getByAltText("Cattle collateral ID col-001");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", expect.stringContaining("cow.jpg"));
  });

  it("alt text is generated from animal type and ID", () => {
    render(
      <CollateralStatusCard
        {...baseProps}
        animalType="goat"
        id="col-abc"
        photoUrl="https://example.com/goat.jpg"
      />
    );
    expect(screen.getByAltText("Goat collateral ID col-abc")).toBeInTheDocument();
  });

  it("is not interactive when onClick is not provided", () => {
    const { container } = render(<CollateralStatusCard {...baseProps} />);
    const article = container.querySelector("article");
    expect(article).not.toHaveAttribute("role", "button");
    expect(article).not.toHaveAttribute("tabIndex");
  });

  it("is keyboard-focusable and fires onClick when Enter is pressed", () => {
    const handleClick = jest.fn();
    const { container } = render(
      <CollateralStatusCard {...baseProps} onClick={handleClick} />
    );
    const article = container.querySelector("article");
    expect(article).toHaveAttribute("role", "button");
    expect(article).toHaveAttribute("tabIndex", "0");

    fireEvent.keyDown(article!, { key: "Enter" });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("fires onClick when Space is pressed", () => {
    const handleClick = jest.fn();
    const { container } = render(
      <CollateralStatusCard {...baseProps} onClick={handleClick} />
    );
    const article = container.querySelector("article")!;
    fireEvent.keyDown(article, { key: " " });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("fires onClick when card is clicked", () => {
    const handleClick = jest.fn();
    const { container } = render(
      <CollateralStatusCard {...baseProps} onClick={handleClick} />
    );
    fireEvent.click(container.querySelector("article")!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders a goat icon for goat type", () => {
    render(<CollateralStatusCard {...baseProps} animalType="goat" />);
    expect(screen.getByLabelText("Goat")).toBeInTheDocument();
  });

  it("renders a sheep icon for sheep type", () => {
    render(<CollateralStatusCard {...baseProps} animalType="sheep" />);
    expect(screen.getByLabelText("Sheep")).toBeInTheDocument();
  });

  it("has an accessible article aria-label", () => {
    render(<CollateralStatusCard {...baseProps} />);
    expect(
      screen.getByRole("article", { name: /cattle collateral, available/i })
    ).toBeInTheDocument();
  });
});
