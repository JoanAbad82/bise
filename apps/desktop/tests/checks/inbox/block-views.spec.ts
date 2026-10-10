// inbox/block-views · b2 (his card #476 'b + la notification native'; designer's inbox-native v2, mock b;
// ambient-lead m_15241 / m_15246, designer m_15245): the ONE inbox block over every composer, on the real
// shell with the scripted core (FakeCore, fake data), at 1100 px, light and dark. Passes when:
//   - on perf's thread, 4 waiting items fold into 3 lines + '+ 1 more' (who, what, project · age);
//   - a click opens the question IN PLACE (its options in the block, nothing floats) and the composer says
//     'answering perf · which bench?' + 'esc write to perf instead'; his words + ⏎ answer it (answer {card 9});
//   - the merge item opened says 'to perf · the merge waits for 1 or 2': his words go as a plain message
//     (send, never an answer), its 2 picks it (answer {card 10, reply '2'}); esc folds the block;
//   - on settings (the bottom block), ⌘I (the app menu's CmdOrCtrl+I) opens the first item in place;
//   - a window opened on 'inbox?card=<project>/<id>' (a notification's click) has that card open in place;
//   - the permission row ('questions can reach you…', macOS never asked in a fresh test home): 'turn on'
//     asks (the test answers 'on') and the row goes.
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

    await test.step('folded: 3 lines + 1 more, the keys', async () => {
      await expect(block).toContainText('4 waiting');
      for (const n of [1, 2, 3]) await expect(page.getByTestId(`inbox.block.row.${String(n)}`)).toBeVisible();
      await expect(page.getByTestId('inbox.block.row.1')).toContainText('which bench?');
      await expect(page.getByTestId('inbox.block.more')).toContainText('+ 1 more');
      await expect(page.getByTestId('inbox.block.keys')).toContainText('⌃1–4');
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
    const row = page.getByTestId('inbox.block.notify');
    await expect(row, 'a fresh home: macOS never asked').toBeVisible({ timeout: 10_000 });
    await expect(row).toContainText("questions can reach you when bise isn't in front, as macOS notifications.");
    await page.getByTestId('inbox.block.notify.on').click();
    await expect(row, "the test's answer is 'on': the row goes").toHaveCount(0, { timeout: 5000 });
  } finally {
    await s.close();
    core.dispose();
  }
});
