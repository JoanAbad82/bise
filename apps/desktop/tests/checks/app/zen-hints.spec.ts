// app/zen-hints · his ask (zen-hints, main m_25676): the desktop matches the terminal app on two
// behaviours. On FakeCore: acme with 2 inbox items, its main thread with a long message of his (a
// fold), a thinking row (a fold) and a code block. Passes when:
//   HELD CTRL (rust/tui/src/ctrlhint.rs): a quick ctrl (under 150 ms) shows nothing; held alone
//     150 ms: the inbox rows' numbers turn accent (the block's data-ctrl), each fold says
//     '⌃O expand', a hovered code block's copy '⌃Y', the composer's key line
//     lists every ctrl key of the moment (ctrl+o expand, ctrl+1-2 open an inbox item, ctrl+y copy
//     code, ctrl+` terminal); released: all gone, the line at rest again; ctrl+o while held hides
//     them and opens the folds, the next hold says '⌃O collapse'.
//   ZEN (rust/tui/src/zen.rs): a typed letter in the composer sets data-zen; 300 ms later the
//     sidebar's text is 45% toward its ground (alpha .55) while the thread's text, the composer's
//     text and the accent count keep theirs; an arrow key holds it, a mouse move leaves at once,
//     typing again enters, ⏎ (send) leaves, '/' opening the list is no zen, and 5 s after the last
//     key it leaves by itself.
// Shots: rest-, ctrl-held- and zen-<theme>-<w>.png, light + dark at 1100 and 800, for the
// designer. Owner: amb-win.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

import { thread } from '../../../src/proto/words_thread.gen';
const P = 'acme-1a2b3c4d';
const HOME = 'bise-home-00000000';
const NOW = Date.now();
const MIN = 60_000;
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 40 * MIN, waits: 0, watching: [] });
const card = (id: number) => ({ id, project: P, kind: 'question', agent: 'main', question: `ship the parser? (${String(id)})`, options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], urgent: false, since_ms: NOW - 2 * MIN });
const LONG = Array.from({ length: 30 }, (_, i) => `line ${String(i + 1)} of the plan`).join('\n');
const CODE = 'Here is the loop:\n\n```rust\nfn main() {\n    println!("hi");\n}\n```\n';
const world = (theme: 'light' | 'dark') => [
  { ev: 'prefs', prefs: { onboarded: true, theme } },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: 2, running: true, cards: [card(1), card(2)] },
    ],
  },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf')] },
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: NOW - 9 * MIN, kind: 'you', text: LONG },
      { pos: 2, at_ms: NOW - 8 * MIN, kind: 'thinking', text: thread.thought_for({ dur: '3.2s' }), thinking: { ms: 3200, text: 'the parser first, then the loop.' } },
      { pos: 3, at_ms: NOW - 7 * MIN, kind: 'agent', text: CODE },
    ],
    before: null,
    more: false,
  },
];

const launch = (theme: 'light' | 'dark', w: number) => {
  const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  return launchDesktop({ core, route: `agent/${P}/main`, size: `${String(w)}x760` }).then((s) => ({ s, core }));
};

/** The alpha of an element's computed text color (1 when opaque). */
const alpha = (page: Page, sel: string): Promise<number> =>
  page.locator(sel).first().evaluate((el) => {
    const c = getComputedStyle(el).color;
    const m = /rgba?\(([^)]+)\)/.exec(c) ?? /color\(srgb ([^)]+)\)/.exec(c);
    const parts = (m?.[1] ?? '').split(/[ ,/]+/).filter(Boolean);
    return parts.length >= 4 ? Number(parts[3]) : 1;
  });

