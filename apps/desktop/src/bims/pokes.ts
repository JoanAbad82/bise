// His pokes (page bims-pokes v4, all 20 kept): a click on a bim, and it reacts by what it is doing.
// Pure, next to eggs.ts and in the same shape: the driver keeps his clicks (office-driver.ts
// poke), pokeOf turns each into a reaction by the bim's situation at the click, pokesAt says which
// bim plays which reaction at t, as a BimEgg (kind, since, dur, word) that beats its egg while it
// plays. The pick is hash('poke|name|n') over the situation's weights (n: his nth poke on that
// bim): replayable, never Math.random; never the same twice in a row where there are 3+ to pick
// from (with 2, only boop never repeats, so it stays rare); his 3rd poke in 2.5 s is
// 'ok, enough', then 10 s of boop only; no boop on a failed bim. The state always wins: a poke
// stops when the bim's situation changes. Reduced motion: no move, only the word, for 1.5 s. The
// bodies are render/poke.ts; the kinds' names are model.ts's (PokeKind). Owner: bims-poke.
import type { BimFrame, Office, Park, PlayKind, PokeKind, Pt } from './model';
import { hash, type BimEgg, type Forced } from './eggs';
import { sinceArrived, skateAt } from './skate';

/** where a bim is when he pokes it: what picks the reaction */
export type Situation = 'sleep' | 'nap' | 'work' | 'hot' | 'snack' | 'asks' | 'blocked' | 'failed' | 'done' | 'landing' | 'skate' | 'stopped' | 'about';

/** each reaction's length (s) and its word, shown from `a` to `b` (0..1 of its play) */
interface Spec {
  readonly dur: number;
  readonly word: string;
  readonly a: number;
  readonly b: number;
}

export const POKES: Readonly<Record<PokeKind, Spec>> = {
  hi: { dur: 1.6, word: 'hi!', a: 0.1, b: 0.9 },
  boop: { dur: 0.7, word: 'boop', a: 0.15, b: 0.85 },
  startle: { dur: 1.8, word: 'huh?!', a: 0.04, b: 0.78 },
  snooze: { dur: 1.8, word: '5 more min', a: 0.13, b: 0.87 },
  rollover: { dur: 1.6, word: 'mmh', a: 0.15, b: 0.85 },
  shoo: { dur: 1.5, word: 'busy', a: 0.1, b: 0.9 },
  turbo: { dur: 1.6, word: 'on it!', a: 0.06, b: 0.94 },
  spin: { dur: 1.6, word: 'wheee', a: 0.25, b: 0.8 },
  bite: { dur: 1.8, word: 'want some?', a: 0.1, b: 0.9 },
  hiccup: { dur: 1.9, word: 'hic', a: 0, b: 1 },
  meme: { dur: 1.6, word: 'me! me!', a: 0.06, b: 0.94 },
  watch: { dur: 1.8, word: 'tick tock', a: 0.1, b: 0.9 },
  shrug: { dur: 1.3, word: 'meh', a: 0.15, b: 0.85 },
  fine: { dur: 2.2, word: "it's fine", a: 0.15, b: 0.85 },
  brave: { dur: 2.4, word: 'ok. ok.', a: 0.5, b: 0.86 },
  peek: { dur: 1.8, word: 'oh, you', a: 0.3, b: 0.75 },
  cheers: { dur: 1.5, word: 'cheers', a: 0.1, b: 0.9 },
  juggle: { dur: 1.6, word: 'whoa', a: 0.15, b: 0.85 },
  windmill: { dur: 1.6, word: 'whoa whoa', a: 0.075, b: 0.925 },
  enough: { dur: 2.6, word: 'hmph', a: 0.05, b: 0.8 },
};

/** the page's weights, by situation */
export const WEIGHTS: Readonly<Record<Situation, readonly (readonly [PokeKind, number])[]>> = {
  sleep: [['startle', 3], ['snooze', 3], ['boop', 1]],
  nap: [['rollover', 3], ['snooze', 2], ['boop', 1]],
  work: [['shoo', 3], ['turbo', 2], ['spin', 2], ['boop', 1]],
  hot: [['shoo', 3], ['turbo', 2], ['boop', 1]],
  snack: [['bite', 3], ['hiccup', 2], ['hi', 1], ['boop', 1]],
  asks: [['meme', 3], ['boop', 1]],
  blocked: [['watch', 2], ['shrug', 2], ['boop', 1]],
  failed: [['fine', 2], ['brave', 2]],
  done: [['peek', 3], ['cheers', 2], ['hi', 1], ['boop', 1]],
  landing: [['juggle', 3], ['hi', 1]],
  skate: [['windmill', 3], ['hi', 1]],
  stopped: [['shrug', 3], ['boop', 1]],
  about: [['hi', 3], ['boop', 1]],
};

