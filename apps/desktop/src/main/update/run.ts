// The app's own updates (bar S.6), the shell; owner: amb-mac. The core says
// a newer app is on bise's release channel (app_update {version, url,
// sha256}: bise_home::release decided); here, one download at a time into
// <userData>/updates, its sha256, `ditto -x -k`, then `codesign --verify
// --deep --strict` against the running app's own designated requirement
// (fail closed on any codesign error), the quarantine cleared: then the
// window hears {state:'ready', version}. Only his click installs it: the core
// stops (the hubs are their own processes and keep every agent), the bundle
// is swapped (swap.ts: a write-ahead record first, then current →
// <name>.app.old, the new one in place, rolled back on any error), and the
// app starts again from the new bundle. .old stays until the new app ran and
// said so (plan.ts startup); a new app that never did is offered a way back,
// on his click.
//
// The folder next to the bundle is the updater's alone: `<name>.app.old` is
// its own only when swap.json names it; any other .old (a launcher's copy) is
// 'stray': left on disk, never offered, never deleted (architect m_18352).
//
// Test mode: never his bundle or a real feed. BISE_DESKTOP_UPDATE_TARGET
// names a fake .app inside the test HOME, only a local feed (file://,
// http://127.0.0.1) is read, and the relaunch is a stdout line, never done.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, readFileSync } from 'node:fs';
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { app, net } from 'electron';
import { RELAUNCH_LINE, UPDATE_LINE, UPDATE_TARGET_ENV, type UpdateState } from '../../shared/api';
import { inside } from '../testhome';
import { bundleOf, designated, leftovers, localFeed, readSwap, readVersion, startup, zipName, type AppBuild } from './plan';
import { swapIn, writeRecord } from './swap';

const run = promisify(execFile);

/** What the updater needs from the rest of main. */
export interface UpdateDeps {
  readonly testMode: boolean;
  /** a command to the core (core/ipc.ts sendToCore): false when none runs */
  readonly send: (cmd: unknown) => boolean;
  /** the state to every window */
  readonly broadcast: (s: UpdateState) => void;
  readonly stopCore: () => void;
}

/** The bundle this run may update: the running app's (packed), the test's fake one, or none (an unpacked dev run). */
export function updateTarget(testMode: boolean, env: Readonly<Record<string, string | undefined>>, packaged: boolean, execPath: string): string | null {
  if (testMode) {
    const t = env[UPDATE_TARGET_ENV] ?? '';
    const home = env['HOME'] ?? '';
    return t.endsWith('.app') && home !== '' && inside(t, home) ? t : null;
  }
  return packaged ? bundleOf(execPath) : null;
}

/** How often app_version may go out again on the core's prefs (each core start sends them). */
const RESEND_MS = 10 * 60 * 1000;

export class Updates {
  private state: UpdateState = { state: 'none' };
  /** the checked new .app, waiting for his click */
  private staged: string | null = null;
  /** a download runs (one at a time) */
  private busy = false;
  private sentAt = 0;
  private first = false;
  private readonly build: AppBuild | null;

  constructor(
    private readonly target: string,
    private readonly dir: string,
    private readonly d: UpdateDeps,
  ) {
    this.build = (() => {
      try {
        return readVersion(readFileSync(join(target, 'Contents', 'Resources', 'VERSION'), 'utf8'));
      } catch {
        return null;
      }
    })();
  }

  now(): UpdateState {
    return this.state;
  }

  /** At start: the leftovers of a cut download go, then the last swap's follow-up. */
  async start(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    for (const n of leftovers(await readdir(this.dir))) await rm(join(this.dir, n), { recursive: true, force: true });
    const recFile = join(this.dir, 'swap.json');
    const rec = existsSync(recFile) ? readSwap(readFileSync(recFile, 'utf8')) : null;
    const old = `${this.target}.old`;
    switch (startup(old, existsSync(old), rec)) {
      case 'stray':
        console.log(`update: ${old} is not this updater's (no swap record names it): left as is`);
        break;
      case 'forget':
        await rm(recFile, { force: true });
        break;
      case 'confirmed':
        await rm(old, { recursive: true, force: true });
        await rm(recFile, { force: true });
        break;
      case 'first':
        if (rec !== null) await writeRecord(recFile, { ...rec, attempts: 1 });
        this.first = true;
        break;
      case 'went_bad':
        this.set({ state: 'went_bad', version: rec?.to_version ?? '' });
        break;
      case 'none':
        break;
    }
  }

  /** The app runs (its window loaded, its core answered): a first start after a swap is confirmed, .old goes. */
  async started(): Promise<void> {
    if (!this.first) return;
    this.first = false;
    await rm(`${this.target}.old`, { recursive: true, force: true });
    await rm(join(this.dir, 'swap.json'), { force: true });
  }

  /** The core's events: its prefs mean it runs (it asks the channel), app_update an offer. */
  onCoreEvent(ev: Record<string, unknown>): void {
    if (ev['ev'] === 'prefs') {
      void this.started();
      this.askCore();
      return;
    }
    if (ev['ev'] !== 'app_update') return;
    const { version, url, sha256 } = ev as { version?: unknown; url?: unknown; sha256?: unknown };
    if (typeof version !== 'string' || typeof url !== 'string' || typeof sha256 !== 'string') return;
    void this.fetch(version, url, sha256);
  }

  /** The window asks again (a reload): the core reads the channel again. */
  askCore(force = false): void {
    if (this.build === null) return;
    const t = Date.now();
    if (!force && t - this.sentAt < RESEND_MS) return;
    if (this.d.send({ cmd: 'app_version', id: this.build.id, ...(this.build.built !== undefined ? { built: this.build.built } : {}) })) this.sentAt = t;
  }

