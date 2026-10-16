// His easter eggs (page bims-easter-eggs, bims' triage m_27978 part B): one pure scheduler between
// timeline.poseAt and labelsOf. eggsAt(t, frames, rows, local date, today's lands) -> which bim
// plays which egg now, and the office's own (the eclipse, the ghost, the tree, the cake...). Every
// roll is a hash of (egg, agent, segment or day): replayable, never Math.random. Rules (bims):
// the state pose always wins (an egg only plays on the pose its trigger names; nothing on a working,
// waiting, asking or failed bim but p4's '!'); at most one egg per bim, at most MAX_ROLLED rolled
// eggs at once (the newest win); reduced motion: none. No new hub fact, no new walk, no new
// character. The renderer's half (the poses, the props) is render/egg.ts. In test mode eggs stay off
// unless a check forces them (Office.tsx: window.__biseEggs), so a check never meets a random one.
// Owner: bims-follow.
import type { Agent } from '@/proto';
import type { ActivityKind, BimFrame } from './model';

export type EggKind =
  | 'salto' // m1: a done bim's back flip before it skates out (1 in 10); the konami code: every bim
  | 'hop' // m2: a hop and a coin mid-walk (walks over 4 s, 1 in 40)
  | 'speedrun' // m3: done under 2 min after it came: its time over its head
  | 'moonwalk' // m5: back to its desk from a coffee, facing backwards (1 in 50)
  | 'itemget' // m6: the day's first land: its box over its head, three notes
  | 'kickflip' // m7: a done bim on the terrace, at most once an hour
  | 'tetris' // m8: the day's 4th land: main says 'line clear'
  | 'combo' // p1: the 2nd done agent of a place: 'combo ×2' over both
  | 'stare' // p4: two agents that wait on each other: '!' over both (useful: a real deadlock)
  | 'tap' // o2: a tap on the coffee machine (1 coffee in 200)
  | 'golden' // o5: the golden pineapple (1 snack in 500)
  | 'loop' // y1: his plane loops before it lands (1 in 50)
  | 'clap' // n1: stage clear: every agent done or idle and his inbox empty, main claps
  | 'shades' // t1: friday after 17:00, idle bims in sunglasses
  | 'lookup' // t4: the eclipse: idle and done bims look up
  | 'dance'; // s1: halloween at midnight, idle and done bims dance 10 s

export interface BimEgg {
  readonly kind: EggKind;
  /** seconds into it, and how long it plays (Infinity: while its trigger holds) */
  readonly since: number;
  readonly dur: number;
  /** its overlay words ('1:47', 'combo ×2', '!'), '' for none */
  readonly label: string;
}

export interface OfficeEggs {
  /** t4: the sky violet 30 s (1 day in 100) */
  readonly eclipse: boolean;
  /** t3: midnight in the night theme, a small ghost crossing, 0..1 of its way; null: none */
  readonly ghost: number | null;
  /** s2: the christmas tree in the lounge (24 and 25 december) */
  readonly tree: boolean;
  /** s4: the cake on the island (the day the project's first agent came, a year or more on) */
  readonly cake: boolean;
  /** s3: april fools, hats shuffled and one bim in main's hoodie */
  readonly april: boolean;
  /** o4: a game on the whiteboard instead of equations (1 drawing in 10); only once the office has its whiteboard (stage 4) */
  readonly doodle: boolean;
  /** the boombox plays, notes over it (bims-grow): o3, 5+ agents working; t1, friday after 17:00. Only once it has one (stage 5) */
  readonly music: boolean;
}

export const NO_OFFICE: OfficeEggs = { eclipse: false, ghost: null, tree: false, cake: false, april: false, doodle: false, music: false };
/** the growth stages (growth.ts) that bring the whiteboard and the boombox */
export const BOARD_STAGE = 4;
export const BOOMBOX_STAGE = 5;
/** o3: this many agents working and the boombox plays */
export const MUSIC_WORKING = 5;

/** the local date and time, as the office's clock reads it (Office.tsx: localOf(new Date())) */
export interface Local {
  readonly y: number;
  /** 1..12 */
  readonly mo: number;
  readonly d: number;
  /** 0 sunday .. 6 saturday */
  readonly dow: number;
  /** seconds since local midnight */
  readonly s: number;
}

export function localOf(at: Date): Local {
  return { y: at.getFullYear(), mo: at.getMonth() + 1, d: at.getDate(), dow: at.getDay(), s: at.getHours() * 3600 + at.getMinutes() * 60 + at.getSeconds() };
}

const dayKey = (l: Local): string => `${String(l.y)}-${String(l.mo)}-${String(l.d)}`;

