// FakeHelper: drive the app's bise-mac-helper from a test, through fakes/helper-stub.mjs.
//   const helper = new FakeHelper();
//   const s = await launchDesktop({ helper });
//   await helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' });   // a fn press, as the helper says it
//   await helper.waitCmd((c) => c.cmd === 'read_context');            // what the app asked the helper
// Events and commands are bise-proto's typed lines (src/proto/helper.ts; fixtures in
// '@/proto/fixtures.gen'), never hand-written shapes.
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import type { HelperCmd, HelperEv } from '../../../src/proto';

const STUB = path.join(__dirname, 'helper-stub.mjs');

export class FakeHelper {
  readonly dir: string;
  readonly sock: string;
  readonly log: string;

  constructor() {
    // a short path: a unix socket path must stay under 104 bytes
    this.dir = mkdtempSync(path.join('/tmp', 'bh-'));
    this.sock = path.join(this.dir, 's');
    this.log = path.join(this.dir, 'cmds.jsonl');
    chmodSync(STUB, 0o755);
  }

  /** The environment that makes the app spawn the stub. */
  env(): Record<string, string> {
    return { BISE_DESKTOP_HELPER: STUB, BISE_HARNESS_HELPER_SOCK: this.sock, BISE_HARNESS_HELPER_LOG: this.log };
  }

  /** Sends events as the helper (each becomes one line on its stdout). */
  async send(...evs: HelperEv[]): Promise<void> {
    for (let i = 0; i < 50 && !existsSync(this.sock); i++) await new Promise((r) => setTimeout(r, 100));
    await new Promise<void>((resolve, reject) => {
      const c = net.createConnection(this.sock, () => {
        c.end(evs.map((e) => JSON.stringify(e)).join('\n') + '\n', () => { resolve(); });
      });
      c.on('error', reject);
    });
  }

  /** Every command the app sent the helper so far. */
  cmds(): HelperCmd[] {
    if (!existsSync(this.log)) return [];
    return readFileSync(this.log, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as HelperCmd);
  }

  /** Waits for a command matching `pred` (polls the log every 50 ms). */
  async waitCmd(pred: (c: HelperCmd) => boolean, timeoutMs = 5000): Promise<HelperCmd> {
    const end = Date.now() + timeoutMs;
    for (;;) {
      const hit = this.cmds().find(pred);
      if (hit) return hit;
      if (Date.now() > end) throw new Error(`no helper command matched in ${timeoutMs} ms; got ${JSON.stringify(this.cmds())}`);
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  dispose(): void {
    rmSync(this.dir, { recursive: true, force: true });
  }
}
