// thread/fold-hold · an opened or closed row never moves (qa-native's FOLDS2 red on beb70fe6,
// designer m_17092, ambient-lead m_17097): at the end of a long thread (the list stuck to its end),
// a click on '▸ read 2 files', on a thinking row, then closing them again, each keeps the clicked
// row's top within 2 px (the thread grows below it, never back to the end on his click); ⌘E (open
// everything) keeps the row at the top of the view in place. Measured 700 ms after the press, as
// qa-native's check does. The scripted core (FakeCore), fake data. Owner: amb-win.
import type { Locator, Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const ag = (name: string) => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 90 * MIN, waits: 0 });
const PARA = 'the loop reads the core state first, then each channel in turn, and only then the queue; ';
const older = Array.from({ length: 30 }, (_, i) => ({ pos: i + 1, at_ms: NOW - (80 - i) * MIN, kind: i % 3 === 0 ? 'you' : 'agent', text: `${String(i + 1)}. ${PARA.repeat(i % 3 === 0 ? 1 : 3)}` }));
const world = () => [
  { ev: 'prefs', prefs: { onboarded: true, theme: 'light' } },
  { ev: 'projects', projects: [{ project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 0, agents: 2, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [ag('main'), ag('perf')] },
  {
    ev: 'thread',
    project: P,
    agent: 'perf',
    entries: [
      ...older,
      { pos: 40, at_ms: NOW - 8 * MIN, kind: 'thinking', text: 'thought for 3.2s', thinking: { ms: 3200, text: `${PARA}${PARA}${PARA}${PARA}` } },
      {
        pos: 41,
        at_ms: NOW - 7 * MIN,
        kind: 'tools',
        text: 'read 6 files',
        tools: {
          count: 6,
          summary: 'read 6 files',
          items: Array.from({ length: 6 }, (_, i) => ({ pos: 42 + i, at_ms: NOW - 7 * MIN + i * 1000, text: `read_file: {"path":"core/part${String(i)}.rs"}`, kind: 'read', state: 'ok', ms: 20 })),
        },
      },
      { pos: 50, at_ms: NOW - 6 * MIN, kind: 'agent', text: 'Skeleton first.' },
    ],
    before: null,
    more: false,
  },
];

/** The press's row top before and 700 ms after; returns the move in px. */
async function moveOf(page: Page, row: Locator, press: () => Promise<void>): Promise<number> {
  const before = (await row.boundingBox())?.y ?? Number.NaN;
  await press();
  await page.waitForTimeout(700);
  const after = (await row.boundingBox())?.y ?? Number.NaN;
  return Math.abs(after - before);
}

test('thread/fold-hold: an opened or closed row keeps its y at the end of a long thread; ⌘E keeps the top row', async () => {
  test.setTimeout(90_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x760' });
  try {
    const { page } = s;
    const pill = page.getByTestId('thread.tools.41');
    await expect(pill).toContainText('read 6 files', { timeout: 10_000 });
    await expect(page.getByTestId('thread.list')).toHaveAttribute('data-stuck', 'true');
    const think = page.getByTestId('thread.think.40.head');

    // the pill: opened, then closed
    expect(await moveOf(page, pill, () => pill.click()), 'opened: the pill stays where he clicked it').toBeLessThan(2);
    await expect(page.locator('[data-testid="thread.toolrow.41"] .th-steps .th-tool-line')).toHaveCount(6);
    await page.screenshot({ path: test.info().outputPath('pill-open.png') });
    expect(await moveOf(page, pill, () => pill.click()), 'closed: the pill stays').toBeLessThan(2);
    await expect(page.locator('[data-testid="thread.toolrow.41"] .th-steps .th-tool-line')).toHaveCount(0);

    // the thinking row: opened, then closed
    expect(await moveOf(page, think, () => think.click()), 'opened: the thinking row stays').toBeLessThan(2);
    await expect(page.locator('[data-testid="thread.think.40"] .th-think-body')).toBeVisible();
    expect(await moveOf(page, think, () => think.click()), 'closed: the thinking row stays').toBeLessThan(2);

    // ⌘E (the TUI's ctrl+o): the row at the top of the view stays put
    const topRow: string = await page.evaluate((): string => {
      const list = document.querySelector('[data-testid="thread.list"]');
      const edge = list === null ? 0 : list.getBoundingClientRect().top;
      const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="thread.list"] [data-item-index]'));
      const row = rows.find((r) => r.getBoundingClientRect().top >= edge);
      return row === undefined ? '' : (row.dataset['itemIndex'] ?? '');
    });
    expect(topRow).not.toBe('');
    const top = page.locator(`[data-testid="thread.list"] [data-item-index="${topRow}"]`);
    expect(await moveOf(page, top, () => page.keyboard.press('Meta+e')), '⌘E: the top row stays').toBeLessThan(2);
    await expect(page.locator('[data-testid="thread.toolrow.41"] .th-steps .th-tool-line')).toHaveCount(6);
  } finally {
    await s.close();
    core.dispose();
  }
});
