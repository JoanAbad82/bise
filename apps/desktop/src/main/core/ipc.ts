// Main's side of the core channel (window.bise.core, src/shared/api.ts):
// starts the one core child for the app, sends every event and state change
// to every window, writes the windows' commands to it. Owner: amb-core.
// src/main/index.ts calls startCore() once at ready and stopCore() at quit.
import { existsSync, readFileSync } from 'node:fs';
import { constants, homedir, release } from 'node:os';
import { join } from 'node:path';
import { app, BrowserWindow, ipcMain, Notification, shell } from 'electron';
import { CORE_CRASH_NOTE_LINE, CORE_IPC, CORE_REVEAL_LINE, TEST_ENV, type CoreExit, type CoreState, type CrashReport } from '../../shared/api';
import { reasonOf } from './exit';
import { writeReport } from './report';
import { noAsks } from '../offscreen';
import { binPath } from '../paths';
import { configOf, coreLogOf } from './env';
import { Latest } from '../../shared/latest';
import { CoreProcess } from './process';
import { DictationRoutes, type Route } from './dictation';
import { SubRoutes } from './subs';
import type { AnswerResult, SendResult } from '../../proto';

let core: CoreProcess | null = null;
// the last state events, for a window or a main-side listener that comes after they went out
const latest = new Latest();
const listeners = new Set<(ev: Record<string, unknown>) => void>();
// a dictation's words go only to the window that started it (dictation.ts)
const dictations = new DictationRoutes();
// the threads each window follows: the core has one set per project (subs.ts)
const subs = new SubRoutes();
const watched = new Set<number>();
// A1 (architect m_21449): a send's result carries its message id; it goes back only to the window
// that sent it (its cid is that window's own counter), as the window-local event 'sent' (echo.ts)
const sends = new Map<string, number>();
const sendKey = (c: Readonly<Record<string, unknown>>): string | null =>
  c['cmd'] === 'send' && typeof c['cid'] === 'number' ? `${String(c['project'])}/${String(c['agent'])}/${String(c['cid'])}` : null;
// inbox picks (3), architect m_22636: card/answer's result (AnswerResult) goes back only to the
// window that answered (a card is answered once), as the window-local event 'card_answered': that
// window shows his answer where he is when the asker's thread is elsewhere
const answers = new Map<string, number>();
// card-state (architect m_23450): card/close's result too, as 'card_closed': the window's store
// settles its close (a refused one comes back first as the hub's error and shows the card again)
const answerKey = (c: Readonly<Record<string, unknown>>): string | null =>
  (c['cmd'] === 'answer' || c['cmd'] === 'close') && typeof c['card'] === 'number' ? `${c['cmd']}/${String(c['project'])}/${String(c['card'])}` : null;
// how its last run ended (exit.ts), sent with every state: null until it ended once
let lastExit: CoreExit | null = null;

/**
 * Main's own listener on the core's events (amb-mac m_9733: the helper's
 * config follows the core's prefs). The kept state events are replayed to it
 * first, so a listener added late misses nothing. Returns the unsubscribe.
 */
export function onCoreEvent(listener: (ev: Record<string, unknown>) => void): () => void {
  for (const ev of latest.snapshot()) listener(ev);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function broadcast(channel: string, payload: unknown): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(channel, payload);
  }
}

/** The state with how the last run ended: one event, so the window reads both at once. */
function sendState(s: CoreState): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(CORE_IPC.state, s, lastExit);
  }
}

function toWindow(r: Route): void {
  if (r.to !== 'window') return;
  const w = BrowserWindow.getAllWindows().find((x) => !x.isDestroyed() && x.webContents.id === r.window);
  w?.webContents.send(CORE_IPC.ev, r.ev);
}

