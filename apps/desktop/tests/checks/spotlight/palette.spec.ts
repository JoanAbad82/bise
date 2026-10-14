// spotlight/palette · ⌘K on the ds Picker (designer m_25150): its glass frame and big input stay;
// the list is Picker groups and rows. Owner: amb-win. The new app on the scripted core (FakeCore,
// its fixture world), fn+space from the scripted helper. Passes when, empty, with a query and with
// a query nothing matches:
//   - every row is 32 px, glyph | name 14 | 'what' inline | one trailing item; no sphere (.b-dot);
//   - a row's trailing item is its project, or its key on the active row (its project in the tip);
//   - a head is text-3 12 sentence case (no uppercase), 28 px;
//   - nothing matches: the one row is 'ask bise'.
// Writes light + dark shots of the three states.
import { test, expect, FakeCore, FakeHelper, launchDesktop } from '../../harness';

type Ev = Parameters<FakeCore['send']>[0];
// the theme as the hub sends it (the capsule's native glass follows it, a data-theme alone doesn't)
const prefs = (theme: 'light' | 'dark'): Ev =>
  ({
    ev: 'prefs',
    prefs: {
      onboarded: true,
      theme,
      context: { shot: true, url: true, file: true, window_text: false },
      excluded_apps: [],
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
      voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
      shots_keep_days: 7,
    },
  }) as unknown as Ev;

test('spotlight/palette: ⌘K draws the ds Picker rows in its frame, the project trailing, the key on the active row', async () => {
  test.setTimeout(90_000);
  const core = new FakeCore();
  const helper = new FakeHelper();
  const s = await launchDesktop({ core, helper });
  try {
    const { app } = s;
    await s.page.waitForTimeout(1500);
    await helper.send({ ev: 'fn', act: 'key', key: 'space' });
    await expect.poll(() => app.windows().some((p) => p.url().includes('surface=capsule'))).toBe(true);
    const cap = app.windows().find((p) => p.url().includes('surface=capsule'));
    if (!cap) throw new Error('no capsule window');
    const input = cap.locator('[data-testid="spot.input"]');
    await expect(input).toBeVisible({ timeout: 5000 });
    const rows = cap.locator('[data-testid^="spot.row."]');
    const look = () =>
      cap.evaluate(() => {
        const all = Array.from(document.querySelectorAll<HTMLElement>('.b-spot .b-picker-row[data-testid^="spot.row."]'));
        const heads = Array.from(document.querySelectorAll<HTMLElement>('.b-spot .b-picker-ghead'));
        return {
          rows: all.map((e) => ({ id: e.getAttribute('data-testid') ?? '', h: Math.round(e.getBoundingClientRect().height), on: e.getAttribute('aria-selected') === 'true', trail: e.querySelector(':scope > .k')?.textContent ?? '', tip: e.getAttribute('data-tip') ?? '', name: getComputedStyle(e.querySelector('.n') ?? e).fontSize, hasActs: e.querySelector('.b-spot-acts') !== null })),
          heads: heads.map((h) => ({ t: h.textContent, tt: getComputedStyle(h).textTransform, h: Math.round(h.getBoundingClientRect().height), fs: getComputedStyle(h).fontSize })),
          spheres: document.querySelectorAll('.b-spot .b-dot, .b-spot [role="listbox"] .b-pearl').length,
        };
      });
    const shoot = async (name: string) => {
      await cap.waitForTimeout(250);
      for (const t of ['light', 'dark'] as const) {
        await core.send(prefs(t));
        await expect.poll(() => cap.evaluate(() => document.documentElement.dataset['theme'])).toBe(t);
        await cap.waitForTimeout(400);
        // the capsule is a transparent window over the desktop's glass; alone in the harness it sits
        // on white, so the shot gets the glass's backdrop for its theme (the shot only)
        await cap.evaluate((t) => { document.body.style.background = t === 'dark' ? '#1b1917' : '#ece7df'; }, t);
        await cap.screenshot({ path: test.info().outputPath(`palette-${name}-${t}.png`) });
        await cap.evaluate(() => { document.body.style.background = ''; });
      }
      await core.send(prefs('light'));
    };

    // empty
    await expect(rows.first()).toBeVisible({ timeout: 5000 });
    const empty = await look();
    test.info().annotations.push({ type: 'empty', description: JSON.stringify(empty) });
    expect(empty.spheres, 'no sphere: the glyphs are marks').toBe(0);
    for (const r of empty.rows) if (!r.hasActs) expect(r.h, `${r.id} is 32 px`).toBe(32);
    for (const r of empty.rows) expect(r.name, `${r.id}: the name at 14`).toBe('14px');
    for (const h of empty.heads) {
      expect(h.tt, `head '${h.t}' is not uppercase`).toBe('none');
      expect([h.h, h.fs], `head '${h.t}' 28 px, 12`).toEqual([28, '12px']);
    }
    await shoot('empty');

    // a query: a few groups; the active row shows its key, the others their project
    await input.fill('a');
    await expect(rows.first()).toBeVisible();
    const q = await look();
    test.info().annotations.push({ type: 'query', description: JSON.stringify(q) });
    const on = q.rows.find((r) => r.on);
    expect(on, 'an active row').toBeDefined();
    expect(on?.trail ?? '', 'the active row: its key, the one trailing item').toMatch(/^⏎ /u);
    expect(await cap.locator('.b-spot .b-picker-row.on .b-spot-acts .tm:visible').count(), 'no time beside the key').toBe(0);
    for (const r of q.rows.filter((x) => !x.on && x.tip !== '')) expect(r.trail, `${r.id}: its project trails`).toBe(r.tip);
    await shoot('query');

    // nothing matches: 'ask bise'
    await input.fill('zzqqxx nothing matches this');
    await expect.poll(async () => (await look()).rows.map((r) => r.id)).toEqual(expect.arrayContaining([expect.stringContaining('spot.row.ask')]));
    await shoot('none');
    // the key line says the same keys in every state (designer m_25724)
    await expect(cap.locator('.b-spot .keys')).toContainText('↑↓ move');
  } finally {
    await s.close();
  }
});
