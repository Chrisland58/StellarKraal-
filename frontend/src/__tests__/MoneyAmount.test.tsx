import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import MoneyAmount from '@/components/MoneyAmount';

describe('MoneyAmount', () => {
  it('renders locale-formatted XLM with at most 7 fraction digits', () => {
    render(<MoneyAmount value={1234.12345678} locale="en-US" />);
    expect(screen.getByText('1,234.1234568 XLM')).toBeInTheDocument();
  });

  it('renders fiat with a currency symbol and 2 decimal places', () => {
    render(<MoneyAmount value={1234.5} currency="USD" locale="en-US" />);
    expect(screen.getByText('$1,234.50')).toBeInTheDocument();
  });

  it('converts stroops to XLM', () => {
    render(<MoneyAmount value={25_000_000} fromStroops locale="en-US" />);
    expect(screen.getByText('2.5 XLM')).toBeInTheDocument();
  });

  it('is keyboard-navigable when interactive', async () => {
    const user = userEvent.setup();
    render(<MoneyAmount value={10} locale="en-US" />);
    await user.tab();
    expect(screen.getByText('10 XLM')).toHaveFocus();
  });

  it('exposes an accessible name for screen readers', () => {
    render(<MoneyAmount value={10} locale="en-US" />);
    expect(screen.getByLabelText('10 lumens')).toBeInTheDocument();
  });

  it('is not in the tab order when nested inside another control', async () => {
    const user = userEvent.setup();
    render(
      <button type="button">
        Pay <MoneyAmount value={10} locale="en-US" interactive={false} />
      </button>
    );
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    expect(screen.getByText('10 XLM')).not.toHaveAttribute('tabindex');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<MoneyAmount value={99.5} currency="USD" locale="en-US" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