/** a second click this soon after one is the same poke (a double-click: one poke, never two) */
export const DOUBLE_S = 0.4;
/** his 3rd poke in this long is 'ok, enough' */
export const ENOUGH_IN_S = 2.5;
/** after 'ok, enough': boop only, this long */
export const CALM_S = 10;
/** reduced motion: the word alone, this long */
export const WORD_S = 1.5;
/** the first click opens the agent: the poke starts as the camera arrives */
export const OPEN_DELAY_S = 0.3;
/** a bim keeps its last few pokes (the no-repeat, the 3-poke rule, the calm) */
const KEEP = 4;

/** A click on a bim at t (Office.tsx onClick through the driver). */
export interface Click {
  readonly name: string;
  readonly t: number;
}

/** A click turned into a reaction: its nth poke on that bim, in that situation. */
export interface Poke {
  readonly name: string;
  readonly t: number;
  readonly n: number;
  readonly kind: PokeKind;
  readonly sit: Situation;
}

/** Where this bim is now, for the pick. Pure. */
export function situationOf(f: BimFrame): Situation {
  const { act, pastime } = f.pose.seg;
  const k = act.k;
  if (k === 'failed') return 'failed';
  if (k === 'stopped') return 'stopped';
  if (k === 'landing') return 'landing';
  if (pastime !== undefined && !f.pose.moving) return 'skate';
  if (f.pose.moving) return 'about';
  switch (k) {
    case 'sleep':
    case 'waitagent':
      return 'sleep';
    case 'nap':
      return act.at === 'lounge' ? 'nap' : 'sleep';
    case 'work':
    case 'main':
      return 'work';
    case 'hot':
      return 'hot';
    case 'snack':
    case 'coffee':
      return 'snack';
    case 'asks':
      return 'asks';
    case 'blocked':
      return 'blocked';
    case 'done':
      return act.at === 'terrace' ? 'done' : 'about';
    case 'starting':
    case 'mainidle':
    case 'visit':
    case 'report':
      return 'about';
  }
}

/** a roll over the weights (hash % sum), the last reaction skipped for the next one in the list */
function roll(sit: Situation, key: string, last: PokeKind | null, spins: boolean): PokeKind {
  // no room behind its chair: the spin's weight goes to shoo (bims m_31312)
  const w = spins ? WEIGHTS[sit] : WEIGHTS[sit].filter(([k]) => k !== 'spin').map(([k, n]): readonly [PokeKind, number] => [k, k === 'shoo' ? n + 2 : n]);
  const pick = weighted(w, hash(key));
  // never twice in a row where there are 3+ reactions; with 2, repeats are fine but boop's (so it
  // stays rare, bims m_31365): a roll that gives a banned one rolls again over the others, by weight
  // the roll again never lands on boop, so its share stays its weight's
  const banned = pick === last && (w.length > 2 || pick === 'boop');
  if (!banned) return pick;
  const others = w.filter(([k]) => k !== last && k !== 'boop');
  return weighted(others.length > 0 ? others : w.filter(([k]) => k !== last), hash(`${key}|again`));
}

/** the reaction a roll lands on (h % the weights' sum) */
function weighted(w: readonly (readonly [PokeKind, number])[], h: number): PokeKind {
  const sum = w.reduce((s, [, n]) => s + n, 0);
  let r = h % sum;
  for (const [k, n] of w) {
    r -= n;
    if (r < 0) return k;
  }
  return w[w.length - 1]?.[0] ?? 'hi';
}

/**
 * pokeOf: this click on a bim in this situation, after its pokes so far (oldest first), as a
 * reaction; null when it plays nothing (the double-click's second, a click while it turns its
 * back, a failed bim in its calm). Pure.
 */
