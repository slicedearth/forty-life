import { defineConfig, devices } from '@playwright/test'

const isCI = Boolean(process.env.CI)
const baseURL = 'http://127.0.0.1:4174'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    serviceWorkers: 'allow',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: isCI ? 'npm run preview:test' : 'npm run build && npm run preview:test',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
