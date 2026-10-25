// The studio's page (index.html): what scripts/bims-sprites.mts calls through window.studio. Each
// sheet comes back as WebP data URLs at a quality, plus its frame size, anchor and the idle bim's
// box (its hit area on the page). A strip per sheet: its frames side by side. Owner: bims-home.
import { SHEETS, idleFrames } from './gags';
import { drawSheet, inkBox } from './studio';

function strip(frames: readonly HTMLCanvasElement[]): HTMLCanvasElement {
  const f = frames[0];
  const c = document.createElement('canvas');
  c.width = (f?.width ?? 0) * frames.length;
  c.height = f?.height ?? 0;
  const ctx = c.getContext('2d');
  frames.forEach((x, i) => ctx?.drawImage(x, i * x.width, 0));
  return c;
}

const cache = new Map<string, { gag: HTMLCanvasElement; idle: HTMLCanvasElement; meta: object }>();

function sheet(id: string): { gag: HTMLCanvasElement; idle: HTMLCanvasElement; meta: object } {
  const hit = cache.get(id);
  if (hit) return hit;
  const s = SHEETS.find((x) => x.id === id);
  if (!s) throw new Error(`no sheet ${id}`);
  const g = drawSheet(s, s.frames);
  const i = drawSheet(s, idleFrames(s));
  const idle0 = i.frames[0];
  const meta = {
    id: s.id, w: g.w, h: g.h, ax: Math.round(g.ax * 10) / 10, ay: Math.round(g.ay * 10) / 10, n: s.frames.length,
    seq: s.seq, phone: s.phone, hit: idle0 ? inkBox(idle0) : null,
    ...(s.travel ? { travel: s.travel.map((u) => Math.round(u * 1000) / 1000) } : {}),
  };
  const out = { gag: strip(g.frames), idle: strip(i.frames), meta };
  cache.set(id, out);
  return out;
}

declare global {
  interface Window {
    studio: {
      ids(): string[];
      render(id: string, q: number, qIdle: number): { meta: object; gag: string; idle: string };
      png(id: string): string;
    };
  }
}

window.studio = {
  ids: () => SHEETS.map((s) => s.id),
  render(id, q, qIdle) {
    const s = sheet(id);
    return { meta: s.meta, gag: s.gag.toDataURL('image/webp', q), idle: s.idle.toDataURL('image/webp', qIdle) };
  },
  /** the strip as a PNG on a page's paper, its anchor's edge drawn in grey, for looking at it */
  png(id) {
    const s = sheet(id);
    const m = s.meta as { w: number; ax: number; ay: number };
    const c = document.createElement('canvas');
    c.width = s.gag.width;
    c.height = s.gag.height;
    const ctx = c.getContext('2d');
    if (!ctx) return '';
    ctx.fillStyle = '#f4efe6';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#9a8f80';
    for (let x = 0; x < c.width; x += m.w * 2) {
      ctx.fillRect(x, m.ay * 2, m.w * 2, 2);
      ctx.fillRect(x + m.ax * 2 - 1, m.ay * 2 - 8, 2, 16);
      ctx.fillRect(x, 0, 1, c.height);
    }
    ctx.drawImage(s.gag, 0, 0);
    return c.toDataURL('image/png');
  },
};
