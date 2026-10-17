// app/bar-main · main in the right bar's AGENTS (task bar-main, his ask m_28881: « toujours tout en
// haut de la liste, comme dans le terminal »), on the bims office fixture, off screen. Passes when:
//   (a) AGENTS' first row is main's, named 'bise', its doing line and its sign like the others;
//       'AGENTS · N' counts the tasks only;
//   (b) a click on it opens main's thread (from another agent's), the row then marked current;
//   (c) with the office open, hovering it lights main's bim (its card), at 320 and wide;
// Shots: .harness-cache/bims-shots (index.html, 'bar-main-*'), light and dark, 320 and wide, for
// designer to sign. Owner: bar-main.
import { test, expect } from '../../harness';
import type { Session } from '../../harness';
import { office } from '../../../src/bims/fixtures';
import { open, settle, shotOf, sleep, writeIndex, type Shot } from '../bims/world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 120_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

async function shot(s: Session, file: string, title: string, says: string, what = 'app.right.agents'): Promise<void> {
  const box = await s.page.getByTestId(what).boundingBox();
  if (box === null) throw new Error(`nothing to shoot for ${file}`);
  // the section's top part: the head, the office when open, the first rows
  await shotOf(s.cdp, s.page, { ...box, height: Math.min(box.height, 560) }, file);
  shots.push({ file, title, says });
}

const tasks = office.agents.filter((a) => !a.main && !a.archived).length;

test('(a)(b) main first as bise, out of the count; its click opens its thread', async () => {
  const { s } = await open(office, { width: 1400 });
  try {
    const rows = s.page.locator('[data-testid="app.right.agents"] [data-testid^="app.right.agent."]');
    await expect(rows.first()).toHaveAttribute('data-testid', 'app.right.agent.main');
    const main = s.page.getByTestId('app.right.agent.main');
    await expect(main).toContainText('bise');
    await expect(main).toContainText('routing your requests');
    await expect(main).not.toContainText(/\bmain\b/u);
    await expect(s.page.getByTestId('app.right.agents.head')).toContainText(`· ${String(tasks)}`);
    // from another agent's thread, a click on main's row: main's thread
    await s.page.getByTestId('app.right.agent.signup-perf').click();
    await expect(s.page.getByTestId('app.right.agent.signup-perf')).toHaveAttribute('aria-current', 'true');
    await main.click();
    await expect(main).toHaveAttribute('aria-current', 'true');
    await expect(s.page.getByTestId('app.right.agent.signup-perf')).not.toHaveAttribute('aria-current', 'true');
  } finally {
    await s.close();
  }
});

for (const theme of ['light', 'dark'] as const) {
  test(`(c) main's row hovered lights its bim, 320 and wide, ${theme}`, async () => {
    const { s } = await open(office, { theme, width: 1600 });
    try {
      await s.page.mouse.move(5, 400);
      await shot(s, `bar-main-list-${theme}.png`, `AGENTS with main first, ${theme}`, "'bise' on the first row, its breeze and its doing line, then the tasks; 'AGENTS · N' counts the tasks");
      await s.page.getByTestId('app.title.bims').click();
      await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-shown', 'true', { timeout: 20_000 });
      for (const wide of [false, true]) {
        const w = wide ? 'wide' : '320';
        await s.page.getByTestId(wide ? 'app.right.agents.width.wide' : 'app.right.agents.width.narrow').click();
        await sleep(400);
        await settle(s, 800, 6000);
        await s.page.mouse.move(5, 400);
        // at its left: the 320 column's resize border runs down the bar's middle (bims hover (g))
        await s.page.getByTestId('app.right.agent.main').hover({ position: { x: 24, y: 10 } });
        // its bim's card shows (the hover's tip delay), as for any row (bims hover (b))
        await expect(s.page.locator('.bims-card[data-testid="app.right.bims.label.main"]')).toBeVisible({ timeout: 2000 });
        await sleep(300);
        await shot(s, `bar-main-hover-${w}-${theme}.png`, `main's row hovered, ${w}, ${theme}`, "main's bim lit in the office, its card over its head; the row in the hover tint");
      }
    } finally {
      await s.close();
    }
  });
}
