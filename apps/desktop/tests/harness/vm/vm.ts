// The macOS VM for qa-native's pass (card #444): a real macOS, with a real key window and real
// keys, where what offscreen Electron can't see (NSMenu key equivalents, fn, focus, TCC, the glass
// over a full-screen app) is checked. Within the user's limits, enforced here:
//   - tart only, VMs named bise* in ~/.tart (his bise-vm-cleanup removes them and the image);
//   - 4 GB of memory, 2 cores (tart set before every start);
//   - headless: tart run --no-graphics (Virtualization's own VNC for pixels and keys, rfb.ts);
//     the proof's watch follows tart's pid: a tart window on his screen or tart frontmost stops it;
//   - up only while a check runs: down() stops it, a watchdog stops it if the test process dies;
//   - the disk floor (lead m_9830): under 8 GB free on / it won't start, and a running VM is
//     stopped at once; nothing of his is ever deleted;
//   - inside: the image's own throwaway user (admin), a fake hub (qa-native's guest kit).
//   const vm = await Vm.up({ dirs: { qa: '/abs/guest-kit' } });   // shared read-only
//   await vm.exec(['ls', '/Volumes/My Shared Files/qa']);
//   await vm.exec(['open', '/Applications/bise.app'], { aqua: true });
//   const png = await vm.vnc.shot(); await vm.vnc.keys('Meta+Q');
//   await vm.down();
import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { statfsSync } from 'node:fs';
import { Watch } from '../proof';
import { Rfb } from './rfb';

export const FLOOR_BYTES = 8 * 1024 ** 3;
const TART = process.env['BISE_HARNESS_TART'] ?? 'tart';

export type VmOptions = {
  /** the VM, a clone of `base`, made once (APFS clone: no data written); must start with 'bise' */
  name?: string;
  /** the local base image (made by the pull: tart clone ghcr.io/cirruslabs/macos-tahoe-base bise-base) */
  base?: string;
  /** host folders shared read-only, seen in the guest at /Volumes/My Shared Files/<name> */
  dirs?: Record<string, string>;
  /** the guest's screen size */
  display?: string;
  /** how long to wait for the guest to boot and its agent to answer */
  bootMs?: number;
};

export type ExecResult = { code: number; stdout: string; stderr: string };

/** Free bytes on the volume that holds ~/.tart. */
export const freeBytes = (): number => {
  const s = statfsSync(process.env['HOME'] ?? '/');
  return s.bavail * s.bsize;
};

