'use client';

/**
 * ThemeProvider
 * Reads the user's colorScheme preference from the store and applies
 * it as a data-theme attribute on <html>, which CSS then picks up.
 * 'system' = respects prefers-color-scheme media query (default).
 * 'light' / 'dark' = explicit override regardless of OS setting.
 */

import { useEffect } from 'react';
import { useUserStore } from '@/lib/store/userStore';

export function ThemeProvider() {
  const colorScheme = useUserStore((s) => s.colorScheme);

  useEffect(() => {
    const html = document.documentElement;
    if (colorScheme === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else if (colorScheme === 'light') {
      html.setAttribute('data-theme', 'light');
    } else {
      // 'system' — remove any override and let CSS media query decide
      html.removeAttribute('data-theme');
    }
  }, [colorScheme]);

  return null;
}
