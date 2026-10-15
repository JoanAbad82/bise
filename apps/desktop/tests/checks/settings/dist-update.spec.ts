// settings/dist-update · settings › general's 'update' group for a distributed app (desktop-dist
// v7, designer m_25362's words). window.bise.update's state and info are faked by
// BISE_DESKTOP_TEST_DIST_UPDATE (test mode never runs the updater here; the real one is
// native/update*.spec.ts). Passes when each state says designer's words, the 'beta builds' toggle
// sends prefs_set desktop_channel, and a quiet install's trace shows under the version row.
// Frames: dist-update-<state>-1100-<theme>.png, for designer to sign. Owner: dist-updater.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const V = 'desktop-v2026.10.1';
const N = 'desktop-v2026.10.2';
// as he reads them: the version, not the tag (designer m_25699)
const v = '2026.10.1';
const n = '2026.10.2';
const info = { version: V, updated: null };
const CASES: Record<string, { state: unknown; info: unknown; label: string; row: string; why?: string; sub?: string }> = {
  current: { state: { state: 'none' }, info, label: `bise ${v}`, row: 'up to date' },
  getting: { state: { state: 'downloading', version: N }, info, label: `bise ${v}`, row: `getting ${n}` },
  ready: { state: { state: 'ready', version: N }, info, label: `${n} is ready`, row: 'restart to update', why: 'it installs by itself when you quit or step away. your agents keep running.' },
  // off here: the reason is the row's sub (designer m_26934); where moving fixes it, the row's act
  // (apple-signing ag-move: his click calls window.bise.update.move); a move that didn't happen: ▲
  off: { state: { state: 'none', cant: 'read_only' }, info, label: 'updates are off here', row: '', sub: "bise isn't in Applications, so it can't replace itself." },
  off_move: { state: { state: 'none', cant: 'disk_image', move: 'can' }, info, label: 'updates are off here', row: 'move to Applications', sub: "bise runs from the disk image, so it can't update itself." },
  off_moved_failed: { state: { state: 'none', cant: 'translocated', move: 'failed' }, info, label: 'updates are off here', row: 'move to Applications', sub: "▲ bise couldn't move itself. drag it to Applications to get updates." },
  failed: { state: { state: 'failed', version: N, why: 'x', reason: 'signature' }, info, label: `bise ${v}`, row: 'update failed', why: `${n} was refused: its signature didn't check out. bise keeps ${v}.` },
  failed_swap: { state: { state: 'failed', version: N, why: 'x', reason: 'swap' }, info, label: `bise ${v}`, row: 'update failed', why: `${n} couldn't be installed. bise tries again later.` },
  failed_signer: {
    state: { state: 'failed', version: N, why: 'x', reason: 'new_signer' },
    info,
    label: `bise ${v}`,
    row: 'update failed',
    why: "this test build can't update itself. download bise once from bise.dev/download; later updates come by themselves.",
  },
  went_bad: { state: { state: 'went_bad', version: N }, info, label: "▲ the new bise didn't start right", row: 'go back' },
  trace: { state: { state: 'none' }, info: { version: N, updated: { version: N, at: Date.now() - 3600_000 } }, label: `bise ${n}`, row: 'up to date', why: `updated to ${n} · ` },
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const flat = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim();

async function shoot(page: Page, name: string): Promise<void> {
  await page.mouse.move(1, 1);
  for (const theme of ['light', 'dark'] as const) {
    await page.evaluate((t) => {
      document.documentElement.setAttribute('data-theme', t);
      document.documentElement.style.setProperty('color-scheme', t);
    }, theme);
    await sleep(250);
    await page.screenshot({ path: test.info().outputPath(`${name}-${theme}.png`) });
    // the off-here rows: the UPDATE group alone too (designer m_26934)
    if (name.startsWith('dist-update-off')) await page.getByTestId('settings.dist').screenshot({ path: test.info().outputPath(`${name}-group-${theme}.png`) });
  }
}

for (const [name, c] of Object.entries(CASES)) {
  test(`settings/dist-update: ${name}`, async () => {
    const core = new FakeCore();
    const s = await launchDesktop({ core, route: 'settings/general', size: '1100x800', env: { BISE_DESKTOP_TEST_DIST_UPDATE: JSON.stringify({ state: c.state, info: c.info }) } });
    const { page } = s;
    try {
      await expect(page.getByTestId('settings.page.general')).toBeVisible({ timeout: 10_000 });
      await expect.poll(async () => flat(await page.getByTestId('settings.dist.label').textContent()), { timeout: 5000 }).toBe(c.label);
      const group = page.getByTestId('settings.dist');
      if (c.row !== '') expect(flat(await group.textContent())).toContain(c.row);
      if (c.why !== undefined) expect(flat(await page.getByTestId('settings.dist.why').textContent())).toContain(c.why);
      if (c.sub !== undefined) {
        expect(flat(await page.getByTestId('settings.dist.sub').textContent())).toBe(c.sub);
        await expect(page.getByTestId('settings.dist.why'), 'no help line under the group').toHaveCount(0);
      }
      await expect(page.getByTestId('settings.pref.desktop_channel'), 'the beta toggle').toBeVisible();
      if (name === 'ready') {
        // the pill: the version, never cut inside a word; when it installs is the popover's
        await expect(page.getByTestId('app.update'), 'the pill').toContainText(`bise ${n} is ready`);
      }
      if (name === 'failed_signer') await expect(page.getByTestId('settings.dist.download'), 'bise.dev/download is a link').toHaveText('bise.dev/download');
      await shoot(page, `dist-update-${name}-1100`);
      if (name === 'current') {
        await page.getByTestId('settings.pref.desktop_channel').click();
        const cmd = await core.waitCmd((x) => (x as { cmd?: string; key?: string }).cmd === 'prefs_set' && (x as { key?: string }).key === 'desktop_channel');
        expect((cmd as { value?: unknown }).value, 'beta on').toBe('beta');
        await shoot(page, 'dist-update-beta-1100');
      }
    } finally {
      await s.close();
    }
  });
}
