'use client';
import { useEffect, useState } from 'react';

export type Density = 'compact' | 'comfortable' | 'spacious';

const DENSITY_KEY = 'sk_density';
const DEFAULT_DENSITY: Density = 'comfortable';

/** Valid density values, exported for use in the selector. */
export const DENSITY_OPTIONS: Density[] = ['compact', 'comfortable', 'spacious'];

/**
 * Reads / writes the user's preferred UI density.
 * The value is persisted in localStorage and applied as a `data-density`
 * attribute on `<html>` so that global CSS rules can apply padding/font-size
 * adjustments across all list views and tables.
 */
export function useDensity() {
  const [density, setDensityState] = useState<Density>(DEFAULT_DENSITY);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(DENSITY_KEY) as Density | null;
    if (stored && (DENSITY_OPTIONS as string[]).includes(stored)) {
      setDensityState(stored);
      document.documentElement.setAttribute('data-density', stored);
    }
  }, []);

  function setDensity(next: Density) {
    setDensityState(next);
    localStorage.setItem(DENSITY_KEY, next);
    document.documentElement.setAttribute('data-density', next);
  }

  return { density, setDensity };
}
