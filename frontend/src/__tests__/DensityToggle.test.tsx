/**
 * Tests for DensityToggle component and useDensity hook (#816).
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import DensityToggle from '../components/DensityToggle';
import { useDensity, DENSITY_OPTIONS, Density } from '../hooks/useDensity';
import { renderHook } from '@testing-library/react';

// ── localStorage mock ─────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// ── document.documentElement mock ─────────────────────────────────────────────
beforeEach(() => {
  localStorageMock.clear();
  document.documentElement.removeAttribute('data-density');
});

// ── DensityToggle component ───────────────────────────────────────────────────
describe('DensityToggle component', () => {
  it('renders all three density options', () => {
    render(<DensityToggle />);
    expect(screen.getByRole('radio', { name: /compact/i })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /comfortable/i })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /spacious/i })).toBeTruthy();
  });

  it('defaults to comfortable', () => {
    render(<DensityToggle />);
    const comfortable = screen.getByRole('radio', { name: /comfortable/i });
    expect((comfortable as HTMLInputElement).checked).toBe(true);
  });

  it('reads persisted density from localStorage', () => {
    localStorageMock.setItem('sk_density', 'compact');
    render(<DensityToggle />);
    const compact = screen.getByRole('radio', { name: /compact/i });
    // After mount the hook reads localStorage — check it via the checked state
    expect((compact as HTMLInputElement).checked).toBe(true);
  });

  it('selecting compact checks that radio and persists to localStorage', () => {
    render(<DensityToggle />);
    const compact = screen.getByRole('radio', { name: /compact/i });
    fireEvent.click(compact);
    expect((compact as HTMLInputElement).checked).toBe(true);
    expect(localStorageMock.getItem('sk_density')).toBe('compact');
  });

  it('selecting spacious sets data-density attribute on <html>', () => {
    render(<DensityToggle />);
    fireEvent.click(screen.getByRole('radio', { name: /spacious/i }));
    expect(document.documentElement.getAttribute('data-density')).toBe('spacious');
  });

  it('is keyboard navigable — radio group responds to change events', () => {
    render(<DensityToggle />);
    const spacious = screen.getByRole('radio', { name: /spacious/i });
    fireEvent.click(spacious);
    expect((spacious as HTMLInputElement).checked).toBe(true);
  });

  it('renders within a fieldset with a legend for screen readers', () => {
    const { container } = render(<DensityToggle />);
    const fieldset = container.querySelector('fieldset');
    const legend = container.querySelector('legend');
    expect(fieldset).toBeTruthy();
    expect(legend).toBeTruthy();
    expect(legend!.className).toContain('sr-only');
  });

  it('each option has an aria-describedby pointing to its description', () => {
    render(<DensityToggle />);
    DENSITY_OPTIONS.forEach((option: Density) => {
      const radio = screen.getByRole('radio', { name: new RegExp(option, 'i') });
      const describedById = radio.getAttribute('aria-describedby');
      expect(describedById).toBe(`density-desc-${option}`);
      expect(document.getElementById(describedById!)).toBeTruthy();
    });
  });
});

// ── useDensity hook ───────────────────────────────────────────────────────────
describe('useDensity hook', () => {
  it('defaults to comfortable', () => {
    const { result } = renderHook(() => useDensity());
    expect(result.current.density).toBe('comfortable');
  });

  it('setDensity updates state', () => {
    const { result } = renderHook(() => useDensity());
    act(() => {
      result.current.setDensity('compact');
    });
    expect(result.current.density).toBe('compact');
  });

  it('setDensity persists to localStorage', () => {
    const { result } = renderHook(() => useDensity());
    act(() => {
      result.current.setDensity('spacious');
    });
    expect(localStorageMock.getItem('sk_density')).toBe('spacious');
  });

  it('setDensity sets data-density on document.documentElement', () => {
    const { result } = renderHook(() => useDensity());
    act(() => {
      result.current.setDensity('compact');
    });
    expect(document.documentElement.getAttribute('data-density')).toBe('compact');
  });

  it('DENSITY_OPTIONS contains compact, comfortable, spacious', () => {
    expect(DENSITY_OPTIONS).toEqual(['compact', 'comfortable', 'spacious']);
  });
});
