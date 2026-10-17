// Unit and component tests: `pnpm test` runs every src/**/*.test.ts(x) next
// to its code. Node by default; a component test opts into the DOM with a
// first-line `// @vitest-environment happy-dom`. End-to-end checks are
// Playwright's (tests/, `pnpm test:e2e`), never here. The feature tests
// (tests/feature/*.feature.test.ts, fast-try p5) run here too: typed inputs
// in, a screen's view and the sent commands out, in milliseconds.
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/feature/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
    // the window's keep starts empty for every test (src/test-setup.ts)
    setupFiles: ['src/test-setup.ts'],
  },
});
