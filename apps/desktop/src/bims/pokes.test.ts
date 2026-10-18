import { describe, expect, it } from 'vitest';
import { frame } from './fixtures';
import { CALM_S, DOUBLE_S, ENOUGH_IN_S, NO_POKES, POKES, WEIGHTS, WORD_S, forcedPokes, notePokes, pokeOf, pokesAt, pokeWake, situationOf, spinRoom, wordAt, type Poke, type Room, type Situation } from './pokes';
import { labelsOf } from './labels';
import type { Activity, BimFrame, Office, PokeKind } from './model';

const work: Activity = { k: 'work', at: 'desk' };
const roomy: Room = { spins: () => true };
const cramped: Room = { spins: () => false };
const click = (name: string, t: number) => ({ name, t });
/** n clicks on one bim, each `gap` s apart, in one situation: the reactions */
function run(sit: Situation, n: number, gap = 5, name = 'ada', spins = true): (PokeKind | null)[] {
  const out: (PokeKind | null)[] = [];
  let before: Poke[] = [];
  for (let i = 0; i < n; i++) {
    const p = pokeOf(before, click(name, 100 + i * gap), sit, spins);
    out.push(p?.kind ?? null);
    if (p !== null) before = [...before, p];
  }
  return out;
}

describe('his pokes (pokes.ts)', () => {
  it('every situation picks only its own reactions, about its weights, never the same twice in a row', () => {
    for (const sit of Object.keys(WEIGHTS) as Situation[]) {
      const kinds = run(sit, 400, 5);
      const own = new Set(WEIGHTS[sit].map(([k]) => k));
      for (const k of kinds) expect(own.has(k as PokeKind), `${sit}: ${String(k)}`).toBe(true);
      // never twice in a row with 3+ to pick from; with 2, only boop never repeats
      for (let i = 1; i < kinds.length; i++) if (WEIGHTS[sit].length > 2 || kinds[i] === 'boop') expect(kinds[i], `${sit} #${String(i)}`).not.toBe(kinds[i - 1]);
      // each reaction comes up, the heaviest more often than the lightest
      const count = (k: PokeKind | undefined) => kinds.filter((x) => x === k).length;
      for (const k of own) expect(count(k), `${sit}: ${k}`).toBeGreaterThan(0);
      const w = WEIGHTS[sit];
      if ((w[0]?.[1] ?? 0) > (w[w.length - 1]?.[1] ?? 0)) expect(count(w[0]?.[0]), sit).toBeGreaterThan(count(w[w.length - 1]?.[0]));
    }
  });

  it('boop stays rare: over 1000 pokes, its share is its weight ±5% in every situation (bims m_31365)', () => {
    for (const sit of Object.keys(WEIGHTS) as Situation[]) {
      const w = WEIGHTS[sit];
      const b = w.find(([k]) => k === 'boop')?.[1];
      if (b === undefined) continue;
      const share = run(sit, 1000).filter((k) => k === 'boop').length / 1000;
      expect(Math.abs(share - b / w.reduce((n, [, x]) => n + x, 0)), `${sit}: ${String(share)}`).toBeLessThanOrEqual(0.05);
    }
  });

  it('is replayable: the same clicks give the same reactions (hash of name and n, never Math.random)', () => {
    expect(run('work', 30)).toEqual(run('work', 30));
    expect(run('work', 30, 5, 'ada')).not.toEqual(run('work', 30, 5, 'bob'));
  });

  it("no boop on a failed bim; a '?' bim is never told to hurry (no watch); boop is the rare one", () => {
    expect(run('failed', 200)).not.toContain('boop');
    expect(run('asks', 200)).not.toContain('watch');
    const boops = run('work', 400).filter((k) => k === 'boop').length;
    expect(boops).toBeLessThan(400 / 6);
  });

  it('a double-click is one poke, never two', () => {
    const a = pokeOf([], click('ada', 100), 'work');
    expect(a).not.toBeNull();
    expect(pokeOf([a as Poke], click('ada', 100 + DOUBLE_S / 2), 'work')).toBeNull();
  });

  it("his 3rd poke in 2.5 s is 'ok, enough', then 10 s of boop only (nothing on a failed bim)", () => {
    const k = run('work', 3, 1);
    expect(k[2]).toBe('enough');
    const g = ENOUGH_IN_S / 2 - 0.01;
    expect(run('work', 3, g)[2]).toBe('enough');
    // spread out: never
    expect(run('work', 10, ENOUGH_IN_S / 2 + 0.1)).not.toContain('enough');
    // after it: clicks while it turns its back do nothing, then boop only for CALM_S
    let before: Poke[] = [];
    for (const t of [100, 101, 102]) {
      const p = pokeOf(before, click('ada', t), 'work');
      if (p) before = [...before, p];
    }
    expect(before.at(-1)?.kind).toBe('enough');
    expect(pokeOf(before, click('ada', 103), 'work')).toBeNull();
    const calm = 102 + POKES.enough.dur + 1;
    expect(pokeOf(before, click('ada', calm), 'work')?.kind).toBe('boop');
    expect(pokeOf(before, click('ada', calm), 'failed')).toBeNull();
    expect(pokeOf(before, click('ada', 102 + POKES.enough.dur + CALM_S + 0.1), 'work')?.kind).not.toBe('enough');
  });

  it('no room behind its chair: no chair spin, shoo instead', () => {
    expect(run('work', 300, 5, 'ada', false)).not.toContain('spin');
    expect(run('work', 300, 5, 'ada', true)).toContain('spin');
  });

  it('situations by state: asleep, napping in a bean bag, at its desk, walking, skating', () => {
    expect(situationOf(frame('a', { k: 'sleep', at: 'desk' }))).toBe('sleep');
    expect(situationOf(frame('a', { k: 'waitagent', at: 'desk' }))).toBe('sleep');
    expect(situationOf(frame('a', { k: 'nap', at: 'lounge' }))).toBe('nap');
    expect(situationOf(frame('a', { k: 'nap', at: 'desk' }))).toBe('sleep');
    expect(situationOf(frame('a', { k: 'main', at: 'main' }, { main: true }))).toBe('work');
    expect(situationOf(frame('a', { k: 'done', at: 'terrace' }))).toBe('done');
    expect(situationOf(frame('a', { k: 'done', at: 'terrace' }, { moving: true }))).toBe('about');
    expect(situationOf(frame('a', { k: 'failed', at: 'desk' }, { moving: true }))).toBe('failed');
    expect(situationOf(frame('a', { k: 'mainidle', at: 'main' }, { main: true }))).toBe('about');
  });

  it("the state wins: a poke stops when the bim's situation changes", () => {
    const f = [frame('ada', work)];
    const log = notePokes(NO_POKES, [click('ada', 100)], f, roomy);
    const p = log.by.get('ada')?.[0];
    expect(p).toBeDefined();
    expect(pokesAt(log, f, 100.2, false).get('ada')?.kind).toBe(p?.kind);
    expect(pokesAt(log, [frame('ada', { k: 'asks', at: 'desk' })], 100.2, false).size).toBe(0);
    // over after its own length
    expect(pokesAt(log, f, 100 + POKES[p?.kind ?? 'hi'].dur + 0.01, false).size).toBe(0);
  });

  it('a delayed poke (the first click opens the agent) waits, and the office wakes for it', () => {
    const f = [frame('ada', work)];
    const log = notePokes(NO_POKES, [click('ada', 100.3)], f, cramped);
    expect(pokesAt(log, f, 100.1, false).size).toBe(0);
    expect(pokeWake(log, f, 100.1, false)).toBeCloseTo(0.2);
    expect(pokesAt(log, f, 100.4, false).size).toBe(1);
  });

  it('reduced motion: no move, only the word, for 1.5 s', () => {
    const f = [frame('ada', work)];
    const log = notePokes(NO_POKES, [click('ada', 100)], f, roomy);
    const kind = log.by.get('ada')?.[0]?.kind ?? 'hi';
    const e = pokesAt(log, f, 100.01, true).get('ada');
    expect(e).toMatchObject({ kind: 'word', label: POKES[kind].word, dur: WORD_S });
    expect(pokesAt(log, f, 100 + WORD_S + 0.01, true).size).toBe(0);
    expect(pokeWake(log, f, 100.5, true)).toBeCloseTo(WORD_S - 0.5);
  });

  it("words: lowercase, never an egg's ('!', '×'), shown mid-play", () => {
    for (const [k, s] of Object.entries(POKES)) {
      expect(s.word, k).toBe(s.word.toLowerCase());
      expect(s.word, k).not.toBe('!');
      expect(s.word, k).not.toMatch(/×/);
    }
    expect(wordAt('startle', 0.5)).toBe('huh?!');
    expect(wordAt('meme', 0.8)).toBe('me! me!');
    expect(wordAt('turbo', 0.8)).toBe('on it!');
    expect(wordAt('brave', 0.4 * POKES.brave.dur)).toBe('sniff');
    expect(wordAt('brave', 0.7 * POKES.brave.dur)).toBe('ok. ok.');
    expect(wordAt('hi', 0)).toBe('');
  });

  it("its word takes the card's place and an egg's; the '?' pill stays", () => {
    const f: BimFrame[] = [frame('ada', { k: 'asks', at: 'desk' })];
    const base = { t: 100, hover: 'ada', held: false, agents: [], eggs: new Map([['ada', '1:47']]) };
    expect(labelsOf(f, { ...base, pokes: new Map([['ada', 'me! me!']]) }).get('ada')).toMatchObject({ mode: 'egg', words: 'me! me!', pill: 'asks' });
    expect(labelsOf(f, { ...base, pokes: new Map([['ada', '']]) }).get('ada')).toMatchObject({ mode: 'pill', pill: 'asks' });
    expect(labelsOf(f, base).get('ada')?.mode).toBe('hover');
  });

  it("a check's forced poke stands frozen at its time", () => {
    const m = forcedPokes({ ada: { kind: 'spin', since: 0.8 } }, false);
    expect(m.get('ada')).toMatchObject({ kind: 'spin', since: 0.8, dur: POKES.spin.dur, label: 'wheee' });
    expect(forcedPokes({ ada: { kind: 'spin', since: 0.8 } }, true).get('ada')?.kind).toBe('word');
  });

  it('spin room: a chair rolled back clear of the walls, the furniture and the other chairs', () => {
    const spot = (x: number, z: number) => ({ x, z, face: 0 });
    const o = {
      x0: 0, W: 10, D: 8,
      desks: new Map([['ada', spot(3, 3)], ['bob', spot(3, 0.3)], ['cy', spot(6, 3)], ['dee', spot(6, 3.7)]]),
      mainDesk: spot(9, 6),
      furniture: [{ x0: 2.2, x1: 3.8, z0: 3.11, z1: 3.9 }],
    } as unknown as Office;
    expect(spinRoom(o, 'ada')).toBe(true);
    // its back against the wall
    expect(spinRoom(o, 'bob')).toBe(false);
    // another chair right behind it
    expect(spinRoom(o, 'dee')).toBe(false);
  });
});
