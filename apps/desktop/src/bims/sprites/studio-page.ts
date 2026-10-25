// The studio's page (index.html): what scripts/bims-sprites.mts calls through window.studio. Each
// island comes back as WebP data URLs at a quality (its base, its frames' strip) with what the page
// needs to play it: sizes in css px (the sheets are 2x), the frames' box on the base, their order,
// the held pose and its blink, the bim's hit box and the slab's underside (its shadow). Owner: bims-proto.
import { ISLANDS } from './gags';
import { drawIsland, type Drawn } from './studio';

function strip(frames: readonly HTMLCanvasElement[]): HTMLCanvasElement {
  const f = frames[0];
  const c = document.createElement('canvas');
  c.width = (f?.width ?? 0) * frames.length;
  c.height = f?.height ?? 0;
  const ctx = c.getContext('2d');
  frames.forEach((x, i) => ctx?.drawImage(x, i * x.width, 0));
  return c;
}

const cache = new Map<string, { d: Drawn; strip: HTMLCanvasElement; meta: object }>();
const half = (n: number): number => Math.round(n / 2);

function island(id: string): { d: Drawn; strip: HTMLCanvasElement; meta: object } {
  const hit = cache.get(id);
  if (hit) return hit;
  const s = ISLANDS.find((x) => x.id === id);
  if (!s) throw new Error(`no island ${id}`);
  const d = drawIsland(s);
  const meta = {
    id: s.id, w: half(d.base.width), h: half(d.base.height),
    f: [half(d.at.x), half(d.at.y), half(d.at.w), half(d.at.h)],
    n: s.frames.length, seq: s.seq, blink: s.blink,
    hit: [half(d.hit.x), half(d.hit.y), half(d.hit.w), half(d.hit.h)],
    under: d.under.map(half),
  };
  const out = { d, strip: strip(d.frames), meta };
  cache.set(id, out);
  return out;
}

declare global {
  interface Window {
    studio: {
      ids(): string[];
      render(id: string, q: number): { meta: object; base: string; frames: string };
      /** base and frames as PNGs, to look at them */
      png(id: string): { base: string; frames: string };
    };
  }
}

window.studio = {
  ids: () => ISLANDS.map((s) => s.id),
  render(id, q) {
    const s = island(id);
    return { meta: s.meta, base: s.d.base.toDataURL('image/webp', q), frames: s.strip.toDataURL('image/webp', q) };
  },
  png(id) {
    const s = island(id);
    return { base: s.d.base.toDataURL('image/png'), frames: s.strip.toDataURL('image/png') };
  },
};
