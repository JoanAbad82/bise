// bims/office · les bims (page bims-office v7, spec les-bims-sc-narios-du-bureau §1, §2, §5), the
// right bar's AGENTS as an office, on FakeCore rows from src/bims/fixtures.ts, off screen.
// Passes when, light and dark, at 320, 640 docked and 640 slid over (bims-wire m_27585):
//   (2) at rest no label, only the '?' pills (onboarding, deploy) and the '✗' pill (search-index),
//       no name in them; a row change shows an event label for ~3 s then nothing; four at once show
//       at most 3 event labels; ⌃ held shows every bim's name; a hover shows its card (the 'hover'
//       label: its name, its state, its title on its own lines), inside the office, never over its
//       bim; a click opens that agent; his message is a plane, no '→' label (spec §1.4); the rows
//       show under the office (Gabriel: the list stays while the bims are open);
//   (5) his camera: a pinch zooms around the pointer (the bims spread), two fingers move the view
//       and never scroll the bar, a drag moves it and never opens a bim, '⤢ fit' / esc / a
//       double-click on the floor bring the whole office back, each move draws, left alone it draws as the fit does;
//   (6) his easter eggs, forced and frozen mid-play (eggs.ts withForced; never a random roll in a
//       check): copy-fix's salto, signup-perf's speedrun '1:47', pricing-page's stare '!'; the
//       office's eclipse sky, tree, cake and game on the whiteboard; at night the ghost;
//   (7) his pokes, forced and frozen mid-play (pokes.ts forcedPokes): each word in its bim's label
//       place, the '?' / '✗' pills on, the chair spin's chair turned with its bim, day and night;
//   (3) reduced motion: 0 frames at rest with typing bims, and a bim that changes place fades
//       (never drawn between its two spots, model.ts Look.reduced).
// The three chunk, the frame budget and WebGL lost: budget.spec.ts (the land set's part).
// Shots: .harness-cache/bims-shots/*.png and index.html (the designer signs it). Owner: bims-qa.
import { test, expect, type Session } from '../../harness';
import { office, snap } from '../../../src/bims/fixtures';
import {
  NAMES, P, TRIPS, badCut, collisions, drawnIn, headOf, open, overlay, probe, rowsOf, settle, shotOf, showOffice, sleep, trackpad, withRows,
  writeIndex, type Placed, type Shot,
} from './world';

const shots: Shot[] = [];
// a size's pass waits for real time: the 3 s labels, the arrivals, an idle bim's trip to end (~55 s)
test.describe.configure({ timeout: 120_000 });

async function shot(s: Session, file: string, title: string, says: string): Promise<void> {
  const bar = await s.page.getByTestId('app.right.bims').boundingBox();
  if (bar === null) throw new Error(`no office for the shot ${file}`);
  await shotOf(s.cdp, s.page, bar, file);
  shots.push({ file, title, says });
}

test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

/**
 * Under ⌃ (designer's pick A, bims-lead m_27800): every pill shown, each name shown or counted in
 * 'app.right.bims.more' ('+N names · hover a bim'), the more line there only when a name is left out.
 */
async function heldAll(s: Session): Promise<void> {
  const count = async (): Promise<string> => {
    const o = await overlay(s.page);
    const more = s.page.getByTestId('app.right.bims.more');
    const words = (await more.isVisible().catch(() => false)) ? (await more.innerText()).trim() : '';
    const n = Number(/^\+(\d+)/u.exec(words)?.[1] ?? '0');
    return `${String(o.labels.filter((l) => l.mode === 'name').length + n)} names, ${String(o.pills.length)} pills, more '${words}' for ${String(n)}`;
  };
  await expect.poll(count, { timeout: 3000 }).toMatch(new RegExp(`^${String(NAMES.length)} names, 3 pills, `, 'u'));
  const o = await overlay(s.page);
  const missing = NAMES.length - o.labels.filter((l) => l.mode === 'name').length;
  const more = s.page.getByTestId('app.right.bims.more');
  if (missing > 0) await expect(more, 'the more line counts the names left out').toHaveText(new RegExp(`^\\+${String(missing)} `, 'u'));
  else await expect(more, 'no more line when every name shows').toBeHidden();
}

/** 320 at rest; wide = 640, docked when the window has room, slid over the thread when not (bims-wire m_27585). */
const SIZES = [
  { w: 320, win: 1400, wide: null },
  { w: 640, win: 1600, wide: 'docked' },
  { w: 640, win: 1100, wide: 'over' },
] as const;

