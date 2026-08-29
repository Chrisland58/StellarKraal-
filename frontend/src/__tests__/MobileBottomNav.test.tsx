import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import MobileBottomNav from '@/components/MobileBottomNav';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('MobileBottomNav', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('renders all navigation items', () => {
    render(<MobileBottomNav />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Borrow')).toBeInTheDocument();
    expect(screen.getByText('Collateral')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('marks active navigation item', () => {
    render(<MobileBottomNav />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark inactive items as current', () => {
    render(<MobileBottomNav />);

    const borrowLink = screen.getByText('Borrow').closest('a');
    expect(borrowLink).not.toHaveAttribute('aria-current', 'page');
  });

  it('shows active tab label', () => {
    render(<MobileBottomNav />);

    const dashboardLabel = screen.getByText('Dashboard').closest('span');
    expect(dashboardLabel).toHaveClass('block');
  });

  it('hides inactive tab labels', () => {
    render(<MobileBottomNav />);

    const borrowLabel = screen.getByText('Borrow').closest('span');
    expect(borrowLabel).toHaveClass('hidden');
  });

  it('renders icon elements with aria-hidden', () => {
    render(<MobileBottomNav />);

    const icons = document.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBe(4); // One for each nav item
  });

  it('renders as a nav element with proper aria-label', () => {
    render(<MobileBottomNav />);

    const nav = screen.getByRole('navigation', {
      name: 'Mobile bottom navigation',
    });
    expect(nav).toBeInTheDocument();
  });

  it('has fixed bottom positioning', () => {
    const { container } = render(<MobileBottomNav />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
  });

  it('is hidden on md breakpoint (md:hidden)', () => {
    const { container } = render(<MobileBottomNav />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('md:hidden');
  });

  it('uses semantic link elements for navigation', () => {
    render(<MobileBottomNav />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
  });
});
