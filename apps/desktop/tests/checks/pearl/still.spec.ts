// pearl/still · ambient-lead m_11707 · his "the pearl clignote très bizarrement", and battery.
// The pearl moves only while bise works or listens (src/pearl/moods.ts MOVES); at rest, and in every
// other mood once settled, it is one still frame: no requestAnimationFrame loop, nothing drawn. On
// the pearl lab (test mode): idle at rest, its box never changes; in work it moves; back at rest it
// stops again within ~2 s. Then the window's own sidebar pearl (the 'bise · every project' row,
// the box that tripped composer/dictation) stays still while nothing happens.
import { test, expect, launchDesktop, Recorder, changedInside, type Box } from '../../harness';

const PEARL = '[data-testid="lab.pearl.canvas"]';
const mood = (m: string): string => `[data-testid="lab.mood.${m}"]`;
/** frames in which the pearl's box changed (encoder noise under 3 px ignored) */
const moved = (frames: Parameters<typeof changedInside>[0], box: Box): number => changedInside(frames, box).filter((n) => n > 3).length;

test('pearl/still: at rest the pearl is one still frame; it moves in work and stops again at rest', async () => {
  const s = await launchDesktop({ route: 'lab/pearl' });
  try {
    const pearl = s.page.locator(PEARL);
    await expect(pearl).toBeVisible();
    const box = await pearl.boundingBox();
    if (!box) throw new Error('no pearl box');
    const rec = new Recorder(s.cdp, s.page);
    await s.page.waitForTimeout(500);
    const idle = await rec.during(() => s.page.waitForTimeout(1500), 0);
    expect.soft(moved(idle, box), 'frames where the pearl changed at rest').toBe(0);
    await s.page.locator(mood('work')).click();
    const work = await rec.during(() => s.page.waitForTimeout(1500), 0);
    // that it moves at all (its frame rate is pearl/frames' measure, and a loaded machine lowers it)
    expect.soft(moved(work, box), 'frames where the pearl moved while bise works').toBeGreaterThan(5);
    await s.page.locator(mood('rest')).click();
    await s.page.waitForTimeout(2500);
    const after = await rec.during(() => s.page.waitForTimeout(1500), 0);
    expect.soft(moved(after, box), 'frames where the pearl changed once back at rest').toBe(0);
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
    const rec = new Recorder(s.cdp, s.page);
    const idle = await rec.during(() => s.page.waitForTimeout(2000), 0);
    expect.soft(moved(idle, box), 'frames where the sidebar pearl changed while idle').toBe(0);
  } finally {
    await s.close();
  }
});
