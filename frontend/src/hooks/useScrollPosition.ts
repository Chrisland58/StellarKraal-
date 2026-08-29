import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface ScrollPositionState {
  [key: string]: number;
}

const SCROLL_POSITION_KEY = 'scroll-position-map';

export function useScrollPosition() {
  const pathname = usePathname();
  const router = useRouter();
  const scrollPositionsRef = useRef<ScrollPositionState>({});

  // Initialize scroll positions from sessionStorage
  if (typeof window !== 'undefined' && Object.keys(scrollPositionsRef.current).length === 0) {
    const stored = sessionStorage.getItem(SCROLL_POSITION_KEY);
    if (stored) {
      scrollPositionsRef.current = JSON.parse(stored);
    }
  }

  // Save scroll position before navigation
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      scrollPositionsRef.current[pathname] = scrollY;

      // Save to sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          SCROLL_POSITION_KEY,
          JSON.stringify(scrollPositionsRef.current)
        );
      }
    };

    const scrollElement = typeof window !== 'undefined' ? window : null;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [pathname]);

  // Restore scroll position on mount (only for back navigation)
  useEffect(() => {
    // Use a small delay to ensure layout is complete
    const timer = setTimeout(() => {
      const savedPosition = scrollPositionsRef.current[pathname];

      // Only restore if we have a saved position and it's not zero (first visit)
      if (savedPosition !== undefined && savedPosition > 0) {
        window.scrollTo(0, savedPosition);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname]);
}

// Alternative hook for individual components that need scroll restoration
export function useScrollRestoration(elementRef: React.RefObject<HTMLElement>) {
  const pathname = usePathname();
  const scrollPositionsRef = useRef<ScrollPositionState>({});

  // Initialize scroll positions from sessionStorage
  if (typeof window !== 'undefined' && Object.keys(scrollPositionsRef.current).length === 0) {
    const stored = sessionStorage.getItem(SCROLL_POSITION_KEY);
    if (stored) {
      scrollPositionsRef.current = JSON.parse(stored);
    }
  }

  // Save scroll position of specific element
  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    const handleScroll = () => {
      const key = `${pathname}-scroll`;
      scrollPositionsRef.current[key] = element.scrollTop;

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          SCROLL_POSITION_KEY,
          JSON.stringify(scrollPositionsRef.current)
        );
      }
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [pathname, elementRef]);

  // Restore scroll position of specific element
  useEffect(() => {
    if (!elementRef.current) return;

    const timer = setTimeout(() => {
      const key = `${pathname}-scroll`;
      const savedPosition = scrollPositionsRef.current[key];

      if (savedPosition !== undefined && savedPosition > 0) {
        elementRef.current?.scrollTo(0, savedPosition);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname, elementRef]);
}
