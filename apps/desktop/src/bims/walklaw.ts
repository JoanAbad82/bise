// les bims' walking law, as a check (tests only, never the app's runtime): a seeded simulated
// office on one map with n bims for a stretch of time (random activities, messages, reports,
// leaves and returns, skaters on a park), fed to the real timeline, sampled every 50 ms. It counts
// two bims closer than two body radii while one of them walks, and a walking bim whose middle is
// inside a piece of furniture (but the bed or deck chair it walks into or out of). Pure: the same
// seed gives the same counts.
import { agent, mainAgent } from './fixtures';
import { layoutOf } from './maps';
import type { MapId } from './maps/ids';
import type { Activity, BimEvent, Box, Office, Pose } from './model';
import { BODY_R } from './avoid';
import { newTimeline } from './timeline';

/** what one run found: the first few breaks, each said in a line */
export interface LawRun {
  readonly close: number;
  readonly inside: number;
  readonly samples: number;
  readonly first: readonly string[];
}

const DT = 0.05;

/** n bims (main and n-1 others) on `map` for `seconds`, the seed's activities */
export function walkLaw(map: MapId, n: number, seconds: number, seed: number, spy?: (tl: ReturnType<typeof newTimeline>, t: number) => void): LawRun {
  const rnd = mulberry(seed);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)] as T;
  const names = Array.from({ length: Math.max(0, n - 1) }, (_, i) => `a${String(i + 1)}`);
  const crew = [mainAgent(), ...names.map((x) => agent(x))];
  const office = layoutOf(crew, map);
  const tl = newTimeline();
  const acts = new Map<string, Activity>([['main', { k: 'main', at: 'main' }]]);
  for (const x of names) acts.set(x, { k: 'work', at: 'desk' });
  const gone = new Set<string>();
  let queue: string[] = [];
  let key = 0;
  const T0 = 1000;
  const fun = map === 'california' ? { stage: 13, jobs: 120, dow: 1, day: 20000, reduced: false } : undefined;
  let t = T0;
  tl.update(new Map(acts), office, t, [], undefined, fun);
  let close = 0;
  let inside = 0;
  let samples = 0;
  const first: string[] = [];
  const say = (s: string): void => {
    if (first.length < 8) first.push(s);
  };
  while (t < T0 + seconds) {
    const next = t + 0.5 + rnd() * 5;
    // sample until the next change
    for (let s = t; s < next; s += DT) {
      const poses = tl.names(s).map((name) => ({ name, p: tl.poseAt(name, s) })).filter((x): x is { name: string; p: Pose } => x.p !== null);
      samples++;
      for (let i = 0; i < poses.length; i++) {
        const a = poses[i] as { name: string; p: Pose };
        if (a.p.moving && inBox(office, a.p)) {
          inside++;
          say(`${map}/${String(n)} t=${(s - T0).toFixed(2)} ${a.name} inside furniture at ${a.p.x.toFixed(2)},${a.p.z.toFixed(2)}`);
        }
        for (let j = i + 1; j < poses.length; j++) {
          const b = poses[j] as { name: string; p: Pose };
          if (!a.p.moving && !b.p.moving) continue;
          const d = Math.hypot(a.p.x - b.p.x, a.p.z - b.p.z);
          if (d < 2 * BODY_R - 1e-6) {
            close++;
            const tag = (p: Pose): string => `${p.seg.act.k}${p.moving ? '' : '.'}@${(p.seg.t - T0).toFixed(2)}`;
            say(`${map}/${String(n)} t=${(s - T0).toFixed(2)} ${a.name}(${tag(a.p)}) ~ ${b.name}(${tag(b.p)}) ${d.toFixed(2)} at ${a.p.x.toFixed(2)},${a.p.z.toFixed(2)}`);
          }
        }
      }
    }
    t = next;
    // 1 to 3 bims change what they do
    const events: BimEvent[] = [];
    const turns = 1 + Math.floor(rnd() * 3);
    for (let k = 0; k < turns && names.length > 0; k++) {
      const who = pick(names);
      const r = rnd();
      if (gone.has(who)) {
        if (r < 0.5) {
          gone.delete(who);
          acts.set(who, { k: 'starting', at: 'door' });
        }
        continue;
      }
      queue = queue.filter((x) => x !== who);
      if (r < 0.05) {
        gone.add(who);
        acts.delete(who);
        continue;
      }
      const a: Activity =
        r < 0.3 ? { k: pick(['work', 'hot', 'sleep', 'waitagent', 'asks', 'blocked', 'failed', 'stopped'] as const), at: 'desk' }
        : r < 0.45 ? { k: 'nap', at: 'lounge' }
        : r < 0.6 ? { k: 'snack', at: 'island', key: key++ }
        : r < 0.7 ? { k: 'landing', at: 'queue', rank: 1 }
        : r < 0.8 ? { k: 'done', at: 'terrace' }
        : r < 0.85 ? { k: 'starting', at: 'door' }
        : { k: 'work', at: 'desk' };
      if (a.k === 'landing') queue.push(who);
      acts.set(who, a);
    }
    // the land queue's ranks, in order
    queue.forEach((x, i) => acts.set(x, { k: 'landing', at: 'queue', rank: i + 1 }));
    if (rnd() < 0.4 && names.length > 1) {
      const live = names.filter((x) => !gone.has(x));
      const from = pick(live);
      const to = pick(live);
      if (rnd() < 0.3) events.push({ kind: 'report', agent: from, report: 'progress', t });
      else if (from !== to) events.push({ kind: 'message', from: { who: 'agent', name: from }, to: { who: 'agent', name: to }, mode: rnd() < 0.5 ? 'queued' : 'steer', expectsReply: false, t });
    }
    const main = rnd() < 0.2 ? { k: rnd() < 0.5 ? 'main' : 'mainidle', at: 'main' } as const : acts.get('main');
    if (main) acts.set('main', main);
    tl.update(new Map(acts), office, t, events, undefined, fun);
    spy?.(tl, t);
  }
  return { close, inside, samples, first };
}

/** a walking bim's middle inside a piece of furniture that is not the bed it walks into or out of */
function inBox(o: Office, p: Pose): boolean {
  const start = p.seg.path.pts[0];
  // its bed or deck chair: the one it walks to, or the one it walks out of (it starts inside it)
  const mine = (b: Box): boolean => b.of !== undefined && (near(b.of, p.seg.spot) || (start !== undefined && start.x > b.x0 && start.x < b.x1 && start.z > b.z0 && start.z < b.z1));
  return o.furniture.some((b) => !mine(b) && p.x > b.x0 + 0.02 && p.x < b.x1 - 0.02 && p.z > b.z0 + 0.02 && p.z < b.z1 - 0.02);
}

const near = (a: { x: number; z: number }, b: { x: number; z: number }): boolean => Math.hypot(a.x - b.x, a.z - b.z) < 1e-3;

function mulberry(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
