import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OnboardingChecklist from '../components/OnboardingChecklist';

const STORAGE_KEY = 'stellarkraal_onboarding_checklist';

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders all three checklist steps', () => {
    render(<OnboardingChecklist hasWallet={false} hasCollateral={false} hasLoan={false} />);
    expect(screen.getByText('Connect wallet')).toBeTruthy();
    expect(screen.getByText('Add collateral')).toBeTruthy();
    expect(screen.getByText('Request loan')).toBeTruthy();
  });

  it('shows unchecked circles for incomplete steps', () => {
    const { container } = render(
      <OnboardingChecklist hasWallet={false} hasCollateral={false} hasLoan={false} />,
    );
    // Should have 3 empty circles (border only)
    const emptyCircles = container.querySelectorAll('div[class*="border-2"]');
    expect(emptyCircles.length).toBe(3);
  });

  it('marks wallet step complete when hasWallet is true', () => {
    const { container } = render(
      <OnboardingChecklist hasWallet={true} hasCollateral={false} hasLoan={false} />,
    );
    // A completed step renders a filled SVG check circle instead of an empty div
    const svgIcons = container.querySelectorAll('svg');
    // One for dismiss button, one for the completed step = at least 2 SVGs
    expect(svgIcons.length).toBeGreaterThan(1);
  });

  it('applies line-through styling to completed steps', () => {
    const { container } = render(
      <OnboardingChecklist hasWallet={true} hasCollateral={false} hasLoan={false} />,
    );
    const walletLabel = container.querySelector('span.line-through');
    expect(walletLabel).toBeTruthy();
    expect(walletLabel?.textContent).toBe('Connect wallet');
  });

  it('shows success banner when all steps are complete', () => {
    render(<OnboardingChecklist hasWallet={true} hasCollateral={true} hasLoan={true} />);
    expect(screen.getByText(/All done/i)).toBeTruthy();
  });

  it('dismisses the checklist when dismiss button is clicked', () => {
    render(<OnboardingChecklist hasWallet={false} hasCollateral={false} hasLoan={false} />);
    const dismissButton = screen.getByLabelText('Dismiss checklist');
    fireEvent.click(dismissButton);

    expect(screen.queryByText('Getting Started')).toBeNull();
  });

  it('persists dismissal state in localStorage', () => {
    render(<OnboardingChecklist hasWallet={false} hasCollateral={false} hasLoan={false} />);
    const dismissButton = screen.getByLabelText('Dismiss checklist');
    fireEvent.click(dismissButton);

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.dismissed).toBe(true);
  });

  it('does not render when dismissed state is loaded from localStorage', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dismissed: true, steps: { wallet: false, collateral: false, loan: false } }),
    );
    const { container } = render(
      <OnboardingChecklist hasWallet={false} hasCollateral={false} hasLoan={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('persists step completion state in localStorage', () => {
    const { rerender } = render(
      <OnboardingChecklist hasWallet={false} hasCollateral={false} hasLoan={false} />,
    );
    rerender(<OnboardingChecklist hasWallet={true} hasCollateral={false} hasLoan={false} />);

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.steps.wallet).toBe(true);
    expect(parsed.steps.collateral).toBe(false);
    expect(parsed.steps.loan).toBe(false);
  });

  it('auto-dismisses after 3 seconds when all steps are complete', async () => {
    jest.useFakeTimers();
    render(<OnboardingChecklist hasWallet={true} hasCollateral={true} hasLoan={true} />);
    expect(screen.getByText('Getting Started')).toBeTruthy();

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText('Getting Started')).toBeNull();
    });

    jest.useRealTimers();
  });
});
