// pearl/still · ambient-lead m_11707 · his "the pearl clignote très bizarrement", and battery.
// The pearl moves only while bise works or listens (src/pearl/moods.ts MOVES); at rest, and in every
// other mood once settled, it is one still frame: no requestAnimationFrame loop, nothing drawn. On
// the pearl lab (test mode): idle at rest, its box never changes; in work it moves; back at rest it
// stops again within ~2 s. Then the window's own sidebar pearl (the 'bise · every project' row,
// the box that tripped composer/dictation) stays still while nothing happens.
// The pearl is a WebGL canvas: the screencast (Recorder) does not see it redraw in the hidden test
// window, so this samples its box with page.screenshot (shotChanges; the harness self-test keeps
// that sampler seeing a WebGL redraw).
import { test, expect, launchDesktop, shotChanges } from '../../harness';

const PEARL = '[data-testid="lab.pearl.canvas"]';
const mood = (m: string): string => `[data-testid="lab.mood.${m}"]`;
/** samples in which the pearl's box changed (under 3 px is noise) */
const moved = (changes: number[]): number => changes.filter((n) => n > 3).length;

test('pearl/still: at rest the pearl is one still frame; it moves in work and stops again at rest', async () => {
  const s = await launchDesktop({ route: 'lab/pearl' });
  try {
    const pearl = s.page.locator(PEARL);
    await expect(pearl).toBeVisible();
    const box = await pearl.boundingBox();
    if (!box) throw new Error('no pearl box');
    await s.page.waitForTimeout(500);
    const idle = await shotChanges(s.page, box, 1500);
    expect.soft(moved(idle), `samples where the pearl changed at rest (${idle.join(',')})`).toBe(0);
    await s.page.locator(mood('work')).click();
    const work = await shotChanges(s.page, box, 1500);
    // that it moves at all (its frame rate is pearl/frames' measure, and a loaded machine lowers it)
    expect.soft(moved(work), `samples where the pearl moved while bise works (${work.join(',')})`).toBeGreaterThan(3);
    await s.page.locator(mood('rest')).click();
    await s.page.waitForTimeout(2500);
    const after = await shotChanges(s.page, box, 1500);
    expect.soft(moved(after), `samples where the pearl changed once back at rest (${after.join(',')})`).toBe(0);
  } finally {
    await s.close();
  }
});

test("pearl/still: the window's sidebar pearl stays still while nothing happens", async () => {
  const s = await launchDesktop({});
  try {
    const slot = s.page.locator('[data-bise-pearl]').first();
    await expect(slot).toBeVisible({ timeout: 15000 });
    const box = await slot.boundingBox();
    if (!box) throw new Error('no pearl box');
    await s.page.waitForTimeout(1500);
    const idle = await shotChanges(s.page, box, 2000);
    expect.soft(moved(idle), `samples where the sidebar pearl changed while idle (${idle.join(',')})`).toBe(0);
  } finally {
    await s.close();
  }
});
