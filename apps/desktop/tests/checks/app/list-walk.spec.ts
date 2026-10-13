// app/list-walk · his ask (main m_22146, m_22164; ambient-lead m_22147, m_22338): every list page
// walks with the TUI's list keys (tui-parity m_22176). One walk per page on the scripted core
// (FakeCore's fixture world: acme's artifacts, agents, scheduled tasks, perf's log, two cards; the
// approvals rules sent by the check), real keys only. Passes when, on each page:
//   - artifacts, scheduled, agents, archived, log, settings › approvals (the shared useListKeys or
//     its stepOf): home is the first row, ↑ at the top stays, ↓↓ is the 3rd row (or the last when
//     fewer), end is the last, ↑ steps back; and the page's ⏎ (or ⌫ on a rule) does its act:
//     ⏎ opens the artifact, the task's pane, the agent's thread; ⌫ asks 'remove it?', esc keeps it;
//   - ⌘I (the inbox block): ⌘I opens item 1, ↓ the next, ↓ at the end stays, ↑ back, ↑ at the top
//     stays, esc closes.
// Owner: amb-mac.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect, type Session } from '../../harness';
import { menuKey } from '../world';

const P = 'acme-1a2b3c4d';

type Walk = {
  /** the page's rows' keys, in the order they show */
  rows: (page: Page) => Promise<string[]>;
  /** the selected row's key (null: none) */
  sel: (page: Page) => Promise<string | null>;
  /** the element that takes the keys */
  focus: string;
};

const attrs = (page: Page, sel: string, attr: string) =>
  page.locator(sel).evaluateAll((els, a) => els.map((e) => e.getAttribute(a) ?? ''), attr);
const one = async (page: Page, sel: string, attr: string) => (await attrs(page, sel, attr))[0] ?? null;

const WALKS: Record<string, Walk & { route: string; ready: string }> = {
  artifacts: {
    route: `artifacts/${P}`,
    ready: '[data-testid="artifacts.list"] [role=option]',
    focus: '[data-testid="artifacts.list"]',
    rows: (p) => attrs(p, '[data-testid="artifacts.list"] [role=option]', 'data-row'),
    sel: (p) => one(p, '[data-testid="artifacts.list"] [role=option][aria-selected=true]', 'data-row'),
  },
  scheduled: {
    route: 'scheduled',
    ready: '[data-testid^="scheduled.row."]',
    focus: '[data-testid="scheduled.screen"]',
    rows: (p) => attrs(p, '[data-testid^="scheduled.row."][data-row]', 'data-row'),
    sel: (p) => one(p, '[data-testid^="scheduled.row."][aria-selected=true]', 'data-row'),
  },
  agents: {
    route: `agents/${P}`,
    ready: '[data-testid="agents.screen"] .ag-item',
    focus: '[data-testid="agents.screen"]',
    rows: (p) => attrs(p, '[data-testid="agents.screen"] .ag-item', 'data-row'),
    sel: (p) => one(p, '[data-testid="agents.screen"] .ag-item.is-sel', 'data-row'),
  },
  archived: {
    route: `agents/${P}/archived`,
    ready: '[data-testid="agents.screen"] .ag-item',
    focus: '[data-testid="agents.screen"]',
    rows: (p) => attrs(p, '[data-testid="agents.screen"] .ag-item', 'data-row'),
    sel: (p) => one(p, '[data-testid="agents.screen"] .ag-item.is-sel', 'data-row'),
  },
  log: {
    route: `log/${P}/perf`,
    ready: '[data-testid^="log.row."]',
    focus: '[data-testid="log"]',
    rows: (p) => attrs(p, '[data-testid="log.list"] .lg-e[data-testid^="log.row."]', 'data-testid'),
    sel: (p) => one(p, '[data-testid="log.list"] .lg-e.at', 'data-testid'),
  },
  approvals: {
    route: 'settings/approvals',
    ready: '[data-testid="settings.approvals.rules"] .b-gi',
    focus: '.settings-approvals',
    rows: (p) => attrs(p, '[data-testid="settings.approvals.rules"] .b-gi', 'data-row'),
    sel: (p) => one(p, '[data-testid="settings.approvals.rules"] .b-gi.is-sel', 'data-row'),
  },
};

