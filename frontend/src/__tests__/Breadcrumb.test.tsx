import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Breadcrumb, { buildCrumbs } from '../components/Breadcrumb';

expect.extend(toHaveNoViolations);

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mutable pathname so each test can set its own value.
let mockPathname = '/dashboard';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
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

// ---------------------------------------------------------------------------
// buildCrumbs unit tests (pure function — no rendering needed)
// ---------------------------------------------------------------------------

describe('buildCrumbs', () => {
  it('returns a single crumb for /dashboard', () => {
    const crumbs = buildCrumbs('/dashboard');
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0]).toEqual({ label: 'Dashboard', href: '/dashboard' });
  });

  it('returns two crumbs for /dashboard/collateral', () => {
    const crumbs = buildCrumbs('/dashboard/collateral');
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0]).toEqual({ label: 'Dashboard', href: '/dashboard' });
    expect(crumbs[1]).toEqual({ label: 'Collateral', href: '/dashboard/collateral' });
  });

  it('returns three crumbs for /dashboard/collateral/abc-123', () => {
    const crumbs = buildCrumbs('/dashboard/collateral/abc-123');
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0]).toEqual({ label: 'Dashboard', href: '/dashboard' });
    expect(crumbs[1]).toEqual({ label: 'Collateral', href: '/dashboard/collateral' });
    expect(crumbs[2]).toEqual({ label: 'abc-123', href: '/dashboard/collateral/abc-123' });
  });

  it('falls back to the raw segment for unknown segments', () => {
    const crumbs = buildCrumbs('/dashboard/unknown-segment');
    expect(crumbs[1].label).toBe('unknown-segment');
  });
});

// ---------------------------------------------------------------------------
// Breadcrumb component rendering tests
// ---------------------------------------------------------------------------

describe('Breadcrumb', () => {
  // -- Hidden on top-level pages --

  it('renders nothing on /dashboard (top-level page)', () => {
    mockPathname = '/dashboard';
    const { container } = render(<Breadcrumb />);
    expect(container.firstChild).toBeNull();
  });

  // -- /dashboard/collateral --

  describe('on /dashboard/collateral', () => {
    beforeEach(() => {
      mockPathname = '/dashboard/collateral';
      render(<Breadcrumb />);
    });

    it('renders a breadcrumb nav', () => {
      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeTruthy();
    });

    it('shows "Dashboard" as a link (not the current page)', () => {
      const link = screen.getByRole('link', { name: 'Dashboard' });
      expect(link).toBeTruthy();
      expect(link).toHaveAttribute('href', '/dashboard');
      expect(link).not.toHaveAttribute('aria-current');
    });

    it('shows "Collateral" as the current page (not a link)', () => {
      // The last segment should NOT be an anchor
      expect(screen.queryByRole('link', { name: 'Collateral' })).toBeNull();
      const current = screen.getByText('Collateral');
      expect(current).toHaveAttribute('aria-current', 'page');
    });
  });

  // -- /dashboard/collateral/abc-123 --

  describe('on /dashboard/collateral/abc-123', () => {
    beforeEach(() => {
      mockPathname = '/dashboard/collateral/abc-123';
      render(<Breadcrumb />);
    });

    it('renders a breadcrumb nav', () => {
      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeTruthy();
    });

    it('shows "Dashboard" as a link to /dashboard', () => {
      const link = screen.getByRole('link', { name: 'Dashboard' });
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('shows "Collateral" as a link to /dashboard/collateral', () => {
      const link = screen.getByRole('link', { name: 'Collateral' });
      expect(link).toHaveAttribute('href', '/dashboard/collateral');
    });

    it('shows the dynamic ID segment as the current page (not a link)', () => {
      expect(screen.queryByRole('link', { name: 'abc-123' })).toBeNull();
      const current = screen.getByText('abc-123');
      expect(current).toHaveAttribute('aria-current', 'page');
    });

    it('does not mark ancestor links with aria-current', () => {
      const dashLink = screen.getByRole('link', { name: 'Dashboard' });
      const colLink = screen.getByRole('link', { name: 'Collateral' });
      expect(dashLink).not.toHaveAttribute('aria-current');
      expect(colLink).not.toHaveAttribute('aria-current');
    });
  });

  // -- Accessibility --

  it('has no axe accessibility violations on /dashboard/collateral', async () => {
    mockPathname = '/dashboard/collateral';
    const { container } = render(<Breadcrumb />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no axe accessibility violations on /dashboard/collateral/abc-123', async () => {
    mockPathname = '/dashboard/collateral/abc-123';
    const { container } = render(<Breadcrumb />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
