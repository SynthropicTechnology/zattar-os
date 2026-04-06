import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  testMatch: [
    '**/__tests__/e2e/**/*.spec.ts',
    '**/testing/e2e/**/*.spec.ts',
  ],
  timeout: 60_000,
  retries: 0,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 14'] },
    },
  ],
});
