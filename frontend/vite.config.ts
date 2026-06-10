/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite + Vitest config. Vitest runs functional component tests in a jsdom
// environment (Testing Library) with GraphQL mocked at the Apollo client
// boundary. Playwright e2e specs under /e2e are excluded from the unit run.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // `@/` resolves to `src/` so cross-cutting modules import the same way from
    // any depth (shared by Vite, Vitest, tsc, and the ESLint TS resolver).
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/test/**'],
    // MUI transition components import react-transition-group via a directory
    // specifier that Node's ESM resolver rejects; inlining lets Vite resolve it.
    server: {
      deps: {
        inline: [
          'react-transition-group',
          '@mui/material',
          '@mui/system',
          '@mui/utils',
          '@mui/base',
          '@mui/icons-material',
          '@mui/private-theming',
          '@mui/styled-engine',
          '@emotion/react',
          '@emotion/styled',
        ],
      },
    },
  },
});