for (const { w, win, wide } of SIZES) {
  const tag = wide === null ? String(w) : `${String(w)}-${wide}`;
  test(`(2) the office at ${tag}: labels, pills, ⌃, hover, click`, async () => {
    const { s, core } = await open(office, { width: win });
    try {
      await showOffice(s);
      // launch's size is held to the display; setContentSize isn't (a 1512 display gave 1280 for 1600)
      await s.app.evaluate(({ BrowserWindow }, v) => {
        const b = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('index.html'));
        b?.setContentSize(v, b.getContentSize()[1] ?? 900);
      }, win);
      if (wide !== null) {
        await s.page.getByTestId('app.right.agents.width.wide').click();
        const why = await s.page.evaluate(() => {
          const r = (id: string) => Math.round(document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect().width ?? -1);
          return `window ${String(innerWidth)}, sidebar ${String(r('app.sidebar'))}, panel ${String(r('app.panel'))}`;
        });
        await expect(s.page.getByTestId('app.panel'), why).toHaveAttribute('data-wide', wide, { timeout: 3000 });
      }
      const bar = await s.page.getByTestId('app.right.bims').boundingBox();
      expect(Math.abs((bar?.width ?? 0) - w), `the office is ${String(w)} wide (${String(bar?.width)})`).toBeLessThanOrEqual(1);
      // the rows under the office, not in its place (Gabriel: the list stays while the bims are open)
      const firstRow = await s.page.getByTestId(`app.right.agent.${NAMES[1] ?? ''}`).boundingBox();
      expect(firstRow, 'the rows show with the office').not.toBeNull();
      expect((firstRow?.y ?? 0) + 0.5, 'the rows start under the office').toBeGreaterThanOrEqual((bar?.y ?? 0) + (bar?.height ?? 0));
      await settle(s);

      // at rest: no label (an idle bim on an office-life trip walks with its name: wait for a moment
      // without one), the '?' and '✗' pills, no name in them
      await expect.poll(async () => (await overlay(s.page)).labels, { timeout: 15_000, message: 'no label at rest' }).toEqual([]);
      const rest = await overlay(s.page);
      expect(rest.pills.map((p) => `${p.name}:${p.pill}`).sort()).toEqual(['deploy:asks', 'onboarding:asks', 'search-index:failed']);
      for (const p of rest.pills) expect(p.text, `${p.name}'s pill has no name`).not.toContain(p.name);
      await shot(s, `rest-${tag}.png`, `at rest, ${tag} px`, "no label; '?' over onboarding and deploy, '✗' over search-index");

      // an event: signup-perf is done -> 'signup-perf · done' for 3 s, then nothing
      await core.send(rowsOf(withRows(office, { 'signup-perf': { status: 'done', title: 'landed' } })) as never);
      await expect.poll(async () => (await overlay(s.page)).labels.filter((l) => l.mode === 'event').map((l) => l.name), { timeout: 2000 }).toEqual(['signup-perf']);
      const t0 = Date.now();
      await shot(s, `event-${tag}.png`, `an event, ${tag} px`, "signup-perf done: its label 'signup-perf · done' over it, 3 s");
      await sleep(Math.max(0, 2400 - (Date.now() - t0)));
      expect((await overlay(s.page)).labels.filter((l) => l.mode === 'event'), 'still shown at 2.4 s').toHaveLength(1);
      await expect.poll(async () => (await overlay(s.page)).labels.filter((l) => l.mode === 'event').length, { timeout: 2500 }).toBe(0);
      expect(Date.now() - t0, 'gone by 3 s + the 0.6 s fade').toBeLessThan(4400);

      // four events at once: at most 3 event labels at any time
      await core.send(rowsOf(withRows(office, {
        'signup-perf': { status: 'working', turn_ms: 1000 }, 'dark-mode': { status: 'done' }, 'empty-state': { status: 'working', turn_ms: 1000 }, nightly: { status: 'done', watching: [] },
      })) as never);
      let most = 0;
      for (let i = 0; i < 16; i++) {
        most = Math.max(most, (await overlay(s.page)).labels.filter((l) => l.mode === 'event').length);
        if (i === 3) await shot(s, `events-${tag}.png`, `four events at once, ${tag} px`, 'at most 3 event labels at a time');
        await sleep(250);
      }
      expect(most, 'at most 3 event labels').toBeLessThanOrEqual(3);
      expect(most, 'the events show').toBeGreaterThan(0);
      await core.send(rowsOf(office) as never);
      await settle(s);

      // ⌃ held: every bim's name
      await s.page.keyboard.down('Control');
      await heldAll(s);
      await shot(s, `held-${tag}.png`, `⌃ held, ${tag} px`, 'every name, sans 12 on its chip; none covers another or a pill (moved ones have a leader)');
      expect(await collisions(s.page), 'under ⌃ no name covers another, and the pills stay on top').toEqual([]);
      await s.page.keyboard.up('Control');
      await expect.poll(async () => (await overlay(s.page)).labels.filter((l) => !TRIPS.has(l.name)).length, { timeout: 2000 }).toBe(0);

      // hover: its card after the tip's 400 ms (the overlay's 'hover' label): name, state, title on their lines
      const head = await headOf(s.page, 'cookie-banner');
      expect(head, "cookie-banner's head on the canvas").not.toBeNull();
      await s.page.mouse.move((head?.x ?? 0) - 2, (head?.y ?? 0) + 4);
      await s.page.mouse.move(head?.x ?? 0, (head?.y ?? 0) + 6, { steps: 3 });
      await expect.poll(async () => (await overlay(s.page)).labels.filter((l) => l.mode === 'hover').map((l) => l.name), { timeout: 3000 }).toEqual(['cookie-banner']);
      const hover = s.page.getByTestId('app.right.bims.label.cookie-banner');
      await expect(hover).toContainText('cookie-banner');
      const inside = await s.page.evaluate(() => {
        const o = document.querySelector('[data-testid="app.right.bims"]')?.getBoundingClientRect();
        const out: string[] = [];
        for (const e of Array.from(document.querySelectorAll('[data-testid^="app.right.bims.label."], [data-testid^="app.right.bims.pill."]'))) {
          const r = e.getBoundingClientRect();
          if (o !== undefined && r.width > 0 && (r.left < o.left - 0.5 || r.right > o.right + 0.5 || r.top < o.top - 0.5 || r.bottom > o.bottom + 0.5)) out.push(`${e.getAttribute('data-testid') ?? ''} ${String(Math.round(r.left - o.left))}..${String(Math.round(r.right - o.left))} of ${String(Math.round(o.width))}`);
        }
        return out;
      });
      expect(inside, 'the hover card and the pills stay inside the office (never cut at its edge)').toEqual([]);
      const said = (await hover.innerText()).split('\n').map((l) => l.trim()).filter((l) => l !== '');
      expect(said, 'the card: its name, its state, its title, each on its line').toEqual(['cookie-banner', 'blocked', 'no access to the CMS']);
      for (const line of said) expect(badCut(line), `a card line's cut is one glued '…' after a word: ${line}`).toBe(false);
      await expect(s.page.getByTestId('app.right.bims.card.state.cookie-banner')).toBeVisible();
      const card = await hover.boundingBox();
      const over = card !== null && head !== null && card.x < head.x && head.x < card.x + card.width && card.y < head.y + 6 && head.y + 6 < card.y + card.height;
      expect(over, 'the card never covers the bim it describes (designer m_27920)').toBe(false);
      await shot(s, `hover-${tag}.png`, `hover, ${tag} px`, "cookie-banner hovered: a card, its name in 600, 'blocked' dim, its title under, after 400 ms; it never covers the bim");

      // click: opens that agent (a row's open: the thread route)
      await s.page.mouse.click(head?.x ?? 0, (head?.y ?? 0) + 6);
      await expect.poll(() => s.page.evaluate(() => sessionStorage.getItem('bise.history') ?? ''), { timeout: 3000 }).toContain(`agent/${P}/cookie-banner`);
    } finally {
      await s.close();
    }
  });
}

