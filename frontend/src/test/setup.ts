// Vitest setup: extends `expect` with jest-dom matchers and resets the DOM
// between tests. Loaded via vite.config `test.setupFiles`.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  // Clear persisted UI prefs (theme mode, view) so tests stay independent.
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
});
