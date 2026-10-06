// pnpm smoke: start the built app (out/) in test mode and wait for its ready
// line, then stop it. Proves the three bundles load together (main, sandboxed
// preload, renderer) without ever showing anything to him: test mode keeps the
// window off-display, inactive and out of the Dock (src/main/index.ts).
// Needs `pnpm build` first. Exit 0 when ready within the timeout, 1 otherwise.
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import electron from 'electron';

const READY_LINE = 'bise-desktop: ready'; // src/shared/api.ts READY_LINE
const TIMEOUT_MS = 30_000;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const child = spawn(String(electron), [root], {
  env: { ...process.env, BISE_DESKTOP_TEST: '1', ELECTRON_RENDERER_URL: '' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let out = '';
let done = false;
const finish = (code, why) => {
  if (done) return;
  done = true;
  clearTimeout(timer);
  child.kill();
  console.log(`smoke: ${why}`);
  process.exit(code);
};
const timer = setTimeout(() => {
  finish(1, `no '${READY_LINE}' within ${TIMEOUT_MS} ms; output:\n${out}`);
}, TIMEOUT_MS);

child.stdout.on('data', (b) => {
  out += String(b);
  if (out.includes(READY_LINE)) finish(0, 'ready');
});
child.stderr.on('data', (b) => {
  out += String(b);
});
child.on('exit', (code) => {
  finish(1, `app exited (${String(code)}) before ready; output:\n${out}`);
});
