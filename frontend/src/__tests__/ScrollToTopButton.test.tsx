/**
 * ScrollToTopButton tests — #563
 *
 * Verifies:
 *   - Hidden at the top of the page
 *   - Appears after scrolling past 300px
 *   - Has aria-label="Scroll to top"
 *   - Clicking scrolls smoothly to the top
 *   - Respects prefers-reduced-motion (instant scroll instead of smooth)
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ScrollToTopButton from '../components/ScrollToTopButton';

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', { value, writable: true, configurable: true });
}

function mockMatchMedia(matches: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({
    matches,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
}

describe('ScrollToTopButton (#563)', () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    setScrollY(0);
    mockMatchMedia(false);
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
  });

  it('is hidden at the top of the page', () => {
    render(<ScrollToTopButton />);
    expect(screen.queryByRole('button', { name: /scroll to top/i })).not.toBeInTheDocument();
  });

  it('appears after scrolling past 300px', () => {
    render(<ScrollToTopButton />);

    setScrollY(301);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(screen.getByRole('button', { name: /scroll to top/i })).toBeInTheDocument();
  });

  it('hides again once scrolled back near the top', () => {
    render(<ScrollToTopButton />);

    setScrollY(500);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(screen.getByRole('button', { name: /scroll to top/i })).toBeInTheDocument();

    setScrollY(0);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(screen.queryByRole('button', { name: /scroll to top/i })).not.toBeInTheDocument();
  });

  it('scrolls smoothly to the top when clicked', () => {
    render(<ScrollToTopButton />);
    setScrollY(400);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    fireEvent.click(screen.getByRole('button', { name: /scroll to top/i }));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('scrolls instantly when prefers-reduced-motion is set', () => {
    mockMatchMedia(true);
    render(<ScrollToTopButton />);
    setScrollY(400);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    fireEvent.click(screen.getByRole('button', { name: /scroll to top/i }));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});