test('app/zen-hints: ctrl held alone shows the ctrl keys where they act, as the TUI', async () => {
  test.setTimeout(90_000);
  const { s, core } = await launch('light', 1100);
  try {
    const { page } = s;
    const block = page.getByTestId('inbox.block');
    await expect(block).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('thread.fold.1')).toBeVisible();
    const keys = page.getByTestId('composer.keys');
    const rest = await keys.innerText();
    const hints = page.locator('.app-keyhint, [data-testid="thread.fold.hint"]');

    // a quick ctrl: nothing
    await page.keyboard.down('Control');
    await page.waitForTimeout(60);
    await page.keyboard.up('Control');
    await page.waitForTimeout(300);
    await expect(hints, 'a quick ctrl: no hint').toHaveCount(0);
    await expect(block).not.toHaveAttribute('data-ctrl', /.*/);

    // held: every ctrl key where it acts
    const numColor = () => block.locator('.strip-n').first().evaluate((el) => getComputedStyle(el).color);
    const before = await numColor();
    const bubble = page.getByTestId('thread.you.1');
    const boxAtRest = await bubble.boundingBox();
    await page.keyboard.down('Control');
    await expect(block, 'the inbox rows: lit').toHaveAttribute('data-ctrl', 'true', { timeout: 2000 });
    expect(await numColor(), 'a row number in accent').not.toBe(before);
    // the thinking row's fold has room: its hint shows at the row's right end
    const think = page.getByTestId('thread.think.2.head').getByTestId('thread.fold.hint');
    await expect(think).toHaveText('⌃O expand');
    await expect(think).toBeVisible();
    // his bubble's fold is narrow: its hint is there, shown whole or dropped whole (designer m_25695)
    await expect(page.getByTestId('thread.fold.1').getByTestId('thread.fold.hint')).toHaveText('⌃O expand');
    await expect(page.getByTestId('thread.fold.1').locator('.b-fold-hint')).toHaveAttribute('data-fits', /^(true|false)$/);
    // nothing moves (designer m_25695): his bubble keeps its box with the fold's hint in it
    expect(await bubble.boundingBox(), "his bubble doesn't move or grow").toEqual(boxAtRest);
    await expect(keys).toHaveAttribute('data-mode', 'held-Control');
    const held = await keys.innerText();
    // ctrl+1-N: N the block's items (its head's ⌃1–N)
    const n = Number(await block.getAttribute('data-count'));
    expect(n, 'the block lists the items').toBeGreaterThan(1);
    // ctrl written as the Mac's ⌃ (U+2303) everywhere (designer m_26044)
    for (const w of ['⌃O expand', `⌃1–${String(n)} open an inbox item`, '⌃Y copy code', '⌃` terminal']) expect(held, `the key line: ${w}`).toContain(w);
    expect(held, 'no ctrl+ notation').not.toContain('ctrl+');
    // voice and the mic say their ⌃R keys at rest already (composer delight, 4cdbce458): they stay
    if ((await page.getByTestId('composer.voice').count()) > 0) await expect(page.getByTestId('composer.voice')).toContainText('⌃R⌃R');
    // a hovered code block: its copy says ⌃Y (the mouse moving never hides them)
    await page.locator('.th-code').first().hover();
    await expect(page.getByTestId('thread.code.hint')).toBeVisible();
    await expect(page.getByTestId('thread.code.copy')).toContainText('⌃Y');
    await expect(block, 'still held after a mouse move').toHaveAttribute('data-ctrl', 'true');
    await page.screenshot({ path: test.info().outputPath('ctrl-held.png') });

    // released: all gone at once
    await page.keyboard.up('Control');
    await expect(hints).toHaveCount(0);
    await expect(block).not.toHaveAttribute('data-ctrl', /.*/);
    await expect.poll(() => keys.innerText(), { message: 'the key line at rest again' }).toBe(rest);

    // ctrl+o while held: the hints go, every fold opens; the next hold says collapse
    await page.keyboard.down('Control');
    await expect(think).toBeVisible({ timeout: 2000 });
    await page.keyboard.press('o');
    await expect(hints, 'ctrl+o: gone').toHaveCount(0);
    await page.keyboard.up('Control');
    await expect(page.getByTestId('thread.fold.1')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.down('Control');
    await expect(page.getByTestId('thread.fold.1').getByTestId('thread.fold.hint')).toHaveText('⌃O collapse', { timeout: 2000 });
    expect(await keys.innerText()).toContain('⌃O collapse');
    // a click hides them too
    await page.mouse.down();
    await page.mouse.up();
    await expect(hints, 'a click: gone').toHaveCount(0);
    await page.keyboard.up('Control');
  } finally {
    await s.close();
    core.dispose();
  }
});

