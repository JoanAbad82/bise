// app/cmd-hints · his ask (main m_21494; designer m_21507, m_21510): ⌘1-9 picks a project, and
// holding ⌘ alone shows the keys where they act. On FakeCore, bise + 3 projects, at 1100 light.
// Passes when:
//   - ⌘1 opens the first project's main, ⌘2 the second, ⌘0 bise (keys.ts's order, the sidebar's);
//   - ⌘ held alone 400 ms: bise's row shows a 16 px kbd '0' and each project its digit in place of
//     its count, ‹ shows ⌘[ under it once there is a place behind, the inbox's head ⌘I;
//   - released, or any other key while held: every hint goes at once;
//   - a quick ⌘ (under the delay) shows nothing.
// Shot: cmd-held-light-1100. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const NOW = Date.now();
const MIN = 60_000;
const prefs = {
  ev: 'prefs',
  prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
};
const PS = [
  { project: 'acme-1a2b3c4d', name: 'storefront', waits: 1 },
  { project: 'docs-2b3c4d5e', name: 'docs', waits: 0 },
  { project: 'tele-3c4d5e6f', name: 'telemetry', waits: 2 },
];
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [] });
const card = (project: string, id: number) => ({ id, project, kind: 'question', agent: 'main', question: `ship it? (${String(id)})`, options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], urgent: false, since_ms: NOW - 2 * MIN });
const world = [
  prefs,
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      ...PS.map((p, i) => ({
        project: p.project, name: p.name, path: `/nowhere/${p.name}`, git: true, home: false, order: i + 1, agents: 1, working: 0, waits: p.waits, running: true,
        cards: Array.from({ length: p.waits }, (_, k) => card(p.project, k + 1)),
      })),
    ],
  },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  ...PS.flatMap((p) => [
    { ev: 'welcome', project: p.project, proto: 1, workspace: `/nowhere/${p.name}`, name: p.name },
    { ev: 'agents', project: p.project, agents: [agent('main')] },
  ]),
];

test('app/cmd-hints: ⌘1-9 picks a project; ⌘ held alone shows the places\' digits, ⌘[ and ⌘I; release or a key hides them', async () => {
  const core = new FakeCore(world as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'bise', size: '1100x720' });
  try {
    const { page } = s;
    const bise = page.getByTestId('app.sidebar.bise');
    await expect(bise).toBeVisible({ timeout: 10_000 });
    // ⌘1-9 / ⌘0: the sidebar's order (keys.ts)
    const screen = page.getByTestId('thread.screen');
    await page.keyboard.press('Meta+Digit1');
    await expect(page.getByTestId(`app.sidebar.project.${PS[0]?.project ?? ''}`)).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Meta+Digit3');
    await expect(page.getByTestId(`app.sidebar.project.${PS[2]?.project ?? ''}`)).toHaveAttribute('aria-current', 'true');
    await expect(screen).toBeVisible();
    await page.keyboard.press('Meta+Digit0');
    await expect(bise).toHaveAttribute('aria-current', 'true');

    const hints = page.locator('.app-keyhint');
    // a quick ⌘ shows nothing
    await page.keyboard.down('Meta');
    await page.waitForTimeout(150);
    await page.keyboard.up('Meta');
    await page.waitForTimeout(400);
    await expect(hints, 'a quick ⌘: no hint').toHaveCount(0);

    // held: bise 0, the projects 1-3 in place of their counts, ⌘[ under ‹ (a place behind), ⌘I
    await page.keyboard.down('Meta');
    await expect(page.getByTestId('app.sidebar.bise.hint')).toHaveText('0', { timeout: 2000 });
    for (const [i, p] of PS.entries()) {
      const row = page.getByTestId(`app.sidebar.project.${p.project}`);
      await expect(row.locator('.app-keyhint'), `${p.name}: ⌘${String(i + 1)}`).toHaveText(String(i + 1));
      await expect(row.locator('.app-cnt'), `${p.name}: the digit in place of its count`).toHaveCount(0);
      await expect(row.locator('.app-m'), `${p.name}: its words hide too, the digit takes the right end`).toHaveCount(0);
    }
    await expect(page.getByTestId('app.title.back.hint')).toHaveText('⌘[');
    await expect(page.getByTestId('app.title.forward.hint'), 'nothing ahead: no ⌘]').toHaveCount(0);
    await expect(page.getByTestId('inbox.block.hint')).toHaveText('⌘I');
    const box = await page.getByTestId('app.sidebar.bise.hint').locator('.b-kbd').boundingBox();
    expect(Math.round(box?.height ?? 0), 'a 16 px kbd').toBe(16);
    await page.screenshot({ path: test.info().outputPath('cmd-held-light-1100.png') });
    // released: all at once, the counts back
    await page.keyboard.up('Meta');
    await expect(hints).toHaveCount(0);
    await expect(page.getByTestId(`app.sidebar.project.${PS[2]?.project ?? ''}`).locator('.app-cnt')).toHaveText('2');
    // another key while held hides them too
    await page.keyboard.down('Meta');
    await expect(page.getByTestId('app.sidebar.bise.hint')).toBeVisible({ timeout: 2000 });
    await page.keyboard.down('Shift');
    await expect(hints, 'any other key: gone').toHaveCount(0);
    await page.keyboard.up('Shift');
    await page.keyboard.up('Meta');
  } finally {
    await s.close();
    core.dispose();
  }
});
