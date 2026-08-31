import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import StatusBadge from '../components/StatusBadge';
import type { BadgeStatus } from '../components/StatusBadge';

expect.extend(toHaveNoViolations);

const ALL_STATUSES: BadgeStatus[] = [
  'active',
  'repaid',
  'defaulted',
  'liquidated',
  'available',
  'pledged',
];

describe('StatusBadge', () => {
  test.each(ALL_STATUSES)('renders %s with label and icon', (status) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    // label text is capitalised version of status
    expect(badge).toHaveTextContent(status.charAt(0).toUpperCase() + status.slice(1));
  });

  test('renders unknown status as plain text without crashing', () => {
    render(<StatusBadge status="unknown-state" />);
    expect(screen.getByText('unknown-state')).toBeInTheDocument();
  });

  test.each(ALL_STATUSES)('%s badge has no axe accessibility violations', async (status) => {
    const { container } = render(<StatusBadge status={status} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('icon is hidden from assistive technology', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Status: Active');
  });

  // ── #539: Design token colour tests ─────────────────────────────────────────

  describe('design token colour classes (#539)', () => {
    test('active uses success token colours', () => {
      render(<StatusBadge status="active" />);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('bg-color-success-subtle');
      expect(badge.className).toContain('text-color-success');
    });

    test('repaid uses primary token colours', () => {
      render(<StatusBadge status="repaid" />);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('bg-color-primary');
      expect(badge.className).toContain('text-color-primary');
    });

    test('liquidated uses danger token colours', () => {
      render(<StatusBadge status="liquidated" />);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('bg-color-danger-subtle');
      expect(badge.className).toContain('text-color-danger');
    });

    test('defaulted uses warning token colours', () => {
      render(<StatusBadge status="defaulted" />);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('bg-color-warning-subtle');
      expect(badge.className).toContain('text-color-warning');
    });

    test('available uses success token colours', () => {
      render(<StatusBadge status="available" />);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('bg-color-success-subtle');
      expect(badge.className).toContain('text-color-success');
    });

    test('pledged uses secondary token colours', () => {
      render(<StatusBadge status="pledged" />);
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('text-color-secondary');
    });
  });
});
