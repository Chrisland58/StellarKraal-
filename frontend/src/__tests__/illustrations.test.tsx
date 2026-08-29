/**
 * Tests for the redesigned brand illustrations — closes #780
 *
 * Verifies:
 * - Each component renders an accessible SVG (role="img" + aria-label).
 * - SVGs contain brand-colour CSS variable references (design token usage).
 * - No jest-axe violations.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  EmptyLoansIllustration,
  EmptyCollateralIllustration,
  EmptyTransactionsIllustration,
} from '../components/illustrations';

expect.extend(toHaveNoViolations);

describe('EmptyLoansIllustration (#780)', () => {
  it('renders with role="img"', () => {
    render(<EmptyLoansIllustration />);
    expect(screen.getByRole('img')).toBeTruthy();
  });

  it('has a descriptive aria-label', () => {
    render(<EmptyLoansIllustration />);
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label')).toBeTruthy();
    expect(svg.getAttribute('aria-label')!.length).toBeGreaterThan(3);
  });

  it('uses design token CSS variables for colour', () => {
    const { container } = render(<EmptyLoansIllustration />);
    const html = container.innerHTML;
    expect(html).toMatch(/var\(--token-/);
  });

  it('does not carry aria-hidden (was wrong before #780)', () => {
    render(<EmptyLoansIllustration />);
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-hidden')).toBeNull();
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(<EmptyLoansIllustration />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('EmptyCollateralIllustration (#780)', () => {
  it('renders with role="img"', () => {
    render(<EmptyCollateralIllustration />);
    expect(screen.getByRole('img')).toBeTruthy();
  });

  it('has a descriptive aria-label', () => {
    render(<EmptyCollateralIllustration />);
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label')).toBeTruthy();
    expect(svg.getAttribute('aria-label')!.length).toBeGreaterThan(3);
  });

  it('uses design token CSS variables for colour', () => {
    const { container } = render(<EmptyCollateralIllustration />);
    const html = container.innerHTML;
    expect(html).toMatch(/var\(--token-/);
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(<EmptyCollateralIllustration />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('EmptyTransactionsIllustration (#780)', () => {
  it('renders with role="img"', () => {
    render(<EmptyTransactionsIllustration />);
    expect(screen.getByRole('img')).toBeTruthy();
  });

  it('has a descriptive aria-label', () => {
    render(<EmptyTransactionsIllustration />);
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label')).toBeTruthy();
    expect(svg.getAttribute('aria-label')!.length).toBeGreaterThan(3);
  });

  it('uses design token CSS variables for colour', () => {
    const { container } = render(<EmptyTransactionsIllustration />);
    const html = container.innerHTML;
    expect(html).toMatch(/var\(--token-/);
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(<EmptyTransactionsIllustration />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
