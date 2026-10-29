// `pnpm test:e2e`: the harness's self-tests (tests/harness/self) and the end-to-end checks
// (tests/checks/<area>). One worker: one off-screen app at a time (battery, and the watch reads
// one app). No browsers are downloaded: every test runs the harness's own Electron (electron.ts).
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '..',
  testMatch: ['harness/self/**/*.spec.ts', 'checks/**/*.spec.ts'],
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  reporter: [['list']],
  outputDir: '../../.harness-cache/results',
});