/** Night (the dark theme) at each size: the same rest, the pills, ⌃'s names; and his message's plane. */
for (const { w, win, wide } of SIZES) {
  const tag = `${wide === null ? String(w) : `${String(w)}-${wide}`}-night`;
  test(`(2) the office at night, ${tag}`, async () => {
    const { s, core } = await open(office, { theme: 'dark' });
    try {
      await s.app.evaluate(({ BrowserWindow }, v) => {
        const b = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('index.html'));
        b?.setContentSize(v, b.getContentSize()[1] ?? 900);
      }, win);
      await showOffice(s);
      if (wide !== null) {
        await s.page.getByTestId('app.right.agents.width.wide').click();
        await expect(s.page.getByTestId('app.panel')).toHaveAttribute('data-wide', wide, { timeout: 3000 });
      }
      await settle(s);
      await expect.poll(async () => (await overlay(s.page)).labels, { timeout: 15_000, message: 'no label at rest' }).toEqual([]);
      expect((await overlay(s.page)).pills.map((p) => `${p.name}:${p.pill}`).sort()).toEqual(['deploy:asks', 'onboarding:asks', 'search-index:failed']);
      await shot(s, `rest-${tag}.png`, `at rest, night, ${tag}`, "night: warm lamps, lit screens; '?' and '✗' pills only");

      // his message to login-test (asleep): a plane from the top edge, no '→' label (the plane is the shape, spec §1.4)
      await core.send({ ev: 'activity', project: P, item: { kind: 'message', from: { who: 'you' }, to: { who: 'agent', name: 'login-test' }, mode: 'steer', expects_reply: false, at_ms: Date.now(), id: 'qa-plane-1' } } as never);
      let arrows = 0;
      for (let i = 0; i < 12; i++) {
        arrows += (await overlay(s.page)).labels.filter((l) => l.text.includes('→')).length;
        if (i === 2) await shot(s, `plane-${tag}.png`, `his message, night, ${tag}`, 'a white paper plane from the top edge to login-test\'s desk; it wakes up; no label');
        await sleep(250);
      }
      expect(arrows, "no '→ login-test' label for his plane").toBe(0);

      await s.page.keyboard.down('Control');
      await heldAll(s);
      await shot(s, `held-${tag}.png`, `⌃ held, night, ${tag}`, 'every name, sans 12 on its chip; none covers another or a pill');
      expect(await collisions(s.page), 'under ⌃ no name covers another, and the pills stay on top').toEqual([]);
      await s.page.keyboard.up('Control');
    } finally {
      await s.close();
    }
  });
}

