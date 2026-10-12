// composer/controls · bar O.6 (docs/desktop-bar.md) for the composer: every control it draws is
// hit by a click at its center (elementFromPoint inside it, nothing over it) and changes under the
// pointer (the ds hovers, src/composer/composer.css). Owner: amb-web (lead m_10883, qa-flows'
// app/clicks red at 7d0266f9). The new app on the scripted core: bise's thread, then a project's
// thread opened from the sidebar once its late controls (its agents in the sidebar, the thread's
// head and 'to the end') are in, the send on (a draft), and the / list open.
// Each control is found by its own test id at each step, never by its index among the page's
// controls: a control that comes late (the project's agents in the sidebar) shifts every index
// after it, and a point taken for one control then lands on another (the app/clicks red).
import type { Locator, Page } from '@playwright/test';
import { FakeCore, FakeHelper, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'telemetry-cf9cb2fe';
const agent = (name: string, over: Record<string, unknown> = {}) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0, ...over });
const world = () => [
  {
    ev: 'prefs',
    prefs: {
      onboarded: true,
      theme: 'system',
      context: { shot: true, url: true, file: true, window_text: false },
      excluded_apps: [],
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
      voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
      shots_keep_days: 7,
    },
  },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'telemetry', path: '/nowhere/telemetry', git: true, home: false, order: 1, agents: 2, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main')] },
  { ev: 'agents', project: P, agents: [agent('main'), agent('p99', { status: 'working' })] },
  { ev: 'thread', project: P, agent: 'main', entries: Array.from({ length: 40 }, (_, i) => ({ pos: i + 1, at_ms: 1791100001000 + i * 1000, kind: 'agent', text: `step ${i + 1} of the telemetry work` })), before: null, more: false },
];

type Seen = { id: string; hit: boolean; hover: boolean; top: string };

const look = (l: Locator) =>
  l.evaluate((el) => {
    const c = getComputedStyle(el);
    return [c.backgroundColor, c.color, c.textDecorationLine, c.opacity, c.boxShadow, c.filter].join('|');
  });

/** One control: hit at its center now (its box read in the same step), a change under the pointer. */
async function probe(page: Page, l: Locator): Promise<Seen> {
  await page.mouse.move(1, 1);
  await page.waitForTimeout(220); // the ds transitions (--d-fast) end
  const id = (await l.getAttribute('data-testid')) ?? '?';
  const before = await look(l);
  const at = await l.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const x = r.x + r.width / 2;
    const y = r.y + r.height / 2;
    const top = document.elementFromPoint(x, y);
    return { x, y, hit: top !== null && (top === el || el.contains(top)), top: top === null ? 'nothing' : `${top.tagName.toLowerCase()}.${top.className}[${top.getAttribute('data-testid') ?? ''}]` };
  });
  await page.mouse.move(at.x, at.y);
  await page.waitForTimeout(220);
  const after = await look(l);
  await page.mouse.move(1, 1);
  return { id, hit: at.hit, hover: before !== after, top: at.top };
}

test('composer/controls: every composer control is hit at its center and hovers, on bise, on a project, with a draft, with the / list', async () => {
  test.setTimeout(90_000);
  const s = await launchDesktop({ helper: new FakeHelper(), core: new FakeCore(world() as never), route: `agent/${HOME}/main` });
  const seen: Record<string, Seen[]> = {};
  try {
    const { page } = s;
    const composer = page.getByTestId('composer');
    const mic = page.getByTestId('composer.mic');
    await expect(page.getByTestId('composer.field')).toBeVisible({ timeout: 10_000 });
    await expect(mic, 'the mic is in the key line').toBeVisible();
    seen['bise thread'] = [await probe(page, mic)];

    await page.getByTestId(`app.sidebar.project.${P}`).click();
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-project', P, { timeout: 5000 });
    // its late controls are in: its agents in the sidebar, before the composer in the page
    await expect(page.getByTestId('app.right.agent.p99')).toBeVisible({ timeout: 5000 });
    seen['telemetry thread'] = [await probe(page, mic)];

    await page.getByTestId('composer.field').click();
    await page.keyboard.type('keep the queue');
    const send = composer.getByTestId('composer.send');
    await expect(send, 'a draft turns the send on').toBeEnabled();
    seen['with a draft'] = [await probe(page, mic), await probe(page, send)];

    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('/');
    const rows = page.locator('[data-testid^="composer.pick."]:not(.on):not(.dis)');
    await expect(rows.first(), 'the / list').toBeVisible({ timeout: 5000 });
    seen['the / list'] = [await probe(page, rows.first()), await probe(page, mic)];
    await page.screenshot({ path: test.info().outputPath('slash-list.png') });
  } finally {
    test.info().annotations.push({ type: 'controls', description: JSON.stringify(seen) });
    await s.close();
  }
  for (const [screen, list] of Object.entries(seen)) {
    expect.soft(list.filter((c) => !c.hit).map((c) => `${c.id} (under its center: ${c.top})`), `${screen}: every composer control is hit at its center`).toEqual([]);
    expect.soft(list.filter((c) => !c.hover).map((c) => c.id), `${screen}: every composer control changes on hover`).toEqual([]);
  }
});
