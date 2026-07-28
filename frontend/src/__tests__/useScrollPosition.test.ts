import { renderHook } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { useScrollPosition } from '@/hooks/useScrollPosition';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

describe('useScrollPosition', () => {
  let scrollPositionMap: { [key: string]: number } = {};

  beforeEach(() => {
    // Mock sessionStorage
    const store: { [key: string]: string } = {};
    const mockSessionStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key]);
      },
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
    });

    // Reset scroll position
    (usePathname as jest.Mock).mockReturnValue('/test-page');
    scrollPositionMap = {};
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('saves scroll position on scroll event', () => {
    renderHook(() => useScrollPosition());

    // Simulate scrolling
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    window.dispatchEvent(new Event('scroll'));

    const stored = sessionStorage.getItem('scroll-position-map');
    expect(stored).toBeTruthy();
    const data = JSON.parse(stored || '{}');
    expect(data['/test-page']).toBe(100);
  });

  it('saves to sessionStorage on scroll', () => {
    renderHook(() => useScrollPosition());

    Object.defineProperty(window, 'scrollY', { value: 250, writable: true });
    window.dispatchEvent(new Event('scroll'));

    const stored = sessionStorage.getItem('scroll-position-map');
    expect(stored).toBeTruthy();
  });

  it('handles navigation to different pages', () => {
    const { rerender } = renderHook(() => useScrollPosition());

    // First page
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    window.dispatchEvent(new Event('scroll'));

    // Navigate to second page
    (usePathname as jest.Mock).mockReturnValue('/another-page');
    rerender();

    Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
    window.dispatchEvent(new Event('scroll'));

    const stored = sessionStorage.getItem('scroll-position-map');
    const data = JSON.parse(stored || '{}');
    expect(data['/test-page']).toBe(100);
    expect(data['/another-page']).toBe(200);
  });

  it('does not restore scroll on fresh page visits (zero position)', () => {
    // Set up a saved position
    sessionStorage.setItem(
      'scroll-position-map',
      JSON.stringify({ '/test-page': 0 })
    );

    const scrollToSpy = jest.spyOn(window, 'scrollTo');
    renderHook(() => useScrollPosition());

    // Should not scroll since position is 0 (fresh visit)
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it('restores scroll on back navigation with saved position', (done) => {
    // Pre-populate with a saved scroll position
    sessionStorage.setItem(
      'scroll-position-map',
      JSON.stringify({ '/test-page': 150 })
    );

    const scrollToSpy = jest.spyOn(window, 'scrollTo');
    renderHook(() => useScrollPosition());

    // Check after timeout to allow for the effect to run
    setTimeout(() => {
      expect(scrollToSpy).toHaveBeenCalledWith(0, 150);
      done();
    }, 10);
  });

  it('removes scroll event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useScrollPosition());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      expect.objectContaining({ passive: true })
    );
  });

  it('uses passive scroll listener for performance', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    renderHook(() => useScrollPosition());

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      expect.objectContaining({ passive: true })
    );
  });
});
