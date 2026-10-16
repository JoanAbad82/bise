// The bims check's world and probes (bims-qa): a FakeCore world built from a Snapshot (the rows the
// office reads, src/bims/model.ts) and what the check watches in the app: the three chunk's load
// (CDP Debugger.scriptParsed against the built chunk that holds three), the office's canvas frames,
// the overlay's labels and pills, and the shots index the designer signs. No hub, no home of his:
// launchDesktop runs it off screen on a throwaway home.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { CDPSession, Page } from '@playwright/test';
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
export function world(snap: Snapshot, theme: 'light' | 'dark' = 'light'): Record<string, unknown>[] {
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
    { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: now, waits: 0, watching: [], dir: 'main' }] },
    cardsOf(snap),
    { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: now - MIN, kind: 'agent', text: 'the office is open.' }], before: null, more: false },
  ];
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
      return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && Number(st.opacity) > 0.05;
    };
    const all = (pre: string) => Array.from(document.querySelectorAll(`[data-testid^="${pre}"]`)).filter(vis);
    return {
      labels: all('app.right.bims.label.').map((e) => ({ name: (e.getAttribute('data-testid') ?? '').slice('app.right.bims.label.'.length), mode: e.getAttribute('data-mode') ?? '', text: (e as HTMLElement).innerText.trim() })),
      pills: all('app.right.bims.pill.').map((e) => ({ name: (e.getAttribute('data-testid') ?? '').slice('app.right.bims.pill.'.length), pill: e.getAttribute('data-pill') ?? '', text: (e as HTMLElement).innerText.trim() })),
    };
  });

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
export const loseContext = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('[data-testid="app.right.bims.canvas"]');
    const gl = c?.getContext('webgl2') ?? c?.getContext('webgl') ?? null;
    const ext = gl?.getExtension('WEBGL_lose_context') ?? null;
    if (ext === null) return false;
    ext.loseContext();
    return true;
  });


// ---- the shots index (for the designer to sign) ---------------------------------------------------

export const SHOTS = path.resolve(__dirname, '..', '..', '..', '.harness-cache', 'bims-shots');

export type Shot = { file: string; title: string; says: string };

/** Writes SHOTS/index.html: every shot of this run with what it should show. Returns its path. */
export function writeIndex(shots: readonly Shot[]): string {
  mkdirSync(SHOTS, { recursive: true });
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
