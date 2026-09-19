import { defineConfig } from '@playwright/test';

// The library is all DOM, layout and animation, so the tests drive a real browser.
// A jsdom suite would pass while the toast was invisible or the dialog uncentred.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:8080',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx http-server -p 8080 -c-1 --silent .',
    url: 'http://127.0.0.1:8080/tests/fixture.html',
    reuseExistingServer: !process.env.CI,
  },
});
