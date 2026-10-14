// inbox/inbox-zero · designer's desktop-delight m_24404, TOUCH 3: his answer to the last waiting item
// folds the inbox block and ':* nothing waits for you' (':*' accent mono, words text-2) stands in its
// place for 2 s, then fades. On the real shell with the scripted core (FakeCore, fake data), at 1100.
// Passes when: after his answer the block is gone and the line shows; it is still there at 1.5 s and
// gone by 3 s; the hub closing the last item without him shows nothing; reduced motion shows it with
// no fade (the same opacity in every frame); ':*' sits on the content edge, the composer label's, 8 px to
// its words (designer m_24516). Frames: a strip of the line's 2.4 s (zero-strip-*.png),
// light, for designer. Owner: inbox-screen.
import { writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, pngBytes, Recorder, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const prefs = {
  ev: 'prefs',
  prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
};
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 3_600_000, waits: 0 });
const CARD = { id: 9, project: P, kind: 'question', rank: 1, agent: 'perf', question: 'which bench?', options: [{ n: 1, label: 'cold' }, { n: 2, label: 'warm' }], urgent: false, since_ms: NOW - 240_000 };
const projects = (cards: readonly unknown[]) => ({
  ev: 'projects',
  projects: [
    { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
    { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: cards.length, running: true, cards },
  ],
});
// macOS's notifications ask is an item too in a fresh home: the core says it was asked
const world = () => [
  prefs,
  projects([CARD]),
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: HOME, agents: [ag('main')] },
  { ev: 'agents', project: P, agents: [ag('main'), ag('perf')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: NOW - 300_000, kind: 'agent', text: 'two benches can tell why.' }], before: null, more: false },
];
type Cmd = { cmd?: string; card?: number };

async function answerLast(page: Page, core: FakeCore): Promise<void> {
  await page.getByTestId('inbox.block.row.1').click();
  await expect(page.getByTestId(`inbox.block.card.${P}-9`)).toBeVisible({ timeout: 3000 });
  await page.locator('[data-testid="composer.field"]').first().click();
  await page.keyboard.type('cold');
  await page.keyboard.press('Enter');
  await core.waitCmd((c) => (c as Cmd).cmd === 'answer' && (c as Cmd).card === 9, 5000);
  await core.send(projects([]) as never);
}

/** The notifications ask would keep the list from reaching zero: answer it 'not now' first, when it shows. */
async function noNotifyAsk(page: Page): Promise<void> {
  const rows = page.getByTestId('inbox.block');
  await expect(rows).toBeVisible({ timeout: 10_000 });
  const ask = page.getByText('let questions reach you as macOS notifications?');
  if ((await ask.count()) === 0) return;
  await ask.first().click();
  await page.keyboard.press('2');
  await expect(ask).toHaveCount(0, { timeout: 3000 });
}

for (const motion of ['full', 'reduced'] as const) {
  test(`inbox/inbox-zero: his answer to the last item shows ':* nothing waits for you' for 2 s, then it goes (${motion} motion)`, async () => {
    const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x720' });
    try {
      const { page } = s;
      if (motion === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' });
      await noNotifyAsk(page);
      const rec = new Recorder(s.cdp, page);
      await answerLast(page, core);
      await rec.start();
      const zero = page.getByTestId('inbox.zero');
      await expect(zero).toBeVisible({ timeout: 2000 });
      await expect(zero).toHaveText(':*nothing waits for you');
      await expect(page.getByTestId('inbox.block')).toHaveCount(0);
      const mark = await zero.locator('.inbox-zero-mark').evaluate((e) => getComputedStyle(e).fontFamily);
      expect(mark, ':* is mono').toMatch(/mono|Menlo|SF Mono|monospace/i);
      // one content edge (designer m_24516): ':*' starts where the composer's label starts, no hanging glyph
      const textLeft = (sel: string) =>
        page.evaluate((q) => {
          const el = document.querySelector(q);
          const walk = el ? document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) }) : null;
          const t = walk?.nextNode();
          if (!t) return null;
          const r = document.createRange();
          r.selectNodeContents(t);
          return Math.round(r.getBoundingClientRect().left);
        }, sel);
      const [zl, cl] = [await textLeft('[data-testid="inbox.zero"]'), await textLeft('.b-composer .div')];
      expect(zl, "':*' on the composer label's edge").toBe(cl);
      const gap = await zero.evaluate((e) => {
        const [m, w] = [e.querySelector('.inbox-zero-mark'), e.querySelector('.inbox-zero-words')];
        return m && w ? Math.round(w.getBoundingClientRect().left - m.getBoundingClientRect().right) : -1;
      });
      expect(gap, '8 px to its words').toBe(8);
      await page.waitForTimeout(1500);
      await expect(zero).toBeVisible();
      const op = await zero.evaluate((e) => Number(getComputedStyle(e).opacity));
      expect(op, 'still whole at 1.5 s').toBeGreaterThan(0.95);
      await expect(zero).toHaveCount(0, { timeout: 1500 });
      const frames = await rec.stop();
      expect(frames.length).toBeGreaterThan(5);
      if (motion === 'full') {
        // a strip for designer: every ~300 ms of the line's life
        const step = Math.max(1, Math.floor(frames.length / 8));
        for (let i = 0; i < frames.length; i += step) {
          const f = frames[i];
          if (f) writeFileSync(test.info().outputPath(`zero-strip-${String(i).padStart(3, '0')}.png`), pngBytes(f));
        }
      }
    } finally {
      await s.close();
    }
  });
}

test('inbox/inbox-zero: the hub closing the last item without him shows nothing', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x720' });
  try {
    const { page } = s;
    await noNotifyAsk(page);
    await core.send(projects([]) as never);
    await expect(page.getByTestId('inbox.block')).toHaveCount(0, { timeout: 3000 });
    await page.waitForTimeout(400);
    await expect(page.getByTestId('inbox.zero')).toHaveCount(0);
  } finally {
    await s.close();
  }
});
