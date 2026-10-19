import { describe, expect, it } from 'vitest';
import type { Activity, ActivityKind, Doing, Path, Pose, Segment, Spot } from '../model';
import { BEAT, PLANE_CATCH, REACH_S } from './catch';
import { PLANE_S } from '../timeline';
import { BITE_S, BITES, FADE, FRUIT_S, PICK_S, PLANE_FLIGHT, louder, placeOf, rigOf, transitionOf, workLoops } from './pose';
import type { BimEgg } from '../eggs';
import { eggRig } from './egg';
import { headClearance } from './laptop';
import { seatedAct } from '../sit';

const desk: Spot = { x: 3, z: 6, wz: 5.35, ax: 1.2, face: 0 };
const lounge: Spot = { x: -4, z: 1, wz: 4, ax: -4, face: 0 };
const still: Path = { pts: [{ x: desk.x, z: desk.z }], seg: [], len: 0 };
const walk: Path = {
  pts: [{ x: lounge.x, z: lounge.z }, { x: lounge.x, z: 4 }, { x: 3, z: 4 }, { x: desk.x, z: desk.z }],
  seg: [3, 7, 2],
  len: 12,
};

const KINDS: readonly ActivityKind[] = [
  'work', 'hot', 'sleep', 'waitagent', 'nap', 'snack', 'asks', 'blocked', 'failed', 'landing', 'done', 'stopped',
  'starting', 'main', 'mainidle', 'coffee', 'visit', 'report',
];

function poseOf(k: ActivityKind, o: { from?: ActivityKind | null; since?: number; path?: Path; act?: Partial<Activity>; plane?: number } = {}): Pose {
  const path = o.path ?? still;
  const speed = 2.4;
  const seg: Segment = {
    t: 0, act: { k, at: 'desk', ...o.act }, sig: k, spot: desk, path, speed, from: o.from ?? null,
  };
  const since = o.since ?? 10;
  const moving = path.len > 0 && since * speed < path.len;
  const end = path.pts[path.pts.length - 1] ?? desk;
  return {
    x: moving ? 0 : end.x, z: moving ? 4 : end.z, dir: 0, moving, since, seg,
    ...(o.plane !== undefined ? { plane: { since: o.plane } } : {}),
  };
}

const rig = (p: Pose, t: number, reduced = false) => rigOf({ pose: p, t, main: false, phase: 1.3, reduced });

