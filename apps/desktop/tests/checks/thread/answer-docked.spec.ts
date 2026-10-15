// thread/answer-docked · inbox card v2 item 7 (ambient m_11273, amb-home 98ac9ea7): while the
// strip's card is docked over the composer, the composer answers it. Passes when, with perf's
// question open from the strip, the composer's label says '↳ answering perf · which bench?' and its
// placeholder 'your answer to perf, then ⏎', his words + ⏎ go as the hub's answer to card 9 (no message),
// and esc in the field makes the composer a plain message to acme's main again. The scripted
// core (FakeCore). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const agent = (name: string) => ({ name, main: name === 'main', status: name === 'perf' ? 'waiting' : 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: name === 'perf' ? 1 : 0 });
// the strip reads the open cards on the projects rows (ProjectRow.cards), as the inbox does
const CARD = { id: 9, project: P, kind: 'question', rank: 1, agent: 'perf', question: 'which bench?', options: [{ n: 1, label: 'cold' }, { n: 2, label: 'warm' }], urgent: false, since_ms: 1791100310000 };
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
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: 1, running: true, cards: [CARD] },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf')] },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hello' }], before: null, more: false },
];
type Cmd = { cmd?: string; card?: number; reply?: string; text?: string };

test("thread/answer-docked: the docked card's composer answers it; esc makes it a message again", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}` });
  try {
    const { page } = s;
    await expect(page.getByTestId('inbox.block.row.1')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('inbox.block.row.1').click();
    await expect(page.getByTestId('inbox.block.open.1'), 'the card opens in place').toBeVisible({ timeout: 3000 });
    const composer = page.getByTestId('composer');
    await expect(composer, 'the label').toContainText('↳ answering perf · which bench?');
    const field = page.locator('[data-testid="composer.field"]').first();
    await expect(field).toHaveAttribute('aria-placeholder', 'your answer to perf, then ⏎');
    await page.screenshot({ path: test.info().outputPath('answering.png') });
    await field.click();
    await page.keyboard.type('cold, on the m2');
    await page.keyboard.press('Enter');
    const a = (await core.waitCmd((c) => (c as Cmd).cmd === 'answer')) as Cmd;
    expect(a.card).toBe(9);
    expect(a.reply).toBe('cold, on the m2');
    expect(core.cmds().some((c) => (c as Cmd).cmd === 'send'), 'no message went').toBe(false);
  } finally {
    await s.close();
    core.dispose();
  }
});

test('thread/answer-docked: esc in the field turns it back into a plain message', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}` });
  try {
    const { page } = s;
    await page.getByTestId('inbox.block.row.1').click({ timeout: 10_000 });
    await expect(page.getByTestId('composer')).toContainText('answering perf');
    const field = page.locator('[data-testid="composer.field"]').first();
    await field.click();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('composer')).not.toContainText('answering perf');
    await page.keyboard.type('just a note');
    await page.keyboard.press('Enter');
    const m = (await core.waitCmd((c) => (c as Cmd).cmd === 'send')) as Cmd;
    expect(m.text).toBe('just a note');
  } finally {
    await s.close();
    core.dispose();
  }
});
