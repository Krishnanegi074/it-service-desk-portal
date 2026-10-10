import { defineConfig, devices } from '@playwright/test';

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  outputDir: 'test-results/e2e',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      APP_ENV: 'test',
      NEXT_DIST_DIR: '.next-e2e',
      AUTH_DEMO_MODE: 'true',
      AUTH_DEMO_ROLE: 'admin',
      DATABASE_URL: '',
      JIRA_BASE_URL: '',
      JIRA_EMAIL: '',
      JIRA_API_TOKEN: '',
      JIRA_SERVICE_DESK_ID: '',
      JIRA_REQUEST_TYPE_ID: '',
      JIRA_WEBHOOK_SECRET: ''
    }
  }
});
