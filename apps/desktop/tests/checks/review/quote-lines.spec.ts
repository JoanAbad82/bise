// review/quote · V7 / L11 / B7 (the TUI's diffquote.rs: drag or shift+↑↓ over diff lines, then
// type: a 'src/a.rs:12-14 · 3 lines' quote). Passes when, on perf's review (the fixture's diff of
// src/query.rs), a drag over 3 lines marks them and shows 'type to ask perf about it', typing 'w'
// opens perf's thread with one quote chip saying 'src/query.rs:10-12 · 3 lines' and the 'w'
// after it, and the send carries a typed quote part with the file and its lines (the hub renders
// the TUI's tag); shift+↓ selects from
// the keyboard too, and esc ends a selection without leaving. The scripted core (FakeCore, every
// fixture). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { thread } from '../../../src/proto/words.gen';

const P = 'acme-1a2b3c4d';
type Cmd = { cmd?: string; text?: string; parts?: unknown[] };

test('review/quote: drag or shift+↓ over diff lines, then type: a quote saying where, sent as a typed quote part', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `review/${P}/perf` });
  try {
    const { page } = s;
    const line = (i: number) => page.getByTestId(`review.file.0.${i}`);
    await expect(line(1)).toBeVisible({ timeout: 10_000 });

    // the keyboard: shift+↓ starts at the first line and grows, esc ends it on the review
    await page.getByTestId('review.files').focus();
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    await expect(line(1)).toHaveClass(/\bpk\b/);
    await expect(line(2)).toHaveClass(/\bpk\b/);
    await page.keyboard.press('Escape');
    await expect(line(1)).not.toHaveClass(/\bpk\b/);
    await expect(page.getByTestId('review.screen'), 'esc ends the selection, not the review').toBeVisible();

    // the mouse: a drag over lines 1..3 (ctx 10, del 11, add 11), then the add 12
    await line(1).hover();
    await page.mouse.down();
    await line(2).hover();
    await line(4).hover();
    await page.mouse.up();
    for (const i of [1, 2, 3, 4]) await expect(line(i)).toHaveClass(/\bpk\b/);
    await expect(line(0), 'the hunk head is not a line').not.toHaveClass(/\bpk\b/);
    await expect(page.getByTestId('review.quote.pop')).toContainText('type to ask perf about it');
    await page.screenshot({ path: test.info().outputPath('selected.png') });

    await page.keyboard.type('w');
    await expect(page.locator('[data-testid="thread.screen"][data-agent="perf"]'), thread.from_thread({ name: 'perf' })).toBeVisible({ timeout: 5000 });
    const chip = page.locator('[data-testid="composer.chip.1"][data-kind="quote"]');
    await expect(chip, 'a quote chip').toBeVisible({ timeout: 3000 });
    await expect(page.getByText('src/query.rs:10-12 · 4 lines')).toBeVisible();
    await page.keyboard.type('hy this order?');
    await page.screenshot({ path: test.info().outputPath('quoted.png') });
    await page.keyboard.press('Enter');
    const sent = (await core.waitCmd((c) => (c as Cmd).cmd === 'send')) as Cmd;
    // typed: a quote part with its file and lines, then his words; the hub renders the TUI's tag
    // from it, the window never writes it (architect's delta review D2)
    expect(sent.parts).toEqual([
      { kind: 'quote', from: 'perf vs main', text: ' let rows = db.query(q);\n-rows.sort();\n+rows.sort_unstable();\n+rows.dedup();', file: 'src/query.rs', new: '10-12', old: '10-11' },
      { kind: 'text', text: 'why this order?' },
    ]);
    expect(sent.text).toBe('why this order?');
  } finally {
    await s.close();
    core.dispose();
  }
});
