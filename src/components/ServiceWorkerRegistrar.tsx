'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker for offline support. Runs only in production
 * builds (the dev server has no sw.js and SW caching would confuse HMR).
 * The path/scope are basePath-aware for GitHub Pages sub-path deploys.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const bp = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const swUrl = `${bp}/sw.js`;
    const scope = `${bp}/`;

    const register = () => {
      navigator.serviceWorker.register(swUrl, { scope }).catch(() => {
        /* offline or unsupported — app still works, just without SW caching */
      });
    };

    if (document.readyState === 'complete') register();
    else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
