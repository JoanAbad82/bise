// Unit and component tests: `pnpm test` runs every src/**/*.test.ts(x) next
// to its code. Node by default; a component test opts into the DOM with a
// first-line `// @vitest-environment happy-dom`. End-to-end checks are
// Playwright's (tests/, `pnpm test:e2e`), never here.
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
    passWithNoTests: true,
  },
});
