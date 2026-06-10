import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the core-loop e2e. Specs live in the repo-root `e2e/`
 * dir (per AGENTS.md). The dev server is started automatically; the run is
 * validated against a live full stack in integration, not in the unit gate.
 */
export default defineConfig({
  testDir: './test',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