  private set(s: UpdateState): void {
    this.state = s;
    if (this.d.testMode) process.stdout.write(`${UPDATE_LINE} ${JSON.stringify(s)}\n`);
    this.d.broadcast(s);
  }

  private async fetch(version: string, url: string, sha256: string): Promise<void> {
    const s = this.state;
    if (this.busy || ((s.state === 'ready' || s.state === 'went_bad') && s.version === version)) return;
    if (this.d.testMode && !localFeed(url)) {
      this.set({ state: 'failed', version, why: 'a test run reads only a local feed' });
      return;
    }
    this.busy = true;
    this.set({ state: 'downloading', version });
    const zip = join(this.dir, zipName(version));
    const unpack = join(this.dir, `unpack-${basename(zip, '.zip')}`);
    try {
      await download(url, `${zip}.part`, sha256);
      await rename(`${zip}.part`, zip);
      await rm(unpack, { recursive: true, force: true });
      await run('/usr/bin/ditto', ['-x', '-k', zip, unpack]);
      const apps = (await readdir(unpack)).filter((n) => n.endsWith('.app'));
      if (apps.length !== 1) throw new Error(`the zip holds ${apps.length} apps`);
      const next = join(unpack, apps[0] ?? '');
      await this.checkSigned(next);
      await run('/usr/bin/xattr', ['-dr', 'com.apple.quarantine', next]).catch(() => undefined);
      await rm(zip, { force: true });
      this.staged = next;
      this.set({ state: 'ready', version });
    } catch (e) {
      await rm(`${zip}.part`, { force: true });
      await rm(unpack, { recursive: true, force: true });
      this.set({ state: 'failed', version, why: e instanceof Error ? e.message : String(e) });
    } finally {
      this.busy = false;
    }
  }

  /** The new app is signed and meets the running app's own designated requirement (same signer, same id); any codesign error refuses it. */
  private async checkSigned(next: string): Promise<void> {
    const out = await run('/usr/bin/codesign', ['-d', '-r-', this.target]).then(
      (r) => `${r.stdout}\n${r.stderr}`,
      () => '',
    );
    const req = designated(out);
    if (req === null) throw new Error('the running app has no designated requirement');
    await run('/usr/bin/codesign', ['--verify', '--deep', '--strict', `-R=${req}`, next]).catch((e: unknown) => {
      throw new Error(`the new app's signature doesn't match this one's: ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`);
    });
  }

  /** His click: the swap, then the app starts again from the new bundle; `route`: the screen to reopen. */
  async install(route: string | null): Promise<boolean> {
    const s = this.state;
    if (s.state !== 'ready' || this.staged === null) return false;
    if (route !== null) await writeFile(join(this.dir, 'route.json'), JSON.stringify({ route }));
    this.d.stopCore();
    try {
      await swapIn(this.target, this.staged, join(this.dir, 'swap.json'), { from: this.build?.id ?? '', to: s.version });
    } catch (e) {
      this.set({ state: 'failed', version: s.version, why: `the swap failed: ${e instanceof Error ? e.message : String(e)}` });
      return false;
    }
    this.relaunch();
    return true;
  }

  /** His click after a new app that didn't start right: back to .old, then start it. */
  async revert(): Promise<boolean> {
    const old = `${this.target}.old`;
    if (this.state.state !== 'went_bad' || !existsSync(old)) return false;
    const bad = `${this.target}.bad`;
    await rm(bad, { recursive: true, force: true });
    this.d.stopCore();
    await rename(this.target, bad);
    await rename(old, this.target);
    await rm(bad, { recursive: true, force: true });
    await rm(join(this.dir, 'swap.json'), { force: true });
    this.relaunch();
    return true;
  }

  private relaunch(): void {
    if (this.d.testMode) {
      process.stdout.write(`${RELAUNCH_LINE} ${this.target}\n`);
      return;
    }
    app.relaunch({ execPath: join(this.target, 'Contents', 'MacOS', basename(process.execPath)) });
    app.exit(0);
  }
}

/** The route the swapped app reopens on (written at his click), read once. */
export function takeRoute(dir: string): string | undefined {
  const f = join(dir, 'route.json');
  try {
    const v = JSON.parse(readFileSync(f, 'utf8')) as { route?: unknown };
    void rm(f, { force: true });
    return typeof v.route === 'string' ? v.route : undefined;
  } catch {
    return undefined;
  }
}

/** The zip to `to`, its sha256 checked (a mismatch throws: the caller removes the part). */
async function download(url: string, to: string, sha256: string): Promise<void> {
  const hash = createHash('sha256');
  const out = createWriteStream(to);
  const write = (chunk: Uint8Array): Promise<void> =>
    new Promise((ok, ko) => {
      hash.update(chunk);
      out.write(chunk, (e) => {
        if (e) ko(e);
        else ok();
      });
    });
  try {
    if (url.startsWith('file://')) {
      for await (const chunk of createReadStream(fileURLToPath(url))) await write(chunk as Uint8Array);
    } else {
      const res = await net.fetch(url);
      if (!res.ok || res.body === null) throw new Error(`the download answered ${res.status}`);
      const reader = res.body.getReader();
      for (;;) {
        const r = await reader.read();
        if (r.done) break;
        await write(r.value);
      }
    }
  } finally {
    await new Promise<void>((ok) => out.end(ok));
  }
  const got = hash.digest('hex');
  if (got !== sha256.toLowerCase()) throw new Error(`the download's sha256 is ${got}, the release says ${sha256}`);
}