test('app/zen-hints: typing in the composer steps the chrome back, as the TUI\'s zen', async () => {
  test.setTimeout(90_000);
  const { s, core } = await launch('light', 1100);
  try {
    const { page } = s;
    const root = page.getByTestId('app.root');
    const field = page.getByTestId('composer.field');
    await expect(field).toBeVisible({ timeout: 10_000 });
    const side = `[data-testid="app.sidebar.project.${P}"] .nm`;
    const count = `[data-testid="app.sidebar.project.${P}.count"]`;
    const thread = '[data-testid="thread.list"] .th-code-lang, [data-testid="thread.list"] p';
    await field.click();
    await page.mouse.move(5, 300);
    await page.waitForTimeout(100);
    await expect(root).not.toHaveAttribute('data-zen', /.*/);
    expect(await alpha(page, side), 'at rest: the sidebar opaque').toBe(1);

    // a letter: zen; the chrome 45% toward its ground, the thread, the field and the accent kept
    await page.keyboard.type('h');
    await expect(root, 'a typed letter: zen').toHaveAttribute('data-zen', 'true', { timeout: 1000 });
    await page.waitForTimeout(350);
    expect(await alpha(page, side), 'the sidebar text faded (45%)').toBeCloseTo(0.55, 1);
    expect(await alpha(page, '[data-testid="app.title.crumb"]'), 'the title bar faded').toBeLessThan(0.7);
    expect(await alpha(page, thread), 'the thread kept').toBe(1);
    expect(await alpha(page, '[data-testid="composer.field"]'), "the composer's text kept").toBe(1);
    if ((await page.locator(count).count()) > 0) expect(await alpha(page, count), 'the accent count kept').toBe(1);
    await page.screenshot({ path: test.info().outputPath('zen.png') });

    // an arrow holds it; a mouse move leaves at once
    await page.keyboard.press('ArrowLeft');
    await expect(root).toHaveAttribute('data-zen', 'true');
    await page.mouse.move(60, 320);
    await expect(root, 'a mouse move: out').not.toHaveAttribute('data-zen', /.*/);
    await page.waitForTimeout(350);
    expect(await alpha(page, side), 'back at rest').toBe(1);
    // typing again: in; ⏎ sends: out
    await page.keyboard.press('End');
    await page.keyboard.type('i');
    await expect(root).toHaveAttribute('data-zen', 'true', { timeout: 1000 });
    await page.keyboard.press('Enter');
    await expect(root, '⏎ send: out').not.toHaveAttribute('data-zen', /.*/);
    // '/' opens the list: no zen
    await page.keyboard.type('/');
    await expect(page.locator('.b-composer .b-picker')).toBeVisible({ timeout: 2000 });
    await page.waitForTimeout(100);
    await expect(root, "'/' opens the list: no zen").not.toHaveAttribute('data-zen', /.*/);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Backspace');
    // 5 s after the last key it leaves by itself
    await page.keyboard.type('z');
    await expect(root).toHaveAttribute('data-zen', 'true', { timeout: 1000 });
    const t0 = Date.now();
    await expect(root, '5 s after the last key: out').not.toHaveAttribute('data-zen', /.*/, { timeout: 7000 });
    const took = Date.now() - t0;
    expect(took, 'about ZEN_HOLD_MS').toBeGreaterThan(4000);
  } finally {
    await s.close();
    core.dispose();
  }
});

test('app/zen-hints: shots for the designer, light + dark at 1100 and 800', async () => {
  test.setTimeout(180_000);
  for (const theme of ['light', 'dark'] as const) {
    for (const w of [1100, 800]) {
      const { s, core } = await launch(theme, w);
      try {
        const { page } = s;
        const field = page.getByTestId('composer.field');
        await expect(field).toBeVisible({ timeout: 10_000 });
        // the window at w (launch's size is the page app's only: window-fit's way)
        await s.app.evaluate(({ BrowserWindow }, ww) => {
          const win = BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0];
          win?.setContentSize(ww, 760);
        }, w);
        await expect.poll(() => page.evaluate(() => window.innerWidth), { message: `the window is ${String(w)} wide` }).toBe(w);
        await page.waitForTimeout(300);
        await page.screenshot({ path: test.info().outputPath(`rest-${theme}-${String(w)}.png`) });
        await page.keyboard.down('Control');
        await expect(page.getByTestId('inbox.block')).toHaveAttribute('data-ctrl', 'true', { timeout: 2000 });
        await page.screenshot({ path: test.info().outputPath(`ctrl-held-${theme}-${String(w)}.png`) });
        await page.keyboard.up('Control');
        await field.click();
        await page.keyboard.type('the parser first, then');
        await page.waitForTimeout(400);
        await page.screenshot({ path: test.info().outputPath(`zen-${theme}-${String(w)}.png`) });
      } finally {
        await s.close();
        core.dispose();
      }
    }
  }
});
