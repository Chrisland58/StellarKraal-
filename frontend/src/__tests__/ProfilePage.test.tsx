import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ProfilePage, { buildReferralUrl } from '../app/profile/page';

// Mock wallet hook
jest.mock('../hooks/useWallet', () => ({
  useWallet: () => ({ address: 'GBTEST123WALLETADDRESS' }),
}));

// Mock toast
const mockSuccess = jest.fn();
const mockError = jest.fn();
jest.mock('../components/toast', () => ({
  useToast: () => ({ success: mockSuccess, error: mockError, warning: jest.fn(), info: jest.fn() }),
}));

// Mock fetch globally
const originalFetch = global.fetch;
beforeEach(() => {
  jest.clearAllMocks();
  // Default: profile loads successfully with a display_name
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/api/borrowers/')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            wallet: 'GBTEST123WALLETADDRESS',
            display_name: 'Alice',
            collateral: [],
            loans: [],
          }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
});
afterEach(() => {
  global.fetch = originalFetch;
});

Object.assign(navigator, {
  clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
});

// ─── buildReferralUrl helper ──────────────────────────────────────────────────

describe('ProfilePage (#571 – referral section)', () => {
  it('builds referral URL containing wallet address', () => {
    expect(buildReferralUrl('GABC')).toContain('/register?ref=GABC');
  });

  it('shows Copy Invite Link button when wallet connected', () => {
    render(<ProfilePage />);
    expect(screen.getByRole('button', { name: /copy invite link/i })).toBeTruthy();
  });

  it('shows the referral URL in the page', () => {
    render(<ProfilePage />);
    expect(screen.getByText(/\/register\?ref=GBTEST123WALLETADDRESS/)).toBeTruthy();
  });

  it('shows Copied! feedback after clicking', async () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }));
    await waitFor(() => expect(screen.getByText('Copied!')).toBeTruthy());
  });

  it('copies URL to clipboard', async () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }));
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/register?ref=GBTEST123WALLETADDRESS'),
      ),
    );
  });
});

// ─── Inline display name edit ─────────────────────────────────────────────────

describe('ProfilePage – inline display name edit', () => {
  it('shows Edit button for the display name field', async () => {
    render(<ProfilePage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /edit display name/i })).toBeTruthy());
  });

  it('switches to input mode when Edit is clicked', async () => {
    render(<ProfilePage />);
    await waitFor(() => screen.getByRole('button', { name: /edit display name/i }));
    fireEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    expect(screen.getByRole('textbox', { name: /display name/i })).toBeTruthy();
  });

  it('pre-fills the input with the current display name', async () => {
    render(<ProfilePage />);
    await waitFor(() => screen.getByRole('button', { name: /edit display name/i }));
    fireEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    const input = screen.getByRole('textbox', { name: /display name/i }) as HTMLInputElement;
    expect(input.value).toBe('Alice');
  });

  it('Cancel hides the input without saving', async () => {
    render(<ProfilePage />);
    await waitFor(() => screen.getByRole('button', { name: /edit display name/i }));
    fireEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('textbox', { name: /display name/i })).toBeNull();
  });

  it('shows validation error when name is too short (< 2 chars)', async () => {
    render(<ProfilePage />);
    await waitFor(() => screen.getByRole('button', { name: /edit display name/i }));
    fireEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    const input = screen.getByRole('textbox', { name: /display name/i });
    fireEvent.change(input, { target: { value: 'X' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeTruthy(),
    );
    expect(screen.getByText(/at least 2/i)).toBeTruthy();
  });

  it('shows validation error when name exceeds 40 chars', async () => {
    render(<ProfilePage />);
    await waitFor(() => screen.getByRole('button', { name: /edit display name/i }));
    fireEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    const input = screen.getByRole('textbox', { name: /display name/i });
    fireEvent.change(input, { target: { value: 'A'.repeat(41) } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeTruthy(),
    );
    expect(screen.getByText(/at most 40/i)).toBeTruthy();
  });

  it('calls PATCH /api/v1/profile with the new name on save', async () => {
    const patchMock = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    global.fetch = jest.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (typeof url === 'string' && url.includes('/api/v1/profile')) return patchMock(url, opts);
      if (typeof url === 'string' && url.includes('/api/borrowers/')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ wallet: 'GBTEST123WALLETADDRESS', display_name: 'Alice', collateral: [], loans: [] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<ProfilePage />);
    await waitFor(() => screen.getByRole('button', { name: /edit display name/i }));
    fireEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    const input = screen.getByRole('textbox', { name: /display name/i });
    fireEvent.change(input, { target: { value: 'Bob' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    });
    await waitFor(() =>
      expect(patchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/profile'),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"display_name":"Bob"'),
        }),
      ),
    );
  });

  it('shows success toast after a successful save', async () => {
    render(<ProfilePage />);
    await waitFor(() => screen.getByRole('button', { name: /edit display name/i }));
    fireEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    const input = screen.getByRole('textbox', { name: /display name/i });
    fireEvent.change(input, { target: { value: 'Bob' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    });
    await waitFor(() => expect(mockSuccess).toHaveBeenCalled());
  });

  it('optimistically updates displayed name immediately', async () => {
    render(<ProfilePage />);
    await waitFor(() => screen.getByRole('button', { name: /edit display name/i }));
    fireEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    const input = screen.getByRole('textbox', { name: /display name/i });
    fireEvent.change(input, { target: { value: 'Bob' } });
    // Click save — name should update before the server responds
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    // Name should be visible immediately (optimistic)
    expect(screen.getByText('Bob')).toBeTruthy();
  });

  it('shows error toast and rolls back name when PATCH fails', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/v1/profile')) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Server error' }) });
      }
      if (typeof url === 'string' && url.includes('/api/borrowers/')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ wallet: 'GBTEST123WALLETADDRESS', display_name: 'Alice', collateral: [], loans: [] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<ProfilePage />);
    await waitFor(() => screen.getByRole('button', { name: /edit display name/i }));
    fireEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    const input = screen.getByRole('textbox', { name: /display name/i });
    fireEvent.change(input, { target: { value: 'Bob' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    });
    await waitFor(() => expect(mockError).toHaveBeenCalled());
    // Rolled back to Alice
    expect(screen.getByText('Alice')).toBeTruthy();
  });

  it('saves on Enter key press', async () => {
    render(<ProfilePage />);
    await waitFor(() => screen.getByRole('button', { name: /edit display name/i }));
    fireEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    const input = screen.getByRole('textbox', { name: /display name/i });
    fireEvent.change(input, { target: { value: 'Charlie' } });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });
    await waitFor(() => expect(mockSuccess).toHaveBeenCalled());
  });

  it('cancels on Escape key press', async () => {
    render(<ProfilePage />);
    await waitFor(() => screen.getByRole('button', { name: /edit display name/i }));
    fireEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    const input = screen.getByRole('textbox', { name: /display name/i });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('textbox', { name: /display name/i })).toBeNull();
  });
});
