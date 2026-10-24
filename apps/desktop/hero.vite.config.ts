// The build of bise.dev/desktop's hero town (src/hero): `pnpm build:hero` writes
// ../../site/desktop/hero/ (the static site serves it as is): hero.js, the small entry the page
// loads, and film-<hash>.js, the chunk with three, the town's renderer, the maps and the film,
// loaded only when the town nears the screen. Minified, no source maps. The build prints both
// sizes (gzip) and fails past their budgets: the entry is the first paint's cost, the film's is
// the wait before the town moves. `pnpm hero` serves src/hero/index.html to try it.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { defineConfig, type Plugin } from 'vite';
import { MAP_IDS } from './src/bims/maps/ids';
import { FILM_MAPS } from './src/hero/film-maps';

const src = resolve(__dirname, 'src');
const out = resolve(__dirname, '../../site/desktop/hero');

/** gzip budgets, bytes */
const ENTRY_BUDGET = 6 * 1024;
// 260 until the cozy offices (bims-cozy 39b0e932c: every map's base pieces, +12 KB gzip): far under
// designer's ceiling of 1.5 MB all in (m_30837); the next step down is loading only the film's maps.
// 290 since main grew 279 -> 284.5 KB with the workshop pods, town light and town paths (main m_35420)
const FILM_BUDGET = 290 * 1024;

/** the maps' registries and table: the only modules that may import a map's file or list every map */
const REGISTRIES = ['bims/maps/index.ts', 'bims/render/maps/index.ts', 'bims/maps/ids.ts'].map((f) => resolve(src, f));
/** what lists every map (a picker, a loop over the registry): a stub would show there */
const ALL_MAPS = /\b(MAP_IDS|PLANS|LOOKS|readyMaps)\b/;

/**
 * The film's cast list (src/hero/film-maps.ts FILM_MAPS, architect m_39026): only the maps the film
 * shows go into film.js (main m_39011). Every other map's plan (src/bims/maps/<id>.ts) builds as a
 * stub with the same value exports: its plan not ready, so planOf draws the loft, the rest
 * undefined; its look (src/bims/render/maps/<id>.ts) the same, its look the loft's, never asked
 * for. The build fails when a map file has an export the stub cannot mirror (export *, default,
 * a list), when it lacks its `<id>` export, when a module outside the registries imports one, or
 * when one outside them lists every map. The app's build keeps them all, and this is no fix for
 * the app's own bims chunk: there the next map lazy-loads the looks first, with no more budget
 * raises (architect m_39026).
 */
function filmMaps(): Plugin {
  const others = MAP_IDS.filter((id) => !(FILM_MAPS as readonly string[]).includes(id));
  const stubbed = new Set<string>();
  const stubOf = (file: string, m: string, plan: boolean): string => {
    const real = readFileSync(file, 'utf8');
    const odd = /^export\s+(\*|default\b|\{)/m.exec(real);
    if (odd) throw new Error(`hero-film-maps: ${file} has '${odd[0]}', a stub can't mirror it`);
    const names = [...real.matchAll(/^export\s+(?:declare\s+)?(?:const|let|var|function\*?|async\s+function|class|enum)\s+([A-Za-z_$][\w$]*)/gm)].map((x) => x[1] ?? '');
    if (!names.includes(m)) throw new Error(`hero-film-maps: ${file} has no 'export const ${m}' to stub`);
    const own = plan
      ? `export const ${m} = { id: '${m}', ready: false, layout: () => { throw new Error('${m}: not in the film'); }, things: [] };`
      : `import { loft } from './loft';\nexport const ${m} = loft;`;
    return [own, ...names.filter((n) => n !== m).map((n) => `export const ${n} = undefined;`)].join('\n');
  };
  return {
    name: 'hero-film-maps',
    apply: 'build',
    load(id) {
      const file = id.split('?')[0] ?? id;
      for (const m of others) {
        for (const [dir, plan] of [['bims/maps', true], ['bims/render/maps', false]] as const) {
          if (file !== resolve(src, dir, `${m}.ts`)) continue;
          stubbed.add(file);
          return stubOf(file, m, plan);
        }
      }
      return null;
    },
    buildEnd() {
      for (const id of this.getModuleIds()) {
        const info = this.getModuleInfo(id);
        if (!info || !id.startsWith(src)) continue;
        if (stubbed.has(id)) {
          const by = info.importers.filter((i) => !REGISTRIES.includes(i) && !stubbed.has(i));
          if (by.length > 0) this.error(`hero-film-maps: ${id} is not in the film, yet ${by.join(', ')} imports it`);
        } else if (!REGISTRIES.includes(id) && !stubbed.has(id) && !id.endsWith('.css') && ALL_MAPS.test(info.code ?? '')) {
          this.error(`hero-film-maps: ${id} lists every map (${ALL_MAPS.exec(info.code ?? '')?.[0]}): in the film it would reach a stub`);
        }
      }
    },
  };
}

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
  plugins: [filmMaps(), budget()],
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
        // stable names: the page preloads film.js in its <head> (design's hero-entry §1); kiln.js is
        // the shop of scenario A's end (kiln-app), loaded by the entry a few seconds before it rises
        chunkFileNames: (c) => (c.name === 'kiln' ? 'kiln.js' : 'film.js'),
        format: 'es',
      },
    },
  },
});