test('(3) reduced motion: no loop, a bim that moves fades (no walk)', async () => {
  // no idle bim: an office-life trip is a real move (a fade under reduced motion), not a loop
  const calm = snap(office.agents.filter((a) => !TRIPS.has(a.name)), office.cards, office.places);
  const { s, core } = await open(calm, { reduced: true });
  try {
    await showOffice(s);
    await settle(s);
    expect(await drawnIn(s, 2000), 'the office with typing bims draws nothing under reduced motion').toEqual({ frames: 0, shown: 0 });
    await shot(s, 'reduced-rest.png', 'reduced motion, at rest', 'every pose reads without motion: no loop runs');

    // signup-perf is done (its desk -> the terrace): a fade, never a walk
    const t0 = Date.now() / 1000;
    await core.send(rowsOf(withRows(calm, { 'signup-perf': { status: 'done', turn_ms: null } })) as never);
    // the probe's ring holds 3000 places (~3 s of 16 bims at 60 fps, and the event label keeps the loop
    // ticking for 3 s): read it every 200 ms and keep signup-perf's places in order
    const trace: Placed[] = [];
    for (let i = 0; i < 30; i++) {
      const last = trace.at(-1)?.t ?? t0 - 1;
      trace.push(...((await probe(s.page))?.trace ?? []).filter((p) => p.name === 'signup-perf' && p.t > last));
      await sleep(200);
    }
    // a fade: every place it is drawn at is by its start or by its end (a pose's own shift, a step
    // aside, stays under half a tile); a walk would draw it between the two
    const first = trace[0], end = trace.at(-1);
    const near = (p: Placed, q: Placed | undefined): boolean => q !== undefined && Math.hypot(p.x - q.x, p.z - q.z) < 0.5;
    const between = trace.filter((p) => !near(p, first) && !near(p, end)).map((p) => `${p.x.toFixed(2)},${p.z.toFixed(2)}`);
    expect(trace.length, 'the move was drawn').toBeGreaterThan(1);
    expect(Math.hypot((end?.x ?? 0) - (first?.x ?? 0), (end?.z ?? 0) - (first?.z ?? 0)), 'it changed place').toBeGreaterThan(2);
    expect(between, 'drawn between its desk and the terrace: a walk').toEqual([]);
    expect(trace.some((p) => p.op > 0.05 && p.op < 0.95), `it faded: ${JSON.stringify(trace.slice(0, 40).map((p) => [Number((p.t - t0).toFixed(2)), Number(p.x.toFixed(2)), Number(p.z.toFixed(2)), Number(p.op.toFixed(2))]))}`).toBe(true);
  } finally {
    await s.close();
  }
});

