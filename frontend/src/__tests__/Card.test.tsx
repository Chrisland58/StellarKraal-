/**
 * Unit tests for the Card component (#789)
 *
 * Covers:
 *  - All slot combinations (title, subtitle, badge, action, footer, header, children)
 *  - All variants (default, highlighted, warning)
 *  - Interaction states (hover classes, selected, disabled, onSelect)
 *  - Keyboard navigation (Enter, Space)
 *  - ARIA attributes (role, aria-disabled, aria-pressed)
 *  - Dark-mode class presence
 */
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Card from "../components/Card";

describe("Card — slot rendering", () => {
  it("renders children", () => {
    render(<Card>body text</Card>);
    expect(screen.getByText("body text")).toBeInTheDocument();
  });

  it("renders title", () => {
    render(<Card title="Loan #42">body</Card>);
    expect(screen.getByText("Loan #42")).toBeInTheDocument();
  });

  it("renders subtitle below title", () => {
    render(
      <Card title="Loan #42" subtitle="Borrower address">
        body
      </Card>
    );
    expect(screen.getByText("Borrower address")).toBeInTheDocument();
  });

  it("renders badge beside title", () => {
    render(
      <Card title="Loan #42" badge={<span data-testid="badge">active</span>}>
        body
      </Card>
    );
    expect(screen.getByTestId("badge")).toBeInTheDocument();
  });

  it("renders action slot to the right of title row", () => {
    render(
      <Card
        title="Loan #42"
        action={<button data-testid="action-btn">Repay</button>}
      >
        body
      </Card>
    );
    expect(screen.getByTestId("action-btn")).toBeInTheDocument();
  });

  it("does not render title row when neither title, badge nor action is supplied", () => {
    const { container } = render(<Card>body</Card>);
    // The title row div is only present when title/badge/action exist
    expect(container.querySelector(".flex.items-start.justify-between")).toBeNull();
  });

  it("renders legacy header slot", () => {
    render(
      <Card header={<h2 data-testid="legacy-header">Header</h2>}>body</Card>
    );
    expect(screen.getByTestId("legacy-header")).toBeInTheDocument();
  });

  it("renders footer slot", () => {
    render(<Card footer={<span data-testid="footer">ID: abc</span>}>body</Card>);
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("renders all slots simultaneously", () => {
    render(
      <Card
        title="Title"
        subtitle="Subtitle"
        badge={<span data-testid="badge">badge</span>}
        action={<button data-testid="action">Act</button>}
        footer={<span data-testid="footer">Footer</span>}
      >
        <span data-testid="body">Body</span>
      </Card>
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
    expect(screen.getByTestId("badge")).toBeInTheDocument();
    expect(screen.getByTestId("action")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByTestId("body")).toBeInTheDocument();
  });
});

describe("Card — variants", () => {
  it("applies default variant classes by default", () => {
    const { container } = render(<Card>body</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/bg-cream-50/);
  });

  it("applies highlighted variant classes", () => {
    const { container } = render(<Card variant="highlighted">body</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/bg-gold-50/);
  });

  it("applies warning variant classes", () => {
    const { container } = render(<Card variant="warning">body</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/bg-warning-light/);
  });
});

describe("Card — selected state", () => {
  it("applies selected ring classes when selected=true", () => {
    const { container } = render(
      <Card selected onSelect={() => {}}>
        body
      </Card>
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/ring-2/);
    expect(card.className).toMatch(/ring-gold-500/);
  });

  it("sets aria-pressed=true when selected and interactive", () => {
    render(
      <Card selected onSelect={() => {}}>
        body
      </Card>
    );
    const card = screen.getByRole("button");
    expect(card).toHaveAttribute("aria-pressed", "true");
  });
});

describe("Card — disabled state", () => {
  it("applies opacity class when disabled", () => {
    const { container } = render(<Card disabled>body</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/opacity-50/);
  });

  it("sets aria-disabled=true when disabled", () => {
    render(
      <Card disabled onSelect={() => {}}>
        body
      </Card>
    );
    // When disabled, onSelect is suppressed — the element is still a button
    // but aria-disabled is true
    const el = screen.queryByRole("button");
    // disabled suppresses onSelect prop, so no role=button is rendered
    expect(el).toBeNull();
    const container = document.querySelector("[aria-disabled='true']");
    expect(container).toBeInTheDocument();
  });

  it("does not fire onSelect when disabled", () => {
    const onSelect = jest.fn();
    const { container } = render(
      <Card disabled onSelect={onSelect}>
        body
      </Card>
    );
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("Card — interactive / onSelect", () => {
  it("renders role=button when onSelect is provided", () => {
    render(<Card onSelect={() => {}}>body</Card>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("is focusable (tabIndex=0) when onSelect is provided", () => {
    render(<Card onSelect={() => {}}>body</Card>);
    expect(screen.getByRole("button")).toHaveAttribute("tabindex", "0");
  });

  it("fires onSelect on click", async () => {
    const onSelect = jest.fn();
    render(<Card onSelect={onSelect}>body</Card>);
    await userEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("fires onSelect on Enter key", () => {
    const onSelect = jest.fn();
    render(<Card onSelect={onSelect}>body</Card>);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("fires onSelect on Space key", () => {
    const onSelect = jest.fn();
    render(<Card onSelect={onSelect}>body</Card>);
    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire onSelect on other keys", () => {
    const onSelect = jest.fn();
    render(<Card onSelect={onSelect}>body</Card>);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Tab" });
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("Card — no role=button without onSelect", () => {
  it("has no button role when onSelect is absent", () => {
    render(<Card>body</Card>);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("has no tabIndex when onSelect is absent", () => {
    const { container } = render(<Card>body</Card>);
    expect(container.firstChild).not.toHaveAttribute("tabindex");
  });
});

describe("Card — dark mode classes", () => {
  it("includes dark: classes in default variant", () => {
    const { container } = render(<Card>body</Card>);
    expect((container.firstChild as HTMLElement).className).toMatch(/dark:/);
  });
});

describe("Card — extra HTML attributes forwarded", () => {
  it("forwards aria-label", () => {
    render(<Card aria-label="Loan card">body</Card>);
    expect(screen.getByLabelText("Loan card")).toBeInTheDocument();
  });

  it("forwards data-testid", () => {
    render(<Card data-testid="my-card">body</Card>);
    expect(screen.getByTestId("my-card")).toBeInTheDocument();
  });
});
