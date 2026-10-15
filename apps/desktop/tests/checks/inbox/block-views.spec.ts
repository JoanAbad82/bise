// inbox/block-views · b2 (his card #476 'b + la notification native'; designer's inbox-native v2, mock b;
// ambient-lead m_15241 / m_15246, designer m_15245): the ONE inbox block over every composer, on the real
// shell with the scripted core (FakeCore, fake data), at 1100 px, light and dark. Passes when:
//   - on perf's thread, 4 waiting items fold into the head + one line (who, what, project · age), the rest
//     '+ 3 more' in the head (H10, tui-parity's thread-hierarchy: under 90 px, was ~200);
//   - a click opens the question IN PLACE (its options in the block, nothing floats) and the composer says
//     'answering perf · which bench?' + 'esc write to perf instead'; his words + ⏎ answer it (answer {card 9});
//   - the merge item opened says 'to perf · the merge waits for 1 or 2': his words go as a plain message
//     (send, never an answer), its 2 picks it (answer {card 10, reply '2'}); esc folds the block;
//   - on settings (the bottom block), ⌘I (the app menu's CmdOrCtrl+I) opens the first item in place;
//   - a window opened on 'inbox?card=<project>/<id>' (a notification's click) has that card open in place;
//   - the permission ask (macOS never asked in a fresh test home) is an ordinary item from bise, the last
//     one (H10, designer m_19835: '? bise · let questions reach you as macOS notifications?', 1 turn on ·
//     2 not now): its 1 asks (the test answers 'on') and it goes;
//   - H10 at 1400/1100/800 x 820: ≤ 224 px under the thread at rest (composer A); scrolled up, the block stays as it
//     was, no fold and the same height (designer m_21505: nothing around the composer changes on scroll),
//     the rows he reads stay put; back at the bottom the last row whole.
// Shots (looked at, for designer): folded, question opened, merge opened, ⌘I from settings, each light + dark.
// Owner: amb-home.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect, type Session } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: name === 'main' ? 'idle' : 'waiting', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 3_600_000, waits: name === 'main' ? 0 : 1 });
const two = (a: string, b: string) => [
  { n: 1, label: a },
  { n: 2, label: b },
];
const CARDS = [
  { id: 9, project: P, kind: 'question', rank: 1, agent: 'perf', question: 'which bench?', options: two('cold', 'warm'), urgent: false, since_ms: NOW - 240_000 },
  { id: 10, project: P, kind: 'feature_merge', rank: 2, agent: 'perf', question: 'merge sb/perf into main?', options: two('merge', 'not yet'), urgent: false, since_ms: NOW - 180_000 },
  { id: 11, project: P, kind: 'question', rank: 3, agent: 'search', question: 'reindex tonight or now?', options: two('tonight', 'now'), urgent: false, since_ms: NOW - 120_000 },
  { id: 12, project: P, kind: 'confirm', approval: true, rank: 4, agent: 'perf', question: 'perf wants to run rm -rf target', options: two('allow', 'no'), urgent: false, since_ms: NOW - 60_000 },
];
const projects = (cards: readonly unknown[]) => ({
  ev: 'projects',
  projects: [
    { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
    { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 3, working: 0, waits: cards.length, running: true, cards },
  ],
});
const world = (cards: readonly unknown[] = CARDS) => [
  prefs('light'),
  projects(cards),
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: HOME, agents: [ag('main')] },
  { ev: 'agents', project: P, agents: [ag('main'), ag('perf'), ag('search')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: NOW - 300_000, kind: 'agent', text: 'p95 is 900 ms on mobile; two benches can tell why.' }], before: null, more: false },
];
type Cmd = { cmd?: string; card?: number; reply?: string; text?: string };

/** One shot light, one dark (the theme as the app sets it: the core's prefs), then light again. */
async function shoot(page: Page, core: FakeCore, name: string): Promise<void> {
  await page.mouse.move(1, 300);
  await page.waitForTimeout(250);
  await page.screenshot({ path: test.info().outputPath(`${name}-light.png`) });
  await core.send(prefs('dark') as never);
  await page.waitForTimeout(400);
  await page.screenshot({ path: test.info().outputPath(`${name}-dark.png`) });
  await core.send(prefs('light') as never);
  await page.waitForTimeout(300);
}