/** His camera at 320 and at 640 docked: pinch, two fingers, a drag, back to the fit. */
for (const { w, win, wide } of SIZES.filter((x) => x.wide !== 'over')) {
  const tag = wide === null ? String(w) : `${String(w)}-${wide}`;
  test(`(5) his camera at ${tag}: pinch, two fingers, drag, fit`, async () => {
    // no idle bim: an office-life trip is a real walk (frames at the display's rate), not the camera's
    const calm = snap(office.agents.filter((a) => !TRIPS.has(a.name)), office.cards, office.places);
    const { s } = await open(calm, { width: win });
    try {
      await showOffice(s);
      await s.app.evaluate(({ BrowserWindow }, v) => {
        const b = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('index.html'));
        b?.setContentSize(v, b.getContentSize()[1] ?? 900);
      }, win);
      if (wide !== null) {
        await s.page.getByTestId('app.right.agents.width.wide').click();
        await expect(s.page.getByTestId('app.panel')).toHaveAttribute('data-wide', wide, { timeout: 3000 });
      }
      await settle(s);
      const box = await s.page.getByTestId('app.right.bims').boundingBox();
      if (box === null) throw new Error('no office');
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      // every head on view now (a zoom puts some off it)
      const heads = async (): Promise<Map<string, { x: number; y: number }>> => {
        const out = new Map<string, { x: number; y: number }>();
        for (const n of NAMES) {
          const h = await headOf(s.page, n);
          if (h !== null) out.set(n, h);
        }
        return out;
      };
      // the two heads nearest the office's centre at the fit, of bims that stay put (an idle one's
      // office-life trip would walk it off view): a pinch there keeps them on view
      const fit0 = await heads();
      const pair = [...fit0.entries()].filter(([n]) => !TRIPS.has(n)).sort(([, a], [, b]) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy)).slice(0, 2).map(([n]) => n);
      const spread = async (): Promise<number> => {
        const a = await headOf(s.page, pair[0] ?? '');
        const b = await headOf(s.page, pair[1] ?? '');
        return a === null || b === null ? -1 : Math.hypot(a.x - b.x, a.y - b.y);
      };
      // how far the heads on view both times moved, on average
      const moved = (a: Map<string, { x: number; y: number }>, b: Map<string, { x: number; y: number }>): number => {
        const d = [...a].flatMap(([n, p]) => {
          const q = b.get(n);
          return q === undefined ? [] : [Math.hypot(q.x - p.x, q.y - p.y)];
        });
        return d.length === 0 ? 0 : d.reduce((x, y) => x + y, 0) / d.length;
      };
      const scroll = () => s.page.evaluate(() => document.querySelector('.app-rb-body')?.scrollTop ?? 0);
      // his camera itself (zoom.ts Cam, the renderer's probe): at the fit or not. The heads above say
      // what he sees, but a bim that moves by itself moves them with no camera at all (desk-cut-15)
      const camNow = () => s.page.evaluate(() => (window as unknown as { __biseBims?: { cam: () => { zoom: number; u: number; v: number } } }).__biseBims?.cam() ?? null);
      const fitNow = async (): Promise<string> => {
        const c = await camNow();
        if (c === null) return 'no camera';
        return Math.abs(c.zoom - 1) < 1e-6 && Math.abs(c.u - 0.5) < 1e-6 && Math.abs(c.v - 0.5) < 1e-6 ? 'fit' : `zoom ${c.zoom.toFixed(4)} at ${c.u.toFixed(4)},${c.v.toFixed(4)}`;
      };
      const at = await spread();
      expect(at, `${pair.join(' and ')} on the canvas at the fit`).toBeGreaterThan(0);
      await expect(s.page.getByTestId('app.right.bims.fit'), 'no fit button at the fit').toHaveCount(0);

      // the fit's own rate (the office's typing bims loop at ~8 fps; budget.spec has the 0 of a still one)
      const fitRate = (await drawnIn(s, 1500)).frames;
      // a pinch (ctrl wheel) zooms in: the bims spread, one frame per move, '⤢ fit' shows
      const f0 = (await probe(s.page))?.frames ?? 0;
      for (let i = 0; i < 2; i++) await trackpad(s.cdp, cx, cy, { dy: -40, pinch: true });
      await expect.poll(spread, { timeout: 2000, message: 'a pinch zooms in' }).toBeGreaterThan(at * 1.5);
      await expect(s.page.getByTestId('app.right.bims.fit')).toBeVisible();
      expect(((await probe(s.page))?.frames ?? 0) - f0, 'the pinch drew').toBeGreaterThan(0);
      await settle(s);
      await shot(s, `zoomed-${tag}.png`, `pinched in, ${tag} px`, "zoomed in around the pointer; labels and pills at their size; '⤢ fit' top right");
      expect(await collisions(s.page), 'zoomed, every tag stays inside the office').toEqual([]);

      // two fingers move the view, the bar does not scroll
      const s0 = await scroll();
      const h0 = await heads();
      for (let i = 0; i < 4; i++) await trackpad(s.cdp, cx, cy, { dx: 15, dy: 10 });
      await expect.poll(async () => moved(h0, await heads()), { timeout: 2000, message: 'two fingers move the view' }).toBeGreaterThan(10);
      expect(await scroll(), 'two fingers on a zoomed office never scroll the bar').toBe(s0);

      // a drag moves it too, and the click after it opens nobody
      const route = () => s.page.evaluate(() => sessionStorage.getItem('bise.history') ?? '');
      const r0 = await route();
      const h1 = await heads();
      await s.page.mouse.move(cx, cy);
      await s.page.mouse.down();
      await s.page.mouse.move(cx - 40, cy - 20, { steps: 5 });
      await s.page.mouse.up();
      await expect.poll(async () => moved(h1, await heads()), { timeout: 2000, message: 'a drag moves the view' }).toBeGreaterThan(10);
      await sleep(300);
      expect(await route(), 'a drag opens no agent').toBe(r0);

      // left alone, zoomed draws as the fit does: the typing loop's ~8 fps, no camera loop
      await settle(s);
      const zoomedRate = (await drawnIn(s, 1500)).frames;
      expect(zoomedRate, `zoomed and left alone it draws as at the fit (${String(fitRate)} frames in 1.5 s)`).toBeLessThanOrEqual(fitRate + 4);

      // '⤢ fit' brings the whole office back; esc too
      await s.page.getByTestId('app.right.bims.fit').click();
      await expect.poll(fitNow, { timeout: 2000, message: "'⤢ fit' brings the camera back to the fit" }).toBe('fit');
      await expect(s.page.getByTestId('app.right.bims.fit')).toHaveCount(0);
      for (let i = 0; i < 2; i++) await trackpad(s.cdp, cx, cy, { dy: -40, pinch: true });
      await expect(s.page.getByTestId('app.right.bims.fit')).toBeVisible();
      // esc while the office has focus (a click on it gives it; the fit button that had it is gone)
      await s.page.getByTestId('app.right.bims').focus();
      await s.page.keyboard.press('Escape');
      await expect(s.page.getByTestId('app.right.bims.fit')).toHaveCount(0);
      await expect.poll(fitNow, { timeout: 2000, message: 'esc brings the camera back to the fit' }).toBe('fit');
      // at the fit the wheel is the bar's again: his camera stays where it is (the camera, not two
      // heads: a bim that moves on its own would move those)
      const pinchAtFit = await scroll();
      await trackpad(s.cdp, cx, cy, { dy: 10 });
      await sleep(300);
      expect(await fitNow(), 'a plain wheel at the fit does not move the office').toBe('fit');
      await expect(s.page.getByTestId('app.right.bims.fit'), "a plain wheel at the fit shows no '⤢ fit'").toHaveCount(0);
      expect(pinchAtFit, 'the bar can scroll').toBeGreaterThanOrEqual(0);
    } finally {
      await s.close();
    }
  });
}

