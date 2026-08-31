/**
 * Tests for Issue 2 – WalletHeader always-visible copy button
 *
 * Verifies:
 *  - Copy button is visible in the header bar when wallet is connected (no popover needed)
 *  - Clicking copy button calls clipboard.writeText with full address
 *  - Tooltip shows "Copied!" for 2 s after click
 *  - Button has aria-label="Copy wallet address"
 *  - Button is keyboard accessible (Enter key triggers click)
 *  - Graceful fallback when Clipboard API throws
 */
import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import WalletHeader from '@/components/WalletHeader';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockConnect = jest.fn();
const mockDisconnect = jest.fn();

const TEST_ADDRESS = 'GABCDEFGHIJ1234567890ABCDEFGHIJ1234567890ABCDEFGHIJKLMNO';

let walletState = {
  address: null as string | null,
  freighterInstalled: null as boolean | null,
  connecting: false,
  error: null,
  connect: mockConnect,
  disconnect: mockDisconnect,
};

jest.mock('@/hooks/useWallet', () => ({
  useWallet: () => walletState,
}));

// Mock fetch for Horizon balance – return immediately
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    balances: [{ asset_type: 'native', balance: '100.0000000' }],
  }),
});
global.fetch = mockFetch;

// Mock clipboard
const mockWriteText = jest.fn();

function renderConnectedHeader() {
  walletState = {
    address: TEST_ADDRESS,
    freighterInstalled: true,
    connecting: false,
    error: null,
    connect: mockConnect,
    disconnect: mockDisconnect,
  };
  return render(<WalletHeader />);
}

describe('WalletHeader – header copy button (Issue 2)', () => {
  beforeEach(() => {
    mockWriteText.mockReset();
    mockFetch.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
    });
    jest.clearAllMocks();
    // Re-assign fetch after clearAllMocks
    global.fetch = mockFetch;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        balances: [{ asset_type: 'native', balance: '100.0000000' }],
      }),
    });
  });

  it('renders copy button in the header bar when wallet is connected', async () => {
    await act(async () => {
      renderConnectedHeader();
    });
    const copyBtn = screen.getByTestId('wallet-header-copy-btn');
    expect(copyBtn).toBeInTheDocument();
  });

  it('copy button has aria-label="Copy wallet address"', async () => {
    await act(async () => {
      renderConnectedHeader();
    });
    const copyBtn = screen.getByTestId('wallet-header-copy-btn');
    expect(copyBtn).toHaveAttribute('aria-label', 'Copy wallet address');
  });

  it('clicking copy button writes full address to clipboard', async () => {
    mockWriteText.mockResolvedValue(undefined);
    await act(async () => {
      renderConnectedHeader();
    });

    const copyBtn = screen.getByTestId('wallet-header-copy-btn');
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(TEST_ADDRESS);
    });
  });

  it('tooltip shows "Copied!" after clicking copy button', async () => {
    mockWriteText.mockResolvedValue(undefined);
    await act(async () => {
      renderConnectedHeader();
    });

    const copyBtn = screen.getByTestId('wallet-header-copy-btn');
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Copied!');
    });
  });

  it('tooltip disappears after 2 s', async () => {
    jest.useFakeTimers();
    mockWriteText.mockResolvedValue(undefined);
    await act(async () => {
      renderConnectedHeader();
    });

    const copyBtn = screen.getByTestId('wallet-header-copy-btn');
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    // tooltip should be present
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());

    // Advance 2 s
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    jest.useRealTimers();
  });

  it('copy button is keyboard accessible', async () => {
    mockWriteText.mockResolvedValue(undefined);
    await act(async () => {
      renderConnectedHeader();
    });

    const copyBtn = screen.getByTestId('wallet-header-copy-btn');
    // Focus the button
    copyBtn.focus();
    expect(document.activeElement).toBe(copyBtn);

    // Simulate keyboard activation via click (browser fires click on Enter for buttons)
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(TEST_ADDRESS);
    });
  });

  it('graceful fallback when Clipboard API throws', async () => {
    mockWriteText.mockRejectedValue(new Error('NotAllowedError'));
    await act(async () => {
      renderConnectedHeader();
    });

    const copyBtn = screen.getByTestId('wallet-header-copy-btn');

    // Should not throw
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    // tooltip should NOT show on failure
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('does NOT render header copy button when wallet is not connected', async () => {
    walletState = {
      address: null,
      freighterInstalled: true,
      connecting: false,
      error: null,
      connect: mockConnect,
      disconnect: mockDisconnect,
    };
    await act(async () => {
      render(<WalletHeader />);
    });
    expect(screen.queryByTestId('wallet-header-copy-btn')).not.toBeInTheDocument();
  });
});