/** ⌘I as the app menu runs it (its accelerator's click). */
async function cmdI(s: Session): Promise<string> {
  return s.app.evaluate(({ Menu, BrowserWindow }) => {
    const find = (items: Electron.MenuItem[]): Electron.MenuItem | undefined => {
      for (const it of items) {
        if (it.accelerator === 'CmdOrCtrl+I') return it;
        const sub = it.submenu ? find(it.submenu.items) : undefined;
        if (sub) return sub;
      }
      return undefined;
    };
    const it = find(Menu.getApplicationMenu()?.items ?? []);
    if (!it) return '';
    const click = it.click as unknown as (e: unknown, w: Electron.BrowserWindow | null, c: unknown) => void;
    click.call(it, {}, BrowserWindow.getAllWindows()[0] ?? null, undefined);
    return it.label;
  });
}

const composer = (page: Page) => page.getByTestId('composer').first();
const field = (page: Page) => page.locator('[data-testid="composer.field"]').first();

test("inbox/block-views: on perf's thread the block folds 4 items, opens a question in place (words answer it) and the merge (words go as a message, 2 picks it)", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x720' });
  try {
    const { page } = s;
    const block = page.getByTestId('inbox.block');
    await expect(block).toBeVisible({ timeout: 10_000 });

    // a fresh test home: macOS never asked, so bise's notifications ask is the 5th item (H10)
    await test.step("folded (inbox-stack, the TUI's box): the head, 3 lines, '+ 2 more · …' under them, the keys", async () => {
      await expect(block).toContainText('5 waiting');
      for (const n of [1, 2, 3]) await expect(page.getByTestId(`inbox.block.row.${String(n)}`)).toBeVisible();
      await expect(page.getByTestId('inbox.block.row.4')).toHaveCount(0);
      await expect(page.getByTestId('inbox.block.row.1')).toContainText('which bench?');
      await expect(page.getByTestId('inbox.block.more')).toContainText('+ 2 more · ');
      const h = await block.evaluate((e) => e.getBoundingClientRect().height);
      expect(h, 'folded, the block is five lines high (head, 3 rows, more), not more').toBeLessThan(BLOCK_H);
      await expect(page.getByTestId('inbox.block.keys')).toContainText('⌃1–5');
      expect(await page.getByTestId('inbox.block').count(), 'one block, never two').toBe(1);
      await shoot(page, core, 'folded');
    });

    await test.step("the question opens in place: 'answering perf · which bench?', his words answer it", async () => {
      await page.getByTestId('inbox.block.row.1').click();
      await expect(page.getByTestId('inbox.block.open.1')).toBeVisible({ timeout: 3000 });
      await expect(page.getByTestId(`inbox.block.card.${P}-9`)).toContainText('cold');
      await expect(composer(page)).toContainText('answering perf · which bench?');
      await expect(composer(page)).toContainText('esc write to perf instead');
      await shoot(page, core, 'question-open');
      await field(page).click();
      await page.keyboard.type('cold, on the m2');
      await page.keyboard.press('Enter');
      const a = (await core.waitCmd((c) => (c as Cmd).cmd === 'answer', 5000)) as Cmd;
      expect(a).toMatchObject({ card: 9, reply: 'cold, on the m2' });
      expect(core.cmds().some((c) => (c as Cmd).cmd === 'send'), 'the answer is no message').toBe(false);
      await core.send(projects(CARDS.slice(1)) as never);
      await expect(page.getByTestId(`inbox.block.card.${P}-9`)).toHaveCount(0);
    });

    await test.step("the merge opens: 'to perf · the merge waits for 1 or 2'; words go as a message; 2 picks it", async () => {
      await page.getByTestId('inbox.block.row.1').click();
      await expect(page.getByTestId(`inbox.block.card.${P}-10`)).toBeVisible({ timeout: 3000 });
      await expect(composer(page)).toContainText('to perf · the merge waits for 1 or 2');
      await shoot(page, core, 'merge-open');
      await field(page).click();
      await page.keyboard.type('wait for the bench first');
      await page.keyboard.press('Enter');
      const m = (await core.waitCmd((c) => (c as Cmd).cmd === 'send' && (c as Cmd).text === 'wait for the bench first', 5000)) as Cmd;
      expect(m.text).toBe('wait for the bench first');
      expect(core.cmds().filter((c) => (c as Cmd).cmd === 'answer' && (c as Cmd).card === 10), 'words never answer the merge').toHaveLength(0);
      await page.getByTestId('inbox.block').click({ position: { x: 4, y: 4 } });
      await page.keyboard.press('2');
      const a = (await core.waitCmd((c) => (c as Cmd).cmd === 'answer' && (c as Cmd).card === 10, 5000)) as Cmd;
      expect(a.reply).toBe('2');
    });

    await test.step('esc folds the block', async () => {
      await core.send(projects(CARDS.slice(2)) as never);
      await page.getByTestId('inbox.block.row.1').click();
      await expect(page.getByTestId('inbox.block.open.1')).toBeVisible({ timeout: 3000 });
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid^="inbox.block.open."]')).toHaveCount(0);
      await expect(page.getByTestId('inbox.block.row.1')).toBeVisible();
    });
  } finally {
    await s.close();
    core.dispose();
  }
});