/** (6) His easter eggs frozen mid-play (the check forces them: window.__biseEggs), day and night. */
for (const theme of ['light', 'dark'] as const) {
  test(`(6) easter eggs frozen mid-play, ${theme}`, async () => {
    const { s, core } = await open(office, { theme, width: 1600 });
    try {
      await showOffice(s);
      await s.page.getByTestId('app.right.agents.width.wide').click();
      await settle(s);
      await s.page.evaluate((night) => {
        (window as unknown as { __biseEggs?: unknown }).__biseEggs = {
          bims: { 'copy-fix': { kind: 'salto', since: 0.4 }, 'signup-perf': { kind: 'speedrun', since: 1 }, 'pricing-page': { kind: 'stare', since: 1 } },
          office: night ? { ghost: 0.45, tree: true } : { eclipse: true, cake: true, doodle: true },
        };
      }, theme === 'dark');
      // a row event kicks a frame (the loop draws on demand)
      await core.send(rowsOf(office) as never);
      await expect.poll(async () => (await overlay(s.page)).labels.filter((l) => l.mode === 'egg').map((l) => `${l.name}:${l.text}`).sort(), { timeout: 3000 })
        .toEqual(['pricing-page:!', 'signup-perf:1:47']);
      await sleep(400);
      await shot(s, `eggs-${theme}.png`, `easter eggs frozen, ${theme === 'dark' ? 'night' : 'day'}, 640`, theme === 'dark'
        ? "copy-fix mid-salto, '1:47' over signup-perf (speedrun), '!' over pricing-page (the stare); the ghost crossing, the christmas tree in the lounge"
        : "copy-fix mid-salto, '1:47' over signup-perf, '!' over pricing-page; the eclipse's violet sky, the cake on the island, noughts and crosses on the whiteboard");
      expect(await collisions(s.page), "the eggs' words follow the labels' rules").toEqual([]);
      await s.page.evaluate(() => { delete (window as unknown as { __biseEggs?: unknown }).__biseEggs; });
    } finally {
      await s.close();
    }
  });
}

