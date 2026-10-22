// Unit and component tests: `pnpm test` runs every src/**/*.test.ts(x) next
// to its code. Node by default; a component test opts into the DOM with a
// first-line `// @vitest-environment happy-dom`. End-to-end checks are
// Playwright's (tests/, `pnpm test:e2e`), never here. The feature tests
// (tests/feature/*.feature.test.ts, fast-try p5) run here too: typed inputs
// in, a screen's view and the sent commands out, in milliseconds.
import { availableParallelism } from 'node:os';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  test: {
    // tests/checks/**/*.test.ts: a check's pure helpers (composer/still.ts); the checks are *.spec.ts
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/feature/**/*.test.ts', 'tests/checks/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
    // the window's keep starts empty for every test (src/test-setup.ts)
    setupFiles: ['src/test-setup.ts'],
    // at most 4 workers, half the cpus on a small machine: the gate runs this while the heavy
    // slots are busy (load 25 on 12 cpus), and 11 workers there starve each other's RPC to the
    // runner ('Timeout calling onTaskUpdate', -43's gate). 4 runs as fast here: the long bims
    // files set the wall time, and they yield between worlds (lying, walklaw, parkpath tests).
    maxWorkers: Math.max(1, Math.min(4, Math.floor(availableParallelism() / 2))),
  },
});