test('inbox/block-views: on settings ⌘I opens the first item in place, in the bottom block', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'settings', size: '1100x720' });
  try {
    const { page } = s;
    await expect(page.getByTestId('app.bottom')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('inbox.block')).toBeVisible();
    expect(await cmdI(s), 'the app menu has ⌘I').not.toBe('');
    await expect(page.getByTestId('inbox.block.open.1'), '⌘I opens the first item').toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('settings.root'), 'he stays on settings').toBeVisible();
    await expect(composer(page)).toContainText('answering perf · which bench?');
    await shoot(page, core, 'cmd-i-settings');
  } finally {
    await s.close();
    core.dispose();
  }
});

test("inbox/block-views: a window opened on a notification's 'inbox?card=' has that card open in place", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `inbox?card=${P}/11`, size: '1100x720' });
  try {
    const { page } = s;
    await expect(page.getByTestId(`inbox.block.card.${P}-11`), 'the notified card is open').toBeVisible({ timeout: 12_000 });
    await expect(page.getByTestId(`inbox.block.card.${P}-11`)).toContainText('reindex tonight or now?');
  } finally {
    await s.close();
    core.dispose();
  }
});

test("inbox/block-views: an open card in the thread is one dim line pointing at the block, never a second copy with its options (designer m_15612)", async () => {
  const ask = { id: 13, project: P, kind: 'question', rank: 1, agent: 'main', question: 'which branch first?', options: two('checkout', 'gift-ui'), urgent: false, since_ms: NOW - 90_000 };
  const thread = {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: NOW - 120_000, kind: 'agent', text: 'two branches are ready to merge.' },
      { pos: 2, at_ms: NOW - 90_000, kind: 'card', text: ask.question, card: { id: 13, question: ask.question, options: ask.options, answered: false } },
    ],
    before: null,
    more: false,
  };
  const core = new FakeCore([...world([ask]), thread] as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x720' });
  try {
    const { page } = s;
    const line = page.getByTestId('thread.card.13');
    await expect(line).toHaveText('? bise asks: which branch first? · in the inbox below', { timeout: 10_000 });
    await expect(page.locator('[data-testid^="thread.card.13.opt"]'), 'no options in the thread').toHaveCount(0);
    await expect(page.getByTestId('inbox.block.row.1')).toContainText('which branch first?');
    await shoot(page, core, 'thread-line');
    await line.click();
    await expect(page.getByTestId(`inbox.block.card.${P}-13`), 'the line opens it in the block').toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="thread.list"]').getByText('[1]', { exact: false }), 'one copy of the options: in the block').toHaveCount(0);
    await shoot(page, core, 'thread-line-open');
  } finally {
    await s.close();
    core.dispose();
  }
});

test("inbox/block-views: the permission row asks macOS once ('turn on'), then goes", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x720' });
  try {
    const { page } = s;
    // H10 (designer m_19835): an ordinary item from bise, the last one ('+ 2 more': 4 cards + the ask, 3 shown)
    await expect(page.getByTestId('inbox.block.more'), 'a fresh home: macOS never asked').toContainText('+ 2 more', { timeout: 10_000 });
    await page.keyboard.press('Control+5');
    const row = page.getByTestId('inbox.block.notify');
    await expect(row).toBeVisible({ timeout: 3000 });
    await expect(row).toContainText('let questions reach you as macOS notifications?');
    await expect(page.getByTestId('inbox.block.notify.opt.1')).toContainText('turn on');
    await page.getByTestId('inbox.block.notify.opt.1').click();
    await expect(row, "the test's answer is 'on': it goes").toHaveCount(0, { timeout: 5000 });
    await expect(page.getByTestId('inbox.block.more')).toContainText('+ 1 more');
  } finally {
    await s.close();
    core.dispose();
  }
});