/** Settings shows the home's approvals: the fixture world has no home, the check adds one. */
const HOME = 'bise-home-00000000';
const PROJECTS = {
  ev: 'projects', projects: [
    { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
    { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
  ],
};

/** The rules the approvals page lists (three, so ↓↓ reaches the 3rd). */
const APPROVALS = {
  ev: 'approvals', project: HOME, mode: 'auto', env: false, checker: 'jev', checker_who: 'TypeSafe', checker_model: 'jev-1.13', repo: '/nowhere/acme',
  rules: [
    { tool: 'bash', pattern: 'cargo test *', what: 'cargo test *', note: 'from perf' },
    { tool: 'edit', path: '/nowhere/acme/docs', what: 'edits to docs/', note: 'every project' },
    { tool: 'gmail.send_email', what: 'gmail.send_email', note: 'a connector' },
  ],
};

/** acme's scheduled tasks (three; the fixture world has none). */
const scheduled = (now: number) => ({
  ev: 'scheduled', project: P, items: [
    { id: 2, name: 'morning page', agent: 'main', by: 'you', words: 'the morning page: what changed overnight', every: 'day 07:30', done: 12, next_ms: now + 60 * 60_000 },
    { id: 7, name: 'bench rerun', agent: 'perf', by: 'perf', words: 'rerun the product page bench', every: '1h', done: 3, next_ms: now + 41 * 60_000 },
    { id: 9, agent: 'api', by: 'main', words: 'watch the checkout PR until its checks are green', every: '10m', times: 6, done: 2, next_ms: now + 8 * 60_000 },
  ],
});

async function walk(s: Session, name: string, w: Walk): Promise<string[]> {
  const { page } = s;
  const rows = await w.rows(page);
  expect(rows.length, `${name}: the fixture has rows`).toBeGreaterThan(0);
  const at = (i: number) => rows[Math.max(0, Math.min(rows.length - 1, i))] ?? null;
  const key = async (k: string, want: string | null, why: string) => {
    await page.keyboard.press(k);
    await expect.poll(() => w.sel(page), { timeout: 3000, message: `${name}: ${why}` }).toBe(want);
  };
  await page.locator(w.focus).first().focus();
  await key('Home', at(0), 'home is the first row');
  await key('ArrowUp', at(0), '↑ at the top stays');
  await key('ArrowDown', at(1), '↓ the 2nd');
  await key('ArrowDown', at(2), '↓↓ the 3rd (or the last)');
  await key('End', at(rows.length - 1), 'end is the last');
  await key('ArrowUp', at(rows.length - 2), '↑ steps back');
  await key('Home', at(0), 'home again');
  return rows;
}

test('app/list-walk: every list page walks with the TUI list keys', async () => {
  test.setTimeout(300_000);
  for (const [name, w] of Object.entries(WALKS)) {
    const core = new FakeCore();
    const s = await launchDesktop({ core, route: w.route, size: '1400x900' });
    try {
      const { page } = s;
      if (name === 'approvals') {
        await core.send(PROJECTS as never);
        await core.send(APPROVALS as never);
      }
      if (name === 'scheduled') await core.send(scheduled(Date.now()) as never);
      await expect(page.locator(w.ready).first(), `${name}: the list shows`).toBeVisible({ timeout: 10_000 });
      const rows = await walk(s, name, w);
      await page.screenshot({ path: test.info().outputPath(`${name}.png`) });
      if (name === 'artifacts') {
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await expect(page.getByTestId('artifact.open'), 'artifacts: ⏎ opens the selected one').toBeVisible({ timeout: 5000 });
      } else if (name === 'scheduled') {
        await page.keyboard.press('Enter');
        await expect(page.getByTestId('scheduled.pane'), "scheduled: ⏎ opens the task's pane").toBeVisible({ timeout: 5000 });
        await page.keyboard.press('ArrowDown');
        expect(await w.sel(page), 'scheduled: the move keys stay put while a task is open').toBe(rows[0]);
        await page.keyboard.press('Escape');
        await expect(page.getByTestId('scheduled.pane'), 'scheduled: esc closes the task').toBeHidden({ timeout: 5000 });
      } else if (name === 'agents') {
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await expect(page.locator('[data-testid="thread.screen"]'), "agents: ⏎ opens the agent's thread").toHaveAttribute('data-project', P, { timeout: 5000 });
      } else if (name === 'approvals') {
        const list = page.getByTestId('settings.approvals.rules');
        await page.keyboard.press('End');
        await page.keyboard.press('Backspace');
        await expect(list, 'approvals: ⌫ asks first').toContainText('remove it?');
        await page.keyboard.press('Escape');
        await expect(list, 'approvals: esc keeps the rule').not.toContainText('remove it?');
        await expect(page.getByTestId('settings.root'), 'approvals: the first esc stays in settings').toBeVisible();
        expect(core.cmds().filter((c) => c.cmd === 'remove_rule'), 'approvals: nothing removed').toEqual([]);
      }
    } finally {
      await s.close();
    }
  }

  // ⌘I: the inbox block, on acme's thread (its two fixture cards)
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1400x900' });
  try {
    const { page } = s;
    await expect(page.locator('[data-testid="thread.screen"]')).toHaveAttribute('data-project', P, { timeout: 10_000 });
    const open = () => one(page, '[data-testid^="inbox.block.open."]', 'data-testid');
    expect(await menuKey(s, 'CmdOrCtrl+I'), '⌘I is in the menu').not.toBe('');
    await expect.poll(open, { timeout: 5000, message: '⌘I opens item 1' }).toBe('inbox.block.open.1');
    await page.locator('body').focus();
    const key = async (k: string, want: string | null, why: string) => {
      await page.keyboard.press(k);
      await expect.poll(open, { timeout: 3000, message: `⌘I: ${why}` }).toBe(want);
    };
    // the block's item count is its head ('N waiting'; it draws 1 row + the open one): the
    // fixture's cards come in over a few events, so wait for N to hold still 1 s before walking.
    // the walk is ↓ ↑ ↑ (moves one, back, stays at the top): the clamp at the end is Block.test.tsx's
    // (amb-home 54a0e74f), the cards' order can still settle under a walk to the end here
    const head = page.locator('[data-testid="inbox.block"] .strip-count');
    let n = 0;
    for (let still = 0, t = 0; still < 10 && t < 100; t++) {
      const c = Number(/^(\d+) waiting/.exec(await head.innerText())?.[1] ?? '0');
      still = c === n ? still + 1 : 0;
      n = c;
      await page.waitForTimeout(100);
    }
    expect(n, '⌘I: the block shows at least 2 items').toBeGreaterThanOrEqual(2);
    await key('ArrowDown', 'inbox.block.open.2', '↓ the next item');
    await key('ArrowUp', 'inbox.block.open.1', '↑ back one');
    await key('ArrowUp', 'inbox.block.open.1', '↑ at the top stays');
    await page.screenshot({ path: test.info().outputPath('cmd-i.png') });
    await key('Escape', null, 'esc closes the item');
  } finally {
    await s.close();
  }
});
