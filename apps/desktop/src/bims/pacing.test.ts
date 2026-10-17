// The office's pace (Gabriel and Lucas, bims-life: « ils marchent un peu trop souvent par rapport au
// moment où ils font des trucs », and at the bar they left too soon). An hour of an office whose
// bims are all idle, on the timeline as Office.tsx runs it (a snapshot a second): the share of each
// bim's time spent walking stays under WALK_MAX, its trips to the island last SNACK_MIN s at least,
// and it walks a few times an hour, never every minute. `pace` is the numbers the check reads.
import { describe, expect, it } from 'vitest';
import { activities, SNACK_MIN, SNACK_SPREAD } from './activity';
import { agent, mainAgent, snap } from './fixtures';
import { layoutOf } from './maps';
import { bedsAt, LAST_STAGE } from './growth';
import { newTimeline } from './timeline';

/** the share of an idle bim's time it may walk */
const WALK_MAX = 0.08;

interface Pace {
  /** of all the bims' seconds, the share walking */
  readonly walking: number;
  /** walks started, per bim per hour */
  readonly walksPerHour: number;
  /** each stay at the island, s (arrived to leaving) */
  readonly snacks: readonly number[];
}

/** `secs` of an office of `n` idle bims, sampled each second */
export function pace(n: number, secs: number): Pace {
  const s = snap([mainAgent({ status: 'idle' }), ...Array.from({ length: n }, (_, i) => agent(`idle-${String(i + 1)}`, { status: 'idle' }))]);
  const o = layoutOf(s.agents);
  const tl = newTimeline();
  const names = s.agents.filter((a) => !a.main).map((a) => a.name);
  let walk = 0;
  let all = 0;
  let walks = 0;
  const snacks: number[] = [];
  const at = new Map<string, number>();
  const was = new Map<string, boolean>();
  for (let t = 0; t <= secs; t++) {
    tl.update(activities(s, t), o, t, [], bedsAt(LAST_STAGE));
    for (const name of names) {
      const p = tl.poseAt(name, t);
      if (!p) continue;
      all++;
      if (p.moving) walk++;
      if (p.moving && was.get(name) === false) walks++;
      was.set(name, p.moving);
      const eating = p.seg.act.k === 'snack' && !p.moving;
      const since = at.get(name);
      if (eating && since === undefined) at.set(name, t);
      if (!eating && since !== undefined) {
        // a stay cut by the hour's start or end is not counted
        if (since > 0) snacks.push(t - since);
        at.delete(name);
      }
    }
  }
  return { walking: walk / all, walksPerHour: (walks / names.length) * (3600 / secs), snacks };
}

describe('pacing: long stays, few walks', () => {
  it(`an idle hour: under ${String(WALK_MAX * 100)}% of the time walking, a few walks an hour, ${String(SNACK_MIN)} s at least at the island`, () => {
    for (const n of [4, 12]) {
      const p = pace(n, 3600);
      expect(p.walking, `${String(n)} bims: the share walking`).toBeLessThan(WALK_MAX);
      expect(p.walksPerHour, `${String(n)} bims: walks per bim per hour`).toBeLessThanOrEqual(2 * (3600 / 240) + 1);
      expect(p.snacks.length).toBeGreaterThan(0);
      for (const d of p.snacks) {
        expect(d).toBeGreaterThanOrEqual(SNACK_MIN - 6);
        expect(d).toBeLessThanOrEqual(SNACK_MIN + SNACK_SPREAD);
      }
    }
  });
});