export function pokeOf(before: readonly Poke[], c: Click, sit: Situation, spins = true): Poke | null {
  const last = before[before.length - 1] ?? null;
  if (last !== null && c.t - last.t < DOUBLE_S) return null;
  if (last?.kind === 'enough' && c.t < last.t + POKES.enough.dur) return null;
  const n = (last?.n ?? 0) + 1;
  const poke = (kind: PokeKind): Poke => ({ name: c.name, t: c.t, n, kind, sit });
  let enough = -1;
  before.forEach((p, i) => { if (p.kind === 'enough') enough = i; });
  const fresh = before.slice(enough + 1);
  const was = before[enough];
  if (was !== undefined && c.t < was.t + POKES.enough.dur + CALM_S) return sit === 'failed' ? null : poke('boop');
  if (fresh.filter((p) => c.t - p.t < ENOUGH_IN_S).length >= 2) return poke('enough');
  return poke(roll(sit, `poke|${c.name}|${String(n)}`, last?.kind ?? null, spins));
}

/** His pokes so far, by bim, and the clicks not heard yet: the driver's memory. */
export interface PokeLog {
  readonly by: ReadonlyMap<string, readonly Poke[]>;
}

export const NO_POKES: PokeLog = { by: new Map() };

/** how far the chair rolls back before it spins (render/poke.ts), and the chair's reach as it turns (furniture.ts: 0.42 wide, its back 0.235 behind) */
export const SPIN_BACK = 0.3;
const CHAIR_R = 0.32;
/** a chair stands this far behind its spot (the maps' desks) */
const CHAIR_DZ = 0.05;

/** whether a desk's chair, rolled back SPIN_BACK, turns clear of the walls, the furniture and the other chairs. Pure. */
export function spinRoom(o: Office, name: string): boolean {
  const d = o.desks.get(name) ?? (name === MAIN_SEAT ? o.mainDesk : undefined);
  if (d === undefined) return false;
  const back = CHAIR_DZ + SPIN_BACK;
  const c: Pt = { x: d.x - Math.sin(d.face) * back, z: d.z - Math.cos(d.face) * back };
  if (c.x - CHAIR_R < o.x0 || c.x + CHAIR_R > o.x0 + o.W || c.z - CHAIR_R < 0 || c.z + CHAIR_R > o.D) return false;
  for (const b of o.furniture) {
    const nx = Math.max(b.x0, Math.min(c.x, b.x1));
    const nz = Math.max(b.z0, Math.min(c.z, b.z1));
    if (Math.hypot(c.x - nx, c.z - nz) < CHAIR_R) return false;
  }
  const seats = [...o.desks.entries()].filter(([n]) => n !== name).map(([, s]) => s);
  if (name !== MAIN_SEAT) seats.push(o.mainDesk);
  return seats.every((s) => Math.hypot(s.x - Math.sin(s.face) * CHAIR_DZ - c.x, s.z - Math.cos(s.face) * CHAIR_DZ - c.z) >= CHAIR_R + 0.25);
}
/** the name spinRoom takes for main's desk */
export const MAIN_SEAT = '\u0000main';

/** a skater on the flat or resting on its board `dt` s from now (never mid-trick, on a ramp or a bowl's wall). Pure. */
export function skateFlat(f: BimFrame, park: Park, dt: number): boolean {
  const p = f.pose.seg.pastime;
  if (p?.kind !== 'skate') return true;
  const m = skateAt(f.name, p, sinceArrived(f.pose) + dt, park).move;
  return m === null || (m.trick === 'roll' && (m.on === null || m.on === 'flat'));
}

/** a skater's poke waits for the next flat stretch as long as the reaction (bims m_31312); null: none in a session */
function flatStart(f: BimFrame, park: Park | undefined, dur: number): number | null {
  if (park === undefined) return 0;
  const STEP = 0.1;
  for (let k = 0; k * STEP < 24; k++) {
    let ok = true;
    for (let j = 0; j * STEP <= dur && ok; j++) ok = skateFlat(f, park, (k + j) * STEP);
    if (ok) return k * STEP;
  }
  return null;
}

/** What the office says about where a poke may go: room to spin a chair, the park a skater rides. */
export interface Room {
  readonly spins: (name: string, main: boolean) => boolean;
  readonly park?: Park;
}

export const roomOf = (o: Office): Room => ({ spins: (name, main) => spinRoom(o, main ? MAIN_SEAT : name), ...(o.park ? { park: o.park } : {}) });

