import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormSuccess from '@/components/FormSuccess';

// ── Mock framer-motion ───────────────────────────────────────────────────────
jest.mock('framer-motion', () => ({
  useReducedMotion: jest.fn().mockReturnValue(false),
}));

// ── Mock next/link ───────────────────────────────────────────────────────────
jest.mock('next/link', () =>
  function MockLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
);

// ── Mock window.focus / scrollIntoView ──────────────────────────────────────
beforeAll(() => {
  window.HTMLElement.prototype.focus = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderSuccess(overrides: Partial<React.ComponentProps<typeof FormSuccess>> = {}) {
  const defaults: React.ComponentProps<typeof FormSuccess> = {
    title: 'Collateral Registered!',
    summary: <p>Collateral ID: col-999</p>,
    onSubmitAnother: jest.fn(),
    ...overrides,
  };
  return render(<FormSuccess {...defaults} />);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('FormSuccess', () => {
  describe('rendering', () => {
    it('renders the title', () => {
      renderSuccess();
      expect(screen.getByRole('heading', { name: 'Collateral Registered!' })).toBeInTheDocument();
    });

    it('renders the summary content', () => {
      renderSuccess({ summary: <p>Collateral ID: col-abc</p> });
      expect(screen.getByText('Collateral ID: col-abc')).toBeInTheDocument();
    });

    it('renders a "Submit Another" button with default label', () => {
      renderSuccess();
      expect(screen.getByRole('button', { name: 'Submit Another' })).toBeInTheDocument();
    });

    it('renders a custom submitAnotherLabel', () => {
      renderSuccess({ submitAnotherLabel: 'Register More' });
      expect(screen.getByRole('button', { name: 'Register More' })).toBeInTheDocument();
    });

    it('renders a "View Details" link when viewDetailsHref is provided', () => {
      renderSuccess({ viewDetailsHref: '/collateral/col-999', viewDetailsLabel: 'View Collateral' });
      const link = screen.getByRole('link', { name: 'View Collateral' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/collateral/col-999');
    });

    it('renders a "View Details" button when onViewDetails callback is provided', () => {
      const onViewDetails = jest.fn();
      renderSuccess({ onViewDetails, viewDetailsLabel: 'Open Loan' });
      expect(screen.getByRole('button', { name: 'Open Loan' })).toBeInTheDocument();
    });

    it('does not render a View Details element when neither href nor callback is provided', () => {
      renderSuccess();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      // Only one button — Submit Another
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    it('has role="status" for live region announcement', () => {
      renderSuccess();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders an SVG checkmark', () => {
      const { container } = renderSuccess();
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders keyframe <style> tag when motion is not reduced', () => {
      const { container } = renderSuccess();
      expect(container.querySelector('style')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onSubmitAnother when "Submit Another" is clicked', () => {
      const onSubmitAnother = jest.fn();
      renderSuccess({ onSubmitAnother });
      fireEvent.click(screen.getByRole('button', { name: 'Submit Another' }));
      expect(onSubmitAnother).toHaveBeenCalledTimes(1);
    });

    it('calls onViewDetails callback when "View Details" button is clicked', () => {
      const onViewDetails = jest.fn();
      renderSuccess({ onViewDetails, viewDetailsLabel: 'View Details' });
      fireEvent.click(screen.getByRole('button', { name: 'View Details' }));
      expect(onViewDetails).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('heading receives focus on mount', () => {
      renderSuccess();
      const heading = screen.getByRole('heading', { name: 'Collateral Registered!' });
      expect(window.HTMLElement.prototype.focus).toHaveBeenCalled();
      // tabIndex=-1 allows programmatic focus
      expect(heading).toHaveAttribute('tabindex', '-1');
    });

    it('status container has aria-live="polite"', () => {
      renderSuccess();
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('status container has aria-atomic="true"', () => {
      renderSuccess();
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-atomic', 'true');
    });

    it('SVG decoration has aria-hidden="true"', () => {
      const { container } = renderSuccess();
      // The wrapping div around the SVG should be aria-hidden
      const svgWrapper = container.querySelector('[aria-hidden="true"]');
      expect(svgWrapper).toBeInTheDocument();
    });
  });

  describe('prefers-reduced-motion', () => {
    it('does not render <style> keyframes when motion is reduced', async () => {
      const { useReducedMotion } = jest.requireMock('framer-motion');
      useReducedMotion.mockReturnValue(true);

      const { container } = renderSuccess();
      expect(container.querySelector('style')).not.toBeInTheDocument();

      // restore
      useReducedMotion.mockReturnValue(false);
    });
  });

  describe('loan success variant', () => {
    it('renders loan-specific summary content', () => {
      renderSuccess({
        title: 'Loan Requested!',
        summary: (
          <div>
            <p>Loan ID: loan-42</p>
            <p>Amount: 50000 stroops</p>
          </div>
        ),
        viewDetailsHref: '/loans',
        viewDetailsLabel: 'View My Loans',
      });
      expect(screen.getByRole('heading', { name: 'Loan Requested!' })).toBeInTheDocument();
      expect(screen.getByText('Loan ID: loan-42')).toBeInTheDocument();
      expect(screen.getByText('Amount: 50000 stroops')).toBeInTheDocument();
      const link = screen.getByRole('link', { name: 'View My Loans' });
      expect(link).toHaveAttribute('href', '/loans');
    });
  });
});
