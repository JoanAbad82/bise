// thread/answer-images · R36 (ambient-lead m_14252 / m_14267; amb-feed's 037c83ca: Answered and
// ApprovalFold carry images: ImageRef {name, path} apart from his words). On the REAL thread screen
// (FakeCore; his images ride in Entry.parts since msg-parts sha d, a4babf54): his answer to gift-ui's card with a pasted image reads 'you answered gift-ui' and his
// words, then the window's one image chip ('[Image #1]' with its 16 px thumbnail drawn from his
// source path, accent on accent-soft); an answer bise gave for him ('answered … for you') shows its
// chip the same way. Never the hub's marker ('<image', 'b64'), never a path in the row's text.
// Shots light and dark. Owner: amb-win.
// Real-shaped data too (designer's R36 red on 387ad740): the store names a pasted image by its sha
// ('bd913dd2…6569.png'); the chip still reads '[Image #1]' and stays inside the column.
import { copyFileSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'shop-ab9f3c3b';
const SHA = 'bd913dd20e9e8cf0a03080f1df7859b3fd1a7581bd95070815b9330e131d6569.png';
// his pasted image as the store keeps it: a sha-named file in its own images folder
const PNG = path.join(mkdtempSync(path.join(os.tmpdir(), 'r36-images-')), SHA);
copyFileSync(path.join(__dirname, '../fixtures/checker.png'), PNG);
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 9 * MIN, waits: 0 });
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  { ev: 'agents', project: P, agents: [ag('main'), ag('gift-ui')] },
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: NOW - 5 * MIN, kind: 'agent', text: 'gift-ui asks: show the balance on the cart page, or only at checkout?' },
      { pos: 2, at_ms: NOW - 4 * MIN, kind: 'approval', text: 'you answered gift-ui', approval: { ok: true, text: 'you answered gift-ui', note: 'the balance on the cart page' }, parts: [{ kind: 'text', text: 'the balance on the cart page' }, { kind: 'image', name: SHA, source: PNG }] },
      { pos: 3, at_ms: NOW - 3 * MIN, kind: 'answered', text: 'answered gift-ui for you', answered: { agent: 'gift-ui', question: 'which colour for the badge?', answer: 'the green one', why: 'he showed it', images: [{ name: SHA, path: PNG }] } },
      // his answer to main's OWN card, as the hub still sends it: a raw line from 'switchboard' (designer m_15195)
      { pos: 4, at_ms: NOW - 2 * MIN, kind: 'from_agent', from: 'switchboard', text: 'the user answered card #1 ("merge checkout into main? (2 files, tests pass) 1. merge 2. not yet"): "[Image #1] this one"' },
      // the same answer as a newer hub sends it (amb-feed c02ad231): ONE typed approval row, the raw line gone
      { pos: 5, at_ms: NOW - 1 * MIN, kind: 'approval', text: 'you answered main: [Image #1] this one', approval: { ok: true, text: 'you answered main: [Image #1] this one' }, parts: [{ kind: 'image', name: SHA, source: PNG }, { kind: 'text', text: 'this one' }] },
    ],
    before: null,
    more: false,
  },
];

