import React from 'react';
import { render, screen } from '@testing-library/react';
import MaintenancePage from '../app/maintenance/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('MaintenancePage', () => {
  it('renders maintenance heading and status message', () => {
    render(<MaintenancePage />);
    expect(screen.getByRole('heading', { name: /under maintenance/i })).toBeTruthy();
    expect(screen.getByText(/StellarKraal is currently undergoing scheduled maintenance/i)).toBeTruthy();
  });

  it('shows return time from env var', () => {
    const original = process.env.NEXT_PUBLIC_MAINTENANCE_RETURN_TIME;
    process.env.NEXT_PUBLIC_MAINTENANCE_RETURN_TIME = 'Back by 5 PM';
    render(<MaintenancePage />);
    expect(screen.getByText('Back by 5 PM')).toBeTruthy();
    process.env.NEXT_PUBLIC_MAINTENANCE_RETURN_TIME = original;
  });

  it('links to the status page', () => {
    const original = process.env.NEXT_PUBLIC_STATUS_PAGE_URL;
    process.env.NEXT_PUBLIC_STATUS_PAGE_URL = 'https://status.example.com';
    render(<MaintenancePage />);
    const link = screen.getByRole('link', { name: /status page/i });
    expect(link).toHaveAttribute('href', 'https://status.example.com');
    expect(link).toHaveAttribute('target', '_blank');
    process.env.NEXT_PUBLIC_STATUS_PAGE_URL = original;
  });

  it('shows contact email', () => {
    render(<MaintenancePage />);
    expect(screen.getByText('support@stellarkraal.io')).toBeTruthy();
  });
});
