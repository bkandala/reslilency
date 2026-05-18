// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the reslilency project.
 * Tests are kept under tests/ and use a local static file server.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Reporter to use */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    /* Base URL allows using relative paths like page.goto('/tests/fixtures/...') */
    baseURL: 'http://localhost:3001',

    /* Collect traces when retrying a failed test */
    trace: 'on-first-retry',
  },

  /* Static file server – serves the whole project root */
  webServer: {
    command: 'node tests/server.js',
    url: 'http://localhost:3001/health',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
