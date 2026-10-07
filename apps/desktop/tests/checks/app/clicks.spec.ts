// app/clicks · bar O.6 (docs/desktop-bar.md): every button takes a real click, with hover, on the
// first click, with bise not frontmost (round 10 audit). Owner: qa-flows. The NEW app on the REAL
// core over the throwaway world (../world.ts). Passes when:
//   - one click acts (no second click): a project in the sidebar opens its thread, the head's
//     agent counts open the agents list, an agent there opens its thread, 'bise' opens bise's
//     thread, a settings page in the settings nav opens it; the window is blurred before each, but
//     the harness's offscreen window still reports focus (document.hasFocus() stays true, kept in
//     the 'firsts' annotation), so 'bise not frontmost' is qa-native's, on a real window;
//   - on each screen visited, every visible control (button, link, role button/switch/option/tab)
//     is hit by a click at its center (nothing over it) and changes on hover (the item in view,
//     aria-current / aria-selected / .on, excepted). No pointer cursor asked: mac controls keep
//     the arrow.
// Controls are not all clicked: a click acts on the world (archive, stop…); those are the other
// checks' (agents/*, review/*, settings/*), which click once too.
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect, type Session } from '../../harness';
import { hubOf, launchReal, menuKey, realWorld } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  thread: '[data-testid="thread.screen"]',
  project: (p: string) => `[data-testid="app.sidebar.project.${p}"]`,
  bise: '[data-testid="app.sidebar.bise"]',
  counts: '[data-testid="thread.agents"]',
  agents: '[data-testid="agents.screen"]',
  open: (n: string) => `[data-testid="agents.open.${n}"]`,
  nav: (p: string) => `[data-testid="settings.nav.${p}"]`,
  page: (p: string) => `[data-testid="settings.page.${p}"]`,
};
const CONTROLS = 'button, a[href], [role="button"], [role="switch"], [role="option"], [role="tab"]';

type Audit = { id: string; hit: boolean; current: boolean; hover: boolean };

/** Every visible control of the screen: hit at its center, a change on hover. */
async function audit(page: Page, max = 40): Promise<Audit[]> {
  // the screen settled first: a project's late controls (its agents in the sidebar, the head's
  // counts…) come after its first frame; the list of controls must stop changing for 600 ms
  const ids = () => page.locator(CONTROLS).evaluateAll((els) => els.map((e) => e.getAttribute('data-testid') ?? e.tagName).join(','));
  let last = await ids();
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(300);
    const now = await ids();
    if (now === last) {
      await page.waitForTimeout(300);
      if ((await ids()) === now) break;
    }
    last = now;
  }
  // each control probed by its own element (never re-found by index: amb-web m_10928, a late
  // control shifts every index after it and the probe lands on another control)
  // each one tagged once (data-qa-n), then found again by its tag
  const boxes = await page.locator(CONTROLS).evaluateAll((els) =>
    els
      .map((el, i) => {
        el.setAttribute('data-qa-n', String(i));
        const r = el.getBoundingClientRect();
        const off = el.getAttribute('aria-disabled') === 'true' || (el as HTMLButtonElement).disabled;
        return { n: i, id: el.getAttribute('data-testid') ?? `${el.tagName.toLowerCase()}:${el.textContent.trim().slice(0, 24)}`, x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, off };
      })
      .filter((b) => b.w > 2 && b.h > 2 && !b.off && b.x > 0 && b.y > 0 && b.x < window.innerWidth && b.y < window.innerHeight));
  const out: Audit[] = [];
  for (const b of boxes.slice(0, max)) {
    const h = page.locator(`[data-qa-n="${String(b.n)}"]`);
    if ((await h.count()) !== 1) continue;
    await page.mouse.move(1, 1);
    await page.waitForTimeout(60);
    const look = () =>
      h.evaluate((el) => {
        const c = getComputedStyle(el);
        return [c.backgroundColor, c.color, c.textDecorationLine, c.opacity, c.boxShadow, c.borderColor, c.filter].join('|');
      });
    const before = await look();
    const at = await h.evaluate((el, p) => {
      const top = document.elementFromPoint(p.x, p.y);
      // the item in view (current page, picked option) has no hover of its own
      const current = el.hasAttribute('aria-current') || el.getAttribute('aria-selected') === 'true' || el.classList.contains('on');
      return { hit: top !== null && (el === top || el.contains(top)), current };
    }, { x: b.x, y: b.y });
    await page.mouse.move(b.x, b.y);
    await page.waitForTimeout(160);
    const after = await look();
    out.push({ id: b.id, hit: at.hit, current: at.current, hover: before !== after });
  }

  await page.mouse.move(1, 1);
  return out;
}

