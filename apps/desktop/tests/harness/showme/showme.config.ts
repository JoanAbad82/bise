// Playwright config for 'show me' only (showme.mts runs it): one test, one worker.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['showme.spec.ts'],
  workers: 1,
  reporter: [['line']],
  outputDir: '../../../.harness-cache/showme-results',
});
