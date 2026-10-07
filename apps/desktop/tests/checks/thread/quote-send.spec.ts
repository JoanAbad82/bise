// thread/quote-send · his bug 3, parity M6/B7 (the TUI's quote.rs, input.rs:415): a drag across an
// answer in the real thread selects it (rows were visibility:hidden behind Virtuoso's initial
// scroll until now), typing puts it in the composer as a quote chip with its strip, and ⏎ sends
// it as the TUI does: '<selection from="main">…</selection>' in front of his words. Owner: amb-win
// (lead m_10647). The new app on the scripted core; the send read in the core's command log.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { expectShown } from './shown';

const HOME = 'bise-home-00000000';
const ANSWER = 'the p99 climbs when the 14:00 compaction runs.\n2.1 s instead of 300 ms for 12 min.\nalerts suggests moving it to 03:00.';
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
  { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 }] },
  {
    ev: 'thread',
    project: HOME,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: 1791100001000, kind: 'you', text: 'why does ingest p99 climb at 14:00?' },
      { pos: 2, at_ms: 1791100002000, kind: 'agent', text: ANSWER },
    ],
    before: null,
    more: false,
  },
];

test('thread/quote-send: drag selects an answer, typing quotes it with its strip, ⏎ sends the TUI\'s <selection> in front', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${HOME}/main` });
  try {
    const { page } = s;
    const answer = page.getByTestId('thread.entry.2').locator('.th-md').first();
    await expect(answer, 'the answer is drawn, visible').toBeVisible({ timeout: 10_000 });
    // toBeVisible passed while Virtuoso hid the rows (amb-win 35d08ae5): shown = painted and hit
    await expectShown(page.getByTestId('thread.entry.2'), "main's answer");
    const b = await answer.boundingBox();
    if (!b) throw new Error('no answer box');
    await page.mouse.move(b.x + 6, b.y + 6);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 });
    await page.mouse.move(b.x + b.width - 4, b.y + b.height - 4, { steps: 6 });
    await page.mouse.up();
    expect(await page.evaluate(() => String(window.getSelection())), 'the drag selected the answer').toContain('14:00 compaction');
    await expect(page.getByTestId('thread.screen'), 'the thread knows a quote is ready').toHaveAttribute('data-quoting', 'true');
    await page.keyboard.type('why 03:00?');
    const field = page.getByTestId('composer.field');
    await expect(field.locator('[data-kind="quote"]'), 'a quote chip in the field').toHaveText('❝ 1');
    await expect(field, 'his words after it').toContainText('why 03:00?');
    // the answer renders as one paragraph (markdown soft breaks): the selection is one line
    await expect(page.getByTestId('composer'), "its strip names where it's from and its lines").toContainText(/main · \d+ lines?/);
    await page.screenshot({ path: test.info().outputPath('quote.png') });
    await page.keyboard.press('Enter');
    const sent = (await core.waitCmd((c) => c.cmd === 'send', 5000)) as { text?: string };
    const text = sent.text ?? '';
    expect(text.startsWith('<selection from="main">\n'), 'the quote in front, as the TUI sends it').toBe(true);
    expect(text).toContain('14:00 compaction runs');
    expect(text).toContain('</selection>');
    expect(text.trimEnd().endsWith('why 03:00?'), 'then his words').toBe(true);
  } finally {
    await s.close();
  }
});
