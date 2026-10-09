// thread/answer-images · R36 (ambient-lead m_14252 / m_14267; amb-feed's 037c83ca: Answered and
// ApprovalFold carry images: ImageRef {name, path} apart from his words). On the REAL thread screen
// (FakeCore): his answer to gift-ui's card with a pasted image reads 'you answered gift-ui' and his
// words, then the window's one image chip ('[Image #1]' with its 16 px thumbnail drawn from his
// source path, accent on accent-soft); an answer bise gave for him ('answered … for you') shows its
// chip the same way. Never the hub's marker ('<image', 'b64'), never a path in the row's text.
// Shots light and dark. Owner: amb-win.
import path from 'node:path';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'shop-ab9f3c3b';
const PNG = path.join(__dirname, '../fixtures/checker.png');
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
      { pos: 2, at_ms: NOW - 4 * MIN, kind: 'approval', text: 'you answered gift-ui', approval: { ok: true, text: 'you answered gift-ui', note: 'the balance on the cart page', images: [{ name: '[Image #1]', path: PNG }] } },
      { pos: 3, at_ms: NOW - 3 * MIN, kind: 'answered', text: 'answered gift-ui for you', answered: { agent: 'gift-ui', question: 'which colour for the badge?', answer: 'the green one', why: 'he showed it', images: [{ name: '[Image #1]', path: PNG }] } },
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
