// The film replays: its first loop's every bim (where it stands, what it does, its egg) is its
// second loop's, frame for frame, and the score's beats land on the poses they were written for.
import { describe, expect, it } from 'vitest';
import { FILM_S, KILN, REVIEWER } from './cast';
import { advance, FEED_X, makeRuns, stepOf } from './run';
import { ORIGIN } from './world';

/** every bim of every office at each 0.25 s of film time, from world time `from` for one loop */
function play(from: number, runs = makeRuns()): Map<number, string> {
  const out = new Map<number, string>();
  for (let k = 0; k < FILM_S * 4; k++) {
    const t = from + k / 4;
    const row: string[] = [];
    for (const r of runs) {
      advance(r, t, false, false);
      for (const f of stepOf(r, false, false)?.played ?? []) {
        row.push(`${r.cast.id}/${f.name}:${f.pose.seg.act.k}:${f.pose.x.toFixed(3)},${f.pose.z.toFixed(3)}:${f.egg?.kind ?? ''}`);
      }
    }
    out.set(k, row.join('|'));
  }
  return out;
}

describe('the hero film', () => {
  it('plays the same loop twice: every bim where it was, doing what it did', () => {
    const runs = makeRuns();
    const one = play(ORIGIN, runs);
    const two = play(ORIGIN + FILM_S, runs);
    const diff = [...one].filter(([k, v]) => two.get(k) !== v).map(([k]) => k / 4);
    expect(diff).toEqual([]);
  });

  it('lands its beats in the office brains (bims-film v13): planes, pops at the desk, visits, the queue, the stamp', () => {
    const runs = makeRuns();
    const at = (T: number, name: string) => {
      for (const r of runs) advance(r, ORIGIN + T, false, false);
      const r = runs.find((x) => x.cast.id === KILN);
      return r ? stepOf(r, false, false)?.played.find((f) => f.name === name) : undefined;
    };
    // his first plane: 3 s with a loop, from the feed; the next ones 1.6 s, straight
    expect(at(5, 'main')?.pose.plane).toMatchObject({ dur: 3, loops: 1, startX: FEED_X });
    expect(at(8.5, 'main')?.pose.plane).toMatchObject({ dur: 1.6, loops: 0 });
    // an agent pops at its desk, never walking in by the door
    const catalog = at(8.05, 'catalog');
    expect(catalog?.pose.moving).toBe(false);
    expect(catalog?.pose.seg.act.at).toBe('desk');
    // the visits: there before their bubbles
    expect(at(17.6, 'checkout')?.pose.seg.act.k).toBe('visit');
    expect(at(37.2, 'order-test')?.pose.seg.act.k).toBe('visit');
    expect(at(39.2, 'order-test')?.egg?.kind).toBe('hop');
    // checkout's crate at main by 0:46, every other one by 0:50
    expect(at(46.1, 'checkout')).toMatchObject({ pose: { moving: false, seg: { act: { k: 'landing' } } } });
    for (const n of ['catalog', 'cart', 'emails', 'theme', 'order-test']) expect(at(50.2, n)).toMatchObject({ pose: { moving: false, seg: { act: { k: 'landing' } } } });
    // the reviewer beside the first crate, its stamp; main's crate over its head
    const review = at(51, REVIEWER);
    expect(review?.egg?.kind).toBe('stamp');
    expect(review?.pose.moving).toBe(false);
    expect(at(53, 'main')?.egg?.kind).toBe('itemget');
  });
});