// H10 (tui-parity's thread-hierarchy, ambient-lead m_19826, designer m_19835): at 820 high the block +
// the composer take ≤ 224 px at rest (the thread's bottom), ≤ 120 px while he reads scrolled up: the
// block is one 36 px line then, the composer's keys line hides, and the rows he reads don't move; back
// at the bottom both come back and the last row shows whole. Frames at 1400, 1100 and 800, light + dark.
// inbox-stack (his ask: up to 3 items stacked, as the TUI's box): the folded block is its head, 3
// rows and the '+ N more' row (148 px measured); the block + the composer at rest 308 px (was 224
// with one line: 3 more 28 px lines)
const BLOCK_H = 160;
const BOTTOM_H = 320;
const LONG = Array.from({ length: 60 }, (_, i) => ({ pos: i + 1, at_ms: NOW - 3_600_000 + i * 1000, kind: 'agent', text: `bench note ${String(i + 1)}: p95 moved by ${String(i % 7)} ms on the cold path, nothing else changed.` }));
const longWorld = () => world().map((e) => ((e as { ev: string; agent?: string }).ev === 'thread' && (e as { agent?: string }).agent === 'perf' ? { ...e, entries: LONG } : e));
/** the inbox block's top to the window's bottom: the block, the composer and its lines */
const bottomPart = (page: Page) => page.evaluate(() => window.innerHeight - (document.querySelector('[data-testid="inbox.block"]')?.getBoundingClientRect().top ?? window.innerHeight));

for (const size of ['1400x820', '1100x820', '800x820'] as const) {
  test(`inbox/block-views: H10 at ${size}: the head + 3 lines + more at rest, the same while he reads`, async () => {
    const core = new FakeCore(longWorld() as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `agent/${P}/perf`, size });
    const w = size.split('x')[0] ?? size;
    try {
      const { page } = s;
      const block = page.getByTestId('inbox.block');
      await expect(block).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText('bench note 60:')).toBeVisible({ timeout: 5000 });
      // the composer is the tab + the box with its 32 px row now (designer's composer-strip A, signed
      // m_24325): 44 px more than the old label line and box, so the budget is 180 + 44
      await test.step(`at rest: the head + 3 lines + more, the composer whole, ≤ ${String(BOTTOM_H)} px`, async () => {
        await expect(page.getByTestId('inbox.block.row.3')).toBeVisible();
        expect(await block.evaluate((e) => e.getBoundingClientRect().height), 'the head + 3 lines + more').toBeLessThan(BLOCK_H);
        const bottom = await bottomPart(page);
        expect(bottom, 'the block + the composer at rest').toBeLessThanOrEqual(BOTTOM_H);
        await expect(page.getByTestId('composer.keys')).toBeVisible();
        await shoot(page, core, `h10-${w}-rest`);
      });
      await test.step('scrolled up: the block stays as it was (no fold, same height), the rows he reads stay put', async () => {
        const before = await block.evaluate((e) => Math.round(e.getBoundingClientRect().height));
        await page.getByTestId('thread.list').hover();
        await page.mouse.wheel(0, -900);
        await expect(page.getByText('bench note 60:')).toBeHidden({ timeout: 3000 });
        // the wheel is a smooth scroll (~370 ms, longer under load) that goes on after the line shows,
        // and Virtuoso fixes the heights of the rows above as it draws them: y is read once the list
        // stops (the same scrollTop over 3 frames); what must not come after is a move of its own
        await page.evaluate(
          () =>
            new Promise<void>((done) => {
              const s = document.querySelector<HTMLElement>('[data-virtuoso-scroller]');
              let last = Number.NaN;
              let same = 0;
              const t0 = performance.now();
              const f = () => {
                const t = s?.scrollTop ?? 0;
                same = t === last ? same + 1 : 0;
                last = t;
                if (same >= 3 || performance.now() - t0 > 3000) done();
                else requestAnimationFrame(f);
              };
              requestAnimationFrame(f);
            }),
        );
        const note = page.getByText('bench note 40:');
        const y = await note.evaluate((e) => e.getBoundingClientRect().top).catch(() => null);
        await page.waitForTimeout(400);
        const y2 = await note.evaluate((e) => e.getBoundingClientRect().top).catch(() => null);
        if (y !== null && y2 !== null) expect(Math.abs(y2 - y), 'the rows he reads stay put').toBeLessThan(1);
        // nothing around the composer changes on scroll (designer m_21505): the block keeps its head,
        // its line and its height; only his hand or its content folds or opens it
        await expect(page.getByTestId('inbox.block.row.1')).toBeVisible();
        await expect(block).not.toHaveAttribute('data-open');
        expect(await block.evaluate((e) => Math.round(e.getBoundingClientRect().height)), 'the block keeps its height').toBe(before);
        await page.mouse.move(1, 300);
        await shoot(page, core, `h10-${w}-reading`);
      });
      await test.step('back at the bottom: the block and the keys line come back, the last row whole', async () => {
        await page.getByTestId('thread.list').hover();
        await page.mouse.wheel(0, 20_000);
        await expect(page.getByTestId('inbox.block.row.1')).toBeVisible({ timeout: 3000 });
        await expect(page.getByTestId('composer.keys')).toBeVisible();
        await page.waitForTimeout(300);
        const last = await page.getByText('bench note 60:').evaluate((e) => e.getBoundingClientRect().bottom);
        const top = await page.getByTestId('inbox.block').evaluate((e) => e.getBoundingClientRect().top);
        expect(last, 'the last row shows whole above the block').toBeLessThanOrEqual(top);
      });
    } finally {
      await s.close();
      core.dispose();
    }
  });
}

