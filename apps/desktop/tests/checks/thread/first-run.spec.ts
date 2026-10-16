// thread/first-run · bar L1 / M18 (the TUI's FIRST_RUN, BISE-284; amb-kit 29c5eb93, lead m_10836).
// Passes when main's thread, where he has said nothing and main is the project's only agent, shows
// the first-run text under its rows; a click on "show me what you can do" puts those words in the
// composer alone (nothing sent), the last line then says ⏎ tries it, ⏎ sends them to main, and the
// text goes once he said something. bise main's thread on the scripted core (FakeCore). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

import { composer } from '../../../src/proto/words_composer.gen';
const HOME = 'bise-home-00000000';
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
  // a project: with none, bise's empty thread shows designer's 'no project yet' centre instead (m_12093)
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: 'acme-1a2b3c4d', name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 }] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
];

const fieldText = (e: Element): string => (e as HTMLElement).innerText.replace(/\r/g, '').trim();

test("thread/first-run: main's empty thread offers 'show me what you can do'; a click fills the composer, ⏎ sends it", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core });
  try {
    const { page } = s;
    const first = page.getByTestId('setup.firstrun');
    await expect(first, 'the first-run text in the empty thread').toBeVisible({ timeout: 10_000 });
    await expect(first).toContainText(composer.placeholder_main);
    await page.screenshot({ path: test.info().outputPath('first-run.png') });

    await page.getByTestId('setup.firstrun.demo').click();
    const field = page.getByTestId('composer.field');
    await expect.poll(() => field.evaluate(fieldText), { message: 'the words alone in the composer' }).toBe(composer.demo);
    await expect(page.getByTestId('setup.firstrun.ready'), 'its last line says ⏎ tries it').toContainText('try it');
    expect(core.cmds().some((c) => c.cmd === 'send'), 'a click never sends').toBe(false);

    await page.keyboard.press('Enter');
    const sent = (await core.waitCmd((c) => c.cmd === 'send', 3000)) as { text?: string; agent?: string };
    expect(sent).toMatchObject({ agent: 'main', text: composer.demo });
    await expect(first, 'gone once he said something').toBeHidden({ timeout: 2000 });
  } finally {
    await s.close();
    core.dispose();
  }
});

test('thread/first-run: a long ask open in the inbox block leaves no room: the first-run words go, never over the block (amb-home m_16909)', async () => {
  const long = ['which plan for the cart?', ...Array.from({ length: 8 }, (_, i) => `line ${String(i + 2)}: the cart page loads its totals twice when the coupon field is open`)].join('\n');
  const card = { id: 21, project: HOME, kind: 'question', rank: 1, agent: 'main', question: long, options: [{ n: 1, label: 'fix totals first' }, { n: 2, label: 'ship as is' }], urgent: false, since_ms: 1791100000000 };
  const w = world().map((e) => (e.ev === 'projects' ? { ...e, projects: (e as { projects: Record<string, unknown>[] }).projects.map((p) => (p['home'] === true ? { ...p, waits: 1, cards: [card] } : p)) } : e));
  const core = new FakeCore([...w, { ev: 'cards', project: HOME, cards: [card] }] as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, size: '1100x720' });
  try {
    const { page } = s;
    const block = page.getByTestId('inbox.block');
    await expect(block).toBeVisible({ timeout: 10_000 });
    // ⌃1 opens the item in place (the block lists it folded first)
    await page.keyboard.press('Control+Digit1');
    await expect(page.getByTestId(`inbox.block.card.${HOME}-21`)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(300);
    const boxes = await page.evaluate(() => {
      const r = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return b.height === 0 || getComputedStyle(el).display === 'none' ? null : { top: b.top, bottom: b.bottom };
      };
      return { first: r('[data-testid="thread.first"] .setup-firstrun') ?? r('[data-testid="thread.first"]'), block: r('[data-testid="inbox.block"]') };
    });
    await page.screenshot({ path: test.info().outputPath('first-run-under-a-long-ask.png') });
    expect(boxes.block).not.toBeNull();
    if (boxes.first !== null) expect(boxes.first.bottom, 'the first-run words end above the inbox block').toBeLessThanOrEqual((boxes.block?.top ?? 0) + 1);
  } finally {
    await s.close();
    core.dispose();
  }
});
