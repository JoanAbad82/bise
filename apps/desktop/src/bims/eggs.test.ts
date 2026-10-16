import { describe, expect, it } from 'vitest';
import { agent, frame, mainAgent } from './fixtures';
import { clearAt, eggLabels, eggsAt, konamiDone, KONAMI, MAX_ROLLED, noteLands, officeEggs, rolls, withForced, NO_EGGS, type EggIn, type Local } from './eggs';
import type { Activity, BimFrame } from './model';

const done: Activity = { k: 'done', at: 'terrace' };
const work: Activity = { k: 'work', at: 'desk' };
const nap: Activity = { k: 'nap', at: 'lounge' };
// a tuesday, 11:00
const TUE: Local = { y: 2026, mo: 3, d: 10, dow: 2, s: 11 * 3600 };
const base = (frames: BimFrame[], o: Partial<EggIn> = {}): EggIn => ({
  t: 1000, frames, agents: [mainAgent(), ...frames.filter((f) => !f.main).map((f) => agent(f.name))], cards: 1, local: TUE, night: false, reduced: false, lands: [], konami: null, ...o,
});
/** the first key of a done segment (by its start) whose salto roll comes up, for a fixed name */
const saltoAt = (name: string): number => {
  for (let t = 1; t < 5000; t++) if (rolls('salto', `${name}@${t.toFixed(3)}`, 10)) return t;
  throw new Error('no roll');
};