/** The clicks heard against the bims' frames now (their situations): the log with their reactions. Pure. */
export function notePokes(log: PokeLog, clicks: readonly Click[], frames: readonly BimFrame[], room: Room): PokeLog {
  if (clicks.length === 0) return log;
  const by = new Map(log.by);
  for (const c of clicks) {
    const f = frames.find((x) => x.name === c.name);
    if (f === undefined) continue;
    const before = by.get(c.name) ?? [];
    const sit = situationOf(f);
    const p = pokeOf(before, c, sit, room.spins(f.name, f.main));
    if (p === null) continue;
    let at = p.t;
    // a climber (climb.ts) is on the wall or resting for its next problem: no reaction there
    if (sit === 'skate' && f.pose.seg.pastime?.kind === 'climb') continue;
    if (sit === 'skate') {
      const wait = flatStart(f, room.park, POKES[p.kind].dur);
      if (wait === null) continue;
      at += wait;
    }
    by.set(c.name, [...before, { ...p, t: at }].slice(-KEEP));
  }
  return { by };
}

/** a reaction's word at `since` into it ('' between): the hiccup's on each hop. Pure. */
export function wordAt(kind: PokeKind, since: number): string {
  const s = POKES[kind];
  const u = since / s.dur;
  if (kind === 'hiccup') return (since % 0.63) / 0.63 < 0.25 ? s.word : '';
  if (kind === 'brave' && u >= 0.3 && u < 0.5) return 'sniff';
  return u >= s.a && u < s.b ? s.word : '';
}

/** each bim's last poke if it plays at t (started, not over, its situation unchanged) */
function playing(log: PokeLog, frames: readonly BimFrame[], t: number, reduced: boolean): [BimFrame, Poke, number][] {
  const out: [BimFrame, Poke, number][] = [];
  for (const f of frames) {
    const p = log.by.get(f.name)?.at(-1);
    if (p === undefined) continue;
    const dur = reduced ? WORD_S : POKES[p.kind].dur;
    if (t < p.t || t >= p.t + dur || situationOf(f) !== p.sit) continue;
    out.push([f, p, dur]);
  }
  return out;
}

/** pokesAt: which bim plays which poke at t, as an egg (its word in `label`). Reduced motion: the word alone. Pure. */
export function pokesAt(log: PokeLog, frames: readonly BimFrame[], t: number, reduced: boolean): ReadonlyMap<string, BimEgg> {
  const out = new Map<string, BimEgg>();
  for (const [f, p, dur] of playing(log, frames, t, reduced)) {
    const since = t - p.t;
    out.set(f.name, reduced ? { kind: 'word', since, dur, label: POKES[p.kind].word } : { kind: p.kind, since, dur, label: wordAt(p.kind, since) });
  }
  return out;
}

/**
 * s until the next poke starts or ends (a delayed one, a word under reduced motion): a still
 * office has no frame to see it otherwise. null: none ahead. Pure.
 */
export function pokeWake(log: PokeLog, frames: readonly BimFrame[], t: number, reduced: boolean): number | null {
  let next: number | null = null;
  const at = (s: number): void => { if (s > 0 && (next === null || s < next)) next = s; };
  for (const f of frames) {
    const p = log.by.get(f.name)?.at(-1);
    if (p === undefined) continue;
    const dur = reduced ? WORD_S : POKES[p.kind].dur;
    at(p.t - t);
    at(p.t + dur - t);
  }
  return next;
}

/** A check's forced pokes as eggs, frozen at `since`. Pure. */
export function forcedPokes(f: Forced['pokes'], reduced: boolean): ReadonlyMap<string, BimEgg> {
  const out = new Map<string, BimEgg>();
  for (const [name, x] of Object.entries(f ?? {})) {
    const s = POKES[x.kind];
    out.set(name, reduced ? { kind: 'word', since: x.since, dur: WORD_S, label: s.word } : { kind: x.kind, since: x.since, dur: s.dur, label: wordAt(x.kind, x.since) });
  }
  return out;
}

export const isPoke = (kind: BimEgg['kind']): kind is PlayKind => kind === 'word' || kind in POKES;

export type { PlayKind, PokeKind };

/** the sooner of two wakes (s), null for none */
export const soonest = (a: number | null, b: number | null): number | null => (a === null ? b : b === null ? a : Math.min(a, b));
