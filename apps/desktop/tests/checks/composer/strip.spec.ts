// composer/strip · designer's composer-strip A (his pick, designer m_23965). Passes when, in
// storefront on the scripted core (FakeCore, fake data):
//   (1) no band and no shadow over the composer: the list's bottom is an opacity mask (12 px), its
//       ::after draws nothing, the box has no drop shadow; the thread ends 24 px above the tab;
//   (2) the tab glued to the box: 32 px high, 16 px in from each side, 'to perf' + the gust while it
//       works, 'ψ sb/perf' ('shared folder' in his checkout), right 'context 42k · 17%'; no
//       'idle', no model in it; short, it drops the context, then the branch, never 'to perf';
//   (3) answering a card: the tab in the accent, 'answering search · …' and 'esc write to search
//       instead'; the box's row is '+' and send only;
//   (4) the box's row: '+' (his files by the panel: two picked files are two chips), 'yolo ⌄'
//       (its menu opens above the box and sends the approvals mode), '<b>opus 5.5</b> high ⌄'
//       (its menu opens above, an effort sends it), send; short, the effort leaves the button,
//       the mode stays;
//   (5) the key line under the box is still there.
// Writes shots for designer (light + dark at 1400, 1100, 800: idle, working + text, answering, 2
// attachments, scrolled under the fade) and one sheet. Owner: amb-win.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'storefront-1a2b3c4d';
const MIN = 60_000;
const prefs = (theme: 'light' | 'dark') => ({
  ev: 'prefs',
  prefs: {
    onboarded: true,
    theme,
    context: { shot: true, url: true, file: true, window_text: false },
    excluded_apps: [],
    quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
    voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
    shots_keep_days: 7,
  },
});
const QUESTION = 'which size system should the filter use: EU, or US too?';
const usage = (words: string) => ({ model: 'anthropic/claude-opus-5-5', context: 42310, window: 256000, words, short: '17%' });
const OPUS = 'anthropic/claude-opus-5-5';
const PARA = 'the bench runs on every target. the product page took 4.1 s on a mid phone; the hero image decodes on the main thread and blocks the first paint. i moved it to an idle callback and the page now paints in 1.3 s. i will compare when it ends and send you the before / after.';
// the hub's models event as the proto fixture has it, sent once the app is up (as agents/tune does)
const MODELS = { ev: 'models', project: P, items: [{ id: OPUS, label: 'opus 5.5', provider: 'Anthropic', short: '1M', context: 1000000, vision: true, efforts: ['low', 'medium', 'high', 'max'], default_effort: 'high', default_for: ['main', 'agents'] }] };
const world = (now: number) => {
  const ag = (name: string, over: Record<string, unknown>) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: now - 60 * MIN, waits: 0, model: OPUS, effort: 'high', ...over });
  const long = Array.from({ length: 14 }, (_, i) => ({ pos: i + 1, at_ms: now - (30 - i) * MIN, kind: i % 2 === 0 ? 'you' : 'agent', text: i % 2 === 0 ? `step ${String(i / 2 + 1)}: what did the bench say?` : PARA }));
  return [
    prefs('light'),
    {
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 5, working: 1, waits: 1, running: true, cards: [{ id: 7, project: P, kind: 'question', rank: 1, agent: 'search', question: QUESTION, options: [{ n: 1, label: 'EU only' }, { n: 2, label: 'EU and US' }], urgent: false, since_ms: now - 5 * MIN }] },
      ],
    },
    { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
    { ev: 'approvals', project: P, mode: 'yolo', env: false, checker: 'off', checker_who: '', repo: '/nowhere/storefront', rules: [] },
    {
      ev: 'agents',
      project: P,
      agents: [
        ag('main', { usage: usage('263k · 26%') }),
        ag('perf', { status: 'working', since_ms: now - 40_000, turn_ms: 40_000, purpose: 'product page speed', branch: 'sb/perf', worktree: '/nowhere/wt/perf', usage: usage('42k · 17%') }),
        ag('search', { purpose: 'size filter on search', waits: 1, branch: 'sb/search', usage: usage('58k · 23%') }),
        ag('docs', { purpose: 'the readme', usage: usage('12k · 5%') }),
        ag('ui', { purpose: 'the product card', branch: 'sb/ui', usage: usage('31k · 12%') }),
      ],
    },
    { ev: 'thread', project: P, agent: 'perf', entries: long, before: null, more: false },
    { ev: 'thread', project: P, agent: 'docs', entries: [{ pos: 1, at_ms: now - 9 * MIN, kind: 'you', text: 'make the readme say how to run the bench' }, { pos: 2, at_ms: now - 8 * MIN, kind: 'agent', text: 'done: the readme has a "run the bench" section now.' }], before: null, more: false },
    { ev: 'thread', project: P, agent: 'ui', entries: [{ pos: 1, at_ms: now - 9 * MIN, kind: 'agent', text: 'the product card is ready for a look.' }], before: null, more: false },
    { ev: 'thread', project: P, agent: 'search', entries: [{ pos: 1, at_ms: now - 6 * MIN, kind: 'agent', text: 'two size systems fit. which one should the filter use?' }], before: null, more: false },
  ];
};