describe('the easter eggs scheduler (eggs.ts)', () => {
  it('rolls are replayable: the same segment gets the same egg every time', () => {
    const t0 = saltoAt('perf');
    const f = [frame('perf', done, { t: t0, from: 'work' })];
    const a = eggsAt(base(f, { t: t0 + 0.3 }));
    const b = eggsAt(base(f, { t: t0 + 0.3 }));
    expect(a.bims.get('perf')?.kind).toBe('salto');
    expect(b.bims.get('perf')).toEqual(a.bims.get('perf'));
    // over after its 0.9 s
    expect(eggsAt(base(f, { t: t0 + 2 })).bims.get('perf')).toBeUndefined();
  });

  it('the state pose wins: nothing on a working bim, reduced motion none at all', () => {
    const f = [frame('perf', work, { t: 10, from: 'nap' })];
    expect(eggsAt(base(f, { t: 10.2 })).bims.size).toBe(0);
    const t0 = saltoAt('perf');
    expect(eggsAt(base([frame('perf', done, { t: t0, from: 'work' })], { t: t0 + 0.3, reduced: true })).bims.size).toBe(0);
  });

  it('m3 speedrun: done under 2 min after it came, its time over its head', () => {
    const born = 1_000_000;
    const f = [frame('quick', done, { t: (born + 107_000) / 1000, from: 'work' })];
    const e = eggsAt(base(f, { t: (born + 108_000) / 1000, agents: [mainAgent(), agent('quick', { created_ms: born })] }));
    expect(e.bims.get('quick')).toMatchObject({ kind: 'speedrun', label: '1:47' });
  });

  it('m6 the day\'s first land, m8 the 4th: main says line clear', () => {
    const f = [frame('a', done, { t: 50, from: 'landing' }), frame('main', { k: 'main', at: 'main' }, { main: true })];
    const lands = noteLands({ day: '', lands: [] }, f, TUE).lands;
    expect(lands).toEqual([{ name: 'a', t: 50 }]);
    expect(eggsAt(base(f, { t: 51, lands })).bims.get('a')).toMatchObject({ kind: 'itemget', label: '♪ ♪ ♪' });
    const four = [1, 2, 3, 4].map((i) => ({ name: `x${String(i)}`, t: 100 + i }));
    expect(eggsAt(base(f, { t: 105, lands: four })).bims.get('main')).toMatchObject({ kind: 'tetris', label: 'line clear' });
    // a new day starts empty
    expect(noteLands({ day: '2026-3-9', lands: four }, [], TUE).lands).toEqual([]);
  });

  it('p4 the stare: two agents waiting on each other, a "!" over both', () => {
    const f = [frame('a', { k: 'waitagent', at: 'desk', on: 'b' }), frame('b', { k: 'waitagent', at: 'desk', on: 'a' })];
    const agents = [mainAgent(), agent('a', { waiting_on: { who: 'agent', name: 'b' } }), agent('b', { waiting_on: { who: 'agent', name: 'a' } })];
    const e = eggsAt(base(f, { agents }));
    expect(eggLabels(e)).toEqual(new Map([['a', '!'], ['b', '!']]));
  });

  it('p1 combo: the 2nd done agent of a place, over its arrival', () => {
    const f = [frame('a', done, { t: 10, from: 'work' }), frame('b', done, { t: 20, from: 'work' })];
    const agents = [mainAgent(), agent('a', { place_id: 'wt:x' }), agent('b', { place_id: 'wt:x' })];
    expect(eggsAt(base(f, { t: 21, agents })).bims.get('b')).toMatchObject({ kind: 'combo', label: 'combo ×2' });
  });

  it('n1 stage clear: every other agent done or idle and the inbox empty, main claps', () => {
    const f = [frame('main', { k: 'mainidle', at: 'main' }, { main: true, t: 0 }), frame('a', done, { t: 40, from: 'work' }), frame('b', nap, { t: 5 })];
    expect(clearAt(f, 1)).toBeNull();
    expect(clearAt(f, 0)).toBe(40);
    expect(eggsAt(base(f, { t: 41, cards: 0 })).bims.get('main')?.kind).toBe('clap');
    expect(clearAt([...f, frame('c', work)], 0)).toBeNull();
  });

  it('at most MAX_ROLLED rolled eggs at once, the newest first', () => {
    const names = ['a', 'b', 'c', 'd'];
    const f = names.map((n) => frame(n, done, { t: saltoAt(n), from: 'work' }));
    // every one in its salto at the same t: move each start so they overlap
    const t = Math.max(...f.map((x) => x.pose.seg.t)) + 0.1;
    const overlapping = f.filter((x) => t - x.pose.seg.t < 0.9);
    const e = eggsAt(base(f, { t }));
    expect(e.bims.size).toBeLessThanOrEqual(Math.min(MAX_ROLLED, overlapping.length));
  });

  it('the konami code: every bim flips, "+30" over main', () => {
    expect(konamiDone([...KONAMI])).toBe(true);
    expect(konamiDone(['x', ...KONAMI.slice(1)])).toBe(false);
    const f = [frame('main', { k: 'main', at: 'main' }, { main: true }), frame('a', work)];
    const e = eggsAt(base(f, { t: 10.5, konami: 10 }));
    expect([...e.bims.values()].map((x) => x.kind)).toEqual(['salto', 'salto']);
    expect(eggLabels(e)).toEqual(new Map([['main', '+30']]));
  });

  it('the dates: the tree, april fools, the cake, friday shades, the ghost at night only', () => {
    expect(officeEggs({ local: { ...TUE, mo: 12, d: 24 }, night: false, agents: [] }, false).tree).toBe(true);
    expect(officeEggs({ local: { ...TUE, mo: 4, d: 1 }, night: false, agents: [] }, false).april).toBe(true);
    const first = new Date(2024, 2, 10).getTime();
    expect(officeEggs({ local: TUE, night: false, agents: [agent('a', { created_ms: first })] }, false).cake).toBe(true);
    expect(officeEggs({ local: { ...TUE, y: 2024 }, night: false, agents: [agent('a', { created_ms: first })] }, false).cake).toBe(false);
    expect(officeEggs({ local: { ...TUE, s: 5 }, night: true, agents: [] }, false).ghost).toBeCloseTo(0.25);
    expect(officeEggs({ local: { ...TUE, s: 5 }, night: false, agents: [] }, false).ghost).toBeNull();
    const fri = { ...TUE, dow: 5, s: 17 * 3600 + 60 };
    expect(eggsAt(base([frame('a', nap)], { local: fri })).bims.get('a')?.kind).toBe('shades');
    expect(eggsAt(base([frame('a', work)], { local: fri })).bims.get('a')).toBeUndefined();
  });

  it("a check's forced eggs replace the rolls, with their words", () => {
    const e = withForced(NO_EGGS, { bims: { a: { kind: 'speedrun', since: 1 }, b: { kind: 'salto', since: 0.4 } }, office: { eclipse: true } });
    expect(e.bims.get('a')).toMatchObject({ kind: 'speedrun', label: '1:47' });
    expect(e.bims.get('b')?.since).toBe(0.4);
    expect(e.office.eclipse).toBe(true);
  });
});
