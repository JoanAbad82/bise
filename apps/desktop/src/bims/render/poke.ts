// His pokes' bodies (pure, no three): a bim's Rig with the reaction to his click played on top
// (pokes.ts says which, page bims-pokes v4, bims' review m_31312). The state's own pose stays
// under it: a working bim keeps its screen lit, a failed one its cloud (smaller, never gone), a done
// one its sunglasses. The boop squashes about the feet or the seat, the chair spin rolls its chair
// back and turns it with the bim (Rig.seat), a jump keeps its labels still (Rig.anchor). Owner: bims-poke.
import { SPIN_BACK, type PlayKind } from '../pokes';
import type { Rig, Rot } from './pose';

const ease = (u: number): number => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
/** 0 -> 1 -> 0 over the play: in for `a`, out from 1 - `a` */
const env = (u: number, a = 0.2): number => (u < a ? ease(u / a) : u > 1 - a ? ease((1 - u) / a) : 1);
const mix = (a: number, b: number, f: number): number => a + (b - a) * f;
const mix3 = (a: Rot, b: Rot, f: number): Rot => [mix(a[0], b[0], f), mix(a[1], b[1], f), mix(a[2], b[2], f)];
const add = (a: Rot, b: Rot): Rot => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** the way that faces the camera (camera.ts: it looks from +x +z) */
export const CAM = Math.PI / 4;
/** the angle from a to b, the short way round */
const turnTo = (a: number, b: number): number => {
  const d = (((b - a) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  return d;
};
/** sitting (a desk chair, a deck chair): its legs out ahead */
const seated = (r: Rig): boolean => r.legL < -1;

/** it turns to you: a standing bim turns its body, a seated one its head (never through its chair) */
function toYou(r: Rig, e: number): Pick<Rig, 'dir' | 'head'> {
  const d = turnTo(r.dir, CAM);
  if (seated(r)) return { dir: r.dir, head: [r.head[0] * (1 - e), Math.max(-1.1, Math.min(1.1, d)) * e, r.head[2] * (1 - e)] };
  return { dir: r.dir + d * e, head: mix3(r.head, [0, 0, 0], e) };
}

/** a bim's rig with its poke at `since` of `dur` on top */
export function pokeRig(r: Rig, kind: PlayKind, since: number, dur: number): Rig {
  const u = Math.min(1, Math.max(0, since / dur));
  const s = since;
  switch (kind) {
    case 'word':
      // reduced motion: no move, only its word
      return r;
    case 'hi': {
      const e = env(u);
      return { ...r, ...toYou(r, e), armR: mix3(r.armR, [0, 0, 2.5 + Math.sin(s * 13) * 0.35], e), mouth: e > 0.5 ? 'laugh' : 'smile', eyes: e > 0.5 ? 0.3 : r.eyes };
    }
    case 'boop': {
      const q = u < 0.62 ? Math.sin(Math.PI * Math.min(1, u * 1.6)) : -0.25 * Math.sin((Math.PI * (u - 0.62)) / 0.38);
      // sitting: about the seat, and less, so the head never dips into the desk or the lid
      const sit = seated(r);
      return { ...r, squash: { k: sit ? q * 0.55 : q, at: sit ? 0.36 : 0 }, eyes: q > 0.2 ? 0.15 : r.eyes, mouth: q > 0.2 ? 'oh' : r.mouth };
    }
    case 'startle': {
      const e = u < 0.08 ? ease(u / 0.08) : u < 0.55 ? 1 : 1 - ease((u - 0.55) / 0.45);
      const hop = u < 0.15 ? Math.sin((Math.PI * u) / 0.15) * 0.18 : 0;
      return { ...r, y: r.y + hop, anchor: hop, body: mix3(r.body, [-0.15, 0, 0], e), head: mix3(r.head, [-0.25, 0.3, 0], e), armL: mix3(r.armL, [-0.3, 0, 0.9], e), armR: mix3(r.armR, [-0.3, 0, -0.9], e), eyes: e > 0.5 ? 1 : r.eyes, mouth: 'oh', screen: e > 0.5 ? Math.max(r.screen, 0.6) : r.screen };
    }
    case 'snooze': {
      const e = env(u, 0.25);
      return { ...r, armR: mix3(r.armR, [-2.7 + Math.sin(s * 7) * 0.35, 0, -0.25], e), head: mix3(r.head, [0.5, -0.35, 0], e) };
    }
    case 'rollover': {
      const e = env(u, 0.3);
      return { ...r, y: r.y + Math.sin(Math.PI * u) * 0.06, body: [r.body[0], r.body[1], mix(r.body[2], 0.45, e)], head: [r.head[0], mix(r.head[1], -0.5, e), mix(r.head[2], 0.25, e)], armL: mix3(r.armL, [-1.6, 0, -0.2], e), armR: mix3(r.armR, [-0.4, 0, 0.9], e), legL: mix(r.legL, -0.9, e), mouth: e > 0.4 ? 'smile' : 'oh' };
    }
    case 'shoo': {
      const e = env(u);
      return { ...r, armR: mix3(r.armR, [-1.1, 0.4, -0.9 + Math.sin(s * 16) * 0.55], e), head: mix3(r.head, [0.15, 0, 0], e), mouth: 'oh' };
    }
    case 'spin': {
      // rolls back clear of its desk, one full turn with its chair, rolls back in
      const back = SPIN_BACK * (u < 0.2 ? ease(u / 0.2) : u > 0.8 ? 1 - ease((u - 0.8) / 0.2) : 1);
      const turn = 2 * Math.PI * ease((u - 0.2) / 0.6);
      const e = env(u);
      return { ...r, x: r.x - Math.sin(r.dir) * back, z: r.z - Math.cos(r.dir) * back, dir: r.dir + turn, seat: { back, turn }, armL: mix3(r.armL, [0, 0, -1.4], e), armR: mix3(r.armR, [0, 0, 1.4], e), mouth: 'laugh', eyes: 0.3 };
    }
    case 'turbo': {
      const e = env(u, 0.12);
      return { ...r, armL: [-1.2 + Math.sin(s * 45) * 0.3 * e, 0, 0], armR: [-1.2 + Math.sin(s * 45 + 2) * 0.3 * e, 0, 0], body: add(r.body, [0.12 * e, 0, Math.sin(s * 40) * 0.03 * e]), head: add(r.head, [0.25 * e, 0, 0]), mouth: 'oh', eyes: 1, props: { ...r.props, flick: e > 0.3 ? (s * 2.5) % 1 : null } };
    }
    case 'hiccup': {
      const k = (s % 0.63) / 0.63;
      const hic = k < 0.25 ? Math.sin((Math.PI * k) / 0.25) : 0;
      return { ...r, y: r.y + hic * 0.13, anchor: hic * 0.13, body: add(r.body, [-0.15 * hic, 0, 0]), eyes: hic > 0.3 ? 1 : r.eyes, mouth: hic > 0.3 ? 'oh' : r.mouth };
    }
    case 'bite': {
      const e = env(u);
      return { ...r, ...toYou(r, e), armR: mix3(r.armR, [-1.55, 0, -0.15], e), mouth: e > 0.5 ? 'laugh' : r.mouth, eyes: e > 0.5 ? 0.3 : r.eyes };
    }
    case 'meme': {
      const e = env(u, 0.12);
      const jump = Math.abs(Math.sin(s * 9)) * 0.3 * e;
      return { ...r, ...toYou(r, e), y: r.y + jump, anchor: jump, armL: mix3(r.armL, [0, 0, -2.8 + Math.sin(s * 14) * 0.3], e), armR: mix3(r.armR, [0, 0, 2.8 + Math.sin(s * 14 + 1) * 0.3], e), mouth: 'laugh', eyes: 1 };
    }
    case 'watch': {
      const e = env(u);
      const tap = Math.max(0, Math.sin(s * 14));
      return { ...r, ...toYou(r, e), armL: mix3(r.armL, [-1.45, 0, 0.55], e), armR: mix3(r.armR, [-1.35 + tap * 0.18, 0, -0.65], e), mouth: 'oh' };
    }
    case 'shrug': {
      const e = env(u, 0.3);
      return { ...r, armL: mix3(r.armL, [-0.7, 0, 1.0], e), armR: mix3(r.armR, [-0.7, 0, -1.0], e), head: mix3(r.head, [-0.1, 0.25, 0.25], e), y: r.y + 0.04 * e, anchor: 0.04 * e, mouth: 'oh' };
    }
    case 'fine': {
      const e = env(u, 0.3);
      return { ...r, armR: mix3(r.armR, [-2.9, 0, -0.15 + Math.sin(s * 3) * 0.08], e), head: mix3(r.head, [0.5, -0.4, 0], e), mouth: e > 0.5 ? 'smile' : 'oh' };
    }
    case 'brave': {
      // the cloud shrinks to 70%, never gone: the '✗' stays true
      const e = env(u, 0.25);
      const sniff = u > 0.3 && u < 0.5 ? Math.sin((u - 0.3) * 60) * 0.05 : 0;
      return { ...r, body: mix3(r.body, [-0.05, 0, 0], e), head: mix3(r.head, [-0.15 + sniff, 0.35, 0], e), armL: mix3(r.armL, [-1.2, 0, 0], e), armR: mix3(r.armR, [-1.2, 0, 0], e), eyes: e > 0.5 ? 1 : r.eyes, mouth: e > 0.6 ? 'smile' : 'oh', props: { ...r.props, cloud: r.props.cloud * mix(1, 0.7, e) } };
    }
    case 'peek': {
      const e = env(u, 0.25);
      return { ...r, head: mix3(r.head, [0.55, 0.45, 0], e), armR: mix3(r.armR, [-2.3, 0, -0.4], e), props: { ...r.props, glasses: r.props.glasses && !(u > 0.25 && u < 0.78) }, mouth: e > 0.5 ? 'oh' : r.mouth };
    }
    case 'cheers': {
      const e = env(u);
      return { ...r, armR: mix3(r.armR, [-2.5 + Math.sin(s * 10) * 0.12 * e, 0, -0.25], e), mouth: 'laugh', props: { ...r.props, mug: r.props.mug || e > 0.2 } };
    }
    case 'juggle': {
      // at chest height (over its head is the itemget egg's): slips forward, two bounces off its hands, caught against its chest
      const slip = ease(Math.min(1, u / 0.15));
      const b = u > 0.15 && u < 0.75 ? Math.abs(Math.sin((2 * Math.PI * (u - 0.15)) / 0.6)) : 0;
      const catchIn = u > 0.75 ? ease((u - 0.75) / 0.15) * (1 - ease((u - 0.9) / 0.1)) : 0;
      const zf = u < 0.75 ? mix(0.3, 0.46, slip) : mix(0.46, 0.2, ease((u - 0.75) / 0.12));
      const z = u > 0.9 ? mix(0.2, 0.3, ease((u - 0.9) / 0.1)) : zf;
      const w = Math.sin(s * 11) * env(u, 0.15);
      const arm = -1.3 - b * 0.45 - slip * 0.15 * (1 - catchIn);
      return { ...r, body: add(r.body, [0, 0, w * 0.12]), armL: [arm, 0, 0.1 + catchIn * 0.25], armR: [arm, 0, -0.1 - catchIn * 0.25], props: { ...r.props, crate: true, crateUp: false, crateAt: [0.62 - slip * 0.05 + b * 0.24, z] }, mouth: 'oh', eyes: 1 };
    }
    case 'windmill': {
      // on its board: rolling on the flat or resting (pokes.ts waits for it), its line's way kept
      const e = env(u, 0.15);
      return { ...r, armL: [-s * 13 * e, 0, 0.35], armR: [(-s * 13 + Math.PI) * e, 0, -0.35], body: add(r.body, [0, 0, Math.sin(s * 8) * 0.22 * e]), props: { ...r.props, skate: true }, mouth: 'oh', eyes: 1 };
    }
    case 'enough': {
      // arms crossed, turns its back (a seated one turns its head away), then turns back
      const turn = ease(Math.min(1, Math.max(0, (u - 0.1) / 0.3)));
      const back = u > 0.85 ? ease((u - 0.85) / 0.15) : 0;
      const f = turn * (1 - back);
      const crossed = env(u, 0.1);
      const away = seated(r) ? { dir: r.dir, head: [0.1, mix(r.head[1], turnTo(r.dir, CAM + Math.PI) > 0 ? 1.1 : -1.1, f), 0] as Rot } : { dir: r.dir + turnTo(r.dir, CAM + Math.PI) * f, head: [0.1, 0, 0] as Rot };
      return { ...r, ...away, armL: mix3(r.armL, [-1.2, 0, 0.9], crossed), armR: mix3(r.armR, [-1.2, 0, -0.9], crossed), mouth: 'oh' };
    }
  }
}
