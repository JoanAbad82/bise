// inbox/block-long · bar I8 in the inbox block (qa-native 9108fdae amber, ambient-lead m_16822): a 16-line
// ask opened in the block at a thread's bottom, focus in the composer. Passes when, on the built app with
// the scripted core (FakeCore, fake data):
//   - folded, the card shows the first lines and '… N more lines', 'line 16' is not on screen;
//   - ctrl+o: the card grows (its height cap lifts), 'line 16' is on screen inside the window;
//   - ctrl+o again: the card is back to its folded height.
// Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'shop-5e6f7a8b';
const NL = String.fromCharCode(10);
const LONG = ['which plan for the cart?', ...Array.from({ length: 15 }, (_, i) => `line ${String(i + 2)}: the cart page loads its totals twice when the coupon field is open`)].join(NL);
const card = { id: 21, project: P, kind: 'question', rank: 1, agent: 'main', question: LONG, options: [{ n: 1, label: 'fix totals first' }, { n: 2, label: 'ship as is' }], urgent: false, since_ms: 1791100100000 };
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const world = () => [
  { ev: 'prefs', prefs: { onboarded: true, theme: 'light' } },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 1, working: 0, waits: 1, running: true, cards: [card] },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  { ev: 'agents', project: P, agents: [agent('main')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'one question for you below.' }], before: null, more: false },
];

test('inbox/block-long: ctrl+o lifts the open card height cap in the inbox block, again folds it', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/main` });
  const { page } = s;
  try {
    await expect(page.getByTestId('inbox.block')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('inbox.block.row.1').click();
    const open = page.getByTestId(`inbox.block.card.${P}-21`);
    await expect(open).toBeVisible({ timeout: 5000 });
    await page.getByTestId('composer.field').click();
    const last = open.getByText('line 16: the cart page', { exact: false });
    const shown = async () => {
      // folded, the line isn't in the DOM at all
      if ((await last.count()) === 0) return false;
      const r = await last.first().boundingBox();
      const h = await page.evaluate(() => window.innerHeight);
      return r !== null && r.height > 0 && r.y >= 0 && r.y + r.height <= h;
    };
    const h0 = (await open.boundingBox())?.height ?? 0;
    expect(await shown(), "folded: 'line 16' isn't on screen").toBe(false);
    await page.screenshot({ path: test.info().outputPath('long-folded.png') });

    await page.keyboard.press('Control+o');
    await expect.poll(async () => (await open.boundingBox())?.height ?? 0, { timeout: 3000, message: 'ctrl+o: the card grows' }).toBeGreaterThan(h0 + 40);
    const h1 = (await open.boundingBox())?.height ?? 0;
    const where = await page.evaluate(() => {
      const box = (sel: string) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; };
      return { win: window.innerHeight, card: box('[data-testid^="inbox.block.card."]'), composer: box('[data-testid="composer.field"]') };
    });
    test.info().annotations.push({ type: 'where', description: JSON.stringify(where) });
    // the card and the composer under it stay inside the window
    expect((where.card?.[1] ?? 9999) <= where.win && (where.composer?.[1] ?? 9999) <= where.win, `inside the window ${JSON.stringify(where)}`).toBe(true);
    // every line is there: the question scrolls inside the card to its last line
    await open.getByTestId(`inbox.block.card.${P}-21.q`).evaluate((e) => { e.scrollTop = e.scrollHeight; });
    expect(await shown(), "ctrl+o: 'line 16' is on screen once the question is scrolled").toBe(true);
    await page.screenshot({ path: test.info().outputPath('long-whole.png') });

    await page.keyboard.press('Control+o');
    await expect.poll(async () => Math.round((await open.boundingBox())?.height ?? 0), { timeout: 3000, message: 'ctrl+o again: back to its folded height' }).toBe(Math.round(h0));
    test.info().annotations.push({ type: 'heights', description: `folded ${String(Math.round(h0))} px, whole ${String(Math.round(h1))} px` });
  } finally {
    await s.close();
    core.dispose();
  }
});
