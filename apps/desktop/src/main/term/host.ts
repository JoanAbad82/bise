// The terminal panel's shells (bar T W25/V13/K26/M16; architect m_10140):
// one `bise pty` child per project, run by main, never inside ambient-core.
// A shell is made on the first open of its project and kept while the panel
// is hidden or the window closed (⌘W); an open of a live one answers a
// screen snapshot (`attach`), so the panel redraws whatever runs. At most
// MAX_SHELLS: the least recently used ends to make room. All end at quit
// (their stdin closes: `bise pty` hangs up the shell's group).
//
// The page names a project, main finds its folder in the core's last
// `projects` event (never a path from the page). Output goes to every
// window in 16 ms batches (IPC.termData {id, bytes}); its end as
// IPC.termExit {id, code}.
//
// Test mode: the harness's own bise only (paths.ts; BISE_DESKTOP_PTY when the
// harness runs a FakeCore and gives the shells a real bise), a clean /bin/sh, the
// folder jailed by `bise pty` itself (BISE_TEST_HOME), and a stdout line
// `TERM_LINE <id> open|exit <code>` for the harness.
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import { app, BrowserWindow, ipcMain } from 'electron';
import type { PtyEv } from '../../proto';
import { IPC, TERM_LINE, type TermOpened } from '../../shared/api';
import { onCoreEvent } from '../core/ipc';
import { LineSplitter } from '../helper/lines';
import { binPath } from '../paths';
import { Batcher, clampSize, decodePtyEv, encodePtyCmd, evictee, folderOf, MAX_SHELLS, MAX_WRITE, ptyBin } from './lines';

interface Shell {
  readonly id: string;
  readonly child: ChildProcessWithoutNullStreams;
  /** the open waiting for its snapshot */
  waiting: ((screen: Uint8Array) => void) | null;
  alive: boolean;
}

function broadcast(channel: string, payload: unknown): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(channel, payload);
  }
}

export class TermHost {
  private readonly shells = new Map<string, Shell>();
  private readonly lastUse = new Map<string, number>();
  private rows: readonly unknown[] = [];
  private readonly batch = new Batcher((id, bytes) => {
    broadcast(IPC.termData, { id, bytes });
  });

  constructor(
    private readonly testMode: boolean,
    /** his login shell's environment in process.env (loginenv.ts): the first spawn waits for it */
    private readonly ready: Promise<void> = Promise.resolve(),
  ) {}

  /** The core's projects rows: where each project's shell runs. */
  setRows(rows: readonly unknown[]): void {
    this.rows = rows;
  }

  /** The project's live shell (with its screen), else a new one; an error line when it can't. */
  async open(project: unknown, cols: unknown, rows: unknown): Promise<TermOpened> {
    const folder = folderOf(project, this.rows);
    if (folder === null || typeof project !== 'string') return { error: 'no folder for this project' };
    const size = clampSize(cols, rows) ?? { cols: 80, rows: 24 };
    const id = project;
    this.lastUse.set(id, Date.now());
    const live = this.shells.get(id);
    if (live?.alive === true) {
      this.send(live, { cmd: 'resize', cols: size.cols, rows: size.rows });
      const screen = await new Promise<Uint8Array>((done) => {
        live.waiting = done;
        this.send(live, { cmd: 'attach' });
      });
      return { id, screen };
    }
    // room for this one: the least recently used of the others ends
    await this.ready;
    const drop = evictee(new Map([...this.lastUse].filter(([k]) => k !== id && this.shells.has(k))), MAX_SHELLS);
    if (drop !== null) this.kill(drop);
    const core = binPath({ env: process.env, packaged: app.isPackaged, resourcesPath: process.resourcesPath, appPath: app.getAppPath(), exists: existsSync });
    const bise = ptyBin(process.env, this.testMode, core);
    if (bise === null) return { error: 'no bise to run the shell' };
    const args = ['pty', '--cwd', folder, '--cols', String(size.cols), '--rows', String(size.rows), ...(this.testMode ? ['--shell', '/bin/sh'] : [])];
    const child = spawn(bise, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    const shell: Shell = { id, child, waiting: null, alive: true };
    this.shells.set(id, shell);
    const lines = new LineSplitter();
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      for (const l of lines.push(chunk)) {
        const ev = decodePtyEv(l);
        if (ev !== null) this.on(shell, ev);
      }
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (s: string) => {
      process.stderr.write(`bise-desktop: term ${id}: ${s}`);
    });
    child.on('exit', (code) => {
      if (shell.alive) this.ended(shell, code ?? null);
    });
    if (this.testMode) process.stdout.write(`${TERM_LINE} ${JSON.stringify(id)} open
`);
    return { id, screen: null };
  }

