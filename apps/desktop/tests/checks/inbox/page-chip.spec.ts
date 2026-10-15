// inbox/page-chip · a notification and its page as one thing (notif-artifact, Gabriel's pick A,
// designer m_26560). Designer asks 'which composer look when a notification is open?' from its
// page 'where does my answer go' (v4). On FakeCore, fake data. Passes when, light and dark:
//   - the open item carries the page as the artifact chip under the question: '↗ where does my
//     answer go', 'page · v4', with '⌘O open beside' at its right in text-3, 4 px after its keycap;
//   - its options are the page's 4 (A to D, in its order and words), each with its one-line why
//     under it (text-2), the asker's own pick says 'my pick';
//   - the foot says '1–4 pick', 'or type: designer reads it', 'esc later';
//   - an 'o' on the empty composer is a letter; ⌘O opens the page beside the thread (the artifact
//     view: the real kit page, its pick saying '? waits in your inbox'), nothing sent: the item stays
//     open in the thread column and the composer on '↳ answering designer', at 1100 and 800; a
//     click on the chip does the same.
// Shots: page-chip-<theme>-1100/800 (the open item) and page-chip-<theme>-beside-1100/800 (the page
// open beside), for designer. Owner: notif-artifact.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Locator, Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const TITLE = 'where does my answer go';
const ASK = 'which composer look when a notification is open?';
const KEY = `${P}-7`;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 14 * MIN, waits: 0, watching: [] });
const OPTS = [
  ['A · a pink border and a clear label', 'the field keeps its place; the label says who reads it'],
  ['B · the card and the field in one frame', 'one box, but it moves the field'],
  ['C · a reply chip in the field', 'a chip like a mail reply'],
  ['D · the field turns pale pink', 'the color says it'],
] as const;
// the page as the hub serves it (pages/server.rs `shell`): the repo's kit, the fragment in
// main#bise-page, its meta saying the pick waits in the inbox (asks: open, 4 on the card)
const KIT = path.resolve(__dirname, '..', '..', '..', '..', '..', 'kit');
const FRAGMENT = `<section data-kit="heading" data-id="h"><p>composer · for Gabriel</p><h1>${TITLE}</h1></section>
<section data-kit="prose" data-id="intro"><p>four looks for the composer while a notification is open. the pick makes its notification: answer it here or in the inbox.</p></section>
<section data-kit="ui" data-id="look"><div class="k-pick" data-ui="pick" data-ask="${ASK}">
${OPTS.map(([h, why], i) => `<div class="k-option" data-pick="${'abcd'[i]}">${i === 0 ? '<span class="k-mark">my pick</span>' : ''}<h3>${h}</h3><p>${why}.</p></div>`).join('\n')}
</div></section>`;
const SHELL = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="bise-token" content="t"><title>${TITLE}</title>
<link rel="stylesheet" href="/kit/tokens.css"><link rel="stylesheet" href="/kit/kit.css"><link rel="stylesheet" href="/kit/notes.css">
<script src="/kit/ask.js" defer></script><script src="/kit/kit.js" defer></script></head>
<body><main id="bise-page" data-page="notif-artifact" data-version="4" data-latest="4" data-agent="designer" data-title="${TITLE}" data-state="done" data-started="${String(NOW - 30 * MIN)}">
${FRAGMENT}
</main></body></html>`;
const META = { id: 'notif-artifact', title: TITLE, agent: 'designer', state: 'done', versions: [{ n: 4, at_ms: NOW - 3 * MIN, blocks: [] }], asks: [{ block: 'look', open: true, count: 4 }] };
async function pagesServer(): Promise<{ url: string; server: Server }> {
  const server = createServer((req, res) => {
    const u = (req.url ?? '/').split('?')[0] ?? '/';
    const send = (type: string, body: string | Buffer, code = 200) => {
      res.writeHead(code, { 'content-type': type });
      res.end(body);
    };
    if (u.startsWith('/kit/') && !u.includes('..')) {
      try {
        const type = u.endsWith('.css') ? 'text/css' : u.endsWith('.js') ? 'text/javascript' : u.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream';
        send(type, readFileSync(path.join(KIT, u.slice(5))));
      } catch {
        send('text/plain', 'no', 404);
      }
    } else if (u === '/p/notif-artifact/meta') send('application/json', JSON.stringify(META));
    else if (u === '/p/notif-artifact') send('text/html; charset=utf-8', SHELL);
    else send('text/plain', 'no', 404);
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`, server };
}
const card = (pages: string) => ({
  id: 7,
  project: P,
  kind: 'question',
  rank: 1,
  agent: 'designer',
  question: ASK,
  text: [ASK, ...OPTS.map(([h], i) => `${String(i + 1)}. ${h}`)].join('\n'),
  options: OPTS.map(([label, why], i) => ({ n: i + 1, label, why, ...(i === 0 ? { mine: true } : {}) })),
  page: { id: 'notif-artifact', url: `${pages}/p/notif-artifact#look`, block: 'look', title: TITLE, v: 4 },
  urgent: false,
  since_ms: NOW - 2 * MIN,
});
const world = (theme: string, pages: string) => [
  prefs(theme),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'harness', path: '/nowhere/harness', git: true, home: false, order: 1, agents: 2, working: 0, waits: 1, running: true, cards: [card(pages)] },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/harness', name: 'harness' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('designer')] },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'thread', project: P, agent: 'designer', entries: [{ pos: 1, at_ms: NOW - 3 * MIN, kind: 'agent', text: 'the variants are on the page.' }], before: null, more: false },
  {
    ev: 'artifacts',
    project: P,
    items: [{ id: 'notif-artifact', kind: 'page', title: TITLE, agent: 'designer', version: 4, at_ms: NOW - 3 * MIN, url: `${pages}/p/notif-artifact`, new: true }],
  },
];