test("thread/answer-images: 'you answered gift-ui' shows his words and the image chip with its thumbnail, never the marker or a path", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x760' });
  try {
    const { page } = s;
    const row = page.getByTestId('thread.approval.2');
    await expect(row).toContainText('you answered gift-ui', { timeout: 10_000 });
    await expect(row).toContainText('the balance on the cart page');
    const chip = page.getByTestId('thread.approval.2.image.1');
    await expect(chip).toHaveText('[Image #1]');
    const thumb = chip.locator('img.thumb');
    await expect.poll(() => thumb.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0), { message: 'its thumbnail is drawn from his path' }).toBe(true);
    expect(Math.round((await thumb.boundingBox())?.width ?? 0), 'a 16 px thumbnail').toBe(16);
    for (const id of ['thread.approval.2', 'thread.answered.3']) {
      const text = await page.getByTestId(id).innerText();
      expect(text, `${id}: never the hub's marker`).not.toContain('<image');
      expect(text, `${id}: never a b64 path`).not.toContain('b64');
      expect(text, `${id}: never his path`).not.toContain(PNG);
    }
    await expect(page.getByTestId('thread.answered.3.image.1'), "bise's answer for him: the same chip").toHaveText('[Image #1]');
    // main's own card answered: the '✓ you answered' row with the chip, never the hub's raw line
    // the same order as the rows above (designer m_15420): what was asked, his words, the chip
    await expect(page.getByTestId('thread.cardanswer.4.head')).toHaveText('✓you answered: merge checkout into main? (2 files, tests pass)');
    await expect(page.getByTestId('thread.cardanswer.4.words')).toHaveText('this one');
    await expect(page.getByTestId('thread.cardanswer.4.image.1')).toHaveText('[Image #1]');
    // the raw line names no file: the chip keeps its 16 px slot with a faint image glyph (designer m_15943)
    const slot = await page.getByTestId('thread.cardanswer.4.image.1').locator('.thumb').boundingBox();
    expect(Math.round(slot?.width ?? 0), 'the same 16 px slot as the chips with a thumbnail').toBe(16);
    const ys = await Promise.all(['head', 'words', 'image.1'].map(async (k) => (await page.getByTestId(`thread.cardanswer.4.${k}`).boundingBox())?.y ?? 0));
    expect(ys[0] ?? 0, 'his words under the question').toBeLessThan(ys[1] ?? 0);
    expect(ys[1] ?? 0, 'the chip under his words').toBeLessThan(ys[2] ?? 0);
    // a newer hub's typed row: the chip is the image, so his words never say '[Image #1]' too (designer m_15891)
    // messages-right v1: his side, '✓ you answered main' dim over his words in the bubble
    await expect(page.getByTestId('thread.approval.5.head')).toHaveText('✓you answered main');
    await expect(page.getByTestId('thread.approval.5.words')).toHaveText('this one');
    await expect(page.getByTestId('thread.approval.5.image.1')).toHaveText('[Image #1]');
    expect(await page.getByTestId('thread.approval.5').innerText(), 'the mark once: the chip').toMatch(/^[^[]*\[Image #1\][^[]*$/u);
    const all = await page.getByTestId('thread.list').innerText();
    expect(all, 'never the raw line').not.toContain('the user answered card');
    expect(all, 'never the old product name').not.toContain('switchboard');
    // never the store's file name; every chip inside the thread's column
    for (const id of ['thread.approval.2', 'thread.answered.3']) {
      expect(await page.getByTestId(id).innerText(), `${id}: never the store's file name`).not.toContain(SHA.slice(0, 8));
      const fit = await page.getByTestId(`${id}.image.1`).evaluate((el) => {
        const col = el.closest('[data-testid="thread.list"]') ?? document.body;
        return { right: el.getBoundingClientRect().right, colRight: col.getBoundingClientRect().right, over: el.scrollWidth - el.clientWidth };
      });
      expect(fit.right, `${id}: the chip ends inside the column`).toBeLessThanOrEqual(fit.colRight + 0.5);
      expect(fit.over, `${id}: its words fit the chip`).toBeLessThanOrEqual(1);
    }
    // the chip's colours are the accent on its soft fill, as everywhere
    const look = await chip.evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--c-accent)';
      probe.style.background = 'var(--c-accent-soft)';
      el.parentElement?.appendChild(probe);
      const want = { c: getComputedStyle(probe).color, b: getComputedStyle(probe).backgroundColor };
      probe.remove();
      return { c: getComputedStyle(el).color, b: getComputedStyle(el).backgroundColor, want };
    });
    expect(look.c).toBe(look.want.c);
    expect(look.b).toBe(look.want.b);
    await page.mouse.move(1, 300);
    await page.screenshot({ path: test.info().outputPath('answer-image-light.png') });
    await core.send(prefs('dark') as never);
    await page.waitForTimeout(300);
    await page.screenshot({ path: test.info().outputPath('answer-image-dark.png') });
  } finally {
    await s.close();
    core.dispose();
  }
});
