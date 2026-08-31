import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import StepConfirm from '../components/wizard/steps/StepConfirm';

// ── Module mocks ────────────────────────────────────────────────────────────

jest.mock('../context/LoanWizardContext', () => ({
  useWizard: jest.fn(),
}));

jest.mock('../hooks/useButtonState', () => ({
  useButtonState: jest.fn(),
}));

jest.mock('../lib/freighterClient', () => ({
  signTransaction: jest.fn(),
}));

jest.mock('../lib/stellarUtils', () => ({
  submitSignedXdr: jest.fn(),
}));

jest.mock('../lib/api', () => ({
  invalidateLoans: jest.fn(),
}));

// Stub XlmAmount so we can assert on its `xlm` prop without currency fetch noise
jest.mock('../components/XlmAmount', () => ({
  __esModule: true,
  default: ({ xlm }: { xlm: number }) => (
    <span data-testid="xlm-amount">{xlm} XLM</span>
  ),
}));

// Stub hooks used for fiat conversion — kept simple so fee-display tests
// focus on the XLM value rather than currency conversion state.
jest.mock('../hooks/useCurrencySettings', () => ({
  useCurrencySettings: jest.fn(() => ({ enabled: false, currency: 'KES' })),
}));

jest.mock('../hooks/useCurrencyConversion', () => ({
  useCurrencyConversion: jest.fn(() => ({
    convert: jest.fn(() => null),
    rates: null,
    loading: false,
    error: null,
    isStale: false,
  })),
}));

// ── Imports after mocks ─────────────────────────────────────────────────────

import { useWizard } from '../context/LoanWizardContext';
import { useButtonState } from '../hooks/useButtonState';

const mockUseWizard = useWizard as jest.Mock;
const mockUseButtonState = useButtonState as jest.Mock;

// ── Default mock values ─────────────────────────────────────────────────────

const defaultWizard = {
  animalType: 'cattle',
  count: '3',
  collateralId: '42',
  loanAmount: '1000',
  loanTermDays: '30',
  error: null,
  setField: jest.fn(),
  prevStep: jest.fn(),
  reset: jest.fn(),
};

const defaultButtonState = {
  state: 'idle' as const,
  setLoading: jest.fn(),
  setSuccess: jest.fn(),
  setError: jest.fn(),
  reset: jest.fn(),
};

function setupFetch(resolveValue: unknown) {
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => resolveValue,
  });
}

function setupFetchReject(error = new Error('Network error')) {
  (global as any).fetch = jest.fn().mockRejectedValue(error);
}

function setupFetchNotOk() {
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({}),
  });
}

// ── Test helpers ────────────────────────────────────────────────────────────

function renderComponent() {
  mockUseWizard.mockReturnValue(defaultWizard);
  mockUseButtonState.mockReturnValue(defaultButtonState);
  return render(<StepConfirm walletAddress="GTEST" />);
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('StepConfirm – fee estimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a spinner while the fee estimate is loading', () => {
    // Make fetch never resolve so we stay in the loading state
    (global as any).fetch = jest.fn(
      () => new Promise<never>(() => undefined),
    );

    renderComponent();

    expect(screen.getByTestId('fee-spinner')).toBeInTheDocument();
  });

  it('renders the fee amount after a successful estimate', async () => {
    setupFetch({ estimatedFee: 0.00001 });

    renderComponent();

    // Spinner should disappear and the amount should appear
    await waitFor(() =>
      expect(screen.queryByTestId('fee-spinner')).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId('fee-amount')).toBeInTheDocument();
    expect(screen.getByTestId('fee-amount').textContent).toContain('0.00001');
  });

  it('calls POST /api/v1/loans/estimate with the correct payload', async () => {
    setupFetch({ estimatedFee: 0.00001 });

    renderComponent();

    await waitFor(() =>
      expect(screen.queryByTestId('fee-spinner')).not.toBeInTheDocument(),
    );

    expect((global as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/loans/estimate'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          collateral_id: 42,
          amount: 1000,
          term_days: 30,
        }),
      }),
    );
  });

  it('shows "Unable to estimate fee" when the fetch rejects', async () => {
    setupFetchReject();

    renderComponent();

    await waitFor(() =>
      expect(screen.getByTestId('fee-error')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('fee-error').textContent).toBe(
      'Unable to estimate fee',
    );
  });

  it('shows "Unable to estimate fee" when the server returns a non-ok response', async () => {
    setupFetchNotOk();

    renderComponent();

    await waitFor(() =>
      expect(screen.getByTestId('fee-error')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('fee-error').textContent).toBe(
      'Unable to estimate fee',
    );
  });

  it('does NOT show a fee warning when the estimate is below 0.1 XLM', async () => {
    setupFetch({ estimatedFee: 0.00001 });

    renderComponent();

    await waitFor(() =>
      expect(screen.queryByTestId('fee-spinner')).not.toBeInTheDocument(),
    );
    expect(screen.queryByTestId('fee-warning')).not.toBeInTheDocument();
  });

  it('shows the amber fee warning when the estimate exceeds 0.1 XLM', async () => {
    setupFetch({ estimatedFee: 0.5 }); // 0.5 XLM > 0.1 threshold

    renderComponent();

    await waitFor(() =>
      expect(screen.getByTestId('fee-warning')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('fee-warning').textContent).toMatch(
      /unusually high/i,
    );
  });

  it('shows the amber fee warning exactly at the boundary (> 0.1, not >=)', async () => {
    // 0.1 XLM should NOT trigger the warning (threshold is strictly >)
    setupFetch({ estimatedFee: 0.1 });

    renderComponent();

    await waitFor(() =>
      expect(screen.queryByTestId('fee-spinner')).not.toBeInTheDocument(),
    );
    expect(screen.queryByTestId('fee-warning')).not.toBeInTheDocument();

    // 0.1000001 should trigger it
    setupFetch({ estimatedFee: 0.1000001 });
    const { unmount } = renderComponent();
    await waitFor(() =>
      expect(screen.getByTestId('fee-warning')).toBeInTheDocument(),
    );
    unmount();
  });
});

describe('StepConfirm – existing submit flow preserved', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to a fee that resolves quickly and doesn't produce a warning
    setupFetch({ estimatedFee: 0.00001 });
  });

  it('renders the final summary heading', async () => {
    renderComponent();
    expect(screen.getByText('Final Summary')).toBeInTheDocument();
  });

  it('renders the Back and Submit buttons', async () => {
    renderComponent();
    expect(screen.getByText(/← Back/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit Loan Request/i)).toBeInTheDocument();
  });

  it('shows the wallet note', async () => {
    renderComponent();
    expect(screen.getByText(/Clicking submit will open Freighter/i)).toBeInTheDocument();
  });

  it('displays the wizard error when one is set', async () => {
    mockUseWizard.mockReturnValue({ ...defaultWizard, error: 'Some error occurred' });
    mockUseButtonState.mockReturnValue(defaultButtonState);
    render(<StepConfirm walletAddress="GTEST" />);
    expect(screen.getByText('Some error occurred')).toBeInTheDocument();
  });
});
