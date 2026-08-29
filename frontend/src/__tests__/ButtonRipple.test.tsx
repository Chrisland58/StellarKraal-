/**
 * Button ripple effect tests — #809
 *
 * Verifies:
 *   - A .ripple-wave element is injected on pointerdown for primary buttons
 *   - Duration / class / positioning attributes
 *   - Ripple is NOT injected when button is disabled or loading
 *   - Ripple is NOT injected when prefers-reduced-motion is set
 *   - Non-primary variants do NOT get the btn-ripple class
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button';

// Helper to fire a pointerdown at a specific coordinate
function pointerDown(el: Element, x = 50, y = 50) {
  fireEvent.pointerDown(el, { clientX: x, clientY: y, bubbles: true });
}

describe('Button — ripple effect (#809)', () => {
  describe('primary variant', () => {
    it('has the btn-ripple class', () => {
      render(<Button variant="primary">Click</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-ripple');
    });

    it('injects a .ripple-wave element on pointerdown', () => {
      render(<Button variant="primary">Click</Button>);
      const btn = screen.getByRole('button');

      // Mock getBoundingClientRect
      jest.spyOn(btn, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, width: 120, height: 40,
        right: 120, bottom: 40, x: 0, y: 0, toJSON: () => ({}),
      });

      pointerDown(btn, 60, 20);
      expect(btn.querySelector('.ripple-wave')).not.toBeNull();
    });

    it('ripple-wave has explicit width and height styles', () => {
      render(<Button variant="primary">Click</Button>);
      const btn = screen.getByRole('button');

      jest.spyOn(btn, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, width: 120, height: 40,
        right: 120, bottom: 40, x: 0, y: 0, toJSON: () => ({}),
      });

      pointerDown(btn, 60, 20);
      const wave = btn.querySelector('.ripple-wave') as HTMLElement;
      expect(wave.style.width).toBeTruthy();
      expect(wave.style.height).toBeTruthy();
    });

    it('does NOT inject ripple when button is disabled', () => {
      render(<Button variant="primary" disabled>Click</Button>);
      const btn = screen.getByRole('button');
      pointerDown(btn);
      expect(btn.querySelector('.ripple-wave')).toBeNull();
    });

    it('does NOT inject ripple when isLoading=true', () => {
      render(<Button variant="primary" isLoading>Click</Button>);
      const btn = screen.getByRole('button');
      pointerDown(btn);
      expect(btn.querySelector('.ripple-wave')).toBeNull();
    });

    it('does NOT inject ripple when prefers-reduced-motion is set', () => {
      // Override matchMedia to simulate reduced-motion preference
      const original = window.matchMedia;
      window.matchMedia = jest.fn().mockReturnValue({
        matches: true,
        addListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      render(<Button variant="primary">Click</Button>);
      const btn = screen.getByRole('button');

      jest.spyOn(btn, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, width: 120, height: 40,
        right: 120, bottom: 40, x: 0, y: 0, toJSON: () => ({}),
      });

      pointerDown(btn, 60, 20);
      expect(btn.querySelector('.ripple-wave')).toBeNull();

      window.matchMedia = original;
    });
  });

  describe('non-primary variants', () => {
    it.each(['secondary', 'ghost', 'danger'] as const)(
      '%s variant does NOT have the btn-ripple class',
      (variant) => {
        render(<Button variant={variant}>Click</Button>);
        expect(screen.getByRole('button')).not.toHaveClass('btn-ripple');
      }
    );
  });

  describe('custom onPointerDown callback', () => {
    it('still calls a custom onPointerDown handler', () => {
      const handler = jest.fn();
      render(<Button variant="primary" onPointerDown={handler}>Click</Button>);
      const btn = screen.getByRole('button');
      jest.spyOn(btn, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, width: 120, height: 40,
        right: 120, bottom: 40, x: 0, y: 0, toJSON: () => ({}),
      });
      pointerDown(btn);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
