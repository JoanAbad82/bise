// The workshop's floor laws (page bims-workshop, Gabriel's pick C, bims' brief):
// - the walls hold 18 desks at most, the next ones sit in pods of six; at 30 desks the room is ~27 x 14;
// - grow-keep: no desk, pod or corner moves (from the left wall and the back wall) when a desk comes, 0..31, nothing goes;
// - nothing stands on a walkway: every corner piece, pod piece and the Vespa keeps off every leg but its own nook's, 0..31;
// - every desk and corner nook is reached from the door on the walk graph.
import { describe, expect, it } from 'vitest';
import { agent, crowd, mainAgent } from '../fixtures';
import type { Box, Leg, Pt } from '../model';
import { network, path, along } from '../paths';
import { legToBox } from '../cozy';
import { layoutOf } from './index';
import { type WorkshopOffice, vespaBox, workshopLayout } from './workshop';
import { CORNERS, WALL_MAX, cornersOf, podPieces, podsOf } from './workshop-floor';

/** a walkway's room each side: a bim's body (avoid.ts BODY_R) and a little air */
const CLEAR = 0.2;
const near = (a: Pt, b: Pt): boolean => Math.hypot(a.x - b.x, a.z - b.z) < 1e-4;
const ws = (n: number): WorkshopOffice => layoutOf(crowd(n).agents, 'workshop') as WorkshopOffice;

describe('the workshop: walls, pods and corners', () => {
  it('holds 18 desks on its walls at most, the next ones in pods of six', () => {
    for (let n = 0; n <= 31; n++) {
      const o = ws(n);
      const onFloor = [...o.slots.values()].filter((s) => s >= WALL_MAX).length;
      expect(onFloor, `${String(n)} desks`).toBe(Math.max(0, n - WALL_MAX));
      expect(o.pods.length).toBe(podsOf(o.cap));
      expect(o.corners.map((c) => c.kind)).toEqual(CORNERS.slice(0, cornersOf(o.cap)));
    }
    expect(ws(12).corners).toEqual([]);
    expect(ws(13).corners.map((c) => c.kind)).toEqual(['lounge']);
    expect(ws(19).corners.map((c) => c.kind)).toEqual(['lounge', 'band']);
    expect(ws(31).corners.map((c) => c.kind)).toEqual(['lounge', 'band', 'maker', 'lift']);
  }, 60_000);

  it('is ~27 x 14 at 30 desks, the same room as at 18', () => {
    const o = ws(30);
    expect(o.W).toBeCloseTo(27.35, 2);
    expect(o.D).toBeCloseTo(14.1, 2);
    expect(ws(18).W).toBeCloseTo(o.W, 6);
    expect(ws(18).D).toBeCloseTo(o.D, 6);
  });

  it('grow-keep: no desk, pod or corner moves when a desk comes, 0..31 (from its walls), and none goes', () => {
    const names = Array.from({ length: 32 }, (_, i) => `a${String(i)}`);
    let prev: WorkshopOffice | undefined;
    for (let n = 0; n <= 31; n++) {
      const o = workshopLayout([mainAgent(), ...names.slice(0, n).map((x) => agent(x))], prev);
      if (prev) {
        const p = prev;
        const rel = (q: Pt, x0: number) => ({ x: q.x - x0, z: q.z });
        for (const [name, d] of p.desks) expect(near(rel(o.desks.get(name) ?? { x: NaN, z: NaN }, o.x0), rel(d, p.x0)), `${String(n)}: ${name}`).toBe(true);
        p.pods.forEach((q, i) => { expect(near(rel(o.pods[i] ?? { x: NaN, z: NaN }, o.x0), rel(q, p.x0)), `${String(n)}: pod ${String(i)}`).toBe(true); });
        p.corners.forEach((c, i) => {
          const now = o.corners[i];
          expect(now?.kind, `${String(n)}: corner ${String(i)}`).toBe(c.kind);
          expect(near(rel(now ?? { x: NaN, z: NaN }, o.x0), rel(c, p.x0)), `${String(n)}: corner ${c.kind}`).toBe(true);
        });
      }
      prev = o;
    }
  });

  it('keeps its pods and corners when desks leave (the room never shrinks)', () => {
    const all = crowd(30).agents;
    const big = workshopLayout(all);
    const fewer = workshopLayout(all.slice(0, 10), big);
    expect(fewer.pods.length).toBe(big.pods.length);
    expect(fewer.corners.map((c) => c.kind)).toEqual(big.corners.map((c) => c.kind));
  });

  it('nothing stands on a walkway, 0..31: corner pieces, pod pieces and the Vespa keep off every leg but their own nook\'s', () => {
    const bad: string[] = [];
    for (let n = 0; n <= 31; n++) {
      const o = ws(n);
      const things: { what: string; box: Box }[] = [
        ...o.corners.flatMap((c) => c.pieces.map((box, i) => ({ what: `${c.kind} piece ${String(i)}`, box }))),
        ...o.pods.flatMap((p, i) => podPieces(p).map((box) => ({ what: `pod ${String(i)}`, box }))),
        ...(o.vespa ? [{ what: 'the Vespa', box: vespaBox(o.vespa) }] : []),
      ];
      for (const leg of network(o) as Leg[]) {
        for (const t of things) {
          const own = t.box.of !== undefined && leg.some((p) => near(p, t.box.of as Pt));
          if (!own && legToBox(leg, t.box) < CLEAR) bad.push(`${String(n)}: ${t.what} on ${JSON.stringify(leg)}`);
        }
      }
    }
    expect([...new Set(bad)].slice(0, 10)).toEqual([]);
  }, 60_000);

  it('every desk and corner nook is reached from the door, 0..31', () => {
    for (let n = 0; n <= 31; n++) {
      const o = ws(n);
      for (const p of [...o.desks.values(), ...(o.nooks ?? [])]) {
        const w = path(o, o.door, p);
        expect(near(along(w, w.len), p), `${String(n)}: ${JSON.stringify(p)}`).toBe(true);
      }
    }
  }, 60_000);
});
