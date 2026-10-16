// thread/quote-pop · quoting a selection made easier (lead m_11968, the TUI's quote-keys twin):
// text selected in the thread shows the selection pop under it ('type to ask about it · tab quote · ⌘C copy');
// Space starts the quote like a letter (the chip, then the space); a click on the ask words puts
// the quote in the composer AT HIS CARET with nothing typed; the review's pop does the same for
// diff lines (the thread opens with the chip alone); tab quotes with nothing typed in both (the TUI's key, main m_12004).
// The scripted core (FakeCore). Owner: amb-web.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { thread } from '../../../src/proto/words.gen';
import { expectShown } from './shown';
import { composer } from '../../../src/proto/words.gen';

const HOME = 'bise-home-00000000';
const ANSWER = 'the p99 climbs when the 14:00 compaction runs. alerts suggests moving it to 03:00.';
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

/** A drag across main's answer: the thread's selection. */
async function selectAnswer(page: Page): Promise<void> {
  const answer = page.getByTestId('thread.entry.2').locator('.th-md').first();
  await expect(answer).toBeVisible({ timeout: 10_000 });
  await expectShown(page.getByTestId('thread.entry.2'), "main's answer");
  const b = await answer.boundingBox();
  if (!b) throw new Error('no answer box');
  // from the text's left edge: a press inside the 't' starts the selection after it (designer m_21425)
  await page.mouse.move(b.x + 1, b.y + 6);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 });
  await page.mouse.move(b.x + b.width - 4, b.y + b.height - 4, { steps: 6 });
  await page.mouse.up();
  const picked = await page.evaluate(() => String(window.getSelection()));
  expect(picked, 'the drag selected the answer').toContain('14:00 compaction');
  expect(picked.trimStart(), 'from its first letter').toMatch(/^the p99/);
}

/** The field as it reads: words and chips ('❝ 1') in order. */
const fieldText = (page: Page): Promise<string> => page.getByTestId('composer.field').evaluate((el) => el.textContent);

test('thread/quote-pop: the pop under a selection, Space starts the quote, tab quotes alone, a click quotes at the caret with nothing typed', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${HOME}/main` });
  try {
    const { page } = s;
    const field = page.getByTestId('composer.field');
    const chip = field.locator('[data-kind="quote"]');

    // Space: the quote, then the space, like a letter
    await selectAnswer(page);
    const pop = page.getByTestId('thread.quote.pop');
    await expect(pop, 'the pop under the selection').toHaveText('type to ask about it · tab quote · ⌘C copy');
    await page.screenshot({ path: test.info().outputPath('pop.png') });
    await page.keyboard.press('Space');
    await expect(chip, 'a quote chip').toHaveText('❝ 1');
    expect(await fieldText(page), 'the chip, then the space').toBe('❝ 1 ');
    await expect(pop, 'the pop goes with the selection').toBeHidden();
    await page.keyboard.type('why?');
    expect(await fieldText(page)).toBe('❝ 1 why?');

    // tab: the quote alone, nothing typed (the TUI's key, main m_12004)
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await expect(chip).toHaveCount(0);
    await selectAnswer(page);
    await page.keyboard.press('Tab');
    await expect(chip, 'a quote chip').toHaveCount(1);
    expect(await fieldText(page), 'the chip alone, nothing typed').toBe('❝ 1');
    await expect(field, 'the field has the focus').toBeFocused();
    await expect(pop, 'the pop goes with the selection').toBeHidden();

    // a click on the ask words: the quote at his caret, nothing typed, the caret after the chip
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await expect(chip).toHaveCount(0);
    await page.keyboard.type('hello world');
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowLeft');
    await selectAnswer(page);
    await page.getByTestId('thread.quote.pop.ask').click();
    await expect(chip, 'one quote chip').toHaveCount(1);
    expect(await fieldText(page), 'at the caret he left, nothing typed').toBe('hello❝ 1 world');
    await expect(field, 'the field has the focus').toBeFocused();
    await page.keyboard.type(',');
    expect(await fieldText(page), 'the caret right after the chip').toBe('hello❝ 1, world');
    await page.screenshot({ path: test.info().outputPath('clicked.png') });

    // ⌘C copy keeps the selection (and the field as it was)
    await selectAnswer(page);
    await page.getByTestId('thread.quote.pop.copy').click();
    expect(await page.evaluate(() => String(window.getSelection())), 'the selection stays').toContain('14:00 compaction');
    expect(await fieldText(page)).toBe('hello❝ 1, world');
  } finally {
    await s.close();
  }
});

test('review/quote-pop: a click on the pop asks about the picked lines, the thread opens with the chip alone', async () => {
  const P = 'acme-1a2b3c4d';
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `review/${P}/perf` });
  try {
    const { page } = s;
    const line = (i: number) => page.getByTestId(`review.file.0.${i}`);
    await expect(line(1)).toBeVisible({ timeout: 10_000 });
    await line(1).hover();
    await page.mouse.down();
    await line(3).hover();
    await page.mouse.up();
    const pop = page.getByTestId('review.quote.pop');
    await expect(pop).toHaveText('type to ask perf about it · tab quote · ⌘C copy');
    await page.getByTestId('review.quote.pop.ask').click();
    await expect(page.locator('[data-testid="thread.screen"][data-agent="perf"]'), thread.from_thread({ name: 'perf' })).toBeVisible({ timeout: 5000 });
    const chip = page.locator('[data-testid="composer.chip.1"][data-kind="quote"]');
    await expect(chip, 'a quote chip').toBeVisible({ timeout: 3000 });
    await expect(page.getByText(composer.quote_about({ place: 'src/query.rs:10-11', n: 3 }))).toBeVisible();
    expect(await fieldText(page), 'nothing typed after it').toMatch(/^❝ 1 ?$/u);
  } finally {
    await s.close();
    core.dispose();
  }
});

test('review/quote-pop: tab asks about the picked lines, the thread opens with the chip alone', async () => {
  const P = 'acme-1a2b3c4d';
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `review/${P}/perf` });
  try {
    const { page } = s;
    const line = (i: number) => page.getByTestId(`review.file.0.${i}`);
    await expect(line(1)).toBeVisible({ timeout: 10_000 });
    await line(1).hover();
    await page.mouse.down();
    await line(3).hover();
    await page.mouse.up();
    const pop = page.getByTestId('review.quote.pop');
    await expect(pop).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="thread.screen"][data-agent="perf"]'), thread.from_thread({ name: 'perf' })).toBeVisible({ timeout: 5000 });
    const chip = page.locator('[data-testid="composer.chip.1"][data-kind="quote"]');
    await expect(chip, 'a quote chip').toBeVisible({ timeout: 3000 });
    await expect(page.getByText(composer.quote_about({ place: 'src/query.rs:10-11', n: 3 }))).toBeVisible();
    expect(await fieldText(page), 'nothing typed after it').toMatch(/^❝ 1 ?$/u);
  } finally {
    await s.close();
    core.dispose();
  }
});
