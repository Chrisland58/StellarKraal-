import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TransactionHistory from '../components/TransactionHistory';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock('@/hooks/usePagination', () => ({
  usePagination: () => ({
    page: 1,
    limit: 10,
    totalPages: 1,
    setPage: jest.fn(),
    setLimit: jest.fn(),
    slice: (arr: unknown[]) => arr,
  }),
}));

const mockTransactions = [
  {
    id: 1,
    loan_id: 101,
    type: 'Repayment',
    amount: 5000,
    status: 'completed',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 2,
    loan_id: 102,
    type: 'Disbursement',
    amount: 10000,
    status: 'pending',
    created_at: '2026-02-20T00:00:00Z',
  },
];

function setupFetch(data: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data }),
  } as Response);
}

describe('TransactionHistory', () => {
  afterEach(() => jest.resetAllMocks());

  it('renders the card list for mobile (sm:hidden list exists in DOM)', async () => {
    setupFetch(mockTransactions);
    const { container } = render(<TransactionHistory walletAddress="GTEST" />);

    await waitFor(() => {
      expect(screen.getAllByText('Repayment').length).toBeGreaterThan(0);
    });

    // The mobile card list should be present (visibility controlled by Tailwind)
    const mobileList = container.querySelector('ul[aria-label="Transaction list"]');
    expect(mobileList).not.toBeNull();
  });

  it('renders the desktop table in the DOM', async () => {
    setupFetch(mockTransactions);
    const { container } = render(<TransactionHistory walletAddress="GTEST" />);

    await waitFor(() => {
      expect(screen.getAllByText('Repayment').length).toBeGreaterThan(0);
    });

    const table = container.querySelector('table');
    expect(table).not.toBeNull();
  });

  it('shows type, amount, date and status labels in mobile cards', async () => {
    setupFetch(mockTransactions);
    render(<TransactionHistory walletAddress="GTEST" />);

    await waitFor(() => {
      expect(screen.getAllByText('Type').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Amount').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Date').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
  });

  it('renders a completed status badge', async () => {
    setupFetch(mockTransactions);
    render(<TransactionHistory walletAddress="GTEST" />);

    await waitFor(() => {
      expect(screen.getAllByText('completed').length).toBeGreaterThan(0);
    });
  });

  it('renders a pending status badge', async () => {
    setupFetch(mockTransactions);
    render(<TransactionHistory walletAddress="GTEST" />);

    await waitFor(() => {
      expect(screen.getAllByText('pending').length).toBeGreaterThan(0);
    });
  });

  it('shows empty state when no transactions', async () => {
    setupFetch([]);
    render(<TransactionHistory walletAddress="GTEST" />);

    await waitFor(() => {
      expect(screen.getByText('No transactions yet')).toBeTruthy();
    });
  });

  it('shows error state on fetch failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    render(<TransactionHistory walletAddress="GTEST" />);

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeTruthy();
    });
  });

  it('table has no overflow by using table-fixed and no horizontal scroll wrapper', async () => {
    setupFetch(mockTransactions);
    const { container } = render(<TransactionHistory walletAddress="GTEST" />);

    await waitFor(() => {
      expect(screen.getAllByText('Repayment').length).toBeGreaterThan(0);
    });

    // Table wrapper should have overflow-hidden to prevent horizontal scroll
    const tableWrapper = container.querySelector('.overflow-hidden');
    expect(tableWrapper).not.toBeNull();

    // Table should have table-fixed class
    const table = container.querySelector('table');
    expect(table?.className).toContain('table-fixed');
  });
});