/**
 * (7) His pokes (page bims-pokes v4, pokes.ts), forced and frozen mid-play through window.__biseEggs.pokes
 * (never a click's roll in a check), day and night: each word over its bim in the label's place,
 * the '?' and '✗' pills still on, the spin's chair turned with its bim, the box at chest height.
 */
for (const theme of ['light', 'dark'] as const) {
  test(`(7) pokes frozen mid-play, ${theme}`, async () => {
    const { s, core } = await open(office, { theme, width: 1600 });
    try {
      await showOffice(s);
      await s.page.getByTestId('app.right.agents.width.wide').click();
      await settle(s);
      await s.page.evaluate(() => {
        (window as unknown as { __biseEggs?: unknown }).__biseEggs = {
          bims: {},
          pokes: {
            'signup-perf': { kind: 'spin', since: 0.8 },
            'login-test': { kind: 'startle', since: 0.5 },
            onboarding: { kind: 'meme', since: 0.8 },
            changelog: { kind: 'juggle', since: 0.6 },
            'copy-fix': { kind: 'cheers', since: 0.75 },
            'search-index': { kind: 'brave', since: 1.7 },
            'cookie-banner': { kind: 'shrug', since: 0.65 },
          },
        };
      });
      await core.send(rowsOf(office) as never);
      await expect.poll(async () => (await overlay(s.page)).labels.filter((l) => l.mode === 'egg').map((l) => `${l.name}:${l.text}`).sort(), { timeout: 3000 })
        .toEqual(['changelog:whoa', 'cookie-banner:meh', 'copy-fix:cheers', 'login-test:huh?!', 'onboarding:me! me!', 'search-index:ok. ok.', 'signup-perf:wheee']);
      const pills = (await overlay(s.page)).pills.map((p) => `${p.name}:${p.pill}`).sort();
      expect(pills, "the '?' and '✗' pills stay on under a poke").toEqual(expect.arrayContaining(['onboarding:asks', 'search-index:failed']));
      await sleep(400);
      await shot(s, `pokes-${theme}.png`, `pokes frozen mid-play, ${theme === 'dark' ? 'night' : 'day'}, 640`,
        "signup-perf mid chair spin (its chair rolled back and turned with it), login-test startled awake, onboarding's me! me!, changelog juggles its box at chest height, copy-fix's cheers, search-index's brave face (its cloud smaller, never gone), cookie-banner's shrug");
      expect(await collisions(s.page), "the pokes' words follow the labels' rules").toEqual([]);
      await s.page.evaluate(() => { delete (window as unknown as { __biseEggs?: unknown }).__biseEggs; });
    } finally {
      await s.close();
    }
  });
}