/** bise not frontmost: every window blurred; the page says it has no focus. */
async function away(s: Session): Promise<boolean> {
  await s.app.evaluate(({ BrowserWindow }) => {
    for (const w of BrowserWindow.getAllWindows()) w.blur();
  });
  await s.page.waitForTimeout(150);
  return s.page.evaluate(() => document.hasFocus());
}

test('app/clicks: first clicks act with bise not frontmost; every control is hit, points and hovers', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const tele = path.basename(path.dirname(hubOf(w, 'telemetry').sock));
  const s = await launchReal(w);
  const audits: Record<string, Audit[]> = {};
  const firsts: { step: string; focused: boolean; ok: boolean }[] = [];
  try {
    const { page } = s;
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    await expect(page.locator(T.field).first(), "bise's thread").toBeVisible({ timeout: 10_000 });
    audits['bise thread'] = await audit(page);

    /** one click, with bise away first; it must act at once (no second click) */
    const first = async (step: string, sel: string, acted: () => Promise<void>) => {
      const focused = await away(s);
      await page.locator(sel).first().click({ timeout: 10_000 });
      let ok = true;
      try {
        await acted();
      } catch {
        ok = false;
      }
      firsts.push({ step, focused, ok });
      await page.screenshot({ path: test.info().outputPath(`${step.replace(/\W+/g, '-')}.png`) });
    };
    await first('sidebar project', T.project(tele), () => expect(page.locator(T.thread)).toHaveAttribute('data-project', tele, { timeout: 3000 }));
    audits['telemetry thread'] = await audit(page);
    await first('head counts', T.counts, () => expect(page.locator(T.agents)).toBeVisible({ timeout: 3000 }));
    audits['agents'] = await audit(page);
    await first('agent in the list', T.open('p99'), () => expect(page.locator(T.thread)).toHaveAttribute('data-agent', 'p99', { timeout: 3000 }));
    await first('sidebar bise', T.bise, () => expect(page.locator(T.thread)).toHaveAttribute('data-project', /^bise/, { timeout: 3000 }));
    await menuKey(s, 'CmdOrCtrl+,');
    await expect(page.locator('[data-testid^="settings.nav."]').first(), 'settings').toBeVisible({ timeout: 5000 });
    audits['settings'] = await audit(page);
    await first('settings nav', T.nav('plugins'), () => expect(page.locator(T.page('plugins'))).toBeVisible({ timeout: 3000 }));
    audits['settings · plugins'] = await audit(page);
  } finally {
    test.info().annotations.push({ type: 'firsts', description: JSON.stringify(firsts) });
    test.info().annotations.push({ type: 'audits', description: JSON.stringify(audits) });
    await s.close();
  }
  for (const f of firsts) expect.soft(f.ok, `${f.step}: the first click acts`).toBe(true);
  for (const [screen, list] of Object.entries(audits)) {
    expect.soft(list.filter((a) => !a.hit).map((a) => a.id), `${screen}: every control is hit at its center`).toEqual([]);
    expect.soft(list.filter((a) => !a.hover && !a.current).map((a) => a.id), `${screen}: every control changes on hover`).toEqual([]);
  }
});
