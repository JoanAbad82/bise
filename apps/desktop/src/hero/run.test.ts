// The film replays: its first loop's every bim (where it stands, what it does, its egg) is its
// second loop's, frame for frame, and the score's beats land on the poses they were written for.
import { describe, expect, it } from 'vitest';
import { FILM_S } from './cast';
import { advance, makeRuns, stepOf } from './run';
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

  it('lands its beats: the coffee, the moonwalk back, the lands, the clap', () => {
    const runs = makeRuns();
    const at = (T: number, office: string, name: string) => {
      for (const r of runs) advance(r, ORIGIN + T, false, false);
      const r = runs.find((x) => x.cast.id === office);
      return r ? stepOf(r, false, false)?.played.find((f) => f.name === name) : undefined;
    };
    expect(at(2 * 60 + 13, 'acme-web', 'checkout')?.egg?.kind).toBe('stare');
    expect(at(2 * 60 + 31.2, 'acme-web', 'checkout')?.pose.seg.act.k).toBe('coffee');
    const back = at(2 * 60 + 38, 'acme-web', 'checkout');
    expect(back?.pose.moving).toBe(true);
    expect(back?.egg?.kind).toBe('moonwalk');
    expect(at(3 * 60 + 9, 'harness', 'dark-mode')?.pose.seg.act.k).toBe('done');
    expect(at(4 * 60 + 6, 'bise.dev', 'main')?.egg?.kind).toBe('clap');
  });
});
