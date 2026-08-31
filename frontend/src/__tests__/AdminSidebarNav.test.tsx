import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
    localStorage.clear();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
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

  it('renders Color Palette link when present in items', async () => {
    const itemsWithPalette = [...mockItems, { label: 'Color Palette', href: '/docs/colors' }];
    render(<AdminSidebarNav items={itemsWithPalette} />);

    await waitFor(() => {
      const paletteLink = screen.getByText('Color Palette').closest('a');
      expect(paletteLink).toHaveAttribute('href', '/docs/colors');
    });
  });

  it('collapses to icon-only mode on screens < 1024 px by default', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 });
    render(<AdminSidebarNav items={mockItems} />);

    await waitFor(() => {
      const navElement = screen.getByRole('navigation', { name: 'Admin navigation' });
      expect(navElement).toHaveAttribute('data-collapsed', 'true');
    });
  });

  it('toggles collapse state on expand/collapse button click and updates localStorage', async () => {
    render(<AdminSidebarNav items={mockItems} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
    });

    const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      const navElement = screen.getByRole('navigation', { name: 'Admin navigation' });
      expect(navElement).toHaveAttribute('data-collapsed', 'true');
      expect(localStorage.getItem('admin_sidebar_collapsed')).toBe('true');
    });

    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }));

    await waitFor(() => {
      const navElement = screen.getByRole('navigation', { name: 'Admin navigation' });
      expect(navElement).toHaveAttribute('data-collapsed', 'false');
      expect(localStorage.getItem('admin_sidebar_collapsed')).toBe('false');
    });
  });

  it('renders tooltips showing the label when sidebar is collapsed', async () => {
    localStorage.setItem('admin_sidebar_collapsed', 'true');
    render(<AdminSidebarNav items={mockItems} />);

    await waitFor(() => {
      const tooltips = screen.getAllByRole('tooltip');
      expect(tooltips.length).toBe(mockItems.length);
      expect(tooltips[0]).toHaveTextContent('Moderation');
    });
  });

  it('toggles sidebar state via Ctrl+B keyboard shortcut', async () => {
    render(<AdminSidebarNav items={mockItems} />);

    await waitFor(() => {
      const navElement = screen.getByRole('navigation', { name: 'Admin navigation' });
      expect(navElement).toHaveAttribute('data-collapsed', 'false');
    });

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });

    await waitFor(() => {
      const navElement = screen.getByRole('navigation', { name: 'Admin navigation' });
      expect(navElement).toHaveAttribute('data-collapsed', 'true');
    });
  });
});
