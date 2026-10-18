import { describe, expect, it } from 'vitest';
import type { ActivityKind, PokeKind, Pose, Segment, Spot } from '../model';
import { POKES } from '../pokes';
import { eggRig } from './egg';
import { rigOf, type Rig } from './pose';
import { pokeRig } from './poke';

const desk: Spot = { x: 3, z: 6, wz: 5.35, ax: 1.2, face: 0 };
function poseOf(k: ActivityKind, at: Spot['face'] extends number ? string : never = 'desk'): Pose {
  const seg: Segment = { t: 0, act: { k, at: at as never }, sig: k, spot: desk, path: { pts: [desk], seg: [], len: 0 }, speed: 2.4, from: null };
  return { x: desk.x, z: desk.z, dir: 0, moving: false, since: 10, seg };
}
const rig = (k: ActivityKind, at = 'desk'): Rig => rigOf({ pose: poseOf(k, at), t: 3, main: false, phase: 0.3, reduced: false });
const mid = (r: Rig, kind: PokeKind, f = 0.5): Rig => pokeRig(r, kind, POKES[kind].dur * f, POKES[kind].dur);

describe('pokes: the bodies (render/poke.ts)', () => {
  it('every reaction moves the bim mid-play and asks for frames; the word alone (reduced motion) moves nothing', () => {
    const r = rig('work');
    for (const kind of Object.keys(POKES) as PokeKind[]) {
      const out = eggRig(r, { kind, since: POKES[kind].dur * 0.45, dur: POKES[kind].dur, label: '' });
      expect(out.motion, kind).toBe('walk');
      expect(JSON.stringify({ ...out, motion: r.motion }), kind).not.toBe(JSON.stringify(r));
    }
    expect(eggRig(r, { kind: 'word', since: 0.5, dur: 1.5, label: 'busy' })).toBe(r);
  });

  it('the state stays true under it: a working screen lit, the failed cloud smaller but never gone', () => {
    const w = rig('work');
    expect(mid(w, 'shoo').screen).toBe(w.screen);
    const f = rig('failed');
    for (let u = 0; u <= 1; u += 0.05) expect(mid(f, 'brave', u).props.cloud).toBeGreaterThanOrEqual(f.props.cloud * 0.7 - 1e-9);
  });

  it('turbo typing sweats at the temples, never a cloud over its head (bims m_31501)', () => {
    const t = mid(rig('work'), 'turbo');
    expect(t.props.flick).not.toBeNull();
    expect(t.props.hot).toBe(rig('work').props.hot);
  });

  it("the box juggle stays at chest height (over its head is the itemget egg's)", () => {
    const r = rig('landing', 'queue');
    for (let u = 0; u <= 1; u += 0.05) {
      const p = mid(r, 'juggle', u).props;
      expect(p.crateUp).toBe(false);
      expect(p.crateAt?.[0] ?? 0).toBeLessThan(0.95);
    }
  });

  it('the chair spin rolls its chair back and turns it with the bim, one full turn, back in place', () => {
    const r = rig('work');
    const m = mid(r, 'spin');
    expect(m.seat?.back).toBeGreaterThan(0.2);
    expect((m.dir - r.dir) % (2 * Math.PI)).toBeCloseTo(m.seat?.turn ?? 0);
    const end = mid(r, 'spin', 1);
    expect(end.seat?.back).toBeCloseTo(0);
    expect(end.x).toBeCloseTo(r.x);
    expect(Math.cos(end.dir - r.dir)).toBeCloseTo(1);
  });

  it('the boop squashes about the seat when it sits, about the feet when it stands', () => {
    const sat = mid(rig('work'), 'boop', 0.3);
    expect(sat.squash?.at).toBeGreaterThan(0.3);
    const stood = mid(rig('starting', 'door'), 'boop', 0.3);
    expect(stood.squash?.at).toBe(0);
    expect(stood.squash?.k ?? 0).toBeGreaterThan(sat.squash?.k ?? 0);
  });

  it("a jump keeps its labels still (anchor), and the peek never puts on sunglasses it didn't wear", () => {
    const a = mid(rig('asks'), 'meme', 0.4);
    expect(a.anchor).toBeCloseTo(a.y - rig('asks').y);
    const plain = { ...rig('done', 'terrace'), props: { ...rig('done', 'terrace').props, glasses: false } };
    for (let u = 0; u <= 1; u += 0.1) expect(mid(plain, 'peek', u).props.glasses).toBe(false);
  });
});