const settle = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))).then(() => undefined));
const colorOf = (l: Locator, token: string) =>
  l.evaluate((e, t) => {
    const probe = document.createElement('i');
    probe.style.color = `var(${t})`;
    document.body.append(probe);
    const want = getComputedStyle(probe).color;
    probe.remove();
    return { got: getComputedStyle(e).color, want };
  }, token);

for (const theme of ['light', 'dark']) {
  test(`inbox/page-chip: a page's notification carries its page, its options' why, ⌘O opens it beside (${theme})`, async () => {
    const pages = await pagesServer();
    const core = new FakeCore(world(theme, pages.url) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `agent/${P}/designer`, size: '1100x820' });
    try {
      const { page } = s;
      await page.setViewportSize({ width: 1100, height: 820 });
      await expect(page.getByTestId('inbox.block')).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press('Control+Digit1');
      const id = `inbox.block.card.${KEY}`;
      const item = page.getByTestId(id);
      await expect(item).toBeVisible({ timeout: 5000 });
      // the chip under the question, '⌘O open beside' at its right in text-3
      const chip = page.getByTestId(`${id}.page.chip`);
      await expect(chip.locator('.b-artchip-title')).toHaveText(`↗ ${TITLE}`);
      await expect(chip.locator('.b-artchip-meta')).toHaveText('page · v4');
      const open = page.getByTestId(`${id}.page.open`);
      await expect(open).toHaveText('⌘Oopen beside');
      // 4 px between the keycap and its words, like '↑↓ next'
      const gap = await open.evaluate((e) => {
        const k = e.firstElementChild;
        const words = Array.from(e.childNodes).find((n) => n.nodeType === 3 && (n.textContent ?? '').trim() !== '');
        if (!k || !words) return -1;
        const r = document.createRange();
        r.selectNodeContents(words);
        return Math.round(r.getBoundingClientRect().left - k.getBoundingClientRect().right);
      });
      expect(gap, '4 px after the keycap').toBe(4);
      const q = await page.getByTestId(`${id}.q`).boundingBox();
      const cb = await chip.boundingBox();
      const ob = await open.boundingBox();
      expect(q !== null && cb !== null && cb.y >= q.y + q.height - 1, 'the chip under the question').toBe(true);
      expect(cb !== null && ob !== null && ob.x > cb.x + cb.width, "'⌘O open beside' at its right").toBe(true);
      const t3 = await colorOf(page.getByTestId(`${id}.page`).locator(':scope > :last-child'), '--c-text-3');
      expect(t3.got, "'open beside' in text-3").toBe(t3.want);
      // the page's options, each with its why (text-2), the asker's 'my pick'
      const opt1 = page.getByTestId(`${id}.opt.1`);
      await expect(opt1.locator('.ic-why')).toHaveText('the field keeps its place; the label says who reads it');
      await expect(opt1.locator('.ic-mine')).toHaveText('my pick');
      await expect(page.getByTestId(`${id}.opt.2`).locator('.ic-why')).toHaveText('one box, but it moves the field');
      await expect(page.getByTestId(`${id}.opt.2`).locator('.ic-mine')).toHaveCount(0);
      // every option of the page's pick, in its order and words
      for (const [i, [h, why]] of OPTS.entries()) {
        await expect(page.getByTestId(`${id}.opt.${String(i + 1)}`)).toContainText(h);
        await expect(page.getByTestId(`${id}.opt.${String(i + 1)}`).locator('.ic-why')).toHaveText(why);
      }
      const t2 = await colorOf(opt1.locator('.ic-why'), '--c-text-2');
      expect(t2.got, 'the why in text-2').toBe(t2.want);
      // the foot: who reads typed words; the old '⌘O open its page' is gone
      const keys = page.getByTestId(`${id}.keys`);
      await expect(keys).toContainText('pick');
      await expect(keys).toContainText('or type: designer reads it');
      await expect(keys).toContainText('later');
      await expect(keys).not.toContainText('open its page');
      for (const w of [1100, 800]) {
        await page.setViewportSize({ width: w, height: 820 });
        await page.mouse.move(1, 400);
        await settle(page);
        await page.screenshot({ path: test.info().outputPath(`page-chip-${theme}-${String(w)}.png`) });
      }
      await page.setViewportSize({ width: 1100, height: 820 });
      const composer = page.getByTestId('composer').first();
      await expect(composer).toContainText('↳ answering designer');
      // an 'o' on the empty composer is a letter, never a key
      const field = page.locator('[data-testid="composer.field"]').first();
      await field.click();
      await page.keyboard.press('o');
      await expect(field).toContainText('o');
      await expect(page.getByTestId('app.art')).toHaveCount(0);
      await page.keyboard.press('Backspace');
      // ⌘O: the page beside the thread, the item stays open, the composer still answers it
      for (const w of [1100, 800]) {
        await page.setViewportSize({ width: w, height: 820 });
        await page.keyboard.press('Meta+o');
        await expect(page.getByTestId('app.art')).toBeVisible({ timeout: 5000 });
        await expect(page.getByTestId('artifact.title')).toHaveText(TITLE);
        await expect(page.getByTestId(`${id}.opt.1`)).toBeVisible();
        await expect(composer).toContainText('↳ answering designer');
        // the real kit page, its pick saying it waits in the inbox
        const frame = page.locator('[data-testid="app.art"] iframe').first().contentFrame();
        await expect(frame.locator('.k-ask')).toContainText('waits in your inbox', { timeout: 10_000 });
        await expect(frame.locator('.k-option h3').first()).toHaveText(OPTS[0][0]);
        // the page lights its pick a moment (kit.js data-lit, 2.4 s): shot after it
        await expect(frame.locator('[data-id="look"]')).not.toHaveAttribute('data-lit', '', { timeout: 5000 });
        await settle(page);
        await page.screenshot({ path: test.info().outputPath(`page-chip-${theme}-beside-${String(w)}.png`) });
        // nothing was sent: the item still waits in the inbox
        await expect(page.getByTestId('inbox.block')).toContainText('which composer look');
        if (w === 1100) {
          await page.getByTestId('artifact.close').click();
          await expect(page.getByTestId('app.art')).toHaveCount(0);
          await expect(page.getByTestId(`${id}.opt.1`)).toBeVisible();
        }
      }
      await page.setViewportSize({ width: 1100, height: 820 });
      // a click on the chip opens it too: the item open again, the view closed first
      await page.getByTestId('artifact.close').click().catch(() => undefined);
      await page.keyboard.press('Control+Digit1');
      await expect(chip).toBeVisible({ timeout: 5000 });
      await chip.click();
      await expect(page.getByTestId('artifact.title')).toHaveText(TITLE);
    } finally {
      await s.close();
      core.dispose();
      pages.server.close();
    }
  });
}
