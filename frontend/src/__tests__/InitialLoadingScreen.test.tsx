import React from 'react';
import { render, act } from '@testing-library/react';
import InitialLoadingScreen from '@/components/InitialLoadingScreen';

describe('InitialLoadingScreen', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="initial-loading-screen" role="status" aria-label="Loading StellarKraal">
        <svg className="sk-loading-logo"></svg>
      </div>
    `;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  it('adds fade-out class and removes element from DOM after hydration', () => {
    const el = document.getElementById('initial-loading-screen');
    expect(el).toBeInTheDocument();
    expect(el).not.toHaveClass('fade-out');

    render(<InitialLoadingScreen />);

    expect(el).toHaveClass('fade-out');

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(document.getElementById('initial-loading-screen')).toBeNull();
  });
});
