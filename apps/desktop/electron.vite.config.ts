// The build of bise desktop: three bundles from one config (electron-vite).
//   main      src/main/index.ts     Electron's main process (amb-mac; src/main/core is amb-core's)
//   preload   src/main/preload.ts   the only bridge to the renderer (contextBridge, sandboxed: CommonJS)
//   renderer  src/renderer/         the React app (index.html + main.tsx mount src/app)
// Output goes to out/ (git-ignored); `pnpm start` runs the built app.
// The renderer's bims chunk (src/bims/render + three, loaded by import('./render')) has a budget:
// the build prints its size and fails past BIMS_BUDGET (architect m_27495).
import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

const src = resolve(__dirname, 'src');

const BIMS_BUDGET = 800 * 1024;

/** the chunks holding three or src/bims/render: their size printed, the build failed past the budget */
function bimsBudget(): Plugin {
  const ours = (id: string): boolean => /[/\\]node_modules[/\\]three[/\\]/.test(id) || id.includes('/src/bims/render/');
  return {
    name: 'bims-budget',
    apply: 'build',
    generateBundle(_, bundle) {
      let bytes = 0;
      const names: string[] = [];
      for (const out of Object.values(bundle)) {
        if (out.type !== 'chunk' || !out.moduleIds.some(ours)) continue;
        if (out.isEntry) this.error(`bims: three is in the entry chunk ${out.fileName}: load it only through import('./render')`);
        bytes += Buffer.byteLength(out.code);
        names.push(out.fileName);
      }
      if (names.length === 0) {
        this.warn('bims chunk: not in this build (nothing imports src/bims/render yet)');
        return;
      }
      const kb = (n: number): string => `${(n / 1024).toFixed(1)} KB`;
      console.log(`bims chunk: ${kb(bytes)} minified of ${kb(BIMS_BUDGET)} (${names.join(', ')})`);
      if (bytes > BIMS_BUDGET) this.error(`bims chunk: ${kb(bytes)} is past its budget of ${kb(BIMS_BUDGET)}`);
    },
  };
}

export default defineConfig({
  main: {
    build: {
      rollupOptions: { input: { index: resolve(src, 'main/index.ts') } },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: { index: resolve(src, 'main/preload.ts') },
        output: { format: 'cjs' },
      },
    },
  },
  renderer: {
    root: resolve(src, 'renderer'),
    resolve: { alias: { '@': src } },
    plugins: [react(), bimsBudget()],
    build: {
      rollupOptions: { input: { index: resolve(src, 'renderer/index.html') } },
    },
  },
});
