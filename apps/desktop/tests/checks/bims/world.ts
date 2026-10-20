// The bims check's world and probes (bims-qa): a FakeCore world built from a Snapshot (the rows the
// office reads, src/bims/model.ts) and what the check watches in the app: the three chunk's load
// (CDP Debugger.scriptParsed against the built chunk that holds three), the office's canvas frames,
// the overlay's labels and pills, and the shots index the designer signs. No hub, no home of his:
// launchDesktop runs it off screen on a throwaway home.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import type { CDPSession, Page } from '@playwright/test';
import { FakeCore, Recorder, changedInside, expect, launchDesktop, type Box, type Session } from '../../harness';
import { EXPECT, office } from '../../../src/bims/fixtures';
import type { Snapshot } from '../../../src/bims/model';

export const HOME = 'bise-home-00000000';
export const P = 'office-0bims0qa';
export const MIN = 60_000;

const prefs = (theme: 'light' | 'dark') => ({
  ev: 'prefs',
  prefs: {
    onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [],
    quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
    voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7,
  },
});

/** The rows event for the office's project: what core.send() replays when a bim's row changes. */
export const rowsOf = (snap: Snapshot): Record<string, unknown> => ({ ev: 'agents', project: P, agents: snap.agents, places: snap.places });
export const cardsOf = (snap: Snapshot): Record<string, unknown> => ({ ev: 'cards', project: P, cards: snap.cards.map((c) => ({ ...c, project: P })) });

/** The start world: bise's home and one project whose bar shows `snap`. */
export function world(snap: Snapshot, theme: 'light' | 'dark' = 'light', growth: Record<string, number> = { jobs_done: 100, days_used: 14, artifacts_made: 120 }): Record<string, unknown>[] {
  const working = snap.agents.filter((a) => a.status === 'working').length;
  const waits = snap.agents.reduce((n, a) => n + a.waits, 0);
  const now = Date.now();
  return [
    prefs(theme),
    {
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        { project: P, name: 'office', path: '/nowhere/office', git: true, home: false, order: 1, agents: snap.agents.length, working, waits, running: true },
      ],
    },
    { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/office', name: 'office' },
    rowsOf(snap),
    // a grown office (growth.ts stage 9: the lounge, the whiteboard, the terrace, the ramp), as
    // these checks drew it before the office grew; grow.spec.ts walks the stages
    { ev: 'growth', project: P, growth },
    { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: now, waits: 0, watching: [], dir: 'main' }] },
    cardsOf(snap),
    { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: now - MIN, kind: 'agent', text: 'the office is open.' }], before: null, more: false },
  ];
}

// ---- the session -------------------------------------------------------------------------------

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
/** The idle bims: office-life trips, a name over them while they walk (spec §2, §7). */
export const TRIPS = new Set(Object.entries(EXPECT).filter(([, k]) => k === 'nap|snack').map(([n]) => n));

/** Every live bim's name in the office (archived rows have no bim). */
export const NAMES = office.agents.filter((a) => !a.archived).map((a) => a.name);

/** The office's world with these agents' rows replaced (an event: a row that changes). */
export const withRows = (base: Snapshot, over: Record<string, Partial<(typeof office.agents)[number]>>): Snapshot => ({
  ...base,
  agents: base.agents.map((a) => (over[a.name] === undefined ? a : { ...a, ...over[a.name] })),
});

/** `growth`: the project's counters (a grown office, stage 9, when absent) */
export async function open(snapshot: Snapshot, o: { theme?: 'light' | 'dark'; reduced?: boolean; width?: number; growth?: Record<string, number> } = {}): Promise<{ s: Session; core: FakeCore }> {
  const core = new FakeCore(world(snapshot, o.theme ?? 'light', o.growth) as never);
  const s = await launchDesktop({ core, route: `project/${P}`, size: `${String(o.width ?? 1400)}x900` });
  if (o.reduced === true) await s.page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(s.page.getByTestId('app.right.agents.bims')).toBeVisible({ timeout: 20_000 });
  return { s, core };
}

