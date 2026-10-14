// inbox/ghost-badge · his live try (233baf9a): «je vois des 1 mais je ne vois rien quand je clique
// dessus»; he answered a page's drafts on the page, the hub re-asked it as a new card, he answered
// that card from the inbox, the hub answered ok and kept it open (a drafts card's words or
// '1. review'). The sidebar counted it from the hub's rows; every inbox hid it (the window's acted
// set waited for rows that never dropped it). And '/inbox' did nothing: it opens the block's first
// item, and the block listed none. On the real shell with the scripted core (FakeCore, fake data).
// Passes when:
//   - the card the hub keeps after his answer is back in the block, and the sidebar's count is the
//     block's ('1' on the project, '1 waiting' in the block): no ghost;
//   - '/inbox' typed in the composer opens the block's item in place;
//   - '/inbox' with nothing waiting says so under the composer, never a silent nothing.
// Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'docs-1a2b3c4d';
const NOW = Date.now();
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 3_600_000, waits: 0 });
const page = (id: number) => ({ id: 'mail-lawyer', url: 'http://127.0.0.1:1/p/mail-lawyer#e1', block: 'e1', item: 'e1', n: id });
const drafts = (id: number) => ({
  id,
  project: P,
  kind: 'question',
  rank: 1,
  agent: 'main',
  question: `2 drafts wait for you · mail to the lawyer (#${String(id)})`,
  options: [
    { n: 1, label: 'review' },
    { n: 2, label: 'send both' },
  ],
  page: { id: page(id).id, url: page(id).url, block: 'e1', item: 'e1' },
  urgent: false,
  since_ms: NOW - 60_000,
});
const projects = (cards: readonly unknown[]) => ({
  ev: 'projects',
  projects: [
    { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true, cards: [] },
    { project: P, name: 'docs', path: '/nowhere/docs', git: true, home: false, order: 1, agents: 1, working: 0, waits: cards.length, running: true, cards },
  ],
});
const world = [
  {
    ev: 'prefs',
    prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
  },
  projects([drafts(16)]),
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/docs', name: 'docs' },
  { ev: 'agents', project: HOME, agents: [ag('main')] },
  { ev: 'agents', project: P, agents: [ag('main')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 300_000, kind: 'agent', text: 'the mail to the lawyer is on its page.' }], before: null, more: false },
];
type Cmd = { cmd?: string; card?: number; reply?: string; project?: string };

test("inbox/ghost-badge: a card the hub keeps after his inbox answer is back in the block, the sidebar's count is the block's; '/inbox' opens it, or says nothing waits", async () => {
  const core = new FakeCore(world as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/main`, size: '1100x760' });
  try {
    const { page: w } = s;
    const block = w.getByTestId('inbox.block');
    const count = w.getByTestId(`app.sidebar.project.${P}`).locator('.app-cnt');
    await expect(block).toBeVisible({ timeout: 10_000 });
    // the notifications' permission row is an item of the block too: 'not now' twice, out of the way
    await w.evaluate(() => {
      localStorage.setItem('bise.notify.notnow', '2');
    });
    await w.reload();
    await expect(block).toBeVisible({ timeout: 10_000 });
    await expect(block).toContainText('1 waiting');
    await expect(count).toHaveText('1');

    await test.step('answered on the page: the hub re-asks it as card 19 (16 replaced)', async () => {
      await core.send(projects([drafts(19)]) as never);
      await expect(block).toContainText('#19', { timeout: 3000 });
    });

    await test.step('his words on card 19 from the inbox; the hub answers ok and keeps it: back in the block, no ghost', async () => {
      await core.result('answer', 19, {});
      await w.getByTestId('inbox.block.row.1').click();
      await expect(w.getByTestId(`inbox.block.card.${P}-19`)).toHaveCount(1, { timeout: 3000 });
      await w.keyboard.type('on peut pas donner accès à son email?');
      await w.keyboard.press('Enter');
      const a = (await core.waitCmd((c) => (c as Cmd).cmd === 'answer' && (c as Cmd).card === 19, 5000)) as Cmd;
      expect(a.reply).toContain('donner accès');
      // the step's rows (still #19) came before the answer: the card is his again
      await core.send(projects([drafts(19)]) as never);
      await expect(block).toBeVisible({ timeout: 3000 });
      await expect(block).toContainText('1 waiting', { timeout: 3000 });
      await expect(block).toContainText('#19');
      await expect(count).toHaveText('1');
    });

    await test.step("'/inbox' in the composer opens the item in place", async () => {
      await w.keyboard.press('Escape');
      await expect(w.getByTestId(`inbox.block.card.${P}-19`)).toHaveCount(0, { timeout: 3000 });
      await w.locator('[data-testid="composer.field"]').click();
      await w.keyboard.type('/inbox');
      await w.keyboard.press('Enter');
      await expect(w.getByTestId(`inbox.block.card.${P}-19`)).toHaveCount(1, { timeout: 3000 });
      expect(core.cmds().some((c) => (c as { cmd?: string; line?: string }).line === '/inbox'), "'/inbox' is the window's, never the hub's").toBe(false);
      await w.keyboard.press('Escape');
    });

    await test.step("'/inbox' with nothing waiting says so", async () => {
      await core.send(projects([]) as never);
      await expect(block).toHaveCount(0, { timeout: 3000 });
      await expect(count).toHaveCount(0);
      await w.locator('[data-testid="composer.field"]').click();
      await w.keyboard.type('/inbox');
      await w.keyboard.press('Enter');
      await expect(w.getByTestId('composer.answer.note')).toContainText('nothing waits for you.', { timeout: 3000 });
    });
  } finally {
    await s.close();
  }
});
