// The core child: `<bise> ambient-core`, one JSON object per line both ways
// (docs/ambient-app.md §4), as the Swift app runs it (Core.swift): its
// stderr appended to a log file, restarted with a backoff when it exits,
// a write to a core that is down dropped with a log line (the store marks
// pending sends failed on `down`). Node only (no Electron), so its test
// drives a fake core script.
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { closeSync, openSync, readSync, statSync } from 'node:fs';
import { Backoff, coreArgs, coreEnv, type CoreConfig } from './env';
import { exitOf, failedToStart } from './exit';
import { eventOf, LineSplitter, lineOf, notAnEventLog } from './lines';
import type { CoreExit, CoreState } from '../../shared/api';

/** At most this much of a run's stderr is read back from the log at its end. */
const TAIL = 16 * 1024;

export interface CoreHooks {
  /** a JSON object with a string `ev`, as the core wrote it */
  readonly onEvent: (ev: Record<string, unknown>) => void;
  readonly onState: (state: CoreState) => void;
  /** how a run ended (exit.ts): before the 'down' it causes; never at stop() */
  readonly onExit?: (exit: CoreExit) => void;
  /** a log line of main (not the core's stderr, which goes to the log file) */
  readonly log: (line: string) => void;
}

export interface CoreOptions {
  readonly config: CoreConfig;
  /** the core's stderr goes here (appended); none: ignored */
  readonly logFile?: string;
  readonly env?: Readonly<Record<string, string | undefined>>;
  /** the delay before a restart, in ms (tests shorten it) */
  readonly scale?: number;
}

export class CoreProcess {
  private child: ChildProcessWithoutNullStreams | null = null;
  private stopped = true;
  private gen = 0;
  private startedAt = 0;
  /** the log's size when this run started: its own stderr comes after */
  private logFrom = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly backoff = new Backoff();
  private stateNow: CoreState = 'down';

  constructor(
    private readonly opts: CoreOptions,
    private readonly hooks: CoreHooks,
  ) {}

  get state(): CoreState {
    return this.stateNow;
  }

  start(): void {
    this.stopped = false;
    this.launch();
  }

  /** Stops it for good (at quit): stdin closed, then SIGTERM. */
  stop(): void {
    this.stopped = true;
    this.gen += 1;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    const c = this.child;
    this.child = null;
    if (c !== null) {
      c.stdin.end();
      c.kill('SIGTERM');
    }
    this.setState('down');
  }

  /** Writes one command; false when refused (not a command) or the core is down. */
  send(cmd: unknown): boolean {
    const line = lineOf(cmd);
    if (line === null) {
      this.hooks.log('core: refused a command that is not an object with a string cmd');
      return false;
    }
    const c = this.child;
    if (c === null || this.stateNow !== 'up') {
      this.hooks.log(`core: down, dropped ${(cmd as { cmd: string }).cmd}`);
      return false;
    }
    c.stdin.write(line);
    return true;
  }

  private setState(s: CoreState): void {
    if (s === this.stateNow) return;
    this.stateNow = s;
    this.hooks.onState(s);
  }

  private launch(): void {
    if (this.stopped) return;
    const { config } = this.opts;
    this.gen += 1;
    const g = this.gen;
    this.startedAt = Date.now();
    this.logFrom = this.logSize();
    let err: number | 'ignore' = 'ignore';
    if (this.opts.logFile !== undefined) {
      try {
        err = openSync(this.opts.logFile, 'a');
      } catch (e) {
        this.hooks.log(`core: can't open ${this.opts.logFile}: ${String(e)}`);
      }
    }
    this.setState('starting');
    let child: ChildProcessWithoutNullStreams;
    try {
      child = spawn(config.bise, coreArgs(config.workspace), {
        env: coreEnv(this.opts.env ?? process.env),
        ...(config.workspace === '' ? {} : { cwd: config.workspace }),
        stdio: ['pipe', 'pipe', err],
      }) as ChildProcessWithoutNullStreams;
    } catch (e) {
      this.hooks.log(`core: can't start ${config.bise}: ${String(e)}`);
      if (typeof err === 'number') closeSync(err);
      this.hooks.onExit?.(failedToStart(`can't start ${config.bise}: ${String(e)}`, Date.now()));
      this.exited(g);
      return;
    }
    if (typeof err === 'number') closeSync(err);
    this.child = child;
    const lines = new LineSplitter();
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      if (g !== this.gen) return;
      for (const line of lines.feed(chunk)) {
        const ev = eventOf(line);
        if (ev !== null) this.hooks.onEvent(ev);
        else if (line.trim() !== '') this.hooks.log(notAnEventLog(line));
      }
    });
    child.stdin.on('error', (e) => {
      this.hooks.log(`core: stdin: ${e.message}`);
    });
    child.on('spawn', () => {
      if (g !== this.gen) return;
      this.hooks.log(`core: started pid ${String(child.pid)} (${config.workspace || 'home'})`);
      this.setState('up');
    });
    child.on('error', (e) => {
      this.hooks.log(`core: ${e.message}`);
      if (g === this.gen && !this.stopped) this.hooks.onExit?.(failedToStart(e.message, Date.now()));
      this.exited(g);
    });
    child.on('exit', (code, signal) => {
      this.hooks.log(`core: exited ${String(code ?? signal)}`);
      if (g === this.gen && !this.stopped) this.hooks.onExit?.(exitOf(code, signal, this.runTail(), this.opts.logFile ?? null, Date.now()));
      this.exited(g);
    });
  }

  private logSize(): number {
    if (this.opts.logFile === undefined) return 0;
    try {
      return statSync(this.opts.logFile).size;
    } catch {
      return 0;
    }
  }

  /** What this run wrote to the log (its last TAIL bytes at most). */
  private runTail(): string {
    const file = this.opts.logFile;
    if (file === undefined) return '';
    try {
      const end = statSync(file).size;
      const from = Math.max(this.logFrom, end - TAIL);
      if (end <= from) return '';
      const fd = openSync(file, 'r');
      try {
        const buf = Buffer.alloc(end - from);
        readSync(fd, buf, 0, buf.length, from);
        return buf.toString('utf8');
      } finally {
        closeSync(fd);
      }
    } catch {
      return '';
    }
  }

  private exited(g: number): void {
    if (g !== this.gen) return;
    this.gen += 1;
    this.child = null;
    this.setState('down');
    if (this.stopped) return;
    const lived = (Date.now() - this.startedAt) / 1000;
    const wait = this.backoff.after(lived) * (this.opts.scale ?? 1000);
    this.hooks.log(`core: restart in ${String(wait)} ms`);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.launch();
    }, wait);
  }
}
