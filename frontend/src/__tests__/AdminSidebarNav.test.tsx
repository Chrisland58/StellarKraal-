import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import AdminSidebarNav from '@/components/AdminSidebarNav';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('AdminSidebarNav', () => {
  const mockItems = [
    { label: 'Moderation', href: '/admin/moderation' },
    { label: 'Statistics', href: '/admin/statistics' },
    { label: 'Users', href: '/admin/users' },
  ];

  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/admin/moderation');
  });

  it('renders skeleton loaders during auth resolution', () => {
    render(<AdminSidebarNav items={mockItems} />);

    // Skeleton elements should be visible during loading
    const skeletons = document.querySelectorAll('.skeleton-shimmer');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders navigation items after auth resolution', async () => {
    render(<AdminSidebarNav items={mockItems} />);

    // Wait for auth resolution
    await waitFor(
      () => {
        expect(screen.getByText('Moderation')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('marks active navigation item correctly', async () => {
    render(<AdminSidebarNav items={mockItems} />);

    await waitFor(() => {
      const moderationLink = screen.getByText('Moderation').closest('a');
      expect(moderationLink).toHaveAttribute('aria-current', 'page');
    });
  });

  it('does not mark inactive items as current', async () => {
    render(<AdminSidebarNav items={mockItems} />);

    await waitFor(() => {
      const statisticsLink = screen.getByText('Statistics').closest('a');
      expect(statisticsLink).not.toHaveAttribute('aria-current', 'page');
    });
  });

  it('renders navigation with proper styling', async () => {
    render(<AdminSidebarNav items={mockItems} />);

    await waitFor(() => {
      const moderationLink = screen.getByText('Moderation').closest('a');
      expect(moderationLink).toHaveClass('border-gold');
    });
  });
});