// one inbox, commit 1 (designer m_19631, page desktop-right-bar): the block's row is the same everywhere,
// 'n ? agent question… <project> · <age>', bise's own items say 'bise'; the head counts the projects;
// an item of another project opened from a project's thread names its agent and project in the composer.
const T = 'telemetry-5e6f7a8b';
const THREE = [
  { id: 21, project: T, kind: 'question', rank: 0, agent: 'p99', question: 'which percentile goes on the dashboard?', options: two('p95', 'p99'), urgent: true, since_ms: NOW - 300_000 },
  ...CARDS.slice(0, 2),
  { id: 31, project: HOME, kind: 'question', rank: 3, agent: 'main', question: 'send the weekly update to the team?', options: two('send', 'not yet'), urgent: false, since_ms: NOW - 3_600_000 },
];
const threeWorld = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 1, running: true, cards: THREE.filter((c) => c.project === HOME) },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 3, working: 0, waits: 2, running: true, cards: THREE.filter((c) => c.project === P) },
      { project: T, name: 'telemetry', path: '/nowhere/telemetry', git: true, home: false, order: 2, agents: 2, working: 1, waits: 1, running: true, cards: THREE.filter((c) => c.project === T) },
    ],
  },
  ...world(THREE).slice(2),
  { ev: 'welcome', project: T, proto: 1, workspace: '/nowhere/telemetry', name: 'telemetry' },
  { ev: 'agents', project: T, agents: [ag('main'), ag('p99')] },
];

