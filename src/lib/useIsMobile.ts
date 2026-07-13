'use client';

import { useEffect, useState } from 'react';

/**
 * Reactively reports whether the viewport matches a mobile-width media query.
 * SSR-safe: returns false until mounted on the client.
 */
export function useIsMobile(query = '(max-width: 640px)'): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return isMobile;
}
