/**
 * Tests for the aria-live health factor announcement region on the Dashboard.
 *
 * The Dashboard renders a visually-hidden `aria-live="polite"` region that
 * announces health factor values to screen readers whenever the value drops
 * below the 1.5× threshold (15 000 basis-point units).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// ── Mock heavy/async dependencies ────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock(
  '@/components/WalletConnect',
  () =>
    function WalletConnect({ onConnect }: { onConnect: (w: string) => void }) {
      return (
        <button data-testid="wallet-connect" onClick={() => onConnect('GBMOCKWALLET')}>
          Connect
        </button>
      );
    }
);
jest.mock('@/components/CollateralCard', () => () => <div data-testid="collateral-card" />);
jest.mock('@/components/RepayPanel', () => () => <div data-testid="repay-panel" />);
jest.mock('@/components/HealthGauge', () => () => <div data-testid="health-gauge" />);
jest.mock(
  '@/components/LoanRepaymentCalculator',
  () =>
    function LoanRepaymentCalculator() {
      return <div data-testid="loan-calc" />;
    }
);
jest.mock('@/components/TransactionHistory', () => () => <div data-testid="tx-history" />);
jest.mock('@/components/SkeletonHealthDashboard', () => () => <div data-testid="skeleton" />);
jest.mock(
  '@/components/ErrorState',
  () =>
    function ErrorState({ message }: { message: string }) {
      return <div data-testid="error-state">{message}</div>;
    }
);
jest.mock(
  '@/components/HelpMenu',
  () =>
    function HelpMenu({ onShowOnboarding }: { onShowOnboarding: () => void }) {
      return <button onClick={onShowOnboarding}>Help</button>;
    }
);
jest.mock(
  '@/components/OnboardingModal',
  () =>
    function OnboardingModal({ isOpen }: { isOpen: boolean }) {
      return isOpen ? <div data-testid="onboarding-modal" /> : null;
    }
);
jest.mock(
  '@/components/Card',
  () =>
    function Card({
      children,
      header,
      className,
    }: {
      children: React.ReactNode;
      header?: React.ReactNode;
      className?: string;
    }) {
      return (
        <div className={className}>
          {header}
          {children}
        </div>
      );
    }
);
jest.mock('@/components/GlossaryTerm', () => ({
  GlossaryTerm: function GlossaryTerm({ termKey }: { termKey: string }) {
    return <span>{termKey}</span>;
  },
}));
jest.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: () => ({
    showOnboarding: false,
    openOnboarding: jest.fn(),
    closeOnboarding: jest.fn(),
  }),
}));

// ── useHealthFactor mock — controllable ──────────────────────────────────────

const mockRefresh = jest.fn();
let mockHealthFactor: number | null = null;
let mockLoading = false;
let mockError: string | null = null;

jest.mock('@/hooks/useHealthFactor', () => ({
  useHealthFactor: () => ({
    healthFactor: mockHealthFactor,
    loading: mockLoading,
    error: mockError,
    refresh: mockRefresh,
  }),
}));

// ── Import after mocks ───────────────────────────────────────────────────────

import Dashboard from '@/app/dashboard/page';

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderDashboard() {
  return render(<Dashboard />);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Dashboard aria-live health factor announcement', () => {
  beforeEach(() => {
    mockHealthFactor = null;
    mockLoading = false;
    mockError = null;
    mockRefresh.mockReset();
  });

  it('renders the aria-live region with polite politeness', () => {
    renderDashboard();
    const region = screen.getByTestId('health-factor-announcement');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('region is visually hidden via sr-only class', () => {
    renderDashboard();
    const region = screen.getByTestId('health-factor-announcement');
    expect(region.className).toMatch(/sr-only/);
  });

  it('sets announcement text when health factor drops below 1.5 (15000 bps)', () => {
    // Start with a healthy value, then drop below threshold
    mockHealthFactor = 12000; // 1.2x — below 1.5x threshold
    renderDashboard();

    const region = screen.getByTestId('health-factor-announcement');
    expect(region.textContent).toBe('Health factor dropped to 1.20');
  });

  it('announcement text is human-readable and shows ratio', () => {
    mockHealthFactor = 8500; // 0.85x
    renderDashboard();

    const region = screen.getByTestId('health-factor-announcement');
    expect(region.textContent).toBe('Health factor dropped to 0.85');
  });

  it('does not announce when health factor is above threshold (>= 1.5)', () => {
    mockHealthFactor = 20000; // 2.0x — healthy
    renderDashboard();

    const region = screen.getByTestId('health-factor-announcement');
    expect(region.textContent).toBe('');
  });

  it('does not announce when healthFactor is null', () => {
    mockHealthFactor = null;
    renderDashboard();

    const region = screen.getByTestId('health-factor-announcement');
    expect(region.textContent).toBe('');
  });

  it('announcement text includes the correct 2-decimal ratio format', () => {
    mockHealthFactor = 13333; // 1.33x
    renderDashboard();

    const region = screen.getByTestId('health-factor-announcement');
    // 13333 / 10000 = 1.3333 → formatted as 1.33
    expect(region.textContent).toBe('Health factor dropped to 1.33');
  });
});
