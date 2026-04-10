// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for Tracking Link API Tests
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: false,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Reporter to use - ONLY ALLURE */
  reporter: [
    ['allure-playwright', { 
      outputFolder: 'allure-results',
      detail: true,
      suiteTitle: true,
      links: {
        issue: {
          urlTemplate: 'https://github.com/issues/%s'
        }
      },
      environmentInfo: {
        'Test Environment': 'Staging',
        'Brand': 'laz-vegas-casino',
        'Website': 'https://sp.athena-stageworker.xyz',
        'Back Office': 'https://nextwork-staging.web.app/sales/brands/edit/1513'
      }
    }],
    ['list'] // Keep list for terminal output
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.TEST_WEBSITE || 'https://sp.athena-stageworker.xyz',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Test timeout */
  timeout: 60000,
  expect: {
    timeout: 10000
  },
});
