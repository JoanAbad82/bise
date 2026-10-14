// thread/waiting-failed · R9/S3 and R12 (ambient-lead m_14021; hub side amb-feed, merged as 5171afc6). Passes when,
// on the scripted core (FakeCore, fake data):
//   - R9/S3: perf waits on main (the hub's typed waiting_on {who: agent, name: main}): its sidebar sign is ⋯ dim
//     with 'waiting on bise · …' on hover (the TUI's panel: … for an agent waiting on another), the agents list's
//     end reads 'waiting on bise', its head's chip '⋯ waiting on bise' (dim, not the accent); docs waits on him
//     (waiting_on {who: you}): '?' in the accent, 'waiting on you', '? waiting for you';
//   - R12: a failed turn is its own row with why, in the TUI's words (proto words::turn_failed, the same fn the
//     TUI renders): '✗ turn failed: provider 500'; a plan line (the text is why itself) is a ▲ with its words.
// Shots: perf's thread (head + failed row), light and dark. Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'acme-1a2b3c4d';
const AT = 1791100000000;
const agent = (name: string, over: Record<string, unknown> = {}) => ({ name, main: name === 'main', status: 'working', archived: false, title: '', purpose: `${name}'s job`, since_ms: AT, waits: 0, ...over });
const agents = [
  agent('main', { status: 'idle' }),
  agent('perf', { waiting_on: { who: 'agent', name: 'main' } }),
  agent('docs', { status: 'idle', waiting_on: { who: 'you' } }),
];
const entries = [
  { pos: 901, at_ms: AT, kind: 'agent', text: 'running the bench on the product page.' },
  { pos: 902, at_ms: AT + 60_000, kind: 'turn_failed', text: 'turn failed: provider 500', turn_failed: { why: 'provider 500' } },
  { pos: 903, at_ms: AT + 120_000, kind: 'turn_failed', text: "you've hit your ChatGPT plan's limit · it resets at 14:00", turn_failed: { why: "you've hit your ChatGPT plan's limit · it resets at 14:00" } },
];

test('thread/waiting-failed: whom an agent waits on shows in the sidebar, the list and its head; a failed turn is its own row', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  const { page } = s;
  try {
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'perf', { timeout: 10_000 });
    await core.send({ ev: 'agents', project: P, agents } as never);
    await core.send({ ev: 'thread', project: P, agent: 'perf', entries, before: null, more: false } as never);

    await test.step('R9: perf waits on main (bise); docs waits on him', async () => {
      // a reply wait is a pause (agent-waiting-states A, f5a0394a1): the head chip says how long,
      // whom it waits on is the line over the composer
      const chip = page.getByTestId('thread.head.state');
      await expect(chip).toHaveText(/^… waiting · \d+ (s|min|h|d)$/u, { timeout: 3000 });
      await expect(page.getByTestId('thread.waiting')).toContainText(/^continues when (bise|main) answers · /u);
      const perf = page.getByTestId('app.right.agent.perf');
      // the right bar's row: the pause's words and its '…' sign (desktop-agents-bar §2)
      await expect(perf).toHaveAttribute('aria-label', /^continues when (bise|main) answers · \d+ (s|min|h|d) · perf's job$/u);
      await expect(perf.getByTestId('app.right.agent.perf.sign')).toHaveText('…');
      const docs = page.getByTestId('app.right.agent.docs');
      await expect(docs).toHaveAttribute('aria-label', "asks you · docs's job");
      await expect(docs).toContainText('?');
    });

    await test.step("R12: '✗ turn failed: provider 500' its own row; a plan line a ▲", async () => {
      const failed = page.getByTestId('thread.failed.902');
      await expect(failed).toHaveText(/✗\s*turn failed: provider 500/);
      await expect(failed).toHaveAttribute('data-level', 'err');
      const plan = page.getByTestId('thread.failed.903');
      await expect(plan).toHaveAttribute('data-level', 'warn');
      await expect(plan).toHaveText(/▲\s*you've hit your ChatGPT plan's limit · it resets at 14:00/);
      await page.screenshot({ path: test.info().outputPath('waiting-failed-light.png') });
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.setProperty('color-scheme', 'dark');
      });
      await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
      await page.waitForTimeout(250);
      await page.screenshot({ path: test.info().outputPath('waiting-failed-dark.png') });
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.style.setProperty('color-scheme', 'light');
      });
    });

  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});

test("thread/waiting-failed: the agents list's ends say whom each waits on", async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agents/${P}` });
  const { page } = s;
  try {
    await core.send({ ev: 'agents', project: P, agents } as never);
    const row = (name: string) => page.locator('[data-testid^="agents.row."]').filter({ hasText: name }).first();
    await expect(row('perf')).toContainText('waiting on bise', { timeout: 10_000 });
    await expect(row('docs')).toContainText('waiting on you');
    await page.screenshot({ path: test.info().outputPath('waiting-agents-list.png') });
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});
