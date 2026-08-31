'use client';

import { useEffect } from 'react';

/**
 * InitialLoadingScreen — closes #839
 * Client component that triggers the fade-out transition of the inline SVG loading
 * screen once React hydrates, then safely removes it from the DOM.
 */
export default function InitialLoadingScreen() {
  useEffect(() => {
    const el = document.getElementById('initial-loading-screen');
    if (el) {
      el.classList.add('fade-out');
      const timer = setTimeout(() => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}