test("inbox/block-views: one inbox, 3 projects: the row says its project, the head counts them, another project's item names it in the composer", async () => {
  const core = new FakeCore(threeWorld() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x820' });
  try {
    const { page } = s;
    const block = page.getByTestId('inbox.block');
    await expect(block).toBeVisible({ timeout: 10_000 });
    await test.step("folded: 'inbox · 5 waiting · 3 projects', the first row ends 'telemetry · <age>'", async () => {
      await expect(block).toContainText('5 waiting · 3 projects');
      const row = page.getByTestId('inbox.block.row.1');
      await expect(row.locator('.strip-who')).toHaveText('p99');
      await expect(row.locator('.strip-what')).toContainText('which percentile');
      await expect(row.locator('.end')).toHaveText(/^telemetry · /u);
      await shoot(page, core, 'one-inbox-folded');
    });
    await test.step("opened from acme's thread: 'answering p99 · telemetry · …', the card's head says its project", async () => {
      await page.getByTestId('inbox.block.row.1').click();
      await expect(page.getByTestId(`inbox.block.card.${T}-21`)).toBeVisible({ timeout: 3000 });
      await expect(page.getByTestId(`inbox.block.card.${T}-21.project`)).toHaveText('· telemetry');
      await expect(composer(page)).toContainText('answering p99 · telemetry · which percentile');
      await expect(composer(page)).toContainText('esc write to perf instead');
      await shoot(page, core, 'one-inbox-other');
      await field(page).click();
      await page.keyboard.type('p99, with p95 under it');
      await page.keyboard.press('Enter');
      const a = (await core.waitCmd((c) => (c as Cmd).cmd === 'answer', 5000)) as Cmd & { project?: string };
      expect(a).toMatchObject({ card: 21, reply: 'p99, with p95 under it' });
    });
  } finally {
    await s.close();
    core.dispose();
  }
});

// designer m_26234: a short window gives rows back, 3 → 2 → 1, so the thread keeps 40% of the
// window; the '+ n more' row counts what went; never a scroll inside the folded block. On this world
// (85 px above the thread, 196 px of head and composer, 28 px rows) 3 rows hold from 655 px, 2 from 608
for (const [size, want] of [['1100x700', 3], ['1100x630', 2], ['1100x560', 1]] as const) {
  test(`inbox/block-views: a short window at ${size}: ${String(want)} row(s), the thread keeps 40%`, async () => {
    const core = new FakeCore(longWorld() as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `agent/${P}/perf`, size });
    try {
      const { page } = s;
      const block = page.getByTestId('inbox.block');
      await expect(block).toBeVisible({ timeout: 10_000 });
      // the harness's size sets the width only: the content height is set here
      const [w, h] = size.split('x').map(Number);
      await s.app.evaluate(({ BrowserWindow }, [w2, h2]) => {
        const win = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
        win?.setContentSize(w2 ?? 0, h2 ?? 0);
      }, [w, h] as const);
      await expect.poll(() => page.evaluate(() => window.innerHeight)).toBe(h);
      await expect(block).toHaveAttribute('data-rows', String(want), { timeout: 3000 });
      for (let n = 1; n <= 5; n++) await expect(page.getByTestId(`inbox.block.row.${String(n)}`)).toHaveCount(n <= want ? 1 : 0);
      await expect(page.getByTestId('inbox.block.more')).toContainText(`+ ${String(5 - want)} more · `);
      const m = await page.evaluate(() => {
        const b = document.querySelector('[data-testid="inbox.block"]');
        const l = document.querySelector('[data-testid="thread.list"]');
        return { win: window.innerHeight, top: l?.getBoundingClientRect().top ?? 0, block: b?.getBoundingClientRect().top ?? 0, scroll: (b?.scrollHeight ?? 0) - (b?.clientHeight ?? 0) };
      });
      expect(m.scroll, 'never a scroll inside the folded block').toBeLessThanOrEqual(1);
      if (want > 1) expect(m.block - m.top, 'the thread keeps 40% of the window').toBeGreaterThanOrEqual(0.4 * m.win);
      await shoot(page, core, `short-${size}`);
    } finally {
      await s.close();
      core.dispose();
    }
  });
}

test("inbox/block-views: one inbox on bise's home: bise's own items say 'bise · <age>'", async () => {
  const core = new FakeCore(threeWorld() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${HOME}/main`, size: '1100x820' });
  try {
    const { page } = s;
    const block = page.getByTestId('inbox.block');
    await expect(block).toBeVisible({ timeout: 10_000 });
    await expect(block).toContainText('3 projects');
    // bise's own item, opened: its card's head says '· bise' like any project's (designer m_19631)
    await page.getByTestId('inbox.block.more').click();
    const home = page.getByTestId(`inbox.block.card.${HOME}-31`);
    for (let i = 0; i < 5 && !(await home.isVisible()); i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(150);
    }
    await expect(home).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId(`inbox.block.card.${HOME}-31.project`)).toHaveText('· bise');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('inbox.block.row.1').locator('.end')).toHaveText(/^telemetry · /u);
    await shoot(page, core, 'one-inbox-home');
  } finally {
    await s.close();
    core.dispose();
  }
});
