import React from 'react';
import { act, render, screen } from '@testing-library/react';
import OfflineBanner from '../components/OfflineBanner';
import { ToastProvider, ToastContainer } from '../components/toast';

function renderWithToast(ui: React.ReactElement) {
  return render(
    <ToastProvider>
      {ui}
      <ToastContainer />
    </ToastProvider>
  );
}

describe('OfflineBanner', () => {
  afterEach(() => {
    // Restore navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  it('renders banner when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    renderWithToast(<OfflineBanner />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/You are offline/)).toBeTruthy();
  });

  it('does not render banner when navigator.onLine is true', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    renderWithToast(<OfflineBanner />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('banner disappears when online event fires', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    renderWithToast(<OfflineBanner />);
    expect(screen.getByText(/You are offline/)).toBeTruthy();

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });

    // The banner itself is gone — a separate "Reconnected" toast (also role="alert")
    // may now be visible, so assert on the banner's own text rather than the role.
    expect(screen.queryByText(/You are offline/)).toBeNull();
  });

  it('has aria-live assertive region', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    renderWithToast(<OfflineBanner />);
    const banner = screen.getByRole('alert');
    expect(banner.getAttribute('aria-live')).toBe('assertive');
  });

  describe('reconnection (#535)', () => {
    it("shows a 'Reconnected' toast when coming back online", () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      renderWithToast(<OfflineBanner />);

      act(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
        window.dispatchEvent(new Event('online'));
      });

      expect(screen.getByText('Reconnected')).toBeInTheDocument();
    });

    it("does not show a 'Reconnected' toast on initial mount while online", () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      renderWithToast(<OfflineBanner />);

      expect(screen.queryByText('Reconnected')).not.toBeInTheDocument();
    });

    it("does not show a 'Reconnected' toast while still offline", () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      renderWithToast(<OfflineBanner />);

      expect(screen.queryByText('Reconnected')).not.toBeInTheDocument();
    });
  });
});
