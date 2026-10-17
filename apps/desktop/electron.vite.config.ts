// The build of bise desktop: three bundles from one config (electron-vite).
//   main      src/main/index.ts     Electron's main process (amb-mac; src/main/core is amb-core's)
//   preload   src/main/preload.ts   the only bridge to the renderer (contextBridge, sandboxed: CommonJS)
//   renderer  src/renderer/         the React app (index.html + main.tsx mount src/app)
// Output goes to out/ (git-ignored); `pnpm start` runs the built app.
// The renderer's bims chunk (src/bims/render + three, loaded by import('./render')) has a budget:
// the build prints its size minified (electron-vite ships the renderer unminified, so the plugin
// minifies a copy with esbuild to measure it) and fails past BIMS_BUDGET (architect m_27495).
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { type Plugin, transformWithEsbuild } from 'vite';

const src = resolve(__dirname, 'src');

const BIMS_BUDGET = 800 * 1024;

// Source maps only in the nightly's coverage-map build (BISE_DESKTOP_SOURCEMAP=1, covmap.mjs run:
// fast-try p2, architect m_29221 #3): V8 sees the bundles, the maps name the source files that ran.
// pnpm build and a release ship none (gate.sh land fails on a .map in out/).
const sourcemap = process.env['BISE_DESKTOP_SOURCEMAP'] === '1';

/** the chunks holding three or src/bims/render: their minified size printed, the build failed past the budget */
function bimsBudget(): Plugin {
  const three = (id: string): boolean => /[/\\]node_modules[/\\]three[/\\]/.test(id);
  const ours = (id: string): boolean => three(id) || id.includes('/src/bims/render/');
  return {
    name: 'bims-budget',
    apply: 'build',
    async generateBundle(_, bundle) {
      let raw = 0;
      let min = 0;
      let gz = 0;
      const names: string[] = [];
      const riders = new Set<string>();
      for (const out of Object.values(bundle)) {
        if (out.type !== 'chunk' || !out.moduleIds.some(ours)) continue;
        if (out.isEntry) this.error(`bims: three is in the entry chunk ${out.fileName}: load it only through import('./render')`);
        const m = await transformWithEsbuild(out.code, out.fileName, { minify: true, loader: 'js' });
        raw += Buffer.byteLength(out.code);
        min += Buffer.byteLength(m.code);
        gz += gzipSync(m.code).length;
        names.push(out.fileName);
        // what rides along that is neither three nor the office's own modules (src/bims/)
        for (const id of out.moduleIds) if (!three(id) && !id.includes('/src/bims/')) riders.add(id.replace(__dirname, '.'));
      }
      if (names.length === 0) {
        this.warn('bims chunk: not in this build (nothing imports src/bims/render yet)');
        return;
      }
      const kb = (n: number): string => `${(n / 1024).toFixed(1)} KB`;
      console.log(`bims chunk: ${kb(min)} minified (${kb(gz)} gzip, ${kb(raw)} as built) of ${kb(BIMS_BUDGET)} (${names.join(', ')})`);
      if (riders.size > 0) console.log(`bims chunk: app modules in it: ${[...riders].join(', ')}`);
      if (min > BIMS_BUDGET) this.error(`bims chunk: ${kb(min)} minified is past its budget of ${kb(BIMS_BUDGET)}`);
    },
  };
}

export default defineConfig({
  main: {
    build: {
      sourcemap,
      rollupOptions: { input: { index: resolve(src, 'main/index.ts') } },
    },
  },
  preload: {
    build: {
      sourcemap,
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
      sourcemap,
      rollupOptions: { input: { index: resolve(src, 'renderer/index.html') } },
    },
  },
});