describe('pose: the kinds at rest', () => {
  it('poses every ActivityKind', () => {
    for (const k of KINDS) expect(rig(poseOf(k), 5).opacity).toBe(1);
  });

  it('loops only typing, the "?" hops and eating; the other poses are still (model.ts Motion)', () => {
    const loops = new Set(KINDS.filter((k) => rig(poseOf(k), 5).motion === 'loop'));
    expect([...loops].sort()).toEqual(['asks', 'hot', 'main', 'snack', 'work']);
    for (const k of KINDS) if (!loops.has(k)) expect(rig(poseOf(k), 5).motion).toBe('still');
  });

  it('eats at the island: picks a fruit from the bowl, bites it smaller, chews; then the next fruit (bims-life)', () => {
    const at = (since: number, fruit = 0) => rig(poseOf('snack', { since, act: { at: 'island', fruit } }), 100 + since);
    // reaching into the bowl: leaning in, nothing in hand yet
    const reach = at(PICK_S * 0.4);
    expect(reach.body[0]).toBeGreaterThan(0.1);
    expect(reach.props.pine || reach.props.orange).toBe(false);
    // picked, at its mouth, mouth open
    const up = at(PICK_S + 0.45);
    expect(up.props.pine).toBe(true);
    expect(up.mouth).toBe('oh');
    expect(up.armR[0]).toBeLessThan(-2);
    // each bite leaves less of it; after the last one the hand is empty
    const left = [0, 1, 2].map((b) => at(PICK_S + b * BITE_S + 1.5).props.eaten);
    expect(left).toEqual([1 / BITES, 2 / BITES, 3 / BITES]);
    const gone = at(PICK_S + (BITES - 1) * BITE_S + 1.5);
    expect(gone.props.pine || gone.props.orange).toBe(false);
    // chewing moves the mouth
    const mouths = new Set(Array.from({ length: 12 }, (_, i) => at(PICK_S + 1.3 + i * 0.1).mouth));
    expect(mouths.size).toBeGreaterThan(1);
    // the next fruit: the other one, whole
    const next = at(FRUIT_S + PICK_S + 0.45);
    expect(next.props.orange).toBe(true);
    expect(next.props.eaten).toBe(0);
    // a mug is sipped, never smaller
    expect(at(PICK_S + 1.5, 2).props).toMatchObject({ mug: true, eaten: 0 });
    // reduced motion: still, chewing with a fruit in hand
    const r = rig(poseOf('snack', { since: 40, act: { at: 'island', fruit: 1 } }), 40, true);
    expect(r.motion).toBe('still');
    expect(r.props.orange).toBe(true);
  });

  it('a still pose is the same at any time', () => {
    for (const k of ['sleep', 'nap', 'done', 'failed', 'blocked', 'stopped', 'landing', 'mainidle'] as const) {
      expect(rig(poseOf(k), 3)).toEqual(rig(poseOf(k), 7.77));
    }
  });

  it('reads without motion: asleep eyes closed, failed slumped, in line with the box, stopped grey and lamp off', () => {
    expect(rig(poseOf('sleep'), 0).eyes).toBeLessThan(0.3);
    expect(rig(poseOf('nap'), 0).eyes).toBeLessThan(0.3);
    expect(rig(poseOf('failed'), 0).body[0]).toBeGreaterThan(0.2);
    expect(rig(poseOf('failed'), 0).props.cloud).toBe(1);
    expect(rig(poseOf('landing'), 0).props.crate).toBe(true);
    const s = rig(poseOf('stopped'), 0);
    expect([s.grey, s.lamp, s.screen]).toEqual([1, false, 0]);
    expect(rig(poseOf('done'), 0).props.glasses).toBe(true);
  });

  it('lights the screen of a working bim, not of a sleeping one', () => {
    expect(rig(poseOf('work'), 1).screen).toBeGreaterThan(0.5);
    expect(rig(poseOf('sleep'), 1).screen).toBe(0);
  });

  it('an urgent ask holds a sheet', () => {
    expect(rig(poseOf('asks', { act: { urgent: true } }), 1).props.sheet).toBe(true);
    expect(rig(poseOf('asks'), 1).props.sheet).toBe(false);
  });

  it('hot sweats in a loop', () => {
    expect(rig(poseOf('hot'), 1).props.hot).not.toBeNull();
    expect(rig(poseOf('work'), 1).props.hot).toBeNull();
  });
});

describe('pose: reduced motion', () => {
  it('never loops: typing holds still', () => {
    for (const k of KINDS) {
      const a = rig(poseOf(k), 2, true);
      expect(a.motion).toBe('still');
      expect(a).toEqual(rig(poseOf(k), 9.1, true));
    }
  });

  it('never walks: the bim is at the start or the end, fading', () => {
    const tl = walk.len / 2.4;
    const ends = [walk.pts[0], walk.pts[walk.pts.length - 1]];
    let dipped = false;
    for (let s = 0; s < tl + 1; s += 0.05) {
      const r = rig(poseOf('work', { from: 'nap', path: walk, since: s }), s, true);
      expect(ends.some((e) => e && Math.abs(e.x - r.x) < 1e-9 && Math.abs(e.z - r.z) < 1e-9)).toBe(true);
      if (r.opacity < 0.5) dipped = true;
      if (s > FADE) expect([r.opacity, r.motion]).toEqual([1, 'still']);
    }
    expect(dipped).toBe(true);
  });

  it('places a walk normally without reduced motion', () => {
    const p = poseOf('work', { from: 'nap', path: walk, since: 1 });
    expect(placeOf(p, false)).toEqual({ x: p.x, z: p.z, opacity: 1, fading: false });
  });
});

