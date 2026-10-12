import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 30000, use: { baseURL: 'http://127.0.0.1:4300/portfolio-v2/', launchOptions: process.env.PORTFOLIO_BROWSER ? { executablePath: process.env.PORTFOLIO_BROWSER } : {}, screenshot: 'only-on-failure' },
  webServer: { command: 'node scripts/serve-static.mjs', url: 'http://127.0.0.1:4300/portfolio-v2/', reuseExistingServer: !process.env.CI },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }]
});
