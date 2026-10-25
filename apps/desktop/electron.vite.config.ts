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
import type { Rollup } from 'vite';
type OutputChunk = Rollup.OutputChunk;

const src = resolve(__dirname, 'src');

// 800 -> 860 KB with the climbing gym (809.7 KB minified, 230.0 KB gzip; architect m_38149). The last
// raise for a map: the next map lazy-loads the looks first (render/maps/index.ts LOOKS split per map),
// so the chunk stops growing with every map.
const BIMS_BUDGET = 860 * 1024;
// The plugins place's objects (src/plugins/render.ts: three, the view, every office object), loaded
// only when the place shows (plug-desktop p7).
const PLUGINS_BUDGET = 760 * 1024;

// Source maps only in the nightly's coverage-map build (BISE_DESKTOP_SOURCEMAP=1, covmap.mjs run:
// fast-try p2, architect m_29221 #3): V8 sees the bundles, the maps name the source files that ran.
// pnpm build and a release ship none (gate.sh land fails on a .map in out/).
const sourcemap = process.env['BISE_DESKTOP_SOURCEMAP'] === '1';

/**
 * What each three-loading door costs: the chunks that import('./render') of the office loads (its
 * chunk and every chunk it imports, the entry aside) against BIMS_BUDGET, and the same for the
 * plugins place's objects (src/plugins/render.ts) against PLUGINS_BUDGET. Each one's minified size
 * printed, the build failed past its budget, or when three lands in the entry chunk.
 */
function bimsBudget(): Plugin {
  const three = (id: string): boolean => /[/\\]node_modules[/\\]three[/\\]/.test(id);
  // render/objects/ids.ts is three-free and made for the entry chunk (the plugins' objects, a prefs pick)
  const threeFree = (id: string): boolean => id.endsWith('/src/bims/render/objects/ids.ts');
  const ours = (id: string): boolean => three(id) || (id.includes('/src/bims/render/') && !threeFree(id));
  const doors = [
    { name: 'bims chunk', facade: '/src/bims/render/index.ts', budget: BIMS_BUDGET },
    { name: 'plugins objects chunk', facade: '/src/plugins/render.ts', budget: PLUGINS_BUDGET },
  ];
  return {
    name: 'bims-budget',
    apply: 'build',
    async generateBundle(_, bundle) {
      const chunks = new Map<string, OutputChunk>();
      for (const out of Object.values(bundle)) {
        if (out.type !== 'chunk') continue;
        chunks.set(out.fileName, out);
        if (out.isEntry && out.moduleIds.some(ours)) this.error(`bims: three is in the entry chunk ${out.fileName}: load it only through import('./render')`);
      }
      const kb = (n: number): string => `${(n / 1024).toFixed(1)} KB`;
      for (const door of doors) {
        const top = [...chunks.values()].find((c) => c.facadeModuleId?.endsWith(door.facade) === true);
        if (top === undefined) {
          this.warn(`${door.name}: not in this build (nothing imports ${door.facade} yet)`);
          continue;
        }
        // the door's chunk and what it imports, the entry aside (it is loaded already)
        const load = new Set<string>();
        const walk = (c: OutputChunk): void => {
          if (c.isEntry || load.has(c.fileName)) return;
          load.add(c.fileName);
          for (const f of c.imports) {
            const d = chunks.get(f);
            if (d !== undefined) walk(d);
          }
        };
        walk(top);
        let raw = 0;
        let min = 0;
        let gz = 0;
        const riders = new Set<string>();
        for (const f of load) {
          const out = chunks.get(f);
          if (out === undefined) continue;
          const m = await transformWithEsbuild(out.code, out.fileName, { minify: true, loader: 'js' });
          raw += Buffer.byteLength(out.code);
          min += Buffer.byteLength(m.code);
          gz += gzipSync(m.code).length;
          // what rides along that is neither three nor the office's own modules (src/bims/)
          for (const id of out.moduleIds) if (!three(id) && !id.includes('/src/bims/')) riders.add(id.replace(__dirname, '.'));
        }
        console.log(`${door.name}: ${kb(min)} minified (${kb(gz)} gzip, ${kb(raw)} as built) of ${kb(door.budget)} (${[...load].join(', ')})`);
        if (riders.size > 0) console.log(`${door.name}: app modules in it: ${[...riders].join(', ')}`);
        if (min > door.budget) this.error(`${door.name}: ${kb(min)} minified is past its budget of ${kb(door.budget)}`);
      }
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