/**
 * A trackpad's wheel at a page point, as Chromium gets it: a pinch is a wheel with ctrl (modifiers 2),
 * two fingers a plain one. Through CDP so it is the browser's own event, not a synthetic one.
 */
export async function trackpad(cdp: CDPSession, x: number, y: number, o: { dx?: number; dy?: number; pinch?: boolean }): Promise<void> {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: o.dx ?? 0, deltaY: o.dy ?? 0, modifiers: o.pinch === true ? 2 : 0 });
}

/** The office on, its renderer loaded and drawing. */
export async function showOffice(s: Session): Promise<void> {
  await s.page.getByTestId('app.right.agents.bims').click();
  await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-state', 'on', { timeout: 20_000 });
  await expect.poll(async () => (await probe(s.page))?.frames ?? 0, { timeout: 10_000 }).toBeGreaterThan(0);
}

/** Waits until the renderer stops drawing (no new frame for `quietMs`), at most `maxMs`. */
export async function settle(s: Session, quietMs = 1500, maxMs = 20_000): Promise<void> {
  const end = Date.now() + maxMs;
  let last = (await probe(s.page))?.frames ?? 0;
  let since = Date.now();
  while (Date.now() < end) {
    await sleep(250);
    const n = (await probe(s.page))?.frames ?? 0;
    if (n !== last) { last = n; since = Date.now(); } else if (Date.now() - since >= quietMs) return;
  }
}

/** Frames the renderer drew in `ms` (the probe) and canvas frames the compositor showed (the Recorder). */
export async function drawnIn(s: Session, ms: number): Promise<{ frames: number; shown: number }> {
  const box = await s.page.getByTestId('app.right.bims.canvas').boundingBox();
  if (box === null) throw new Error('no office canvas');
  const rec = new Recorder(s.cdp, s.page);
  const f0 = (await probe(s.page))?.frames ?? 0;
  await rec.start();
  await sleep(ms);
  const fr = await rec.stop();
  const f1 = (await probe(s.page))?.frames ?? 0;
  const shown = changedInside(fr, box).filter((n) => n > 0).length;
  return { frames: f1 - f0, shown };
}

// ---- the three chunk (check 1) ----------------------------------------------------------------

const OUT = path.resolve(__dirname, '..', '..', '..', 'out', 'renderer');

/** The built renderer chunks that hold three.js (its REVISION export): what the list view never loads. */
export function threeChunks(): string[] {
  const found: string[] = [];
  const walk = (dir: string): void => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.js') && /REVISION\s*=\s*["']\d+/u.test(readFileSync(p, 'utf8'))) found.push(e.name);
    }
  };
  walk(OUT);
  return found;
}

/** Every script the renderer parses from now on (its URL's file name), via CDP's Debugger domain. */
export async function watchScripts(cdp: CDPSession): Promise<() => string[]> {
  const seen: string[] = [];
  cdp.on('Debugger.scriptParsed', (e: { url: string }) => {
    if (e.url !== '') seen.push(path.basename(e.url.split('?')[0] ?? e.url));
  });
  await cdp.send('Debugger.enable');
  return () => [...seen];
}

// ---- the office in the page --------------------------------------------------------------------

/** What test mode exposes (bims-render's window.__biseBims): frames drawn and what was placed. */
export type Placed = { t: number; name: string; x: number; z: number; op: number };
export type BimsProbe = { frames: number; trace: Placed[] };

export const probe = (page: Page): Promise<BimsProbe | null> =>
  page.evaluate(() => {
    const b = (window as unknown as { __biseBims?: { frames: number; trace: Placed[] } }).__biseBims;
    return b === undefined ? null : { frames: b.frames, trace: b.trace.slice() };
  });

/** Start measuring each frame's cost (the probe's slowest, test mode: the render and the GPU's finish). */
export const resetSlowest = (s: Session): Promise<void> =>
  s.page.evaluate(() => {
    const b = (window as unknown as { __biseBims?: { slowest: number | null } }).__biseBims;
    if (b !== undefined) b.slowest = 0;
  });

