import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import LiquidationWarningModal, {
  AtRiskLoan,
} from '../components/LiquidationWarningModal';
import { useLiquidationWarning } from '../hooks/useLiquidationWarning';

// ── LiquidationWarningModal component tests ───────────────────────────────────

// Mock focus-trap-react so Modal works in jsdom
jest.mock('focus-trap-react', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockDismiss = jest.fn();

function renderModal(loans: AtRiskLoan[]) {
  return render(
    <LiquidationWarningModal atRiskLoans={loans} onDismiss={mockDismiss} />,
  );
}

describe('LiquidationWarningModal', () => {
  beforeEach(() => mockDismiss.mockClear());

  it('renders nothing when atRiskLoans is empty', () => {
    const { container } = renderModal([]);
    expect(container.firstChild).toBeNull();
  });

  it('shows the warning title', () => {
    renderModal([{ id: '1', healthFactor: 11_000 }]);
    expect(screen.getByText(/liquidation warning/i)).toBeTruthy();
  });

  it('lists each at-risk loan with its health factor', () => {
    renderModal([
      { id: '42', healthFactor: 11_500 },
      { id: '99', healthFactor: 9_000 },
    ]);
    expect(screen.getByText('#42')).toBeTruthy();
    expect(screen.getByText('#99')).toBeTruthy();
    // Health factor values formatted as xX
    expect(screen.getByText('1.15x')).toBeTruthy();
    expect(screen.getByText('0.90x')).toBeTruthy();
  });

  it('renders a "Repay Now" link for each at-risk loan', () => {
    renderModal([
      { id: '42', healthFactor: 11_500 },
      { id: '99', healthFactor: 9_000 },
    ]);
    const repayLinks = screen.getAllByRole('link', { name: /repay.*now/i });
    expect(repayLinks).toHaveLength(2);
    // Each link points to the repay flow for that loan
    expect(repayLinks[0].getAttribute('href')).toContain('42');
    expect(repayLinks[1].getAttribute('href')).toContain('99');
  });

  it('calls onDismiss when Dismiss button is clicked', () => {
    renderModal([{ id: '1', healthFactor: 11_000 }]);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when the modal close (×) button is clicked', () => {
    renderModal([{ id: '1', healthFactor: 11_000 }]);
    fireEvent.click(screen.getByRole('button', { name: /close dialog/i }));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });
});

// ── useLiquidationWarning hook tests ─────────────────────────────────────────

const DISMISS_KEY = 'liquidation_warning_dismissed_at';

function makeLoan(id: string, health_factor: number, status = 'active') {
  return { id, health_factor, status };
}

describe('useLiquidationWarning', () => {
  beforeEach(() => localStorage.clear());

  it('shouldShow is false when no loans are at risk', () => {
    const { result } = renderHook(() =>
      useLiquidationWarning([makeLoan('1', 15_000)]),
    );
    expect(result.current.shouldShow).toBe(false);
    expect(result.current.atRiskLoans).toHaveLength(0);
  });

  it('shouldShow is true when a loan health factor is below 12_000 bps (< 1.2x)', () => {
    const { result } = renderHook(() =>
      useLiquidationWarning([makeLoan('1', 11_000)]),
    );
    expect(result.current.shouldShow).toBe(true);
    expect(result.current.atRiskLoans).toHaveLength(1);
    expect(result.current.atRiskLoans[0].id).toBe('1');
  });

  it('shouldShow is false when health factor equals 12_000 bps (exactly 1.2x)', () => {
    const { result } = renderHook(() =>
      useLiquidationWarning([makeLoan('1', 12_000)]),
    );
    expect(result.current.shouldShow).toBe(false);
  });

  it('excludes repaid and liquidated loans from atRiskLoans', () => {
    const { result } = renderHook(() =>
      useLiquidationWarning([
        makeLoan('1', 9_000, 'repaid'),
        makeLoan('2', 9_000, 'liquidated'),
        makeLoan('3', 9_000, 'active'),
      ]),
    );
    expect(result.current.atRiskLoans).toHaveLength(1);
    expect(result.current.atRiskLoans[0].id).toBe('3');
  });

  it('dismiss() sets shouldShow to false and writes to localStorage', () => {
    const { result } = renderHook(() =>
      useLiquidationWarning([makeLoan('1', 11_000)]),
    );
    expect(result.current.shouldShow).toBe(true);
    act(() => { result.current.dismiss(); });
    expect(result.current.shouldShow).toBe(false);
    expect(localStorage.getItem(DISMISS_KEY)).not.toBeNull();
  });

  it('shouldShow is false within 1 hour of dismissal (localStorage suppression)', () => {
    // Simulate a dismiss that happened 30 minutes ago
    localStorage.setItem(DISMISS_KEY, String(Date.now() - 30 * 60 * 1000));
    const { result } = renderHook(() =>
      useLiquidationWarning([makeLoan('1', 11_000)]),
    );
    expect(result.current.shouldShow).toBe(false);
  });

  it('shouldShow is true when dismiss timestamp has expired (> 1 hour)', () => {
    // Simulate a dismiss that happened 2 hours ago
    localStorage.setItem(DISMISS_KEY, String(Date.now() - 2 * 60 * 60 * 1000));
    const { result } = renderHook(() =>
      useLiquidationWarning([makeLoan('1', 11_000)]),
    );
    expect(result.current.shouldShow).toBe(true);
  });

  it('lists all at-risk loans across multiple loans', () => {
    const { result } = renderHook(() =>
      useLiquidationWarning([
        makeLoan('1', 11_000),
        makeLoan('2', 15_000), // safe
        makeLoan('3', 9_500),
        makeLoan('4', 12_001), // just above threshold
      ]),
    );
    expect(result.current.atRiskLoans).toHaveLength(2);
    expect(result.current.atRiskLoans.map((l) => l.id)).toEqual(['1', '3']);
  });
});
