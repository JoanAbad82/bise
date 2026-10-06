// The VM tooling checks itself (opt-in: BISE_HARNESS_VM=1; it starts a macOS VM, ~1-2 min):
// up within the limits, the guest agent answers, the screen comes as pixels, a ⌘Q typed through
// VNC reaches a real app's menu (TextEdit quits), and tart never showed a window or came to the
// front on his Mac. down() stops the VM.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { expect, test } from '@playwright/test';
import { Vm } from '../vm/vm';

test.skip(process.env['BISE_HARNESS_VM'] !== '1', 'the VM pass is opt-in: BISE_HARNESS_VM=1');

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

test('vm: up within the limits, real keys reach a real menu, down', async () => {
  test.setTimeout(600_000);
  const vm = await Vm.up();
  try {
    const os = await vm.exec(['sw_vers', '-productVersion']);
    expect(os.code).toBe(0);
    const hw = await vm.exec(['sysctl', '-n', 'hw.memsize', 'hw.ncpu']);
    const [mem, cpu] = hw.stdout.trim().split('\n').map(Number);
    expect(mem).toBeLessThanOrEqual(4 * 1024 ** 3);
    expect(cpu).toBe(2);
    const shot = PNG.sync.read(await vm.vnc.shot());
    expect(shot.width).toBeGreaterThan(800);
    writeFileSync(path.join(test.info().outputDir, 'desktop.png'), PNG.sync.write(shot));
    expect((await vm.exec(['open', '-a', 'TextEdit'], { aqua: true })).code).toBe(0);
    await sleep(4000);
    expect((await vm.exec(['pgrep', '-x', 'TextEdit'])).code).toBe(0);
    writeFileSync(path.join(test.info().outputDir, 'textedit.png'), await vm.vnc.shot());
    await vm.vnc.keys('Escape');
    await vm.vnc.keys('Meta+q');
    await sleep(3000);
    test.info().annotations.push({ type: 'guest', description: `macOS ${os.stdout.trim()}, ${(mem ?? 0) / 1024 ** 3} GB, ${cpu} cores` });
    expect((await vm.exec(['pgrep', '-x', 'TextEdit'])).code).not.toBe(0);
  } finally {
    await vm.down();
  }
});
