import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Navbar from '../components/Navbar';

expect.extend(toHaveNoViolations);

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock next/link
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

describe('Navbar', () => {
  it('renders all four navigation sections with icons and labels', () => {
    render(<Navbar />);
    expect(screen.getAllByRole('link', { name: /dashboard/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /loans/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /collateral/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /settings/i }).length).toBeGreaterThan(0);
  });

  // #781: aria-current="page" is set on the active link
  it('marks the active page with aria-current=page', () => {
    render(<Navbar />);
    const activeLinks = screen.getAllByRole('link', { name: /dashboard/i });
    const desktopActive = activeLinks.find((l) => l.getAttribute('aria-current') === 'page');
    expect(desktopActive).toBeTruthy();
  });

  // #781: inactive links do NOT have aria-current
  it('inactive links do not have aria-current', () => {
    render(<Navbar />);
    const loansLinks = screen.getAllByRole('link', { name: /loans/i });
    const hasAriaCurrent = loansLinks.some((l) => l.getAttribute('aria-current') === 'page');
    expect(hasAriaCurrent).toBe(false);
  });

  // #781: active link uses design token colour (inline style with CSS var)
  it('active link uses a design token colour via inline style', () => {
    render(<Navbar />);
    const activeLinks = screen.getAllByRole('link', { name: /dashboard/i });
    const activeLink = activeLinks.find((l) => l.getAttribute('aria-current') === 'page');
    expect(activeLink).toBeTruthy();
    // The style should reference CSS custom properties (design tokens)
    const style = activeLink!.getAttribute('style') || '';
    expect(style).toMatch(/var\(--token-primary\)/);
  });

  // #781: active indicator — bottom border is set as a CSS rule
  it('active link has border-bottom styling as active indicator', () => {
    render(<Navbar />);
    const activeLinks = screen.getAllByRole('link', { name: /dashboard/i });
    const activeLink = activeLinks.find((l) => l.getAttribute('aria-current') === 'page');
    expect(activeLink).toBeTruthy();
    const classes = activeLink!.className;
    expect(classes).toMatch(/border-b/);
  });

  // Task scenario 1: user wants to view their loans from any page
  it('scenario: user can reach Loans within 1 click from any page', () => {
    render(<Navbar />);
    const loansLink = screen.getAllByRole('link', { name: /loans/i })[0];
    expect(loansLink).toHaveAttribute('href', '/loans');
  });

  // Task scenario 2: user wants to register collateral
  it('scenario: user can reach Collateral within 1 click from any page', () => {
    render(<Navbar />);
    const collateralLink = screen.getAllByRole('link', { name: /collateral/i })[0];
    expect(collateralLink).toHaveAttribute('href', '/collateral');
  });

  // Task scenario 3: user wants to change settings
  it('scenario: user can reach Settings within 1 click from any page', () => {
    render(<Navbar />);
    const settingsLink = screen.getAllByRole('link', { name: /settings/i })[0];
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  it('mobile menu opens and closes on hamburger click', async () => {
    render(<Navbar />);
    // mobile menu is closed initially
    expect(document.getElementById('mobile-menu')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByRole('button', { name: /close menu/i })).toBeTruthy();
    expect(document.getElementById('mobile-menu')).toBeTruthy();
  });

  it('mobile menu closes when a link is clicked', async () => {
    render(<Navbar />);
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
    const mobileMenu = document.getElementById('mobile-menu');
    expect(mobileMenu).toBeTruthy();

    const loansLinks = screen.getAllByRole('link', { name: /loans/i });
    // click the one inside the mobile menu
    await userEvent.click(loansLinks[loansLinks.length - 1]);
    expect(document.getElementById('mobile-menu')).toBeNull();
  });

  // #781: mobile active link also carries aria-current and design tokens
  it('mobile active link has aria-current=page and design token colour', async () => {
    render(<Navbar />);
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }));
    const mobileLinks = screen.getAllByRole('link', { name: /dashboard/i });
    const mobileActive = mobileLinks.find((l) => l.getAttribute('aria-current') === 'page');
    expect(mobileActive).toBeTruthy();
    const style = mobileActive!.getAttribute('style') || '';
    expect(style).toMatch(/var\(--token-primary\)/);
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(<Navbar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