/** A land seen today (Office.tsx keeps them: noteLands), in order. */
export interface Land {
  readonly name: string;
  readonly t: number;
}

/** A forced egg (a check freezes one mid-play): which, and how far into it. */
export interface Forced {
  readonly bims?: Readonly<Record<string, { readonly kind: EggKind; readonly since: number }>>;
  readonly office?: Partial<OfficeEggs>;
}

export interface EggIn {
  readonly t: number;
  readonly frames: readonly BimFrame[];
  readonly agents: readonly Agent[];
  /** his inbox's cards (n1: empty) */
  readonly cards: number;
  readonly local: Local;
  readonly night: boolean;
  readonly reduced: boolean;
  /** today's lands, oldest first (m6, m8) */
  readonly lands: readonly Land[];
  /** when he typed the konami code (m1), null never */
  readonly konami: number | null;
  /** the office's growth stage (growth.ts): the whiteboard's and the boombox's eggs wait for them */
  readonly stage?: number;
}

export interface Eggs {
  readonly bims: ReadonlyMap<string, BimEgg>;
  readonly office: OfficeEggs;
}

/** at most this many rolled eggs at once (the rare ones; the conditions' eggs don't count) */
export const MAX_ROLLED = 2;
const SALTO_S = 0.9;
const HOP_S = 0.6;
const KICK_S = 1.2;
const SHOW_S = 3;
const ECLIPSE_S = 30;
const GHOST_S = 20;
const DANCE_S = 10;
const KONAMI_S = 1.4;
const ROLLED: ReadonlySet<EggKind> = new Set(['salto', 'hop', 'moonwalk', 'itemget', 'kickflip', 'tap', 'golden', 'speedrun', 'combo', 'loop']);
/** the poses an office-wide egg may touch: idle and done (bims: never a busy bim) */
const RESTING: ReadonlySet<ActivityKind> = new Set(['nap', 'snack', 'done', 'mainidle']);

/** FNV-1a, 32 bits: the rolls' hash */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** 1 in n, for this egg and this key */
export const rolls = (egg: string, key: string, n: number): boolean => hash(`${egg}|${key}`) % n === 0;

