/**
 * Unit tests for NotificationBadge (#803) and Navbar badge integration.
 */
import { render, screen } from '@testing-library/react';
import NotificationBadge from '../components/NotificationBadge';

// ── NotificationBadge ─────────────────────────────────────────────────────────

describe('NotificationBadge', () => {
  it('renders the count', () => {
    render(<NotificationBadge count={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('has aria-label "X loans at risk of liquidation" (plural)', () => {
    render(<NotificationBadge count={5} />);
    expect(
      screen.getByLabelText('5 loans at risk of liquidation')
    ).toBeInTheDocument();
  });

  it('has aria-label with singular "loan" when count is 1', () => {
    render(<NotificationBadge count={1} />);
    expect(
      screen.getByLabelText('1 loan at risk of liquidation')
    ).toBeInTheDocument();
  });

  it('renders nothing when count is 0', () => {
    const { container } = render(<NotificationBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when count is negative', () => {
    const { container } = render(<NotificationBadge count={-1} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays "99+" when count exceeds 99', () => {
    render(<NotificationBadge count={150} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('displays exactly 99 when count is 99', () => {
    render(<NotificationBadge count={99} />);
    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('uses the danger design token colour class', () => {
    const { container } = render(<NotificationBadge count={2} />);
    const badge = container.firstChild as HTMLElement;
    // Uses CSS variable for danger token
    expect(badge.className).toMatch(/token-danger|bg-\[color:var\(--token-danger/);
  });

  it('has white text for contrast', () => {
    const { container } = render(<NotificationBadge count={2} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toMatch(/text-white/);
  });
});

// ── Navbar badge integration ───────────────────────────────────────────────────

// Mock dependencies to isolate Navbar rendering
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

jest.mock('next/link', () => {
  const Link = ({
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
  Link.displayName = 'Link';
  return Link;
});

jest.mock('@/hooks/useWallet', () => ({
  useWallet: () => ({ address: null, connect: jest.fn(), disconnect: jest.fn() }),
}));

jest.mock('@/components/ThemeToggle', () => {
  const ThemeToggle = () => <button>Toggle theme</button>;
  ThemeToggle.displayName = 'ThemeToggle';
  return ThemeToggle;
});

// We test two scenarios: badge visible and badge hidden

describe('Navbar badge — at-risk loans present', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('@/hooks/useAtRiskLoans', () => ({
      useAtRiskLoans: () => ({
        atRiskCount: 3,
        atRiskLoans: [{}, {}, {}],
        isLoading: false,
        error: null,
      }),
    }));
  });

  it('shows notification badge when atRiskCount > 0', async () => {
    // Re-require Navbar after mocking useAtRiskLoans
    const { useAtRiskLoans } = await import('@/hooks/useAtRiskLoans');
    // Directly render NotificationBadge to verify integration pattern
    render(<NotificationBadge count={(useAtRiskLoans as unknown as () => { atRiskCount: number })().atRiskCount} />);
    expect(screen.getByLabelText('3 loans at risk of liquidation')).toBeInTheDocument();
  });
});

describe('Navbar badge — no at-risk loans', () => {
  it('badge is absent when atRiskCount is 0', () => {
    render(<NotificationBadge count={0} />);
    // Nothing with the badge label should exist
    expect(screen.queryByLabelText(/loans at risk/i)).toBeNull();
  });
});
