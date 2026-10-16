// composer/art-target · his ask (main m_26949): « quand un artifact est ouvert, entourer l'input en
// rose aussi, comme quand une notification est ouverte, pour montrer qu'on parle à un sous-agent et
// pas au main ». composer-target A's pink (1.5 px accent border, accent tab, accent send) on an open
// artifact's composer when his words go to its live maker. Passes when, on the scripted core
// (FakeCore, fake data), from acme's main at 1400:
//   (1) perf's artifact open: the box has the 1.5 px accent border, the tab is in the accent with
//       '↳ to perf · about “…”' and 'esc to bise instead' at its right, its tip 'your words go to
//       perf, not bise · esc writes to bise', the send filled accent; his line goes to perf;
//   (2) perf's question open beside it: the question's own pink ('↳ answering perf · …');
//       perf's merge open beside it: the approval's plain line ('to perf · the merge waits…'), no pink;
//   (3) esc closes the artifact: main's thread, 'to bise', no pink; ✕ the same;
//   (4) main's own artifact: plain ('to bise · about “…”'), no end, no pink.
// Shots for designer: art-<theme>-pink, -typed, -question, -approval, -after-esc, -main.
import type { Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { composer } from '../../../src/proto/words.gen';

import { inbox } from '../../../src/proto/words_inbox.gen';
const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const MIN = 60_000;
const TITLE = 'product page, before / after';
/** the pink label: whole, or its head alone */
const PINK = new RegExp(`^↳ to perf(?: · about “${TITLE.replace(/[/]/gu, '\\/')}”)?$`, 'u');
const prefs = (theme: 'light' | 'dark') => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const PAGE = (dark: boolean, h: string) => `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;background:${dark ? '#1f1d1a' : '#f4efe6'};color:${dark ? '#ece7de' : '#1d1b18'};font:17px/1.55 -apple-system,sans-serif}
body{padding:40px 48px;box-sizing:border-box}h1{font-size:28px;margin:0 0 12px}
</style></head><body><h1>${h}</h1><p>before: 2.4 MB hero, 3.1 s to paint. after: 180 KB, 0.9 s.</p></body></html>`;
async function pagesServer(): Promise<{ url: string; server: Server }> {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(PAGE(/[?&]theme=dark\b/u.test(req.url ?? ''), (req.url ?? '').includes('weekly') ? 'weekly update' : TITLE));
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`, server };
}
const world = (now: number, pages: string) => {
  const ag = (name: string, waits = 0) => ({ name, main: name === 'main', status: waits > 0 ? 'waiting' : 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: now - 60 * MIN, waits, watching: [] });
  const cards = [
    { id: 1, project: P, kind: 'question', rank: 1, agent: 'perf', question: 'keep the webp next to the avif?', options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], urgent: false, since_ms: now - 1 * MIN },
    { id: 3, project: P, kind: 'merge', approval: true, rank: 2, agent: 'perf', question: 'merge sb/perf into main? 3 files, the hero image goes from 2.4 MB to 180 KB', options: [{ n: 1, label: 'merge it' }, { n: 2, label: 'not yet' }], urgent: false, since_ms: now - 2 * MIN },
  ];
  return [
    prefs('light'),
    {
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: 2, running: true, cards },
      ],
    },
    { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
    { ev: 'agents', project: P, agents: [ag('main'), ag('perf', 2)] },
    { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: now - 3 * MIN, kind: 'agent', text: 'perf made the product page for you.' }], before: null, more: false },
    {
      ev: 'thread',
      project: P,
      agent: 'perf',
      entries: [
        { pos: 1, at_ms: now - 6 * MIN, kind: 'you', text: 'make me a before / after page of the product page' },
        { pos: 2, at_ms: now - 5 * MIN, kind: 'artifact', text: TITLE, made: { id: 'product-page', agent: 'perf', title: TITLE, kind: 'page', kind_word: 'page', v: 1 } },
      ],
      before: null,
      more: false,
    },
    {
      ev: 'artifacts',
      project: P,
      items: [
        { id: 'product-page', kind: 'page', title: TITLE, agent: 'perf', version: 1, at_ms: now - 5 * MIN, url: `${pages}/p/product-page`, new: true },
        { id: 'weekly', kind: 'page', title: 'weekly update', agent: 'main', version: 1, at_ms: now - 4 * MIN, url: `${pages}/p/weekly`, new: false },
      ],
    },
  ];
};

type Cmd = { cmd?: string; project?: string; agent?: string; text?: string };

/** The composer's pink parts, read from the computed style. */
const look = (page: Page) =>
  page.evaluate(() => {
    const q = (s: string) => document.querySelector<HTMLElement>(s);
    const box = q('[data-testid="composer.box"]');
    const tab = q('[data-testid="composer.tab"]');
    const send = q('[data-testid="composer.send"]');
    const probe = document.createElement('span');
    probe.style.color = 'var(--c-accent)';
    document.body.append(probe);
    const accent = getComputedStyle(probe).color;
    probe.remove();
    return {
      accent,
      boxShadow: box === null ? '' : getComputedStyle(box).boxShadow,
      tabTip: tab?.dataset['tip'] ?? null,
      tabAcc: tab?.classList.contains('acc') ?? false,
      tabColor: tab === null ? '' : getComputedStyle(tab.querySelector('.lbl') ?? tab).color,
      sendBg: send === null ? '' : getComputedStyle(send).backgroundColor,
    };
  });

for (const theme of ['light', 'dark'] as const) {
  test(`composer/art-target: pink while an open artifact's words go to its live maker, its item's state beside it, plain for main's, off on esc (${theme})`, async () => {
    test.setTimeout(180_000);
    const pages = await pagesServer();
    const core = new FakeCore(world(Date.now(), pages.url) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900' });
    try {
      const { page } = s;
      await page.setViewportSize({ width: 1400, height: 900 });
      await core.send(prefs(theme) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(theme);
      const shot = async (name: string) => {
        await page.mouse.move(1, 400);
        await page.waitForTimeout(220); // past the 120 ms fade
        await page.screenshot({ path: test.info().outputPath(`art-${theme}-${name}.png`) });
      };
      const field = page.locator('[data-testid="composer.field"]').first();
      const to = page.getByTestId('composer.tab.to');
      const end = page.getByTestId('composer.tab.end');
      const art = page.getByTestId('app.art');
      const openArt = async (id: string) => {
        const row = page.getByTestId(`app.right.artifact.${P}.${id}`);
        await expect(row).toBeVisible({ timeout: 10_000 });
        await row.click();
        await expect(art).toBeVisible({ timeout: 5000 });
      };
      const plain = async (why: string) => {
        const l = await look(page);
        expect(l.boxShadow, `${why}: no accent border`).not.toContain(l.accent);
        expect(l.tabAcc, `${why}: the tab's plain line`).toBe(false);
        expect(l.tabTip, `${why}: no tip`).toBeNull();
        expect(l.sendBg, `${why}: the send ink`).not.toBe(l.accent);
      };
      await expect(to).toHaveText(/^to bise/u, { timeout: 10_000 });

      // (1) perf's artifact from main's thread: pink, its words, esc back to bise
      await openArt('product-page');
      await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'perf');
      // the thread's 390 px column: '· about “…”' whole or gone, never 'about…' (designer m_27021)
      await expect(to).toHaveText(PINK);
      await expect(page.locator('[data-testid="composer.tab.to"] .who')).toHaveText('↳ to perf');
      await expect(end).toHaveText(composer.tab_esc_instead({ agent: 'bise' }));
      await expect(field).toHaveAttribute('aria-placeholder', composer.placeholder_about({ agent: 'perf' }));
      await page.waitForTimeout(220);
      const a = await look(page);
      expect(a.boxShadow, 'a 1.5 px accent border').toContain(`${a.accent} 0px 0px 0px 1.5px`);
      expect(a.tabAcc).toBe(true);
      expect(a.tabColor, 'the tab in the accent').toBe(a.accent);
      expect(a.tabTip).toBe(composer.about_tip({ agent: 'perf', esc: composer.esc_writes_to({ agent: 'bise' }) }));
      expect(a.sendBg, 'the send filled accent').toBe(a.accent);
      await expect(page.getByTestId('composer.tab'), 'the pink tab holds no place nor context').not.toContainText('context');
      await shot('pink');
      await field.click();
      await page.keyboard.type(`make the hero bigger ${theme}`);
      await shot('typed');
      await page.keyboard.press('Enter');
      await expect.poll(() => (core.cmds() as Cmd[]).filter((c) => c.cmd === 'send').at(-1)?.text ?? '', { timeout: 3000 }).toContain(`make the hero bigger ${theme}`);
      expect((core.cmds() as Cmd[]).filter((c) => c.cmd === 'send').at(-1), 'his line goes to perf').toMatchObject({ project: P, agent: 'perf' });

      // (3) esc: the artifact closes, main's thread, plain 'to bise'
      await field.click();
      await page.keyboard.press('Escape');
      await expect(art).toHaveCount(0);
      await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'main');
      await expect(to).toHaveText(/^to bise/u);
      await page.waitForTimeout(160);
      await plain('after esc');
      await shot('after-esc');
      // ✕ the same
      await openArt('product-page');
      await expect(to).toHaveText(PINK);
      await page.getByTestId('artifact.close').click();
      await expect(art).toHaveCount(0);
      await expect(to).toHaveText(/^to bise/u);
      await page.waitForTimeout(160);
      await plain('after ✕');

      // (4) main's own artifact: plain
      await openArt('weekly');
      await expect(to).toHaveText(composer.tab_about({ agent: 'bise', title: 'weekly update' }));
      await expect(end).toHaveCount(0);
      await page.waitForTimeout(220);
      await plain("main's artifact");
      await shot('main');
      await page.getByTestId('artifact.close').click();
      await expect(art).toHaveCount(0);

      // (2) perf's artifact again, its question open beside it: its own pink; its merge: the approval's plain line
      await openArt('product-page');
      await expect(to).toHaveText(PINK);
      await page.getByTestId('inbox.block.row.1').click();
      await expect(page.getByTestId('inbox.block.open.1')).toBeVisible({ timeout: 3000 });
      await expect(to).toHaveText(/^↳ answering perf · keep the webp/u);
      // cut after a whole word by the tab, never by the css clip (designer m_27021: 'next to th…')
      await expect.poll(() => to.evaluate((e) => e.scrollWidth <= e.clientWidth + 1), { timeout: 2000 }).toBe(true);
      await page.waitForTimeout(220);
      expect(((await look(page)).tabTip ?? '').startsWith(composer.answer_tip({ agent: 'perf', esc_to: '' }).replace(/ · .*$/u, ''))).toBe(true);
      await shot('question');
      await page.getByTestId('inbox.block.row.2').click();
      await expect(page.getByTestId('inbox.block.open.2')).toBeVisible({ timeout: 3000 });
      await expect(to).toHaveText(inbox.to_waits({ who: 'perf', waits: inbox.waits_for({ noun: 'merge', digits: inbox.digits_two }) }));
      await page.waitForTimeout(220);
      await plain('the merge open beside it');
      await shot('approval');
    } finally {
      await s.close();
      pages.server.close();
    }
  });
}
