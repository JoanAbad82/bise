// spotlight/preview · R07-a (his 10-04 words: 'je sélectionne un agent et je vois sur la droite ses
// dernières actions'; designer m_13271). Owner: amb-web. The new app on the scripted core (FakeCore),
// fn+space from the scripted helper.
// Passes when:
//   - the agent row the keyboard is on follows that agent's thread (a subscribe for it) and shows its
//     last 4 actions in its right column, newest last, in the thread's marks, instead of its objective;
//   - before its thread comes, the row shows its objective (no empty box);
//   - a waiting agent's open question reads '? …' in accent;
//   - a row that isn't selected keeps its objective.
// Shots for designer: light + dark, one agent working, one waiting.
import type { Page } from '@playwright/test';
import { test, expect, FakeCore, FakeHelper, launchDesktop } from '../../harness';

type Ev = Parameters<FakeCore['send']>[0];
const HOME = 'bise-home-00000000';
const ACME = 'acme-1a2b3c4d';
const min = (n: number): number => Date.now() - n * 60_000;

const agent = (name: string, status: string, title: string) => ({ name, main: false, status, archived: false, title, purpose: title, since_ms: min(30), waits: 0 });

const P99_THREAD = [
  { pos: 10, at_ms: min(14), kind: 'you', text: 'look at the p99 of the ingest' },
  {
    pos: 11, at_ms: min(12), kind: 'tools', text: '',
    tools: { count: 3, summary: 'ran 2 commands, edited 1 file', items: [
      { pos: 12, at_ms: min(12), kind: 'run', text: 'bash: {"command":"cargo bench -p ingest --bench flush"}' },
      { pos: 13, at_ms: min(9), kind: 'edit', text: 'edit: {"file_path":"crates/ingest/src/batch.rs"}' },
      { pos: 14, at_ms: min(4), kind: 'run', text: 'bash: {"command":"cargo test -p ingest"}' },
    ] },
  },
  { pos: 15, at_ms: min(2), kind: 'agent', text: 'the cache is warm now: p99 went from 41 ms to 12 ms' },
];
const SHIP_THREAD = [
  { pos: 20, at_ms: min(6), kind: 'agent', text: 'the release notes are ready' },
  { pos: 21, at_ms: min(1), kind: 'card', text: '', card: { id: 4, question: 'ship 0.5 to the beta channel now?', options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], answered: false } },
];

async function openSpot(helper: FakeHelper, app: { windows: () => Page[] }): Promise<Page> {
  await helper.send({ ev: 'fn', act: 'key', key: 'space' });
  await expect.poll(() => app.windows().some((p) => p.url().includes('surface=capsule'))).toBe(true);
  const cap = app.windows().find((p) => p.url().includes('surface=capsule'));
  if (!cap) throw new Error('no capsule window');
  await expect(cap.locator('[data-testid="spot.input"]')).toBeVisible({ timeout: 5000 });
  return cap;
}

