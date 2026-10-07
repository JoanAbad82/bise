// thread/opens-at-end · qa-type's composer/lists-real red (3) (b37dc4c1, lead m_10892; his bug 5,
// 'a send does nothing'). Passes when a thread of long answers opens at its end (its last row on
// screen, no 'back to the bottom' pill: nobody scrolled), and after his send main's answer, long,
// lands on screen at the end, above the composer, with no pill; and when he scrolls up himself the
// list stays where he is and the pill shows. bise main's thread on the scripted core (FakeCore); the
// check plays main's answer. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { expectShown } from './shown';

const HOME = 'bise-home-00000000';
const long = (n: number) =>
  [`answer ${String(n)}:`, '', ...Array.from({ length: 6 }, (_, i) => `- point ${String(i + 1)} of answer ${String(n)}, ${'with words that wrap '.repeat(4)}`), '', '```ts', `const x${String(n)} = ${String(n)};`, '```', `end of answer ${String(n)}`].join('\n');
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
    entries: Array.from({ length: 12 }, (_, i) => ({ pos: i + 1, at_ms: 1791100000000 + i * 1000, kind: i % 2 === 0 ? 'you' : 'agent', text: i % 2 === 0 ? `question ${String(i + 1)}` : long(i + 1) })),
    before: null,
    more: false,
  },
];

test('thread/opens-at-end: it opens at its end, an answer after his send lands on screen, his own scroll up stays', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.entry.12')).toBeAttached({ timeout: 10_000 });
    await page.waitForTimeout(800); // rows measured, code colored
    await expectShown(page.getByTestId('thread.entry.12').getByText('end of answer 12'), 'it opens on its last line', 3000);
    await expect(page.getByTestId('thread.to-end'), 'nobody scrolled: no pill').toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('opened.png') });

    await page.getByTestId('composer.field').click();
    await page.keyboard.type('and the next one?');
    await page.keyboard.press('Enter');
    const sent = (await core.waitCmd((c) => c.cmd === 'send', 3000)) as { cid?: string };
    await core.send(
      { ev: 'entry', project: HOME, agent: 'main', entry: { pos: 13, at_ms: 1791100100000, kind: 'you', text: 'and the next one?', ...(sent.cid === undefined ? {} : { cid: sent.cid }) } } as never,
      { ev: 'entry', project: HOME, agent: 'main', entry: { pos: 14, at_ms: 1791100101000, kind: 'agent', text: long(14) } } as never,
    );
    await expectShown(page.getByTestId('thread.entry.14').getByText('end of answer 14'), "main's answer lands on screen at the end", 3000);
    await expect(page.getByTestId('thread.to-end'), 'still at its end: no pill').toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('answered.png') });

    // he scrolls up himself: it stays there, the pill offers the way back
    await page.getByTestId('thread.entry.14').hover();
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -600);
    await expect(page.getByTestId('thread.to-end'), 'scrolled up: the pill').toBeVisible({ timeout: 2000 });
    await core.send({ ev: 'entry', project: HOME, agent: 'main', entry: { pos: 15, at_ms: 1791100102000, kind: 'agent', text: 'one more' } } as never);
    await expect(page.getByTestId('thread.to-end')).toContainText('1 new', { timeout: 2000 });
    await page.getByTestId('thread.to-end').click();
    await expectShown(page.getByTestId('thread.entry.15'), 'the pill takes him back to the end', 3000);
  } finally {
    await s.close();
    core.dispose();
  }
});
