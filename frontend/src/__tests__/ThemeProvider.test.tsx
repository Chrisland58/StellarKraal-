import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeProvider, { ThemeScript, useTheme } from '../components/ThemeProvider';

function mockMatchMedia(matchesDark: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: matchesDark,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  });
}

/** Runs the real ThemeScript source against the current jsdom document,
 * the same way the browser would execute it before React hydrates. */
function runThemeScript() {
  const { container } = render(<ThemeScript />);
  const script = container.querySelector('script')!.innerHTML;
  eval(script);
}

describe('ThemeProvider (#572 – hydration)', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('renders children without crashing', () => {
    render(
      <ThemeProvider>
        <span>content</span>
      </ThemeProvider>
    );
    expect(screen.getByText('content')).toBeTruthy();
  });

  it('ThemeScript renders a <script> that manipulates classList, not textContent', () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector('script');
    expect(script).not.toBeNull();
    expect(script!.innerHTML).toContain('classList');
    expect(script!.innerHTML).not.toContain('textContent');
  });
});

// #528: dark mode toggle persistence
describe('ThemeScript (#528 – read-from-storage & system-preference fallback)', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });

  it('applies dark class from a stored "dark" preference, regardless of system preference', () => {
    localStorage.setItem('theme', 'dark');
    mockMatchMedia(false); // system prefers light — stored value should win
    runThemeScript();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('keeps light (no dark class) from a stored "light" preference, even if system prefers dark', () => {
    localStorage.setItem('theme', 'light');
    mockMatchMedia(true); // system prefers dark — stored value should still win
    runThemeScript();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('falls back to system preference (dark) when nothing is stored', () => {
    mockMatchMedia(true);
    runThemeScript();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('falls back to system preference (light) when nothing is stored', () => {
    mockMatchMedia(false);
    runThemeScript();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

describe('ThemeProvider (#528 – reads the class already applied by ThemeScript)', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  function ThemeLabel() {
    const { theme } = useTheme();
    return <span>{theme}</span>;
  }

  it('picks up "dark" when ThemeScript has already applied the class before hydration', () => {
    document.documentElement.classList.add('dark');
    render(
      <ThemeProvider>
        <ThemeLabel />
      </ThemeProvider>
    );
    expect(screen.getByText('dark')).toBeTruthy();
  });

  it('picks up "light" when no class was applied', () => {
    render(
      <ThemeProvider>
        <ThemeLabel />
      </ThemeProvider>
    );
    expect(screen.getByText('light')).toBeTruthy();
  });

  it('writes the toggled preference to localStorage under the "theme" key', () => {
    function ToggleButton() {
      const { toggle } = useTheme();
      return <button onClick={toggle}>toggle</button>;
    }
    render(
      <ThemeProvider>
        <ToggleButton />
      </ThemeProvider>
    );
    fireEvent.click(screen.getByText('toggle'));
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
