// Launching the app under test, always out of his sight, with the proof step first and a watch
// for the whole run.
//   launchOld('window' | 'capsule')  TODAY's old web UI (apps/ambient/web) on its fake cores,
//                                    in the harness's own Electron main (oldapp/main.js);
//   launchDesktop()                  the new app (apps/desktop, built to out/), BISE_DESKTOP_TEST=1.
// Both give the same Session, so a check moves from the old app to the new by one line.
// Every launch: a throwaway userData folder, the harness's background-app Electron (electron.ts),
// focus emulation on (the caret is drawn in a window that is never focused), the window-server
// watch (proof.ts) from the first moment: its first violation kills the app at once, and the test
// fails on it. close() proves again, stops the watch and kills what is left by pid.
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { _electron as electron, type CDPSession, type ElectronApplication, type Page } from '@playwright/test';
import { DESKTOP_DIR, harnessElectron } from './electron';
import { prove, Watch, watcherBinary, type Proof } from './proof';

export const OLD_WEB = path.resolve(DESKTOP_DIR, '..', 'ambient', 'web');
export const OLD_PAGES = {
  window: path.join(OLD_WEB, 'window', 'index.html'),
  capsule: path.join(OLD_WEB, 'index.html'),
} as const;
export type OldSurface = keyof typeof OLD_PAGES;

export type LaunchOptions = {
  /** viewport of the window, "<w>x<h>" */
  size?: string;
  /** a wav file the fake microphone plays (Chromium's fake capture device; never the real mic) */
  micWav?: string;
  /** extra environment for the app */
  env?: Record<string, string>;
};

export type Session = {
  app: ElectronApplication;
  page: Page;
  cdp: CDPSession;
  proof: Proof;
  watch: Watch;
  /** proves again, stops the watch, closes the app; throws on a rule broken during the run */
  close: () => Promise<Proof>;
};

const chromiumArgs = (o: LaunchOptions): string[] =>
  o.micWav
    ? ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${o.micWav}`]
    : [];

const killTree = (pid: number | undefined): void => {
  if (pid === undefined) return;
  try { process.kill(pid, 'SIGKILL'); } catch { /* already gone */ }
};

async function start(args: string[], env: Record<string, string>, o: LaunchOptions): Promise<Session> {
  watcherBinary(); // compiled before the app starts, so the watch starts within ms of the launch
  const userData = mkdtempSync(path.join(os.tmpdir(), 'bise-harness-'));
  let app: ElectronApplication | undefined;
  let watch: Watch | undefined;
  let stopped = '';
  try {
    app = await electron.launch({
      executablePath: harnessElectron(),
      args: [...chromiumArgs(o), ...args],
      env: { ...process.env, ...env, ...o.env, BISE_HARNESS_USER_DATA: userData, BISE_DESKTOP_USER_DATA: userData },
    });
    const pid = app.process().pid;
    watch = new Watch(pid ?? -1, (why) => { stopped = why; killTree(pid); });
    const page = await app.firstWindow();
    await page.waitForLoadState('load');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true });
    const proof = await prove(app, watch);
    if (proof.violations.length) throw new Error(`proof step failed: ${proof.violations.join('; ')}`);
    const opened = app, w = watch;
    const close = async (): Promise<Proof> => {
      const end = await prove(opened, w).catch(() => undefined);
      w.stop();
      await opened.close().catch(() => undefined);
      killTree(pid);
      rmSync(userData, { recursive: true, force: true });
      const broken = [...new Set([...(end?.violations ?? []), ...w.violations])];
      if (broken.length) throw new Error(`harness rule broken during the run: ${broken.join('; ')}`);
      return end ?? { ...proof, violations: [] };
    };
    return { app, page, cdp, proof, watch, close };
  } catch (e) {
    watch?.stop();
    await app?.close().catch(() => undefined);
    killTree(app?.process().pid);
    rmSync(userData, { recursive: true, force: true });
    if (stopped) throw new Error(`run stopped by the watch: ${stopped}`);
    throw e;
  }
}

/** Any local HTML file in the harness's own window (the harness's self-tests use fixtures/). */
export function launchPage(htmlFile: string, o: LaunchOptions = {}): Promise<Session> {
  const env: Record<string, string> = { BISE_HARNESS_PAGE: path.resolve(htmlFile) };
  if (o.size) env['BISE_HARNESS_SIZE'] = o.size;
  return start([path.join(__dirname, 'oldapp', 'main.js')], env, o);
}

/** TODAY's old web UI: 'window' (composer, ⌘I, send) or 'capsule' (spotlight, pearl). */
export function launchOld(surface: OldSurface, o: LaunchOptions = {}): Promise<Session> {
  return launchPage(OLD_PAGES[surface], o);
}

/** The new app, from its build (apps/desktop/out), in its test mode. */
export function launchDesktop(o: LaunchOptions = {}): Promise<Session> {
  return start([DESKTOP_DIR], { BISE_DESKTOP_TEST: '1' }, o);
}
