// composer/agent-target · his ask (main m_28206): « ça m'arrive assez souvent de parler aux mauvais
// agents sans faire exprès … que le nom de l'agent, si ce n'est pas le main, soit en rose et que
// l'input soit entouré en rose comme quand un artefact est ouvert ou quand l'inbox est ouverte ».
// The composer's one pink state (tab.ts pinkState: composer-target A's 1.5 px accent border, accent
// tab with its bold accent name, accent send) whenever his words go to an agent that is not main.
// Passes when, on the scripted core (FakeCore, fake data), at 1100 and 800, light and dark:
//   (1) acme's main: 'to bise', plain;
//   (2) perf's thread: 'to perf' bold in the accent, the tab and the send in the accent, the box's
//       1.5 px accent border, the tip 'your words go to perf, not bise'; its place and context stay;
//       his line goes to perf;
//   (3) perf's question open: its own pink ('↳ answering perf · …'); its merge: the approval's
//       plain line; esc folds it: perf's pink again;
//   (4) the bottom block on perf's review writes to perf: pink; on the agents screen (main): plain.
// The artifact states are art-target.spec's (unchanged). Shots for designer: agt-<theme>-<w>-*.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { inbox } from '../../../src/proto/words_inbox.gen';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const MIN = 60_000;
const TIP = 'your words go to perf, not bise';
const prefs = (theme: 'light' | 'dark') => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const usage = (words: string) => ({ model: 'anthropic/claude-opus-5-5', context: 42310, window: 256000, words, short: '17%' });
const world = (now: number, theme: 'light' | 'dark') => {
  const ag = (name: string, over: Record<string, unknown> = {}) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: now - 60 * MIN, waits: 0, watching: [], ...over });
  const cards = [
    { id: 1, project: P, kind: 'question', rank: 1, agent: 'perf', question: 'keep the webp next to the avif?', options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], urgent: false, since_ms: now - 1 * MIN },
    { id: 3, project: P, kind: 'merge', approval: true, rank: 2, agent: 'perf', question: 'merge sb/perf into main? 3 files, the hero image goes from 2.4 MB to 180 KB', options: [{ n: 1, label: 'merge it' }, { n: 2, label: 'not yet' }], urgent: false, since_ms: now - 2 * MIN },
  ];
  return [
    prefs(theme),
    {
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: 2, running: true, cards },
      ],
    },
    { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
    {
      ev: 'agents',
      project: P,
      agents: [
        ag('main', { usage: usage('63k · 26%') }),
        ag('perf', { status: 'waiting', waits: 2, purpose: 'product page speed', branch: 'sb/perf', worktree: '/nowhere/.bise/worktrees/acme-1/perf/acme', usage: usage('42k · 17%') }),
      ],
    },
    { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: now - 3 * MIN, kind: 'agent', text: 'perf is on the product page.' }], before: null, more: false },
    { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: now - 6 * MIN, kind: 'you', text: 'make the product page faster' }, { pos: 2, at_ms: now - 5 * MIN, kind: 'agent', text: 'the hero image is 2.4 MB: i made it a 180 KB avif. keep the webp too?' }], before: null, more: false },
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
    const who = q('[data-testid="composer.tab.to"] .who');
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
      tabBg: tab === null ? '' : getComputedStyle(tab).backgroundImage,
      whoColor: who === null ? '' : getComputedStyle(who).color,
      whoWeight: who === null ? '' : getComputedStyle(who).fontWeight,
      sendBg: send === null ? '' : getComputedStyle(send).backgroundColor,
    };
  });

const plain = async (page: Page, why: string) => {
  const l = await look(page);
  expect(l.boxShadow, `${why}: no accent border`).not.toContain(l.accent);
  expect(l.tabAcc, `${why}: the tab's plain line`).toBe(false);
  expect(l.tabTip, `${why}: no tip`).toBeNull();
  expect(l.whoColor, `${why}: the name not in the accent`).not.toBe(l.accent);
  expect(l.sendBg, `${why}: the send ink`).not.toBe(l.accent);
};
/** the plain tab's fill (main's): the pink to another agent keeps it, lines only (designer m_28208) */
let plainBg = '';
const pink = async (page: Page, why: string, tip: string) => {
  // past the 120 ms fade in (mid-way the border reads oklab at 1.49 px)
  await expect.poll(async () => { const l = await look(page); return l.boxShadow.includes(`${l.accent} 0px 0px 0px 1.5px`); }, { timeout: 3000 }).toBe(true);
  const l = await look(page);
  if (plainBg !== '') expect(l.tabBg, `${why}: no fill, the plain tab's`).toBe(plainBg);
  expect(l.boxShadow, `${why}: a 1.5 px accent border`).toContain(`${l.accent} 0px 0px 0px 1.5px`);
  expect(l.tabAcc, `${why}: the accent tab`).toBe(true);
  expect(l.whoColor, `${why}: the name in the accent`).toBe(l.accent);
  expect(l.whoWeight, `${why}: the name bold`).toBe('600');
  expect(l.tabTip, `${why}: the tip`).toBe(tip);
  expect(l.sendBg, `${why}: the send filled accent`).toBe(l.accent);
};