describe('pose: walks and transitions', () => {
  it('walks while the pose moves, carries the box to the queue, skates to the terrace', () => {
    expect(rig(poseOf('work', { from: 'nap', path: walk, since: 1 }), 1).motion).toBe('walk');
    expect(rig(poseOf('landing', { from: 'work', path: walk, since: 1 }), 1).props.crate).toBe(true);
    expect(rig(poseOf('done', { from: 'work', path: walk, since: 1 }), 1).props.skate).toBe(true);
  });

  it('plays a §5 transition after arriving, then settles', () => {
    expect(transitionOf('work', 'sleep')).toBe(1.5);
    expect(transitionOf('work', 'failed')).toBe(1.2);
    expect(transitionOf('work', 'stopped')).toBe(0.5);
    expect(transitionOf(null, 'work')).toBe(0);
    expect(rig(poseOf('sleep', { from: 'work', since: 0.7 }), 0.7).motion).toBe('walk');
    expect(rig(poseOf('sleep', { from: 'work', since: 1.6 }), 1.6).motion).toBe('still');
    // stopped goes grey through its half second
    const mid = rig(poseOf('stopped', { from: 'work', since: 0.25 }), 0.25).grey;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
});

describe('pose: his paper plane', () => {
  it('runs at the display rate while it flies and the bim reads it, then goes back to the pose', () => {
    expect(rig(poseOf('work', { plane: 0.5 }), 5).motion).toBe('walk');
    const reading = rig(poseOf('work', { plane: PLANE_FLIGHT + 0.8 }), 5);
    expect(reading.head[0]).toBeGreaterThan(0.2); // head down, reading
    expect(reading.motion).toBe('walk');
    expect(rig(poseOf('sleep', { plane: PLANE_FLIGHT + PLANE_CATCH + 0.1 }), 5).motion).toBe('still');
  });

  it('draws no plane under reduced motion', () => {
    expect(rig(poseOf('sleep', { plane: 0.5 }), 5, true).motion).toBe('still');
  });

  it('looks up and raises its arm before the plane lands, gives a little, brings it in, reads it', () => {
    const at = (c: number) => rig(poseOf('work', { plane: PLANE_FLIGHT + c }), 5);
    const before = rig(poseOf('work', { plane: PLANE_FLIGHT - REACH_S - 0.05 }), 5);
    const landing = at(-0.01);
    // the arm goes up (more negative x: up and ahead) and the head looks up, before the catch
    expect(landing.armR[0]).toBeLessThan(before.armR[0] - 0.05);
    expect(landing.armR[0]).toBeLessThan(-2);
    expect(landing.head[0]).toBeLessThan(0);
    // the impact: the hand gives a little (the arm comes down a bit), then brings it in
    expect(at(BEAT.give).armR[0]).toBeGreaterThan(landing.armR[0]);
    expect(at(BEAT.bring).armR[0]).toBeGreaterThan(at(BEAT.give).armR[0]);
    // never a jump in the arm across the catch's frames
    for (let c = -REACH_S; c < PLANE_CATCH; c += 1 / 120) {
      const a = at(c).armR;
      const b = at(c + 1 / 120).armR;
      expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(0.25);
    }
  });

  it('gives its thumbs up after putting it away, none when an egg follows (thumbs: false)', () => {
    const at = (c: number, thumbs?: boolean) => rig({ ...poseOf('work', { plane: PLANE_FLIGHT + c }), plane: { since: PLANE_FLIGHT + c, ...(thumbs === undefined ? {} : { thumbs }) } }, 5);
    const mid = (BEAT.away + BEAT.thumbs) / 2;
    expect(at(mid).armR[2]).toBeGreaterThan(1.5);
    expect(at(mid).mouth).toBe('laugh');
    expect(at(mid, false).armR[2]).toBeLessThan(0.5);
  });

  it('runs the whole catch inside the timeline\'s plane window', () => {
    expect(PLANE_S).toBeGreaterThanOrEqual(PLANE_FLIGHT + PLANE_CATCH - 1e-9);
  });
});

describe('pose: what its turn does (Activity.doing)', () => {
  const doing = (d: Doing, at: Activity['at'] = 'desk', k: ActivityKind = 'work') => rig(poseOf(k, { act: { doing: d, at } }), 3);

  it('shows each doing kind by its prop', () => {
    expect(doing('think', 'board').props.marker).toBe(true);
    expect(doing('search').props.newspaper).toBe(true);
    expect(doing('computer').props.bigScreen).toBe(true);
    expect(doing('image').props.magnifier).toBe(true);
    expect(doing('publish').props.poster).toBe(true);
    expect(doing('compact').props.shredder).not.toBeNull();
    const b = doing('build');
    expect(b.props.progress).not.toBeNull();
    expect(b.armL[2]).toBeGreaterThan(0.5); // arms crossed
    for (const d of ['edit', 'tool', 'unknown'] as const) expect(doing(d)).toEqual(rig(poseOf('work'), 3));
  });

  it('thinks at its desk when it is not at the whiteboard', () => {
    expect(doing('think', 'desk').props.marker).toBe(false);
  });

  it('loops the moving ones, holds the readers still, and keeps hot sweating', () => {
    for (const d of ['think', 'computer', 'compact', 'build', 'edit', 'tool'] as const) expect(doing(d).motion).toBe('loop');
    for (const d of ['search', 'image', 'publish'] as const) expect(doing(d).motion).toBe('still');
    expect(workLoops({ k: 'hot', at: 'desk', doing: 'search' })).toBe(true);
    expect(doing('search', 'desk', 'hot').props.hot).not.toBeNull();
  });

  it('holds still under reduced motion', () => {
    for (const d of ['think', 'computer', 'compact', 'build'] as const) {
      const p = poseOf('work', { act: { doing: d, at: 'board' } });
      expect(rig(p, 1, true)).toEqual(rig(p, 8.2, true));
      expect(rig(p, 1, true).motion).toBe('still');
    }
  });
});

describe('louder', () => {
  it('walk over loop over still', () => {
    expect(louder('still', 'loop')).toBe('loop');
    expect(louder('loop', 'walk')).toBe('walk');
    expect(louder('still', 'still')).toBe('still');
  });
});

describe('pose: asleep at its desk, the head clear of the laptop (his bug, bims-fix)', () => {
  // a napper with no bean bag built naps at its desk (timeline.ts bedFor): the same pose
  const sleepers: readonly ActivityKind[] = ['sleep', 'waitagent', 'nap'];
  const eggs = (since: number): (BimEgg | null)[] => [
    null,
    { kind: 'lookup', since: 0, dur: Infinity, label: '' },
    { kind: 'stare', since: 0, dur: Infinity, label: '!' },
    ...[0, 0.2, 0.4, 0.6, 0.8].map((u): BimEgg => ({ kind: 'dance', since: since + u * 9, dur: 30, label: '' })),
    // the konami salto (a 1.2 s back flip from the chair, every seated bim) sweeps through its desk by
    // nature: a flip, not the sleep pose; its start and end are the pose itself
    ...[0, 1].map((u): BimEgg => ({ kind: 'salto', since: u * 1.2, dur: 1.2, label: '' })),
  ];
  it('at rest, any time, with every egg a sleeper can get', () => {
    for (const k of sleepers) {
      for (const t of [0, 1.3, 2.7, 5, 9.1]) {
        for (const e of eggs(t)) {
          const r = eggRig(rig(poseOf(k, k === 'nap' ? { act: { at: 'desk' } } : {}), t), e);
          expect(headClearance(r), `${k} at ${String(t)} s, egg ${e?.kind ?? 'none'}`).toBeGreaterThan(0.02);
        }
      }
    }
  });
  it('all through its yawn from work, and through waking back to it', () => {
    for (const k of sleepers) {
      for (let s = 0; s <= 2; s += 0.05) {
        const at = k === 'nap' ? { act: { at: 'desk' as const } } : {};
        expect(headClearance(rig(poseOf(k, { from: 'work', since: s, ...at }), 10 + s)), `${k} from work at +${s.toFixed(2)} s`).toBeGreaterThan(0.02);
        expect(headClearance(rig(poseOf('work', { from: k, since: s }), 10 + s)), `work from ${k} at +${s.toFixed(2)} s`).toBeGreaterThan(0.02);
      }
    }
  });
});

describe('sitting (sit.ts seatedAct, bims-sit)', () => {
  const DOINGS: readonly (Doing | undefined)[] = [undefined, 'think', 'tool', 'edit', 'search', 'computer', 'image', 'publish', 'compact', 'build', 'unknown'];
  it('the timeline sits a bim on its chair exactly when its pose at rest is seated', () => {
    for (const k of KINDS) for (const doing of DOINGS) {
      const act: Activity = { k, at: 'desk', ...(doing ? { doing } : {}) };
      const r = rigOf({ pose: poseOf(k, { act: doing ? { doing } : {} }), t: 20, main: false, phase: 0, reduced: false });
      const seated = r.legL < -1.2 && Math.hypot(r.x - desk.x, r.z - desk.z) < 1e-6;
      expect(seatedAct(act), `${k} ${String(doing)}`).toBe(seated);
    }
  });
});
