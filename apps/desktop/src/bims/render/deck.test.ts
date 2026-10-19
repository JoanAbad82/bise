// The deck chair law (bims-chair, found by plane-catch): a done bim reclines only on a deck chair the
// stage has built. Past the terrace's chair count (growth.ts chairsAt) the done bims lay back in
// mid-air on their spots, a shadow on the grass and no chair. For every ready map, every stage and
// 0 to 31 done bims: each bim the timeline gives the reclined pose (pose.ts 'done') has its hips
// (its rig's point, lifted by its pose) on the seat of a chair stages.ts deckChairs draws (chairBoxes);
// the others stand at their spot, a mug in hand.
import { describe, expect, it } from 'vitest';
import { crowd } from '../fixtures';
import { readyMaps, layoutOf } from '../maps';
import { builtAt, LAST_STAGE } from '../growth';
import type { Activity, Office } from '../model';
import { CHAT_TURN, newTimeline } from '../timeline';
import { rigOf } from './pose';
import { chairBoxes, seatOf } from './stages';

const DONE: Activity = { k: 'done', at: 'terrace' };
const MAIN: Activity = { k: 'main', at: 'main' };
/** what the hips may miss the seat by (float noise; the cloth is 0.05 thick) */
const SLACK = 0.03;

/** each reclined bim whose hips are not on a drawn deck chair's seat, at this stage with n done bims */
function floating(o: Office, stage: number, n: number): string[] {
  const tl = newTimeline();
  const acts = new Map<string, Activity>([['main', MAIN]]);
  for (let i = 1; i <= n; i++) acts.set(`agent-${String(i)}`, DONE);
  tl.update(acts, o, 10, [], builtAt(stage));
  const seats = chairBoxes(o, stage).flatMap((b) => (b ? [seatOf(b)] : []));
  const out: string[] = [];
  for (let i = 1; i <= n; i++) {
    const name = `agent-${String(i)}`;
    const pose = tl.poseAt(name, 60);
    if (!pose || pose.moving) continue;
    if (pose.seg.act.k !== 'done') continue;
    const r = rigOf({ pose, t: 60, main: false, phase: 1.3, reduced: false });
    // the reclined pose: its body tipped back onto the backrest
    if (r.body[0] > -0.5) continue;
    const on = seats.some((s) => r.x >= s.x0 - SLACK && r.x <= s.x1 + SLACK && r.z >= s.z0 - SLACK && r.z <= s.z1 + SLACK && Math.abs(r.y - s.y) <= SLACK + 0.03);
    if (!on) out.push(`stage ${String(stage)}, ${String(n)} done: ${name} reclines at (${r.x.toFixed(2)},${r.y.toFixed(2)},${r.z.toFixed(2)}) on no chair`);
  }
  return out;
}

/** one event-loop turn (lying.test.ts: vitest reads its RPC replies only between macrotasks) */
const turn = (): Promise<void> => new Promise((done) => { setTimeout(done, 0); });

describe('the deck chair law: a done bim reclines only on a drawn deck chair', () => {
  for (const id of readyMaps()) {
    it(`${id}: stages 0..${String(LAST_STAGE)}, 0..31 done bims`, async () => {
      const out: string[] = [];
      for (let n = 0; n <= 31; n++) {
        const o = layoutOf(crowd(n).agents, id);
        for (let stage = 0; stage <= LAST_STAGE; stage++) out.push(...floating(o, stage, n));
        await turn();
      }
      expect(out.slice(0, 10)).toEqual([]);
    }, 60_000);
  }

  it('past the chairs, a done bim stands at its spot with a mug: neighbours on a pair of spots turn to each other, a lone one faces the view', () => {
    const o = layoutOf(crowd(5).agents, readyMaps()[0]);
    const tl = newTimeline();
    const acts = new Map<string, Activity>([['main', MAIN]]);
    for (let i = 1; i <= 5; i++) acts.set(`agent-${String(i)}`, DONE);
    tl.update(acts, o, 10, [], builtAt(2));
    const standing = [1, 2, 3, 4, 5].flatMap((i) => tl.poseAt(`agent-${String(i)}`, 60) ?? []).filter((p) => p.seg.act.standing === true);
    expect(standing).toHaveLength(4);
    // stage 2: one chair (spot 0); standing on 1 (its mate reclines), 2 and 3 (a pair), 4 (its mate's spot empty)
    const dirs = new Map<number, number>();
    for (const p of standing) {
      const r = rigOf({ pose: p, t: 60, main: false, phase: 1.3, reduced: false });
      expect(r.props.mug).toBe(true);
      expect(r.body[0]).toBe(0);
      dirs.set(o.terrace.findIndex((t) => t.x === p.seg.spot.x && t.z === p.seg.spot.z), r.dir);
    }
    expect([...dirs.keys()].sort()).toEqual([1, 2, 3, 4]);
    expect(dirs.get(1)).toBe(0);
    expect(dirs.get(4)).toBe(0);
    expect(dirs.get(2)).toBeCloseTo(CHAT_TURN);
    expect(dirs.get(3)).toBeCloseTo(-CHAT_TURN);
    // the same rows again: nobody moves (the looks keep their segments)
    const names = [...acts.keys()];
    const before = names.map((n) => tl.poseAt(n, 60)?.seg);
    tl.update(acts, o, 70, [], builtAt(2));
    names.forEach((n, i) => { expect(tl.poseAt(n, 70)?.seg, n).toBe(before[i]); });
    expect(tl.moving(70)).toBe(false);
  });
});
