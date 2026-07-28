/**
 * Tests for focus-visible styles — closes #782
 *
 * jsdom does not apply CSS, so we verify:
 * - Interactive elements (buttons, links, inputs) are structurally focusable.
 * - The Button has the correct focus-visible Tailwind class.
 * - jest-axe reports no violations on a page with typical interactive elements.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../components/ui/Button';

expect.extend(toHaveNoViolations);

describe('focus-visible styles (#782)', () => {
  it('Button receives focus when tabbed to', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button');
    btn.focus();
    expect(document.activeElement).toBe(btn);
  });

  it('Button has focus-visible Tailwind class in className', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button');
    // Our Button now uses focus-visible:outline-none and focus-visible:ring-2
    expect(btn.className).toContain('focus-visible:outline-none');
    expect(btn.className).toContain('focus-visible:ring-2');
  });

  it('Button does not have a plain focus:outline-none without replacement', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button');
    // Must not suppress focus without a focus-visible alternative
    expect(btn.className).not.toMatch(/\bfocus:outline-none\b(?!.*focus-visible)/);
  });

  it('anchor tags are natively focusable', () => {
    render(<a href="/test">Link</a>);
    const link = screen.getByRole('link');
    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it('input elements are natively focusable', () => {
    render(<input type="text" aria-label="Name" />);
    const input = screen.getByRole('textbox');
    input.focus();
    expect(document.activeElement).toBe(input);
  });

  it('Button has no axe violations (focus-visible compatible)', async () => {
    const { container } = render(<Button>Accessible button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
