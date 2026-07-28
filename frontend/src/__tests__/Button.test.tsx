/**
 * Tests for Button loading/disabled states — closes #783
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../components/ui/Button';

expect.extend(toHaveNoViolations);

describe('Button — loading state (isLoading prop) (#783)', () => {
  it('shows a spinner when isLoading=true', () => {
    render(<Button isLoading>Save</Button>);
    // Spinner has role="status" with aria-label="Loading"
    expect(screen.getByRole('status', { name: /loading/i })).toBeTruthy();
  });

  it('is disabled when isLoading=true', () => {
    render(<Button isLoading>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets aria-busy="true" when isLoading=true', () => {
    render(<Button isLoading>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('sets aria-disabled="true" when isLoading=true', () => {
    render(<Button isLoading>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('preserves button width by keeping children in the DOM while loading', () => {
    render(<Button isLoading>Save</Button>);
    // The label text is still rendered (inside a hidden span) to keep width stable
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('hides child text from AT while loading (aria-hidden on span)', () => {
    render(<Button isLoading>Save</Button>);
    const span = screen.getByText('Save').closest('span');
    expect(span?.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not fire click handler when loading', () => {
    const onClick = jest.fn();
    render(<Button isLoading onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('backwards-compat: loading prop also triggers spinner', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('status', { name: /loading/i })).toBeTruthy();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('state=loading also triggers spinner', () => {
    render(<Button state="loading">Save</Button>);
    expect(screen.getByRole('status', { name: /loading/i })).toBeTruthy();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('has no axe violations while loading', async () => {
    const { container } = render(<Button isLoading>Save</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Button — disabled state (#783)', () => {
  it('is disabled when disabled=true', () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets aria-disabled="true" when disabled', () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('applies opacity-50 class when disabled', () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole('button').className).toContain('disabled:opacity-50');
  });

  it('applies cursor-not-allowed class when disabled', () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole('button').className).toContain('disabled:cursor-not-allowed');
  });

  it('does not fire click handler when disabled', () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Submit</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('has no axe violations when disabled', async () => {
    const { container } = render(<Button disabled>Submit</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Button — other states (#783)', () => {
  it('shows children normally in idle state', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeTruthy();
  });

  it('renders primary variant by default', () => {
    render(<Button>OK</Button>);
    expect(screen.getByRole('button').className).toContain('bg-brown-600');
  });

  it('applies fullWidth class', () => {
    render(<Button fullWidth>Wide</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('has no axe violations in idle state', async () => {
    const { container } = render(<Button>Normal</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
