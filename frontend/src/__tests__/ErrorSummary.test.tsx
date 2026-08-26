import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import ErrorSummary from '@/components/ui/ErrorSummary';

describe('ErrorSummary', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it('renders nothing when there are no errors', () => {
    const { container } = render(<ErrorSummary errors={[]} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the error count and a link for each field error', () => {
    render(
      <ErrorSummary
        errors={[
          { fieldId: 'count', message: 'Count is required.' },
          { fieldId: 'amount', message: 'Loan amount must be a positive number.' },
        ]}
      />
    );

    const panel = screen.getByRole('alert');
    expect(panel).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText('There are 2 errors in this form')).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '#count');
    expect(links[0]).toHaveTextContent('Count is required.');
    expect(links[1]).toHaveAttribute('href', '#amount');
    expect(links[1]).toHaveTextContent('Loan amount must be a positive number.');
  });

  it('uses a singular heading for a single error', () => {
    render(<ErrorSummary errors={[{ fieldId: 'email', message: 'Email is required' }]} />);
    expect(screen.getByText('There is 1 error in this form')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('moves focus to the related input when a summary link is activated', () => {
    render(
      <form>
        <ErrorSummary errors={[{ fieldId: 'qty', message: 'Quantity is required' }]} />
        <input id="qty" aria-label="Quantity" />
      </form>
    );

    const input = screen.getByLabelText('Quantity');
    const focusSpy = jest.spyOn(input, 'focus');
    fireEvent.click(screen.getByRole('link', { name: 'Quantity is required' }));
    expect(focusSpy).toHaveBeenCalled();
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ErrorSummary
        errors={[
          { fieldId: 'a', message: 'Field A is required' },
          { fieldId: 'b', message: 'Field B is required' },
        ]}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
