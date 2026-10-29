// The proof step: every run proves, from its launch to its end, that the app under test stays out
// of the user's sight (the harness rules: "nothing in his face, ever"). The truth is the window
// server's, never Electron's: BrowserWindow.getBounds() said (-30000,-30000) while macOS had
// clamped the shown window to x=-1160 and a 40 px strip sat on his display (qa-type m_9499).
//   - no window on any display: native/watch.swift samples CGWindowListCopyWindowInfo every 100 ms
//     for every window of the app's pid and its children; kCGWindowIsOnscreen must stay false;
//   - never frontmost: the same sample reads the frontmost app's pid;
//   - no Dock icon: the app's ApplicationType is not Foreground (LSUIElement, see electron.ts);
//   - never focused: no BrowserWindow reports isFocused().
// The first violation calls onViolation at once (launch.ts kills the app: the run stops there).
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import type { ElectronApplication } from '@playwright/test';
import { DESKTOP_DIR } from './electron';

export type OnscreenWindow = { pid: number; x: number; y: number; w: number; h: number };
export type Sample = { t: number; front: number; front_ours: boolean; windows: number; onscreen: OnscreenWindow[] };
export type Proof = { pid: number; applicationType: string; windows: number; samples: number; violations: string[] };

const SOURCE = path.join(__dirname, 'native', 'watch.swift');
const BINARY = path.join(DESKTOP_DIR, '.harness-cache', 'bise-harness-watch');

/** The watcher binary, compiled from native/watch.swift when missing or older than its source. */
export function watcherBinary(): string {
  if (!existsSync(BINARY) || statSync(BINARY).mtimeMs < statSync(SOURCE).mtimeMs) {
    mkdirSync(path.dirname(BINARY), { recursive: true });
    execFileSync('/usr/bin/swiftc', ['-O', SOURCE, '-o', BINARY], { stdio: 'ignore' });
  }
  return BINARY;
}

/** What breaks the rules in one sample (pure). */
export function violationsIn(s: Sample): string[] {
  const out = s.onscreen.map((w) => `a window of pid ${w.pid} is on screen at ${w.x},${w.y} ${w.w}x${w.h}`);
  if (s.front_ours) out.push(`the app (pid ${s.front}) is frontmost`);
  return out;
}

/** Watches the app's windows and the front app for the whole run. */
export class Watch {
  private readonly child: ChildProcess;
  readonly violations: string[] = [];
  samples = 0;
  windows = 0;
  private waiters: (() => void)[] = [];

  constructor(pid: number, onViolation: (why: string) => void) {
    this.child = spawn(watcherBinary(), [String(pid), '100'], { stdio: ['pipe', 'pipe', 'ignore'] });
    const out = this.child.stdout;
    if (!out) throw new Error('watch: no stdout');
    createInterface({ input: out }).on('line', (line) => {
      let s: Sample;
      try { s = JSON.parse(line) as Sample; } catch { return; }
      this.samples++;
      this.windows = Math.max(this.windows, s.windows);
      const bad = violationsIn(s);
      if (bad.length && !this.violations.length) onViolation(bad.join('; '));
      this.violations.push(...bad);
      const w = this.waiters;
      this.waiters = [];
      w.forEach((f) => { f(); });
    });
    this.child.on('exit', () => {
      const w = this.waiters;
      this.waiters = [];
      w.forEach((f) => { f(); });
    });
  }

  /** Resolves after the next sample (or when the watcher ended). */
  next(): Promise<void> {
    if (this.child.exitCode !== null) return Promise.resolve();
    return new Promise((r) => this.waiters.push(r));
  }

  stop(): void {
    this.child.stdin?.end();
    this.child.kill();
  }
}

/** The proof at a point of the run: the watch's samples so far, the Dock and the focus. */
export async function prove(app: ElectronApplication, watch: Watch): Promise<Proof> {
  const pid = app.process().pid ?? -1;
  await watch.next();
  const focused = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().filter((w) => w.isFocused()).map((w) => w.getTitle()));
  let appType = '';
  try { appType = execFileSync('/usr/bin/lsappinfo', ['info', '-only', 'ApplicationType', String(pid)]).toString(); } catch { /* not registered */ }
  const applicationType = /"ApplicationType"="([^"]*)"/.exec(appType)?.[1] ?? 'unknown';
  const violations = [...new Set(watch.violations)];
  if (applicationType === 'Foreground') violations.push('the app has a Dock icon (ApplicationType Foreground)');
  for (const t of focused) violations.push(`window '${t}' is focused`);
  return { pid, applicationType, windows: watch.windows, samples: watch.samples, violations };
}