/** The slowest frame since resetSlowest, ms (then stops measuring). */
export const slowest = (s: Session): Promise<number> =>
  s.page.evaluate(() => {
    const b = (window as unknown as { __biseBims?: { slowest: number | null } }).__biseBims;
    const ms = b?.slowest ?? 0;
    if (b !== undefined) b.slowest = null;
    return ms;
  });

/** A bim's head on the page (css px), from the renderer's headOf through the probe; null off view. */
export const headOf = (page: Page, name: string): Promise<{ x: number; y: number } | null> =>
  page.evaluate((n) => {
    const b = (window as unknown as { __biseBims?: { head: (x: string) => { x: number; y: number } | null } }).__biseBims;
    const c = document.querySelector('[data-testid="app.right.bims.canvas"]');
    const h = b?.head(n) ?? null;
    if (h === null || c === null) return null;
    const r = c.getBoundingClientRect();
    return { x: r.left + h.x, y: r.top + h.y };
  }, name);

/** The overlay now: every label and pill shown, with its mode and words. */
export type Shown = { labels: { name: string; mode: string; text: string }[]; pills: { name: string; pill: string; text: string }[] };
export const overlay = (page: Page): Promise<Shown> =>
  page.evaluate(() => {
    const vis = (e: Element): boolean => {
      const r = e.getBoundingClientRect();
      const st = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && e.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && st.visibility !== 'hidden' && Number(st.opacity) > 0.05;
    };
    const all = (pre: string) => Array.from(document.querySelectorAll(`[data-testid^="${pre}"]`)).filter(vis);
    return {
      labels: all('app.right.bims.label.').map((e) => ({ name: (e.getAttribute('data-testid') ?? '').slice('app.right.bims.label.'.length), mode: e.getAttribute('data-mode') ?? '', text: (e as HTMLElement).innerText.trim() })),
      pills: all('app.right.bims.pill.').map((e) => ({ name: (e.getAttribute('data-testid') ?? '').slice('app.right.bims.pill.'.length), pill: e.getAttribute('data-pill') ?? '', text: (e as HTMLElement).innerText.trim() })),
    };
  });

/**
 * What covers what in the overlay now (designer m_27792): a tag out of the office, label boxes that
 * overlap another label or a pill, and pills not on top at their center (elementFromPoint).
 */
export const collisions = (page: Page): Promise<string[]> =>
  page.evaluate(() => {
    const boxes = (pre: string) => Array.from(document.querySelectorAll<HTMLElement>(`[data-testid^="${pre}"]`))
      .map((e) => ({ e, id: (e.getAttribute('data-testid') ?? '').slice('app.right.bims.'.length), r: e.getBoundingClientRect() }))
      .filter((b) => b.r.width > 0 && b.r.height > 0 && b.e.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && Number(getComputedStyle(b.e).opacity) > 0.05);
    const labels = boxes('app.right.bims.label.');
    const pills = boxes('app.right.bims.pill.');
    const meet = (a: DOMRect, b: DOMRect): boolean => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
    const out: string[] = [];
    const o = document.querySelector('[data-testid="app.right.bims"]')?.getBoundingClientRect();
    for (const b of [...labels, ...pills]) {
      if (o !== undefined && (b.r.left < o.left - 0.5 || b.r.right > o.right + 0.5 || b.r.top < o.top - 0.5 || b.r.bottom > o.bottom + 0.5)) out.push(`${b.id} is out of the office`);
    }
    labels.forEach((a, i) => {
      for (const b of labels.slice(i + 1)) if (meet(a.r, b.r)) out.push(`${a.id} covers ${b.id}`);
      for (const p of pills) if (meet(a.r, p.r)) out.push(`${a.id} meets ${p.id}`);
    });
    for (const p of pills) {
      const top = document.elementFromPoint(p.r.left + p.r.width / 2, p.r.top + p.r.height / 2);
      if (top === null || !(top === p.e || p.e.contains(top))) out.push(`${p.id} is under ${top?.getAttribute('data-testid') ?? top?.className ?? 'nothing'}`);
    }
    return out;
  });

/** A cut that isn't one glued '…' after a whole word (designer m_27792): ' …', '...', or '…' mid-text. */
export const badCut = (text: string): boolean => / …|\.\.\.|…(?!$)/u.test(text);