/** m:ss */
const clock = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60))}:${String(s % 60).padStart(2, '0')}`;
};

/** The lands seen in these frames added to today's (a 'landing' -> 'done' segment start), a new day starting empty. Pure. */
export function noteLands(log: { readonly day: string; readonly lands: readonly Land[] }, frames: readonly BimFrame[], local: Local): { readonly day: string; readonly lands: readonly Land[] } {
  const day = dayKey(local);
  const lands = log.day === day ? [...log.lands] : [];
  for (const f of frames) {
    const s = f.pose.seg;
    if (s.from !== 'landing' || s.act.k !== 'done') continue;
    if (!lands.some((l) => l.name === f.name && l.t === s.t)) lands.push({ name: f.name, t: s.t });
  }
  lands.sort((a, b) => a.t - b.t);
  return lands.length === log.lands.length && day === log.day ? log : { day, lands };
}

/** The konami code (m1): ↑↑↓↓←→←→ b a, the last keys he typed while the office has focus. Pure. */
export const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'] as const;
export function konamiDone(keys: readonly string[]): boolean {
  if (keys.length < KONAMI.length) return false;
  const tail = keys.slice(-KONAMI.length);
  return tail.every((k, i) => k.toLowerCase() === (KONAMI[i] ?? '').toLowerCase());
}

/** The office's own eggs at this local time (pure): the eclipse, the ghost, the dates. */
export function officeEggs(i: Pick<EggIn, 'local' | 'night' | 'agents'> & { readonly stage?: number }, doodle: boolean): OfficeEggs {
  const { local: l } = i;
  const day = dayKey(l);
  const at = 10 * 3600 + (hash(`eclipse-at|${day}`) % (8 * 3600));
  const eclipse = rolls('eclipse', day, 100) && l.s >= at && l.s < at + ECLIPSE_S;
  const ghost = i.night && l.s < GHOST_S ? l.s / GHOST_S : null;
  const first = i.agents.reduce<number | null>((m, a) => (a.created_ms === undefined || a.created_ms === null ? m : m === null ? a.created_ms : Math.min(m, a.created_ms)), null);
  const born = first === null ? null : new Date(first);
  const cake = born !== null && born.getMonth() + 1 === l.mo && born.getDate() === l.d && born.getFullYear() < l.y;
  const stage = i.stage ?? 0;
  const working = i.agents.filter((a) => !a.archived && a.status === 'working').length;
  const friday = l.dow === 5 && l.s >= 17 * 3600;
  const music = stage >= BOOMBOX_STAGE && (working >= MUSIC_WORKING || friday);
  return { eclipse, ghost, tree: l.mo === 12 && (l.d === 24 || l.d === 25), cake, april: l.mo === 4 && l.d === 1, doodle: doodle && stage >= BOARD_STAGE, music };
}

/** Each bim's egg candidate now, by its own pose and rows (before the caps). Pure. */
function candidate(f: BimFrame, i: EggIn, rows: ReadonlyMap<string, Agent>, office: OfficeEggs, clear: number | null): BimEgg | null {
  const { t } = i;
  const { pose } = f;
  const seg = pose.seg;
  const k = seg.act.k;
  const key = `${f.name}@${seg.t.toFixed(3)}`;
  const since = t - seg.t;
  const walkT = seg.path.len > 0.01 && seg.from !== null ? seg.path.len / seg.speed : 0;
  const timed = (kind: EggKind, start: number, dur: number, label = ''): BimEgg | null => (t >= start && t < start + dur ? { kind, since: t - start, dur, label } : null);
  // the konami code: every bim, its salto, '+30' over main
  if (i.konami !== null && t - i.konami < KONAMI_S && t >= i.konami) return { kind: 'salto', since: t - i.konami, dur: KONAMI_S, label: f.main ? '+30' : '' };
  if (f.main && clear !== null) return timed('clap', clear, SHOW_S, '');
  if (f.main) {
    const fourth = i.lands[3];
    if (fourth !== undefined) return timed('tetris', fourth.t, SHOW_S, 'line clear');
  }
  if (k === 'done' && seg.from !== null && seg.from !== 'done') {
    const first = i.lands[0];
    if (seg.from === 'landing' && first !== undefined && first.name === f.name && first.t === seg.t) return timed('itemget', seg.t, 2.5, '♪ ♪ ♪');
    const row = rows.get(f.name);
    const born = row?.created_ms;
    if (born !== undefined && born !== null && seg.t * 1000 - born < 120_000 && seg.t * 1000 >= born) return timed('speedrun', seg.t, 4, clock(seg.t * 1000 - born));
    const mates = row?.place_id;
    if (mates !== undefined && mates !== '' && mates !== 'shared') {
      const before = i.frames.some((o) => o.name !== f.name && o.pose.seg.act.k === 'done' && o.pose.seg.t < seg.t && rows.get(o.name)?.place_id === mates);
      if (before) return timed('combo', seg.t, SHOW_S, 'combo ×2');
    }
    if (rolls('salto', key, 10)) return timed('salto', seg.t, SALTO_S);
  }
  if (k === 'done' && !pose.moving && seg.act.at === 'terrace') {
    const hour = Math.floor(t / 3600);
    const at = hour * 3600 + (hash(`kickflip|${f.name}|${String(hour)}`) % 3600);
    if (at > seg.t + walkT) {
      const e = timed('kickflip', at, KICK_S, 'kickflip +500');
      if (e !== null) return e;
    }
  }
  if (office.eclipse && RESTING.has(k)) return { kind: 'lookup', since: 0, dur: Infinity, label: '' };
  if (i.local.mo === 10 && i.local.d === 31 && i.local.s < DANCE_S && RESTING.has(k)) return { kind: 'dance', since: i.local.s, dur: DANCE_S, label: '' };
  if (pose.moving && walkT > 4 && rolls('hop', key, 40)) return timed('hop', seg.t + walkT / 2, HOP_S);
  if (pose.moving && seg.from === 'coffee' && rolls('moonwalk', key, 50)) return timed('moonwalk', seg.t, walkT);
  if (k === 'coffee' && !pose.moving && rolls('tap', key, 200)) return timed('tap', seg.t + walkT, 0.8);
  if (k === 'snack' && seg.act.fruit === 0 && rolls('golden', key, 500)) return { kind: 'golden', since, dur: Infinity, label: '' };
  if (pose.plane !== undefined && rolls('loop', `${f.name}@${(t - pose.plane.since).toFixed(1)}`, 50)) return { kind: 'loop', since: pose.plane.since, dur: Infinity, label: '' };
  if (k === 'waitagent') {
    const on = seg.act.on;
    const back = on === undefined ? undefined : rows.get(on)?.waiting_on;
    if (back?.who === 'agent' && back.name === f.name) return { kind: 'stare', since, dur: Infinity, label: '!' };
  }
  if (i.local.dow === 5 && i.local.s >= 17 * 3600 && (k === 'nap' || k === 'snack')) return { kind: 'shades', since: 0, dur: Infinity, label: '' };
  return null;
}

/**
 * n1, stage clear: every agent but main done or idle, his inbox empty, one done at least: from the
 * last change (the newest segment's start), main claps SHOW_S. null: not clear. Pure.
 */
export function clearAt(frames: readonly BimFrame[], cards: number): number | null {
  const others = frames.filter((f) => !f.main);
  if (cards > 0 || others.length === 0) return null;
  if (!others.every((f) => RESTING.has(f.pose.seg.act.k))) return null;
  if (!others.some((f) => f.pose.seg.act.k === 'done')) return null;
  return Math.max(...frames.map((f) => f.pose.seg.t));
}

/** eggsAt: which bim plays which egg at t, and the office's own. Reduced motion: none. Pure. */
export function eggsAt(i: EggIn): Eggs {
  if (i.reduced) return { bims: new Map(), office: NO_OFFICE };
  const rows = new Map(i.agents.map((a) => [a.name, a]));
  const doodle = i.frames.some((f) => f.pose.seg.act.at === 'board' && !f.pose.moving && rolls('doodle', `${f.name}@${f.pose.seg.t.toFixed(3)}`, 10));
  const office = officeEggs(i, doodle);
  const clear = clearAt(i.frames, i.cards);
  const all: [string, BimEgg][] = [];
  for (const f of i.frames) {
    const e = candidate(f, i, rows, office, clear);
    if (e !== null) all.push([f.name, e]);
  }
  // the rolled ones: the newest MAX_ROLLED (the konami's saltos are his, not rolled)
  const rolled = all.filter(([, e]) => ROLLED.has(e.kind) && !(i.konami !== null && e.dur === KONAMI_S)).sort(([an, a], [bn, b]) => a.since - b.since || (an < bn ? -1 : 1));
  const drop = new Set(rolled.slice(MAX_ROLLED).map(([n]) => n));
  return { bims: new Map(all.filter(([n]) => !drop.has(n))), office };
}

export const NO_EGGS: Eggs = { bims: new Map(), office: NO_OFFICE };

/**
 * What the clock alone changes in the eggs (the eclipse, the ghost's minute, friday after 17:00,
 * halloween's midnight, the dates): the still office's check draws when it changes. Pure.
 */
export function clockSig(l: Local, night: boolean, agents: readonly Agent[]): string {
  const o = officeEggs({ local: l, night, agents }, false);
  const friday = l.dow === 5 && l.s >= 17 * 3600;
  const halloween = l.mo === 10 && l.d === 31 && l.s < DANCE_S;
  return `${JSON.stringify({ ...o, ghost: o.ghost === null ? null : Math.round(o.ghost * 40) })}|${String(friday)}|${String(halloween)}`;
}

/** A check's forced eggs over the scheduler's (test mode only: Office.tsx reads window.__biseEggs). Pure. */
export function withForced(e: Eggs, f: Forced | null | undefined): Eggs {
  if (f === null || f === undefined) return e;
  const bims = new Map(e.bims);
  for (const [name, x] of Object.entries(f.bims ?? {})) bims.set(name, { kind: x.kind, since: x.since, dur: FORCED_DUR[x.kind] ?? Infinity, label: FORCED_LABEL[x.kind] ?? '' });
  return { bims, office: { ...e.office, ...f.office } };
}

/** a forced egg's length, so a frozen one stands where its play would be at `since` */
const FORCED_DUR: Partial<Record<EggKind, number>> = { salto: SALTO_S, hop: HOP_S, kickflip: KICK_S, itemget: 2.5, tap: 0.8, clap: SHOW_S, dance: DANCE_S, speedrun: 4, combo: SHOW_S, tetris: SHOW_S };
const FORCED_LABEL: Partial<Record<EggKind, string>> = { speedrun: '1:47', combo: 'combo ×2', stare: '!', itemget: '♪ ♪ ♪', kickflip: 'kickflip +500', tetris: 'line clear' };

/** The words over each bim that has an egg's label (labelsOf shows them where nothing else shows). Pure. */
export function eggLabels(e: Eggs): ReadonlyMap<string, string> {
  const out = new Map<string, string>();
  for (const [n, x] of e.bims) if (x.label !== '') out.set(n, x.label);
  return out;
}

/** A signature of what the eggs show, so the still office's check draws only when it changes. Pure. */
export function eggsSig(e: Eggs): string {
  let s = JSON.stringify(e.office);
  for (const [n, x] of e.bims) s += `|${n}:${x.kind}:${x.label}`;
  return s;
}