for (const theme of ['light', 'dark'] as const) {
  for (const w of [1100, 800]) test(`composer/agent-target: pink when his words go to an agent that is not main, plain for main, an item's own state wins (${theme}, ${String(w)})`, async () => {
    test.setTimeout(120_000);
    const core = new FakeCore(world(Date.now(), theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    // (1) main first, on its own launch (at 800 the agents bar is folded: perf's thread is the second launch's route)
    {
      const m = await launchDesktop({ core: new FakeCore(world(Date.now(), theme) as unknown as ConstructorParameters<typeof FakeCore>[0]), route: `project/${P}`, size: `${String(w)}x800` });
      try {
        const page = m.page;
        await m.app.evaluate(({ BrowserWindow }, w) => {
          const win = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
          win?.setContentSize(w, 800);
        }, w);
        await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(w);
        await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(theme);
        await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'main');
        await expect(page.getByTestId('composer.tab.to')).toHaveText(/^to bise/u, { timeout: 10_000 });
        await page.mouse.move(1, 400);
        await page.waitForTimeout(220);
        await plain(page, `main at ${String(w)}`);
        plainBg = (await look(page)).tabBg;
        await page.screenshot({ path: test.info().outputPath(`agt-${theme}-${String(w)}-main.png`) });
      } finally {
        await m.close();
      }
    }
    const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: `${String(w)}x800` });
    try {
      const { page } = s;
      const size = async (w: number) => {
        await s.app.evaluate(({ BrowserWindow }, w) => {
          const win = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
          win?.setContentSize(w, 800);
        }, w);
        await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(w);
      };
      await size(w);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(theme);
      const shot = async (w: number, name: string) => {
        await page.mouse.move(1, 400);
        await page.waitForTimeout(220); // past the 120 ms fade
        await page.screenshot({ path: test.info().outputPath(`agt-${theme}-${String(w)}-${name}.png`) });
      };
      const field = page.locator('[data-testid="composer.field"]').first();
      const to = page.getByTestId('composer.tab.to');
      const who = page.locator('[data-testid="composer.tab.to"] .who');

      {
        // (2) perf's thread: pink, its place and context kept
        await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'perf');
        await expect(who).toHaveText('to perf');
        await page.waitForTimeout(220);
        await pink(page, `perf at ${String(w)}`, TIP);
        await expect(page.getByTestId('composer.tab.place'), 'its place stays').toHaveCount(1);
        // only 'to perf' is accent: ψ and its folder stay text-3 (designer m_28237)
        expect(await page.getByTestId('composer.tab.place').evaluate((e) => getComputedStyle(e).color), 'the place not in the accent').not.toBe((await look(page)).accent);
        await expect(page.getByTestId('composer.tab.context'), 'its context stays').toHaveCount(1);
        await shot(w, 'perf');
        await field.click();
        await page.keyboard.type(`keep both ${theme} ${String(w)}`);
        await shot(w, 'typed');
        await page.keyboard.press('Enter');
        await expect.poll(() => (core.cmds() as Cmd[]).filter((c) => c.cmd === 'send').at(-1)?.text ?? '', { timeout: 3000 }).toContain(`keep both ${theme} ${String(w)}`);
        expect((core.cmds() as Cmd[]).filter((c) => c.cmd === 'send').at(-1), 'his line goes to perf').toMatchObject({ project: P, agent: 'perf' });

        // (3) its question open: the question's own pink; its merge: the approval's plain line; esc: perf's pink
        await page.getByTestId('inbox.block.row.1').click();
        await expect(page.getByTestId('inbox.block.open.1')).toBeVisible({ timeout: 3000 });
        await expect(to).toHaveText(/^↳ answering perf/u);
        await page.waitForTimeout(220);
        expect((await look(page)).tabTip ?? '', 'the question\'s own tip').toMatch(/^your words answer perf's question/u);
        await shot(w, 'question');
        await page.getByTestId('inbox.block.row.2').click();
        await expect(page.getByTestId('inbox.block.open.2')).toBeVisible({ timeout: 3000 });
        await expect(to).toHaveText(inbox.to_waits({ who: 'perf', waits: inbox.waits_for({ noun: 'merge', digits: inbox.digits_two }) }));
        await page.waitForTimeout(220);
        await plain(page, `the merge open at ${String(w)}`);
        await shot(w, 'approval');
        await field.click();
        await page.keyboard.press('Escape');
        await expect(page.getByTestId('inbox.block.open.2')).toHaveCount(0);
        await expect(who).toHaveText('to perf');
        await page.waitForTimeout(220);
        await pink(page, `perf after esc at ${String(w)}`, TIP);
      }
    } finally {
      await s.close();
    }
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`composer/agent-target: the bottom block is pink on perf's review, plain on the agents screen (main) (${theme})`, async () => {
    test.setTimeout(120_000);
    for (const [route, agent] of [[`agents/${P}`, 'main'], [`review/${P}/perf`, 'perf']] as const) {
      const core = new FakeCore(world(Date.now(), theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
      const s = await launchDesktop({ core, route, size: '1100x800' });
      try {
        const { page } = s;
        await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(theme);
        for (const w of [1100, 800]) {
          await s.app.evaluate(({ BrowserWindow }, w) => {
            const win = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
            win?.setContentSize(w, 800);
          }, w);
          await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(w);
          await expect(page.getByTestId('app.bottom')).toHaveAttribute('data-agent', agent, { timeout: 10_000 });
          await page.mouse.move(1, 400);
          await page.waitForTimeout(220);
          if (agent === 'perf') {
            await expect(page.locator('[data-testid="composer.tab.to"] .who')).toHaveText('to perf');
            await pink(page, `the review at ${String(w)}`, TIP);
          } else {
            await expect(page.getByTestId('composer.tab.to')).toHaveText(/^to bise/u);
            await plain(page, `the agents screen at ${String(w)}`);
            plainBg = (await look(page)).tabBg;
          }
          await page.screenshot({ path: test.info().outputPath(`agt-${theme}-${String(w)}-bottom-${agent === 'perf' ? 'review' : 'agents'}.png`) });
        }
      } finally {
        await s.close();
      }
    }
  });
}
