import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoanRepaymentCalculator from '../components/LoanRepaymentCalculator';

jest.mock('../components/HealthGauge', () => ({
  __esModule: true,
  default: ({ value }: { value: number }) => <div>Health: {value}</div>,
}));

describe('LoanRepaymentCalculator', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock.mockReset();
    (global as any).fetch = fetchMock;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: 1 }, { id: 2 }] }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        loan_id: 1,
        repayment_amount: 100,
        breakdown: {
          principal: 100,
          interest: 0,
          fees: 0,
          remaining_balance: 900,
        },
        projected_health_factor_bps: 12000,
        fully_repaid: false,
      }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces preview API and allows proceed-to-repay', async () => {
    const onProceed = jest.fn();
    render(<LoanRepaymentCalculator onProceed={onProceed} />);

    fireEvent.change(screen.getByPlaceholderText('Enter loan ID'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter repayment amount'), {
      target: { value: '100' },
    });

    await act(async () => {
      jest.advanceTimersByTime(299);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Proceed to Repay')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Proceed to Repay'));
    expect(onProceed).toHaveBeenCalledWith('1', '100');
  });

  describe('edge cases (#536)', () => {
    it('does not call the preview API and shows no preview for a zero amount', async () => {
      render(<LoanRepaymentCalculator onProceed={jest.fn()} />);

      fireEvent.change(screen.getByPlaceholderText('Enter loan ID'), {
        target: { value: '1' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter repayment amount'), {
        target: { value: '0' },
      });

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Only the initial loan-list fetch fired; no preview request for a zero amount.
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Proceed to Repay')).not.toBeInTheDocument();
    });

    it('shows a fully-repaid message instead of a health gauge for a full repayment', async () => {
      fetchMock.mockReset();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 1 }] }),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          loan_id: 1,
          repayment_amount: 1000,
          breakdown: {
            principal: 1000,
            interest: 50,
            fees: 5,
            remaining_balance: 0,
          },
          projected_health_factor_bps: null,
          fully_repaid: true,
        }),
      });

      render(<LoanRepaymentCalculator onProceed={jest.fn()} />);

      fireEvent.change(screen.getByPlaceholderText('Enter loan ID'), {
        target: { value: '1' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter repayment amount'), {
        target: { value: '1000' },
      });

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/fully repaid \(health factor becomes infinite\)/i)
        ).toBeInTheDocument();
      });
      expect(screen.queryByText(/^Health:/)).not.toBeInTheDocument();
    });
  });

  describe('embedded with a fixed loanId (#536)', () => {
    it('locks the loan ID and skips the loan-list fetch', async () => {
      fetchMock.mockReset();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          loan_id: 7,
          repayment_amount: 250,
          breakdown: { principal: 250, interest: 10, fees: 1, remaining_balance: 750 },
          projected_health_factor_bps: 15000,
          fully_repaid: false,
        }),
      });

      render(<LoanRepaymentCalculator loanId={7} onProceed={jest.fn()} />);

      expect(screen.queryByPlaceholderText('Enter loan ID')).not.toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText('Enter repayment amount'), {
        target: { value: '250' },
      });

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/api/loan/repayment-preview'),
          expect.objectContaining({
            body: JSON.stringify({ loan_id: 7, amount: 250 }),
          })
        );
      });
      // Only the preview request fired — no separate loan-list fetch for a fixed loan.
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