  write(id: unknown, data: unknown): void {
    const s = typeof id === 'string' ? this.shells.get(id) : undefined;
    if (s === undefined || typeof data !== 'string' || data.length > MAX_WRITE) return;
    this.lastUse.set(s.id, Date.now());
    this.send(s, { cmd: 'write', data: Buffer.from(data, 'utf8').toString('base64') });
  }

  resize(id: unknown, cols: unknown, rows: unknown): void {
    const s = typeof id === 'string' ? this.shells.get(id) : undefined;
    const size = clampSize(cols, rows);
    if (s !== undefined && size !== null) this.send(s, { cmd: 'resize', ...size });
  }

  kill(id: unknown): void {
    const s = typeof id === 'string' ? this.shells.get(id) : undefined;
    if (s !== undefined) this.send(s, { cmd: 'kill' });
  }

  /** At quit: every shell's stdin closes, `bise pty` hangs up its group. */
  stopAll(): void {
    for (const s of this.shells.values()) s.child.stdin.end();
  }

  private send(s: Shell, cmd: Parameters<typeof encodePtyCmd>[0]): void {
    if (s.alive && s.child.stdin.writable) s.child.stdin.write(encodePtyCmd(cmd));
  }

  private on(s: Shell, ev: PtyEv): void {
    switch (ev.ev) {
      case 'data':
        this.batch.push(s.id, Buffer.from(ev.data, 'base64'));
        return;
      case 'screen': {
        // what was read before the snapshot goes first: the page resets on the screen
        this.batch.flush(s.id);
        const done = s.waiting;
        s.waiting = null;
        done?.(Buffer.from(ev.data, 'base64'));
        return;
      }
      case 'exit':
        this.ended(s, ev.code ?? null);
        return;
      case 'error':
        process.stderr.write(`bise-desktop: term ${s.id}: ${ev.text}
`);
        return;
      case 'started':
        return;
    }
  }

  private ended(s: Shell, code: number | null): void {
    s.alive = false;
    this.batch.flush(s.id);
    s.waiting?.(new Uint8Array());
    s.waiting = null;
    if (this.shells.get(s.id) === s) {
      this.shells.delete(s.id);
      this.lastUse.delete(s.id);
    }
    broadcast(IPC.termExit, { id: s.id, code });
    if (this.testMode) process.stdout.write(`${TERM_LINE} ${JSON.stringify(s.id)} exit ${String(code)}
`);
  }
}

/** The shells' IPC (window.bise.term) and their folders from the core's projects rows. */
export function startTerms(testMode: boolean, ready?: Promise<void>): TermHost {
  const host = new TermHost(testMode, ready);
  onCoreEvent((ev) => {
    if (ev['ev'] === 'projects' && Array.isArray(ev['projects'])) host.setRows(ev['projects'] as unknown[]);
  });
  ipcMain.handle(IPC.termOpen, (_e, project: unknown, cols: unknown, rows: unknown) => host.open(project, cols, rows));
  ipcMain.on(IPC.termWrite, (_e, id: unknown, data: unknown) => {
    host.write(id, data);
  });
  ipcMain.on(IPC.termResize, (_e, id: unknown, cols: unknown, rows: unknown) => {
    host.resize(id, cols, rows);
  });
  ipcMain.on(IPC.termKill, (_e, id: unknown) => {
    host.kill(id);
  });
  return host;
}
