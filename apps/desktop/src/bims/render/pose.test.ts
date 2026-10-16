import { describe, expect, it } from 'vitest';
import type { Activity, ActivityKind, Doing, Path, Pose, Segment, Spot } from '../model';
import { FADE, PLANE_CATCH, PLANE_FLIGHT, louder, placeOf, rigOf, transitionOf, workLoops } from './pose';

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

  it('loops only typing and the "?" hops; the other poses are still (model.ts Motion)', () => {
    const loops = new Set(KINDS.filter((k) => rig(poseOf(k), 5).motion === 'loop'));
    expect([...loops].sort()).toEqual(['asks', 'hot', 'main', 'work']);
    for (const k of KINDS) if (!loops.has(k)) expect(rig(poseOf(k), 5).motion).toBe('still');
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
    expect(reading.props.plane).toBe(true);
    expect(reading.motion).toBe('walk');
    expect(rig(poseOf('sleep', { plane: PLANE_FLIGHT + PLANE_CATCH + 0.1 }), 5).motion).toBe('still');
  });

  it('draws no plane under reduced motion', () => {
    expect(rig(poseOf('sleep', { plane: 0.5 }), 5, true).motion).toBe('still');
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