/** A window that dictates, talks in voice mode or follows a thread: when it's gone (closed, crashed, reloaded), its mic stops and its threads are let go. */
function watch(contents: Electron.WebContents): void {
  if (watched.has(contents.id)) return;
  const id = contents.id;
  watched.add(id);
  const gone = (): void => {
    for (const c of dictations.gone(id)) core?.send(c);
    for (const c of subs.gone(id)) core?.send(c);
  };
  contents.once('destroyed', () => {
    watched.delete(id);
    gone();
  });
  contents.on('render-process-gone', gone);
  contents.on('did-start-navigation', (d) => {
    if (d.isMainFrame && !d.isSameDocument) gone();
  });
}

function log(line: string): void {
  process.stderr.write(`bise-desktop: ${line}${String.fromCharCode(10)}`);
}

/**
 * Starts `bise ambient-core` (the bise of src/main/paths.ts binPath: the one
 * shipped in the app, else BISE_DESKTOP_BISE, else the repo's build, never
 * PATH's; BISE_DESKTOP_WORKSPACE: the workspace, '' = home) and the IPC
 * handlers. No bise: the state stays 'down' and the reason is logged once.
 */
export function startCore(env: Readonly<Record<string, string | undefined>> = process.env): void {
  // an off-screen run never opens his mic (macOS would ask him for 'bise try'): the core is told at
  // spawn (--offscreen) and owns the rule, fake voice or no mic; every command goes to it, so each
  // mic command gets its answer from there (architect m_22483)
  const quiet = noAsks(env, env[TEST_ENV] === '1');
  let state: CoreState = 'down';
  ipcMain.on(CORE_IPC.cmd, (e, cmd: unknown) => {
    const name = (cmd as { cmd?: unknown } | null)?.cmd;
    dictations.sent(e.sender.id, cmd);
    const sk = typeof cmd === 'object' && cmd !== null ? sendKey(cmd as Record<string, unknown>) : null;
    if (sk !== null) sends.set(sk, e.sender.id);
    const ak = typeof cmd === 'object' && cmd !== null ? answerKey(cmd as Record<string, unknown>) : null;
    if (ak !== null) answers.set(ak, e.sender.id);
    // a window whose mic, voice mode or held /model (R8) must end with it
    if (name === 'dictate_start' || name === 'voice_mode' || name === 'slash' || name === 'subscribe') watch(e.sender);
    // an unsubscribe another window still needs stays here (R18)
    for (const c of subs.sent(e.sender.id, cmd)) core?.send(c);
  });
  ipcMain.handle(CORE_IPC.stateNow, (): CoreState => state);
  ipcMain.handle(CORE_IPC.snapshot, (): Record<string, unknown>[] => latest.snapshot());
  ipcMain.handle(CORE_IPC.exitNow, (): CoreExit | null => lastExit);
  // read now, after index.ts set the stand-in's userData (userdata.ts): its path said once, so
  // a run on a stand-in home never has to guess it (ambient-lead m_19260)
  const logFile = coreLogOf(app.getPath('userData'));
  log(`core: core.log at ${logFile}`);
  // a crash's report in Finder (test mode: a line, never Finder)
  ipcMain.on(CORE_IPC.revealLog, () => {
    if (env[TEST_ENV] === '1') process.stdout.write(`${CORE_REVEAL_LINE} ${logFile}${String.fromCharCode(10)}`);
    else shell.showItemInFolder(logFile);
  });
  const bise = binPath({ env, packaged: app.isPackaged, resourcesPath: process.resourcesPath, appPath: app.getAppPath(), exists: existsSync });
  const config = configOf(bise, env);
  if (config === null) {
    log("core: no bise: none shipped in the app, no BISE_DESKTOP_BISE path, no repo build (never PATH's bise)");
    return;
  }
  // a crash's report and, with no bise window shown, one notification (designer, voice-window part 2)
  const test = env[TEST_ENV] === '1';
  const reportsDir = env['BISE_HOME'] !== undefined && env['BISE_HOME'] !== '' ? join(env['BISE_HOME'], 'reports') : join(homedir(), '.bise', 'reports');
  let lastReport: string | null = null;
  let told = false;
  ipcMain.on(CORE_IPC.start, () => {
    if (core?.restart() === true) log('core: started again by his click');
  });
  ipcMain.handle(CORE_IPC.report, (): CrashReport | null => {
    if (lastReport === null) return null;
    try {
      return { path: lastReport, text: readFileSync(lastReport, 'utf8') };
    } catch {
      return null;
    }
  });
  const crashed = (e: CoreExit): void => {
    if (!e.crash || told || quiet) return;
    const shown = BrowserWindow.getAllWindows().some((w) => !w.isDestroyed() && w.isVisible() && !w.webContents.getURL().includes('surface=capsule'));
    if (shown) return;
    told = true;
    if (test) {
      process.stdout.write(`${CORE_CRASH_NOTE_LINE} bise crashed · open bise${String.fromCharCode(10)}`);
      return;
    }
    const n = new Notification({ title: 'bise crashed', body: 'open bise' });
    n.on('click', () => {
      app.emit('activate');
      for (const w of BrowserWindow.getAllWindows()) if (!w.webContents.getURL().includes('surface=capsule')) w.show();
    });
    n.show();
  };
  core = new CoreProcess(
    { config, logFile, env, test, offscreen: quiet },
    {
      report: (e, tail) => {
        lastReport = writeReport(
          reportsDir,
          e,
          { reason: reasonOf(e, constants.signals), app: `${app.getName()} ${app.getVersion()}`, bise: config.bise, os: `macOS ${release()}`, log: logFile },
          tail,
        );
        return lastReport;
      },
      onEvent: (ev) => {
        // a dictation's words: its window only, never kept, never main's listeners
        const r = dictations.route(ev);
        if (r.to !== 'all') {
          toWindow(r);
          return;
        }
        latest.keep(ev);
        for (const l of [...listeners]) l(ev);
        broadcast(CORE_IPC.ev, ev);
      },
      onAnswer: (cmd, result) => {
        const ak = answerKey(cmd);
        const by = ak === null ? undefined : answers.get(ak);
        if (ak !== null && by !== undefined) {
          answers.delete(ak);
          if (cmd['cmd'] === 'close') {
            toWindow({ to: 'window', window: by, ev: { ev: 'card_closed', project: cmd['project'], card: cmd['card'] } });
            return;
          }
          // the step closed no card (or an older hub, a page took it) answers {}: answer null, no row
          const answer = (result as AnswerResult | null)?.answer ?? null;
          toWindow({ to: 'window', window: by, ev: { ev: 'card_answered', project: cmd['project'], card: cmd['card'], answer } });
          return;
        }
        const sk = sendKey(cmd);
        const to = sk === null ? undefined : sends.get(sk);
        if (sk === null || to === undefined) return;
        sends.delete(sk);
        // turn/send's result (bise-proto rpc SendResult); an older hub answers {}: msg_id null,
        // the window falls back to the words
        const id = (result as SendResult | null)?.msg_id ?? null;
        const ev = { ev: 'sent', project: cmd['project'], agent: cmd['agent'], cid: cmd['cid'], msg_id: id };
        toWindow({ to: 'window', window: to, ev });
      },
      onState: (s) => {
        // a new core starts from nothing: it says its state again
        if (s === 'starting') {
          latest.clear();
          subs.clear();
          sends.clear();
          answers.clear();
        }
        // a core gone took its mic with it: its dictations end
        if (s !== 'up') for (const r of dictations.coreGone()) toWindow(r);
        state = s;
        // back up: a next crash may tell him again
        if (s === 'up') told = false;
        sendState(s);
      },
      onExit: (e) => {
        lastExit = e;
        crashed(e);
        log(`core: ended ${e.how}${e.code === null ? '' : ` ${String(e.code)}`}${e.signal === null ? '' : ` ${e.signal}`}${e.crash ? ' (crash)' : ''}`);
      },
      log,
    },
  );
  core.start();
}

/** Main's own command to the core (amb-mac, S.6: app_version); false when no core runs. */
export function sendToCore(cmd: unknown): boolean {
  return core?.send(cmd) ?? false;
}

export function stopCore(): void {
  core?.stop();
  core = null;
}
