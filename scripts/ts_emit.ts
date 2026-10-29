// The committed JS of a TS area (js-to-ts, architect m_40557): each file a tsconfig names is
// transpiled alone (tsc's own transpiler, no bundling, a classic script stays classic) next to its
// source, .ts -> .js, .mts -> .mjs, .cts -> .cjs, behind a banner that says it is generated. The
// types are the area's typecheck (tsc -p <config> --noEmit); this only writes what runs. Committed
// because what runs it (Chrome, Electron, the hub's page server, Vercel) never runs node.
//
//   node scripts/ts_emit.ts <tsconfig.json>...          write the emitted files
//   node scripts/ts_emit.ts <tsconfig.json>... --check  exit 1 when one differs (the gate's lane)
//
// typescript comes from the config's folder up (apps/desktop's), else office/sdk's (its owner for
// kit, kit/office, the extension and site). Node runs this by type stripping (gate.sh's
// TS_NODE_OPTIONS before node 22.18).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type TS = typeof import("typescript");

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const configs = process.argv.slice(2).filter((a) => a !== "--check");
if (configs.length === 0) {
  console.error("usage: node scripts/ts_emit.ts <tsconfig.json>... [--check]");
  process.exit(2);
}

/** typescript as the config's folder resolves it, else office/sdk's. */
function typescriptFor(config: string): TS {
  for (const from of [config, join(root, "office", "sdk", "package.json")]) {
    try {
      const ts: TS = createRequire(resolve(from))("typescript");
      return ts;
    } catch { /* the next one */ }
  }
  throw new Error(`no typescript for ${config}: pnpm -C office/sdk install`);
}

/** The emitted file's path: the source's, its extension mapped. */
export function outPath(src: string): string {
  if (src.endsWith(".d.ts")) throw new Error(`a declaration file has no output: ${src}`);
  if (src.endsWith(".mts")) return src.slice(0, -4) + ".mjs";
  if (src.endsWith(".cts")) return src.slice(0, -4) + ".cjs";
  if (src.endsWith(".ts")) return src.slice(0, -3) + ".js";
  throw new Error(`not a .ts/.mts/.cts source: ${src}`);
}

/** The banner, after a shebang when there is one (it must stay the first line). */
export function withBanner(js: string, source: string): string {
  const banner = `// generated from ${source} by scripts/ts_emit.ts: never hand-edited (edit the .ts, then run it)\n`;
  if (js.startsWith("#!")) {
    const nl = js.indexOf("\n");
    return js.slice(0, nl + 1) + banner + js.slice(nl + 1);
  }
  return banner + js;
}

let stale = 0, written = 0;
for (const config of configs) {
  const ts = typescriptFor(config);
  const read = ts.readConfigFile(config, (p) => ts.sys.readFile(p));
  if (read.error) throw new Error(ts.flattenDiagnosticMessageText(read.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, dirname(resolve(config)));
  // transpile alone, as written: no type positions left, nothing else changed
  const options = { ...parsed.options, noEmit: false, declaration: false, sourceMap: false, inlineSourceMap: false, removeComments: false };
  for (const src of parsed.fileNames.filter((f) => !f.endsWith(".d.ts"))) {
    const out = outPath(src);
    const rel = relative(dirname(out), src);
    const js = withBanner(ts.transpileModule(readFileSync(src, "utf8"), { compilerOptions: options, fileName: src }).outputText, rel);
    const now = existsSync(out) ? readFileSync(out, "utf8") : null;
    if (now === js) continue;
    if (check) { stale++; console.error(`stale: ${relative(root, out)} (node scripts/ts_emit.ts ${relative(root, resolve(config))})`); }
    else { writeFileSync(out, js); written++; console.log(`wrote ${relative(root, out)}`); }
  }
}
if (check && stale) process.exit(1);
if (!check) console.log(`${written} file(s) written`);
