// composer/answer-target · his pick A on page composer-target (designer m_26531): where his words go
// while an item is open. Passes when, on the scripted core (FakeCore, fake data), on acme's main:
//   (1) answering: search's question open, the box has a 1.5 px accent border, the tab is its label
//       with the tip 'your words answer search's question · esc writes to bise' (designer m_26683), in
//       the accent, and reads
//       '↳ answering search · <the question cut after a whole word>' with 'esc to bise instead' at its
//       right, the placeholder is 'your answer to search, then ⏎', the send is filled accent, the
//       open card has a 2 px accent rail on its left;
//   (2) at 800 px the question leaves the tab first, then 'esc to bise instead'; '↳ answering search'
//       always stays whole;
//   (3) an approval open (perf's merge): none of it: the tab says where his words really go, 'to perf
//       · the merge waits for 1 or 2' + 'esc to bise instead', the box's plain line, the send ink, no
//       rail; typed words go to perf as a plain message, never an answer (designer m_26683);
//   (4) esc with words typed: the pink is gone within 120 ms (+ a frame), the tab says 'to bise',
//       the half answer stays with the question (it is back when he opens it again).
// Writes shots for designer (light + dark at 1100 and 800: answering, typed, approval, after esc).
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { composer } from '../../../src/proto/words.gen';

import { inbox } from '../../../src/proto/words_inbox.gen';
const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const MIN = 60_000;
const QUESTION = 'which size system should the filter use: EU, or US too?';
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
const world = (now: number) => {
  const ag = (name: string, waits = 0) => ({ name, main: name === 'main', status: waits > 0 ? 'waiting' : 'idle', archived: false, title: '', purpose: '', since_ms: now - 60 * MIN, waits });
  const cards = [
    { id: 7, project: P, kind: 'question', rank: 1, agent: 'search', question: QUESTION, options: [{ n: 1, label: 'EU only' }, { n: 2, label: 'EU and US' }], urgent: false, since_ms: now - 1 * MIN },
    { id: 8, project: P, kind: 'merge', approval: true, rank: 2, agent: 'perf', question: 'merge sb/perf into main? 3 files, the hero image goes from 2.4 MB to 180 KB', options: [{ n: 1, label: 'merge it' }, { n: 2, label: 'not yet' }], urgent: false, since_ms: now - 2 * MIN },
  ];
  return [
    prefs('light'),
    {
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 3, working: 0, waits: 2, running: true, cards },
      ],
    },
    { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
    { ev: 'agents', project: P, agents: [ag('main'), ag('search', 1), ag('perf', 1)] },
    { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: now - 3 * MIN, kind: 'agent', text: 'search waits for your answer below.' }], before: null, more: false },
  ];
};

type Cmd = { cmd?: string; project?: string; agent?: string; text?: string };

/** What the composer and the open card look like now: the pink parts, read from the computed style. */
const look = (page: Page) =>
  page.evaluate(() => {
    const q = (s: string) => document.querySelector<HTMLElement>(s);
    const box = q('[data-testid="composer.box"]');
    const tab = q('[data-testid="composer.tab"]');
    const send = q('[data-testid="composer.send"]');
    const card = q('.inbox-block-open .ic');
    const probe = document.createElement('span');
    probe.style.color = 'var(--c-accent)';
    document.body.append(probe);
    const accent = getComputedStyle(probe).color;
    probe.remove();
    return {
      accent,
      boxShadow: box === null ? '' : getComputedStyle(box).boxShadow,
      boxTip: box?.dataset['tip'] ?? null,
      tabTip: tab?.dataset['tip'] ?? null,
      tabAcc: tab?.classList.contains('acc') ?? false,
      tabColor: tab === null ? '' : getComputedStyle(tab.querySelector('.lbl') ?? tab).color,
      sendBg: send === null ? '' : getComputedStyle(send).backgroundColor,
      cardShadow: card === null ? '' : getComputedStyle(card).boxShadow,
      rail: q('.inbox-block-open')?.dataset['answering'] === 'true',
    };
  });

