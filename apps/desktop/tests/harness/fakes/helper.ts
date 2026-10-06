// The test side of the scripted stubs (stub-lib.mjs): send events as the helper or the core, read
// the commands the app sent them. Events and commands are bise-proto's typed lines (src/proto;
// fixtures in '@/proto/fixtures.gen'), never hand-written shapes.
//   const helper = new FakeHelper();                 // bise-mac-helper (helper-stub.mjs)
//   const core = new FakeCore();                     // bise ambient-core (core-stub.mjs), fixture world
//   const s = await launchDesktop({ helper, core, route: 'inbox' });
//   await helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' });          // a fn press
//   await core.waitCmd((c) => c.cmd === 'send');                           // the app really sent it
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import type { AppCmd, CoreEv, HelperCmd, HelperEv, HubCmd, HubEv } from '../../../src/proto';

const NL = String.fromCharCode(10);
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

class Stub<Ev, Cmd> {
  readonly dir: string;
  readonly sock: string;
  readonly log: string;

  constructor(protected readonly stub: string) {
    // a short path: a unix socket path must stay under 104 bytes
    this.dir = mkdtempSync(path.join('/tmp', 'bh-'));
    this.sock = path.join(this.dir, 's');
    this.log = path.join(this.dir, 'cmds.jsonl');
    chmodSync(stub, 0o755);
  }

  /** Sends events as the stubbed process (each becomes one line on its stdout). */
  async send(...evs: Ev[]): Promise<void> {
    await this.raw(evs.map((e) => JSON.stringify(e)));
  }

  protected async raw(lines: string[]): Promise<void> {
    for (let i = 0; i < 50 && !existsSync(this.sock); i++) await sleep(100);
    await new Promise<void>((resolve, reject) => {
      const c = net.createConnection(this.sock, () => {
        c.end(lines.join(NL) + NL, () => { resolve(); });
      });
      c.on('error', reject);
    });
  }

  /** Every command the app sent so far. */
  cmds(): Cmd[] {
    if (!existsSync(this.log)) return [];
    return readFileSync(this.log, 'utf8').split(NL).filter(Boolean).map((l) => JSON.parse(l) as Cmd);
  }

  /** Waits for a command matching `pred` (reads the log every 50 ms). */
  async waitCmd(pred: (c: Cmd) => boolean, timeoutMs = 5000): Promise<Cmd> {
    const end = Date.now() + timeoutMs;
    for (;;) {
      const hit = this.cmds().find(pred);
      if (hit) return hit;
      if (Date.now() > end) throw new Error(`no command matched in ${timeoutMs} ms; got ${JSON.stringify(this.cmds())}`);
      await sleep(50);
    }
  }

  dispose(): void {
    rmSync(this.dir, { recursive: true, force: true });
  }
}

/** The scripted bise-mac-helper: hello at start; without it a test run has no helper. */
export class FakeHelper extends Stub<HelperEv, HelperCmd> {
  constructor() {
    super(path.join(__dirname, 'helper-stub.mjs'));
  }

  env(): Record<string, string> {
    return { BISE_DESKTOP_HELPER: this.stub, BISE_HARNESS_HELPER_SOCK: this.sock, BISE_HARNESS_HELPER_LOG: this.log };
  }
}

/**
 * The scripted bise ambient-core. Its start world: every fixture of rust/proto/fixtures (default),
 * the events given, or none. Without it a test run has no core (state 'down').
 */
export class FakeCore extends Stub<CoreEv | HubEv, AppCmd | HubCmd> {
  private readonly world: string | undefined;

  constructor(start: 'fixtures' | 'none' | readonly (CoreEv | HubEv)[] = 'fixtures') {
    super(path.join(__dirname, 'core-stub.mjs'));
    if (start === 'none') this.world = 'none';
    else if (start !== 'fixtures') {
      this.world = path.join(this.dir, 'world.jsonl');
      writeFileSync(this.world, start.map((e) => JSON.stringify(e)).join(NL) + NL);
    }
  }

  env(): Record<string, string> {
    return {
      BISE_DESKTOP_BISE: this.stub,
      BISE_DESKTOP_WORKSPACE: '',
      BISE_HARNESS_CORE_SOCK: this.sock,
      BISE_HARNESS_CORE_LOG: this.log,
      ...(this.world ? { BISE_HARNESS_CORE_EVENTS: this.world } : {}),
    };
  }
}
