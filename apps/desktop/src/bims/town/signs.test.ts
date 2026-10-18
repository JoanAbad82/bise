// town/signs.ts: the town's signs laid out like map labels (bims m_30199).
import { describe, expect, it } from 'vitest';
import { placeSigns, type SignIn } from './signs';

const sign = (id: string, x: number, y: number, o: Partial<SignIn> = {}): SignIn => ({ id, x, y, w: 80, h: 20, pillW: 0, pillH: 0, rank: 2, ...o });
const box = (s: SignIn, a: { left: number; top: number; compact: boolean }) => {
  const w = a.compact ? s.pillW : s.w;
  const h = a.compact ? s.pillH : s.h;
  return { x0: a.left, y0: a.top, x1: a.left + w, y1: a.top + h };
};
const overlap = (a: { x0: number; y0: number; x1: number; y1: number }, b: typeof a): boolean => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

describe('town signs: like map labels', () => {
  it('a lone sign goes above its office', () => {
    const s = sign('a', 200, 100);
    const at = placeSigns([s], 400, 300, true).get('a');
    expect(at).toEqual({ left: 160, top: 76, compact: false });
  });

  it('two offices side by side: the second takes another spot, never over the first', () => {
    const ins = [sign('a', 200, 100), sign('b', 230, 102)];
    const out = placeSigns(ins, 400, 300, true);
    const a = out.get('a');
    const b = out.get('b');
    expect(a && b).toBeTruthy();
    if (!a || !b) return;
    expect(overlap(box(ins[0] as SignIn, a), box(ins[1] as SignIn, b))).toBe(false);
  });

  it('at the fit, no room: its pills alone; no pill: left out; zoomed in, its name above anyway', () => {
    // a crowd round one point: the later ones find no free spot for their whole sign
    const ins = Array.from({ length: 8 }, (_, i) => sign(`s${String(i)}`, 100, 50, i === 7 ? { pillW: 24, pillH: 16 } : {}));
    const fit = placeSigns(ins, 200, 100, true);
    expect(fit.get('s7')?.compact, 'its pills never drop').toBe(true);
    expect([...fit.values()].filter((x) => !x.compact).length).toBeLessThan(7);
    expect(fit.size).toBeLessThan(8);
    const zoomed = placeSigns(ins, 200, 100, false);
    expect(zoomed.size, 'zoomed in: every name shows').toBe(8);
    expect([...zoomed.values()].every((x) => !x.compact)).toBe(true);
  });

  it('the hovered one (rank 0) is placed first: it keeps the spot above', () => {
    const ins = [sign('a', 200, 100), sign('b', 200, 100, { rank: 0 })];
    expect(placeSigns(ins, 400, 300, true).get('b')).toEqual({ left: 160, top: 76, compact: false });
  });
});
