// The build of bise.dev/desktop's hero town (src/hero): `pnpm build:hero` writes
// ../../site/desktop/hero/ (the static site serves it as is): hero.js, the small entry the page
// loads, and film-<hash>.js, the chunk with three, the town's renderer, the maps and the film,
// loaded only when the town nears the screen. Minified, no source maps. The build prints both
// sizes (gzip) and fails past their budgets: the entry is the first paint's cost, the film's is
// the wait before the town moves. `pnpm hero` serves src/hero/index.html to try it.
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { defineConfig, type Plugin } from 'vite';

const src = resolve(__dirname, 'src');
const out = resolve(__dirname, '../../site/desktop/hero');

/** gzip budgets, bytes */
const ENTRY_BUDGET = 6 * 1024;
const FILM_BUDGET = 260 * 1024;

function budget(): Plugin {
  return {
    name: 'hero-budget',
    apply: 'build',
    generateBundle(_, bundle) {
      const kb = (n: number): string => `${(n / 1024).toFixed(1)} KB`;
      for (const o of Object.values(bundle)) {
        if (o.type !== 'chunk') continue;
        const gz = gzipSync(o.code).length;
        const max = o.isEntry ? ENTRY_BUDGET : FILM_BUDGET;
        console.log(`hero: ${o.fileName} ${kb(Buffer.byteLength(o.code))} minified, ${kb(gz)} gzip (budget ${kb(max)})`);
        if (gz > max) this.error(`hero: ${o.fileName} is ${kb(gz)} gzip, past its budget of ${kb(max)}`);
      }
    },
  };
}

export default defineConfig({
  root: resolve(src, 'hero'),
  resolve: { alias: { '@': src } },
  plugins: [budget()],
  build: {
    outDir: out,
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    minify: 'esbuild',
    modulePreload: false,
    rollupOptions: {
      input: { hero: resolve(src, 'hero/hero.ts') },
      preserveEntrySignatures: 'exports-only',
      output: {
        entryFileNames: '[name].js',
        // a stable name: the page preloads it in its <head> (design's hero-entry §1)
        chunkFileNames: 'film.js',
        format: 'es',
      },
    },
  },
});