test('spotlight/preview: the selected agent row shows its last actions in its right column, a waiting one its question', async () => {
  test.setTimeout(90_000);
  const core = new FakeCore();
  const helper = new FakeHelper();
  const s = await launchDesktop({ core, helper });
  try {
    const { app } = s;
    await s.page.waitForTimeout(1500);
    await core.send({
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/Users/camille/bise', home: true, order: 0, agents: 1, working: 0, waits: 0, git: false, running: true },
        { project: ACME, name: 'acme', path: '/Users/camille/acme', home: false, order: 1, agents: 3, working: 1, waits: 1, git: true, branch: 'main', running: true },
      ],
    } as unknown as Ev);
    await core.send({ ev: 'agents', project: ACME, agents: [agent('p99', 'working', 'find why the ingest p99 doubled'), agent('ship', 'blocked', 'ship 0.5 to the beta channel'), agent('docs', 'idle', 'rewrite the setup guide')] } as unknown as Ev);
    await core.send({ ev: 'cards', project: ACME, cards: [] } as unknown as Ev);
    await core.send({ ev: 'cards', project: HOME, cards: [] } as unknown as Ev);
    const cap = await openSpot(helper, app);
    const input = cap.locator('[data-testid="spot.input"]');

    // working: 'p99' selects it; its objective stays until its thread comes
    await input.pressSequentially('p99');
    const row = cap.locator(`[data-testid="spot.row.agent.${ACME}.p99"]`);
    await expect(row).toHaveAttribute('aria-selected', 'true');
    await expect(row, 'the objective while its thread loads').toContainText('find why the ingest p99 doubled');
    await core.waitCmd((c) => c['cmd'] === 'subscribe' && c['project'] === ACME && c['agent'] === 'p99');
    await core.send({ ev: 'thread', project: ACME, agent: 'p99', entries: P99_THREAD, before: null, more: false } as unknown as Ev);
    const acts = row.locator(`[data-testid="spot.row.agent.${ACME}.p99.acts"]`);
    await expect(acts, 'its last actions in the right column').toBeVisible({ timeout: 5000 });
    const lines = await acts.locator('.a .t').allInnerTexts();
    expect(lines, 'the last 4 actions, newest last, in the thread marks').toEqual([
      '$ cargo bench -p ingest --bench flush',
      '± crates/ingest/src/batch.rs',
      '$ cargo test -p ingest',
      '› the cache is warm now: p99 went from 41 ms to 12 ms',
    ]);
    await expect(acts.locator('.a.new .tm'), 'the newest line has its time').toHaveText('2m');
    await expect(row, 'the objective gave its place').not.toContainText('find why the ingest p99 doubled');
    // the actions sit in the objective's column (x of the right column), not under the name
    const xs = await row.evaluate((el: Element) => {
      const name = el.querySelector('b')?.getBoundingClientRect();
      const a = el.querySelector('.b-spot-acts')?.getBoundingClientRect();
      return { name: name?.right ?? 0, acts: a?.left ?? 0 };
    });
    expect(xs.acts, 'right of the name').toBeGreaterThan(xs.name);
    await cap.screenshot({ path: test.info().outputPath('light-working.png') });
    await cap.emulateMedia({ colorScheme: 'dark' });
    await cap.waitForTimeout(200);
    await cap.screenshot({ path: test.info().outputPath('dark-working.png') });
    await cap.emulateMedia({ colorScheme: 'light' });

    // waiting: its open question reads '? …' in accent; p99 is back to its objective
    await input.fill('');
    await input.pressSequentially('ship');
    const ship = cap.locator(`[data-testid="spot.row.agent.${ACME}.ship"]`);
    await expect(ship).toHaveAttribute('aria-selected', 'true');
    await core.waitCmd((c) => c['cmd'] === 'subscribe' && c['project'] === ACME && c['agent'] === 'ship');
    await core.send({ ev: 'thread', project: ACME, agent: 'ship', entries: SHIP_THREAD, before: null, more: false } as unknown as Ev);
    const ask = ship.locator('.b-spot-acts .a.new');
    await expect(ask).toHaveClass(/\bask\b/u, { timeout: 5000 });
    await expect(ask.locator('.t')).toHaveText('? ship 0.5 to the beta channel now?');
    await expect.poll(() => core.cmds().some((c) => c['cmd'] === 'unsubscribe' && c['agent'] === 'p99'), { message: 'p99 is no longer followed' }).toBe(true);
    await cap.screenshot({ path: test.info().outputPath('light-waiting.png') });
    await cap.emulateMedia({ colorScheme: 'dark' });
    await cap.waitForTimeout(200);
    await cap.screenshot({ path: test.info().outputPath('dark-waiting.png') });

    // a row that is not selected keeps its objective
    await input.fill('');
    await input.pressSequentially('acme');
    await expect(cap.locator(`[data-testid="spot.row.agent.${ACME}.docs"]`)).toContainText('rewrite the setup guide');
  } finally {
    await s.close();
  }
});