const shown = (page: Page, id: string) => page.getByTestId(id).evaluate((el) => !el.classList.contains('gone'));

test('composer/strip: the tab over the box, the row of controls, no band', async () => {
  test.setTimeout(240_000);
  const now = Date.now();
  const dir = test.info().outputPath('files');
  mkdirSync(dir, { recursive: true });
  const files = [path.join(dir, 'bench-before.pdf'), path.join(dir, 'hero.png')];
  writeFileSync(files[0] ?? '', '%PDF-1.4\n');
  writeFileSync(files[1] ?? '', '');
  const core = new FakeCore(world(now) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, env: { BISE_DESKTOP_TEST_PICK_FILES: files.join('\n') } });
  const shots: { label: string; png: Buffer }[] = [];
  try {
    const { page } = s;
    const cdp = await page.context().newCDPSession(page);
    const size = async (w: number, h: number) => {
      await s.app.evaluate(({ BrowserWindow }, [w, h]) => {
        const win = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
        win?.setContentSize(w, h);
      }, [w, h] as const);
      await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(w);
    };
    const theme = async (t: 'light' | 'dark') => {
      await core.send(prefs(t) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
    };
    const go = async (agent: string) => {
      await page.getByTestId(`app.right.agent.${agent}`).click();
      await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', agent);
    };
    const tab = page.getByTestId('composer.tab');
    const box = page.getByTestId('composer.box');
    await size(1400, 900);
    await expect(tab).toBeVisible({ timeout: 10_000 });
    await core.send(MODELS as never);

    // (2) the tab: 'to perf' + the gust, its branch, its context; never 'idle' or the model
    await expect(page.getByTestId('composer.tab.to')).toHaveText(/^to perf[ ·~∿≈]{5}$/u);
    await expect(page.locator('[data-testid="composer.tab.to"] [data-testid="thread.mark"]')).toHaveCount(1);
    await expect(page.getByTestId('composer.tab.place')).toHaveText('ψsb/perf');
    await expect(page.getByTestId('composer.tab.context')).toHaveText('context 42k · 17%');
    await expect(page.getByTestId('composer.tab.project'), 'the crumb names the project').toHaveCount(0);
    await expect(tab).not.toContainText(/idle|opus|yolo/u);
    await expect(page.locator('[data-testid="composer"] > .div'), 'the old label line is gone').toHaveCount(0);
    const g = await page.evaluate(() => {
      const r = (sel: string) => document.querySelector(sel)?.getBoundingClientRect();
      const t = r('[data-testid="composer.tab"]');
      const b = r('[data-testid="composer.box"]');
      const list = document.querySelector('.th-list');
      const scroller = document.querySelector('.th-list > [data-virtuoso-scroller]');
      const rows = document.querySelectorAll('.th-list [data-item-index]');
      // the last row's words: its box less its own 2 px end (the gap tokens count from there)
      const lastEl = rows.length === 0 ? null : (rows.item(rows.length - 1).querySelector('.th-row') ?? rows.item(rows.length - 1));
      const last = lastEl === null ? undefined : { bottom: lastEl.getBoundingClientRect().bottom - parseFloat(getComputedStyle(lastEl).paddingBottom) };
      const boxCs = getComputedStyle(document.querySelector('[data-testid="composer.box"]') as Element);
      return {
        tab: t && { h: t.height, left: t.left, right: t.right, bottom: t.bottom },
        box: b && { left: b.left, right: b.right, top: b.top },
        radius: boxCs.borderTopLeftRadius,
        shadow: boxCs.boxShadow,
        after: list === null ? '' : getComputedStyle(list, '::after').content,
        mask: scroller === null ? '' : getComputedStyle(scroller).maskImage,
        // the thread's last row to what sits under the list: the inbox block when a card waits, else the tab
        gap: (() => {
          const main = document.querySelector('.th-main');
          let next = main?.nextElementSibling ?? null;
          while (next !== null && next.getBoundingClientRect().height === 0) next = next.nextElementSibling;
          const under = next?.matches('.b-composer') === true ? t : next?.getBoundingClientRect();
          return under && last ? under.top - last.bottom : -1;
        })(),
      };
    });
    expect(g.tab?.h, 'the tab is 32 px').toBe(32);
    expect(Math.round((g.tab?.left ?? 0) - (g.box?.left ?? 0)), '16 px in on the left').toBe(16);
    expect(Math.round((g.box?.right ?? 0) - (g.tab?.right ?? 0)), '16 px in on the right').toBe(16);
    expect(Math.abs((g.tab?.bottom ?? 0) - (g.box?.top ?? 0)), 'glued to the box').toBeLessThanOrEqual(1);
    expect(g.radius, 'the box r 16').toBe('16px');
    expect(g.shadow, 'no drop shadow: one 1 px line').toMatch(/^[^,]* 0px 0px 0px 1px$/u);
    // (1) no band: the bottom ::after draws nothing, the scroller's end is an opacity mask
    expect(g.after === 'none' || g.after === 'normal', 'no ::after band').toBe(true);
    expect(g.mask, 'an opacity mask at the bottom').toContain('linear-gradient');
    expect(Math.round(g.gap), 'the thread ends 24 px above what sits under it (the tab, or the inbox block)').toBe(24);

    // (4) the row: '+', the mode, the model + effort, send (stop while it works)
    await expect(page.getByTestId('composer.attach')).toHaveText('+');
    await expect(page.getByTestId('composer.mode')).toHaveText('yolo ⌄');
    await expect(page.getByTestId('composer.model')).toHaveText('opus 5.5 high ⌄');
    await expect(page.locator('[data-testid="composer.row"] [data-testid="composer.stop"]')).toHaveCount(1);
    // the mode menu opens above the box; approvals sends the hub's 'auto'
    await page.getByTestId('composer.mode').click();
    const menuAbove = async (id: string) => {
      const m = await page.getByTestId(id).boundingBox();
      const b = await box.boundingBox();
      expect(m && b ? m.y + m.height : 9999, `${id} opens above the box`).toBeLessThanOrEqual(b?.y ?? 0);
    };
    await menuAbove('composer.mode.menu');
    await page.getByTestId('composer.mode.auto').click();
    expect(await core.waitCmd((c) => c.cmd === 'approvals', 3000)).toMatchObject({ project: P, mode: 'auto' });
    await expect(page.getByTestId('composer.mode.menu')).toHaveCount(0);
    await core.send({ ev: 'approvals', project: P, mode: 'auto', env: false, checker: 'off', checker_who: '', repo: '/nowhere/storefront', rules: [] } as never);
    await expect(page.getByTestId('composer.mode')).toHaveText('approvals ⌄');
    // the model menu opens above; an effort sends it
    await page.getByTestId('composer.model').click();
    await menuAbove('composer.model.menu');
    await page.getByTestId('composer.effort.max').click();
    expect(await core.waitCmd((c) => c.cmd === 'effort', 3000)).toMatchObject({ project: P, agent: 'perf', effort: 'max' });
    // esc closes a menu and leaves the field alone
    await page.getByTestId('composer.model').click();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('composer.model.menu')).toHaveCount(0);
    await core.send({ ev: 'approvals', project: P, mode: 'yolo', env: false, checker: 'off', checker_who: '', repo: '/nowhere/storefront', rules: [] } as never);

    // (2) drop order: short, the context goes first, then the branch; 'to perf' always stays
    const natural = await page.evaluate(() => (document.querySelector('[data-testid="composer.tab"]') as HTMLElement).getBoundingClientRect().width);
    const setTab = (w: number | null) =>
      page.evaluate((w) => {
        (document.querySelector('[data-testid="composer.tab"]') as HTMLElement).style.width = w === null ? '' : `${String(w)}px`;
      }, w);
    await setTab(Math.min(natural, 300));
    await expect.poll(() => shown(page, 'composer.tab.context')).toBe(false);
    expect(await shown(page, 'composer.tab.place'), 'the branch stays while it fits').toBe(true);
    await setTab(150);
    await expect.poll(() => shown(page, 'composer.tab.place')).toBe(false);
    await expect(page.getByTestId('composer.tab.to')).toBeVisible();
    await setTab(null);
    await expect.poll(() => shown(page, 'composer.tab.context')).toBe(true);

    // (4) '+': two files from the panel, two chips in the attachment list
    await go('ui');
    await page.getByTestId('composer.attach').click();
    await expect(page.locator('[data-testid="composer"] .b-attach-row')).toHaveCount(2);
    await expect(page.getByTestId('composer.tab.place')).toHaveText('ψsb/ui');

    // shared folder
    await go('docs');
    // ψ is a worktree's sign: his own checkout reads 'shared folder' alone (designer m_24325)
    await expect(page.getByTestId('composer.tab.place')).toHaveText('shared folder');

    // (3) answering: the accent tab, the way back on its right, '+' and send only
    await go('search');
    if (!(await page.getByTestId('inbox.block.open.1').isVisible())) await page.getByTestId('inbox.block.row.1').click();
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-answering', 'true');
    await expect(tab).toHaveClass(/\bacc\b/u);
    await expect(page.getByTestId('composer.tab.to')).toHaveText(/^answering search · which size/u);
    await expect(page.getByTestId('composer.tab.end')).toHaveText('esc write to search instead');
    // answering, the tab holds only the question and the way back (designer m_24517)
    await expect(page.getByTestId('composer.tab.place')).toHaveCount(0);
    await expect(page.getByTestId('composer.tab.context')).toHaveCount(0);
    await expect(page.getByTestId('composer.attach')).toBeVisible();
    await expect(page.getByTestId('composer.mode')).toHaveCount(0);
    await expect(page.getByTestId('composer.model')).toHaveCount(0);
    // (5) the key line is unchanged
    await expect(page.getByTestId('composer.keys')).toBeVisible();

    // the shots for designer: every state at 1400, 1100, 800, light and dark
    const shot = async (t: string, w: number, label: string) => {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 2, mobile: false });
      const png = await page.screenshot();
      await cdp.send('Emulation.clearDeviceMetricsOverride');
      writeFileSync(test.info().outputPath(`strip-${t}-${String(w)}-${label.replace(/[^a-z0-9]+/gu, '-')}@2x.png`), png);
      shots.push({ label: `${t} · ${String(w)} · ${label}`, png });
    };
    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      for (const w of [1400, 1100, 800]) {
        // each agent opens from the right bar at 1400 (narrower, the bar slides away), then the width
        const at = async (agent: string) => {
          await size(1400, 900);
          await go(agent);
          await size(w, 900);
        };
        await at('docs');
        await shot(t, w, 'idle');
        await at('perf');
        const field = page.getByTestId('composer.field');
        await field.click();
        await page.keyboard.press('Meta+A');
        await page.keyboard.type('also run it on mobile safari');
        await shot(t, w, 'working + text');
        // scrolled up: the text under the bottom edge fades
        await page.getByTestId('thread.list').hover().catch(() => undefined);
        await page.mouse.wheel(0, -260);
        await page.waitForTimeout(300);
        await shot(t, w, 'scrolled under the fade');
        await at('ui');
        await shot(t, w, '2 attachments');
        await at('search');
        if (!(await page.getByTestId('inbox.block.open.1').isVisible())) await page.getByTestId('inbox.block.row.1').click();
        await expect(tab).toHaveClass(/\bacc\b/u);
        // cut, the question ends after a whole word with one '…' (designer m_24325)
        const shownLabel = ((await page.getByTestId('composer.tab.to').textContent()) ?? '').replace(/[ ·~∿≈]{5}(?= ·|…|$)/u, '');
        const full = `answering search · ${QUESTION}`;
        expect(shownLabel, 'one … glyph, never three dots').not.toContain('...');
        if (shownLabel.endsWith('…')) {
          const head = shownLabel.slice(0, -1);
          expect(full.startsWith(head) && /^[\s·,:;]/u.test(full.slice(head.length)), `${String(w)}: '${shownLabel}' cut after a whole word`).toBe(true);
        } else expect(shownLabel).toBe(full);
        await shot(t, w, 'answering');
        // at 800 the model menu still says its model; the mode never drops
        if (w === 800) {
          await at('perf');
          await expect(page.getByTestId('composer.mode')).toBeVisible();
          await expect(page.getByTestId('composer.model')).toContainText('opus 5.5');
        }
      }
    }
    await s.app.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
      w?.setContentSize(2400, 1500);
    });
    const cells = shots.map((x) => `<figure><figcaption>${x.label}</figcaption><img src="data:image/png;base64,${x.png.toString('base64')}"></figure>`).join('');
    await page.setContent(`<style>body{margin:0;background:#777;font:12px ui-monospace,monospace;color:#eee}main{display:flex;flex-wrap:wrap;gap:10px;padding:10px;align-items:flex-start}figure{margin:0}figcaption{margin:0 0 3px}img{display:block;zoom:.3;border-radius:6px}</style><main>${cells}</main>`);
    writeFileSync(test.info().outputPath('strip-sheet.png'), await page.screenshot({ fullPage: true }));
  } finally {
    await s.close();
    core.dispose();
  }
});