test('composer/answer-target: pink while his words answer a question, never for an approval, off on esc', async () => {
  test.setTimeout(180_000);
  const core = new FakeCore(world(Date.now()) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}` });
  try {
    const { page } = s;
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
    const shot = async (name: string) => {
      await page.waitForTimeout(200); // past the 120 ms fade
      await page.screenshot({ path: test.info().outputPath(`${name}.png`) });
    };
    const field = page.locator('[data-testid="composer.field"]').first();
    const to = page.getByTestId('composer.tab.to');
    const end = page.getByTestId('composer.tab.end');
    const openRow = async (n: number) => {
      if (await page.getByTestId(`inbox.block.open.${String(n)}`).isVisible()) return;
      await page.getByTestId(`inbox.block.row.${String(n)}`).click();
      await expect(page.getByTestId(`inbox.block.open.${String(n)}`)).toBeVisible({ timeout: 3000 });
    };
    await size(1100, 820);
    await expect(page.getByTestId('inbox.block.row.1')).toBeVisible({ timeout: 10_000 });

    for (const t of ['light', 'dark'] as const) {
      await theme(t);
      await size(1100, 820);

      // (1) answering
      await openRow(1);
      await expect(to).toHaveText(/^↳ answering search · which size system\b.*…$/u);
      await expect(end).toHaveText(composer.tab_esc_instead({ agent: 'bise' }));
      await expect(field).toHaveAttribute('aria-placeholder', inbox.answer_placeholder({ who: 'search', key: '⏎' }));
      await expect(page.locator('.inbox-block-open')).toHaveAttribute('data-answering', 'true');
      await page.waitForTimeout(200);
      const a = await look(page);
      expect(a.boxShadow, 'a 1.5 px accent border').toContain(`${a.accent} 0px 0px 0px 1.5px`);
      expect(a.tabTip, "the tab's tip, never over the label").toBe(composer.answer_tip({ agent: 'search', esc_to: 'bise' }));
      expect(a.boxTip, 'the box has no tip of its own').toBeNull();
      expect(a.tabAcc).toBe(true);
      expect(a.tabColor, 'the tab in the accent').toBe(a.accent);
      expect(a.sendBg, 'the send filled accent').toBe(a.accent);
      expect(a.cardShadow, "the card's 2 px rail").toContain(`${a.accent} 2px 0px 0px 0px inset`);
      await expect(page.locator('[data-testid="composer.tab.to"] .who')).toHaveText('↳ answering search');
      await shot(`${t}-1100-answering`);
      await field.click();
      await page.keyboard.type('EU only for now, US after the launch');
      await shot(`${t}-1100-typed`);

      // (2) narrow: the question goes first, then the end; the head never
      for (const w of [800, 720, 680]) {
        await size(w, 820);
        await page.waitForTimeout(100);
        const label = (await to.textContent()) ?? '';
        expect(label.startsWith('↳ answering search'), `${String(w)}: '${label}' keeps its head`).toBe(true);
        const endShown = await end.evaluate((e) => !e.classList.contains('gone'));
        const headOnly = label === '↳ answering search…' || label === '↳ answering search';
        if (!endShown) expect(headOnly, `${String(w)}: the end goes only once the question is gone`).toBe(true);
        const fits = await page.getByTestId('composer.tab').evaluate((e) => e.scrollWidth <= e.clientWidth + 1);
        expect(fits, `${String(w)}: nothing overflows the tab`).toBe(true);
        if (w === 800) await shot(`${t}-800-answering`);
      }
      await size(1100, 820);

      // (4) esc: the pink is off within 120 ms + a frame, the tab says 'to bise', his words wait with the question
      await field.click();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('inbox.block.open.1')).toHaveCount(0);
      await page.waitForTimeout(160);
      const e = await look(page);
      expect(e.boxShadow, 'no accent border after esc').not.toContain(e.accent);
      expect(e.sendBg).not.toBe(e.accent);
      expect(e.tabAcc).toBe(false);
      await expect(to).toHaveText(/^to bise/u);
      await shot(`${t}-1100-after-esc`);
      await openRow(1);
      await expect(field, 'his half answer waits with the question').toHaveText('EU only for now, US after the launch');
      await field.click();
      await page.keyboard.press('Meta+A');
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('inbox.block.open.1')).toHaveCount(0);

      // (3) an approval: words never approve, nothing pink
      await openRow(2);
      await expect(to).toHaveText(inbox.to_waits({ who: 'perf', waits: inbox.waits_for({ noun: 'merge', digits: inbox.digits_two }) }));
      await expect(end).toHaveText(composer.tab_esc_instead({ agent: 'bise' }));
      await expect(field).toHaveAttribute('aria-placeholder', composer.placeholder_to({ agent: 'perf' }));
      await page.waitForTimeout(200);
      const p = await look(page);
      expect(p.boxShadow).not.toContain(p.accent);
      expect(p.boxTip).toBeNull();
      expect(p.tabTip).toBeNull();
      expect(p.tabAcc).toBe(false);
      expect(p.sendBg).not.toBe(p.accent);
      expect(p.rail).toBe(false);
      expect(p.cardShadow).not.toContain(p.accent);
      await shot(`${t}-1100-approval`);
      // typed words go to perf as a plain message; the merge still waits
      const sends = (core.cmds() as Cmd[]).filter((c) => c.cmd === 'send').length;
      await field.click();
      await page.keyboard.type(`after the bench ${t}`);
      await page.keyboard.press('Enter');
      await expect.poll(() => (core.cmds() as Cmd[]).filter((c) => c.cmd === 'send').length, { timeout: 3000 }).toBe(sends + 1);
      expect((core.cmds() as Cmd[]).filter((c) => c.cmd === 'send').at(-1)).toMatchObject({ project: P, agent: 'perf', text: `after the bench ${t}` });
      expect((core.cmds() as Cmd[]).some((c) => c.cmd === 'answer'), 'a typed line never answers the merge').toBe(false);
      await expect(page.getByTestId('inbox.block.open.2'), 'the merge still waits').toBeVisible();
      await field.click();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('inbox.block.open.2')).toHaveCount(0);
    }
  } finally {
    await s.close();
    core.dispose();
  }
});