/**
 * The window hidden, as the app reads it (document.hidden + visibilitychange, App.tsx's useStill):
 * the harness's window is never shown, so the check says it the way the page hears it.
 */
export const setHidden = (page: Page, hidden: boolean): Promise<void> =>
  page.evaluate((h) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);

/** The office's WebGL context lost, as a GPU reset does it (WEBGL_lose_context on its own canvas). */
/** WEBGL_lose_context on a bims canvas (the office's by default, the town's: 'app.right.bims.town.canvas') */
export const loseContext = (page: Page, testId = 'app.right.bims.canvas'): Promise<boolean> =>
  page.evaluate((id) => {
    const c = document.querySelector<HTMLCanvasElement>(`[data-testid="${id}"]`);
    const gl = c?.getContext('webgl2') ?? c?.getContext('webgl') ?? null;
    const ext = gl?.getExtension('WEBGL_lose_context') ?? null;
    if (ext === null) return false;
    ext.loseContext();
    return true;
  }, testId);


// ---- the shots index (for the designer to sign) ---------------------------------------------------

export const SHOTS = path.resolve(__dirname, '..', '..', '..', '.harness-cache', 'bims-shots');

export type Shot = { file: string; title: string; says: string };

/**
 * What the compositor shows in `box` now (a screencast frame), written to SHOTS/<file>. Not
 * page.screenshot: its capture draws the page again, and a WebGL canvas whose loop is still (no
 * preserveDrawingBuffer) comes out blank there while the window shows it (checked: the screencast's
 * frame has the office, the screenshot only the overlay).
 */
export async function shotOf(cdp: CDPSession, page: Page, box: Box, file: string): Promise<void> {
  const rec = new Recorder(cdp, page);
  await rec.start();
  await new Promise((r) => setTimeout(r, 400)); // the screencast sends the frame shown now at its start
  const frames = await rec.stop();
  const f = frames.at(-1);
  if (f === undefined) throw new Error(`no screencast frame for ${file}`);
  const sc = f.scale;
  const x0 = Math.round(box.x * sc), y0 = Math.round(box.y * sc);
  const w = Math.min(Math.round(box.width * sc), f.png.width - x0), h = Math.min(Math.round(box.height * sc), f.png.height - y0);
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(f.png, out, x0, y0, w, h, 0, 0);
  mkdirSync(SHOTS, { recursive: true });
  writeFileSync(path.join(SHOTS, file), PNG.sync.write(out));
}

/**
 * Adds `shots` to SHOTS/shots.json (both spec files write there; a shot of the same file replaces
 * the old one) and writes SHOTS/index.html from it: every shot with what it should show.
 */
export function writeIndex(add: readonly Shot[]): string {
  mkdirSync(SHOTS, { recursive: true });
  const kept = path.join(SHOTS, 'shots.json');
  const before = existsSync(kept) ? (JSON.parse(readFileSync(kept, 'utf8')) as Shot[]) : [];
  const shots = [...before.filter((b) => !add.some((a) => a.file === b.file)), ...add];
  writeFileSync(kept, JSON.stringify(shots, null, 1));
  const esc = (s: string): string => s.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');
  const rows = shots.map((s) => `<figure><img src="${esc(s.file)}" alt=""><figcaption><b>${esc(s.title)}</b><br>${esc(s.says)}</figcaption></figure>`).join('\n');
  const html = `<!doctype html><meta charset="utf-8"><title>les bims · the check's shots</title>
<style>body{font:14px/1.5 -apple-system,system-ui,sans-serif;margin:24px;background:#faf8f5;color:#2a2622}
figure{display:inline-block;vertical-align:top;margin:0 16px 24px 0;max-width:680px}
img{max-width:100%;border:1px solid #e3ddd5;border-radius:6px}figcaption{margin-top:6px}</style>
<h1>les bims · the check's shots</h1><p>from apps/desktop/tests/checks/bims, on FakeCore rows, off screen. ${String(shots.length)} shots.</p>
${rows}
`;
  const p = path.join(SHOTS, 'index.html');
  writeFileSync(p, html);
  return p;
}
