#!/usr/bin/env node
// show me: any screen in any state, out of his sight, as PNGs (and its frames over time).
//   node tests/harness/showme/showme.mjs <surface> [state] [--frames <ms>] [--out <dir>] [--size <w>x<h>]
//   surface: desktop | <file.html>   (state: see showme.spec.ts)
//   e.g.  showme.mjs desktop agent/storefront-5c1d/search
//         showme.mjs desktop inbox --frames 2000
// Prints the folder: shot.png, meta.json, and with --frames frames/NNNN.png + frames.json.
// The desktop surface runs apps/desktop/out: `pnpm build` first.
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const desktop = path.resolve(here, '..', '..', '..');
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const framesMs = Number(flag('--frames') ?? 0) || undefined;
const out = path.resolve(flag('--out') ?? mkdtempSync(path.join(os.tmpdir(), 'showme-')));
const size = flag('--size');
const [surface, state] = args;
if (!surface) {
  console.error('usage: showme.mjs <desktop|file.html> [state] [--frames ms] [--out dir] [--size WxH]');
  process.exit(2);
}
const ask = { surface: surface.endsWith('.html') ? path.resolve(surface) : surface, state, framesMs, out, size };
const r = spawnSync(path.join(desktop, 'node_modules', '.bin', 'playwright'), ['test', '-c', path.join(here, 'showme.config.ts')], {
  cwd: desktop,
  env: { ...process.env, SHOWME: JSON.stringify(ask) },
  stdio: ['ignore', 'inherit', 'inherit'],
});
console.log(r.status === 0 ? `show me: ${out}` : `show me failed (exit ${r.status})`);
process.exit(r.status ?? 1);
