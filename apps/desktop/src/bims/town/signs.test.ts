// town/signs.ts: the town's signs laid out like map labels (bims m_30199), no mark over another,
// none without its name (bims m_31373).
import { describe, expect, it } from 'vitest';
import { placeSigns, type Box, type SignAt, type SignIn } from './signs';

const sign = (id: string, x: number, y: number, o: Partial<SignIn> = {}): SignIn => ({ id, x, y, w: 80, h: 20, compactW: 50, live: false, rank: 2, ...o });
const box = (s: SignIn, a: SignAt): Box => ({ x0: a.left, y0: a.top, x1: a.left + (a.compact ? s.compactW : s.w), y1: a.top + s.h });
const overlap = (a: Box, b: Box): boolean => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
/** the placed signs' boxes, with the marks taken before them */
const boxesOf = (ins: readonly SignIn[], out: ReadonlyMap<string, SignAt>): Box[] =>
  ins.flatMap((s) => {
    const a = out.get(s.id);
    return a === undefined ? [] : [box(s, a)];
  });
const noOverlap = (bs: readonly Box[]): boolean => bs.every((a, i) => bs.slice(i + 1).every((b) => !overlap(a, b)));

/** a tiny deterministic random (the property cases) */
function rand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

describe('town signs: like map labels, none over another mark', () => {
  it('a lone sign goes above its office', () => {
    const s = sign('a', 200, 100);
    expect(placeSigns([s], { x0: 0, y0: 0, x1: 400, y1: 300 }).get('a')).toEqual({ left: 160, top: 76, compact: false });
  });

  it('two offices side by side: the second takes another spot, never over the first', () => {
    const ins = [sign('a', 200, 100), sign('b', 230, 102)];
    const out = placeSigns(ins, { x0: 0, y0: 0, x1: 400, y1: 300 });
    expect(out.size).toBe(2);
    expect(noOverlap(boxesOf(ins, out))).toBe(true);
  });

  it('no room whole: compact (its name and pills); no room compact: hidden whole, never a bare pill nor over another', () => {
    // a crowd round one point: the later ones find no free spot
    const ins = Array.from({ length: 8 }, (_, i) => sign(`s${String(i)}`, 100, 50, i === 7 ? { rank: 1 } : {}));
    const out = placeSigns(ins, { x0: 0, y0: 0, x1: 200, y1: 100 });
    expect(out.get('s7')?.compact, 'with pills: placed first, whole').toBe(false);
    expect(out.size).toBeLessThan(8);
    expect(noOverlap(boxesOf(ins, out))).toBe(true);
    // a long sign in a narrow town: no room whole, its compact one fits
    const m = sign('m', 50, 26, { w: 120, compactW: 60 });
    expect(placeSigns([m], { x0: 0, y0: 0, x1: 100, y1: 30 }).get('m')).toEqual({ left: 20, top: 2, compact: true });
  });

  it('the hovered one (rank 0) is placed first: it keeps the spot above', () => {
    const ins = [sign('a', 200, 100), sign('b', 200, 100, { rank: 0 })];
    expect(placeSigns(ins, { x0: 0, y0: 0, x1: 400, y1: 300 }).get('b')).toEqual({ left: 160, top: 76, compact: false });
  });

  it("the live bims' labels win: a sign never sits on one, it goes elsewhere or hides", () => {
    const label: Box = { x0: 150, y0: 70, x1: 250, y1: 98 };
    const s = sign('a', 200, 100);
    const at = placeSigns([s], { x0: 0, y0: 0, x1: 400, y1: 300 }, [label]).get('a');
    expect(at).toBeDefined();
    if (at !== undefined) expect(overlap(box(s, at), label)).toBe(false);
  });

  it("a live office's sign goes above its back wall only (higher over its bims' labels), else hides", () => {
    const s = sign('a', 200, 100, { live: true });
    const label: Box = { x0: 150, y0: 80, x1: 250, y1: 96 };
    const at = placeSigns([s], { x0: 0, y0: 0, x1: 400, y1: 300 }, [label]).get('a');
    expect(at, 'one sign height higher').toEqual({ left: 160, top: 52, compact: false });
    // its labels fill the wall's height: no spot beside or below it, hidden
    const wall: Box = { x0: 100, y0: 0, x1: 300, y1: 98 };
    expect(placeSigns([s], { x0: 0, y0: 0, x1: 400, y1: 300 }, [wall]).get('a')).toBeUndefined();
  });

  it("past the town's edge by less than half: slid back inside; more: another spot", () => {
    const s = sign('a', 20, 100);
    expect(placeSigns([s], { x0: 0, y0: 0, x1: 400, y1: 300 }).get('a')).toEqual({ left: 0, top: 76, compact: false });
  });

  it("the seen area: a sign never under what covers the town's edges", () => {
    const s = sign('a', 30, 100);
    expect(placeSigns([s], { x0: 4, y0: 0, x1: 396, y1: 300 }).get('a')).toEqual({ left: 4, top: 76, compact: false });
  });

  it('any crowd, any size: every placed sign inside, none over another or a label (300 random towns)', () => {
    const r = rand(7);
    for (let k = 0; k < 300; k++) {
      const W = 200 + r() * 600;
      const H = 150 + r() * 500;
      const n = 1 + Math.floor(r() * 41);
      const ins = Array.from({ length: n }, (_, i) => {
        const w = 40 + r() * 80;
        return sign(`s${String(i)}`, r() * W, r() * H, { w, compactW: w * (0.5 + r() * 0.4), h: 16 + r() * 6, live: r() < 0.2, rank: Math.floor(r() * 3) });
      });
      const labels: Box[] = Array.from({ length: Math.floor(r() * 6) }, () => {
        const x = r() * W;
        const y = r() * H;
        return { x0: x, y0: y, x1: x + 30 + r() * 60, y1: y + 18 };
      });
      const out = placeSigns(ins, { x0: 0, y0: 0, x1: W, y1: H }, labels);
      const bs = boxesOf(ins, out);
      expect(bs.every((b) => b.x0 >= -1e-9 && b.y0 >= -1e-9 && b.x1 <= W + 1e-9 && b.y1 <= H + 1e-9), `town ${String(k)}: inside`).toBe(true);
      expect(noOverlap(bs), `town ${String(k)}: no two signs meet`).toBe(true);
      expect(bs.every((b) => labels.every((l) => !overlap(b, l))), `town ${String(k)}: no sign on a label`).toBe(true);
    }
  });
});
