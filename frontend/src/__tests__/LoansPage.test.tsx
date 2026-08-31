import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoansPage from '../app/loans/page';

// ---------------------------------------------------------------------------
// Next.js navigation mocks
// ---------------------------------------------------------------------------
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/loans',
  useSearchParams: () => ({
    get: () => null,
    getAll: () => [],
    toString: () => '',
  }),
}));

// ---------------------------------------------------------------------------
// framer-motion: no-op to keep tests simple (avoids jsdom animation issues)
// ---------------------------------------------------------------------------
jest.mock('framer-motion', () => ({
  motion: {
    span: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <span {...props}>{children}</span>
    ),
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
  useReducedMotion: () => false,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mockFetch(loans: unknown[]) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => loans,
  } as Response);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('LoansPage — empty state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders EmptyLoansIllustration when loans array is empty', async () => {
    mockFetch([]);
    render(<LoansPage />);

    // Wait for fetch to resolve and loading to finish
    await waitFor(() => {
      expect(screen.queryByText('No Loans Yet')).toBeTruthy();
    });

    // SVG illustration should be present and accessible
    const svg = document.querySelector('svg[role="img"]');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-label')).toBe('No loans yet');
  });

  it('shows "Request a Loan" CTA when loans array is empty', async () => {
    mockFetch([]);
    render(<LoansPage />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /request a loan/i })).toBeTruthy();
    });
  });

  it('navigates to /borrow when CTA is clicked', async () => {
    mockFetch([]);
    render(<LoansPage />);

    const cta = await screen.findByRole('button', { name: /request a loan/i });
    await userEvent.click(cta);

    expect(mockPush).toHaveBeenCalledWith('/borrow');
  });

  it('does NOT show CTA when loans exist', async () => {
    mockFetch([
      {
        id: '1',
        borrower: 'GTEST',
        amount: 100,
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]);
    render(<LoansPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loan #1')).toBeTruthy();
    });

    expect(screen.queryByRole('button', { name: /request a loan/i })).toBeNull();
  });
});
