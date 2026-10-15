// composer/picker-steady · his words (at-steady): "dans le menu @, quand je tape, le menu flicker.
// Je crois qu'il y a une frame où il disparaît, puis il réapparaît. ça fait ça à chaque caractère."
// Cause: the @ list showed a file answer only for the query it was asked with, so each key took the
// file rows out until the next answer came (the core answers over IPC): with no agent or artifact
// matching, the list had no row and closed for those frames. Real keys only, on the lab's fake data.
// Passes when, for @ (files), / (commands) and $ (skills), once the list is open and he types more
// characters (one every 40 ms), on every frame: the list is the same node, in the DOM, visible, with
// at least one row; no mutation ever removes it. Red before the fix on '@scre'.
import type { Page } from '@playwright/test';
import { test, expect } from '../../harness';
import { T, onTarget } from './target';

type Frame = { present: boolean; same: boolean; height: number; rows: number };

/** Starts the per-frame watch of the open list (it must be open); `stop` returns every frame seen. */
async function watch(page: Page): Promise<void> {
  await page.evaluate(
    ([sel, rowSel]) => {
      const w = window as unknown as { __steady?: { frames: Frame[]; removed: number; stop: () => void } };
      const first = document.querySelector(sel);
      const frames: Frame[] = [];
      let removed = 0;
      let on = true;
      const tick = (): void => {
        if (!on) return;
        const el = document.querySelector(sel);
        frames.push({
          present: el !== null && el.isConnected,
          same: el === first,
          height: el?.getBoundingClientRect().height ?? 0,
          rows: el?.querySelectorAll(rowSel).length ?? 0,
        });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      const mo = new MutationObserver((records) => {
        for (const r of records)
          for (const n of Array.from(r.removedNodes)) if (n === first || (n instanceof Element && first !== null && n.contains(first))) removed += 1;
      });
      mo.observe(document.body, { childList: true, subtree: true });
      w.__steady = {
        frames,
        get removed() {
          return removed;
        },
        stop: () => {
          on = false;
          mo.disconnect();
        },
      };
    },
    [T.picker, `${T.pickerRow}:not([data-testid="composer.pick"])`] as const,
  );
}

async function stop(page: Page): Promise<{ frames: Frame[]; removed: number }> {
  return page.evaluate(() => {
    const w = window as unknown as { __steady: { frames: Frame[]; removed: number; stop: () => void } };
    w.__steady.stop();
    return { frames: w.__steady.frames, removed: w.__steady.removed };
  });
}

const CASES = [
  // '@' then a file's name: no agent or artifact matches 'scre', only shots/screen.png
  { name: '@', opener: '@', more: 'scre', last: 'screen.png' },
  // a command row's '/' is its glyph, out of its name
  { name: '/', opener: '/', more: 'mode', last: 'model' },
  { name: '$', opener: '$', more: T.skill.query, last: T.skill.name },
];

for (const c of CASES) {
  test(`composer/picker-steady: the ${c.name} list stays in place on every frame while he types`, async () => {
    await onTarget(async ({ page }) => {
      await page.locator(T.field).click();
      await page.keyboard.type(c.opener);
      const picker = page.locator(T.picker);
      await expect(picker, `"${c.opener}" opens the list`).toBeVisible({ timeout: 1500 });
      await page.waitForTimeout(150);
      await watch(page);
      await page.keyboard.type(c.more, { delay: 40 });
      await expect(picker.locator(T.pickerRow).first()).toContainText(c.last);
      await page.waitForTimeout(200);
      const { frames, removed } = await stop(page);
      expect(frames.length, 'frames were seen').toBeGreaterThan(5);
      expect(removed, 'no mutation removed the list').toBe(0);
      const bad = frames.map((f, i) => ({ ...f, i })).filter((f) => !f.present || !f.same || f.height <= 0 || f.rows === 0);
      expect(bad, `every frame shows the same list with rows (${String(frames.length)} frames)`).toEqual([]);
    });
  });
}