const run = (args: string[], timeoutMs = 120_000): Promise<ExecResult> =>
  new Promise((resolve) => {
    execFile(TART, args, { timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      const code = err ? (typeof (err as { code?: unknown }).code === 'number' ? (err as { code: number }).code : 1) : 0;
      resolve({ code, stdout, stderr });
    });
  });

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export class Vm {
  readonly violations: string[] = [];
  private floorTimer: NodeJS.Timeout | undefined;
  private stopped = false;

  private constructor(
    readonly name: string,
    private readonly child: ChildProcess,
    private readonly watch: Watch,
    readonly vnc: Rfb,
    readonly ip: string,
  ) {}

  static async up(o: VmOptions = {}): Promise<Vm> {
    const name = o.name ?? 'bise-vm';
    const base = o.base ?? 'bise-base';
    if (!name.startsWith('bise')) throw new Error(`vm: '${name}' must start with 'bise' (his cleanup only touches bise*)`);
    if (freeBytes() < FLOOR_BYTES) throw new Error(`vm: ${(freeBytes() / 1024 ** 3).toFixed(1)} GB free < 8 GB: not starting (lead m_9830)`);
    const list = await run(['list', '--format', 'json']);
    const vms = (JSON.parse(list.stdout || '[]') as { Name: string; State?: string }[]);
    if (!vms.some((v) => v.Name === name)) {
      if (!vms.some((v) => v.Name === base)) throw new Error(`vm: no base '${base}': the pull hasn't run (tests/harness/vm/README.md)`);
      const c = await run(['clone', base, name], 600_000);
      if (c.code !== 0) throw new Error(`vm: clone failed: ${c.stderr}`);
    }
    if (vms.find((v) => v.Name === name)?.State === 'running') await run(['stop', name]);
    const set = await run(['set', name, '--cpu', '2', '--memory', '4096', '--display', o.display ?? '1440x900']);
    if (set.code !== 0) throw new Error(`vm: set failed: ${set.stderr}`);
    const dirs = Object.entries(o.dirs ?? {}).map(([n, p]) => `--dir=${n}:${p}:ro`);
    const child = spawn(TART, ['run', name, '--no-graphics', '--vnc-experimental', ...dirs], { stdio: ['ignore', 'pipe', 'pipe'] });
    // the watchdog: if this process dies, the VM is stopped (it is up only while a check runs)
    spawn('/bin/sh', ['-c', `while kill -0 ${process.pid} 2>/dev/null; do sleep 3; done; ${TART} stop ${name} >/dev/null 2>&1`], { detached: true, stdio: 'ignore' }).unref();
    let vm: Vm | undefined;
    const watch = new Watch(child.pid ?? -1, (why) => {
      void (vm ? vm.halt(`tart broke the rules: ${why}`) : run(['stop', name]));
    });
    try {
      const url = await new Promise<string>((resolve, reject) => {
        let seen = '';
        const t = setTimeout(() => { reject(new Error(`vm: no VNC address in 60 s: ${seen.slice(-400)}`)); }, 60_000);
        const on = (b: Buffer): void => {
          seen += b.toString();
          const m = /vnc:\/\/[^\s]*/.exec(seen);
          if (m) { clearTimeout(t); resolve(m[0]); }
        };
        child.stdout.on('data', on);
        child.stderr.on('data', on);
        child.on('exit', (code) => { clearTimeout(t); reject(new Error(`vm: tart run exited (${code}): ${seen.slice(-400)}`)); });
      });
      const m = /vnc:\/\/(?:[^:@]*:)?([^@]*)@([^:/]+):(\d+)/.exec(url);
      if (!m) throw new Error(`vm: can't read ${url}`);
      const vnc = await Rfb.connect(Number(m[3]), decodeURIComponent(m[1] ?? ''), m[2]);
      const ip = (await run(['ip', name, '--wait', String(Math.round((o.bootMs ?? 180_000) / 1000))], (o.bootMs ?? 180_000) + 5000)).stdout.trim();
      vm = new Vm(name, child, watch, vnc, ip);
      await vm.ready(o.bootMs ?? 180_000);
      vm.floorTimer = setInterval(() => {
        if (freeBytes() < FLOOR_BYTES) void vm?.halt(`disk under 8 GB free (${(freeBytes() / 1024 ** 3).toFixed(1)} GB): VM stopped`);
      }, 10_000);
      return vm;
    } catch (e) {
      watch.stop();
      await run(['stop', name]);
      child.kill();
      throw e;
    }
  }

  /** Waits until the guest agent answers (tart exec). */
  private async ready(timeoutMs: number): Promise<void> {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      if ((await run(['exec', this.name, 'true'], 15_000)).code === 0) return;
      await sleep(2000);
    }
    throw new Error(`vm: the guest agent didn't answer in ${timeoutMs} ms`);
  }

  /**
   * Runs a command in the guest as its user (admin). aqua: in his GUI session (launchctl asuser),
   * for what must reach the window server (open an app, post CGEvents, screencapture).
   */
  async exec(cmd: string[], o: { aqua?: boolean; timeoutMs?: number } = {}): Promise<ExecResult> {
    const full = o.aqua ? ['sudo', 'launchctl', 'asuser', '501', 'sudo', '-u', 'admin', ...cmd] : cmd;
    return run(['exec', this.name, ...full], o.timeoutMs ?? 120_000);
  }

  /** Copies a host file into the guest (through the agent's stdin, for files a shared dir doesn't hold). */
  async put(hostFile: string, guestPath: string): Promise<ExecResult> {
    return new Promise((resolve) => {
      const p = spawn(TART, ['exec', '-i', this.name, 'sh', '-c', `cat > '${guestPath.replace(/'/g, `'\\''`)}'`], { stdio: ['pipe', 'pipe', 'pipe'] });
      let out = '', err = '';
      p.stdout.on('data', (b: Buffer) => { out += b.toString(); });
      p.stderr.on('data', (b: Buffer) => { err += b.toString(); });
      p.on('exit', (code) => { resolve({ code: code ?? 1, stdout: out, stderr: err }); });
      void import('node:fs').then((fs) => { fs.createReadStream(hostFile).pipe(p.stdin); });
    });
  }

  private async halt(why: string): Promise<void> {
    this.violations.push(why);
    await this.down();
  }

  /** Stops the VM (always: it is up only while a check runs). Throws if a rule broke during the run. */
  async down(): Promise<void> {
    if (!this.stopped) {
      this.stopped = true;
      if (this.floorTimer) clearInterval(this.floorTimer);
      this.vnc.close();
      await run(['stop', this.name], 60_000);
      this.child.kill();
      this.watch.stop();
    }
    const broken = [...new Set([...this.violations, ...this.watch.violations])];
    if (broken.length) throw new Error(`vm: ${broken.join('; ')}`);
  }
}
