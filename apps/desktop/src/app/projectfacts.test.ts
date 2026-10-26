// A project row's facts (Gabriel's H1, designer m_44783): the sentence's rule as a table (failed /
// working + new artifacts / news / unread / waits / quiet), the pill or the age, the quiet row, the
// week sliding for a stopped hub, its day bars and their tips, and the fallback with no pulse.
import { describe, expect, it } from 'vitest';
import type { News, ProjectRow, Pulse } from '@/proto';
import { projects } from '@/proto/words_projects.gen';
import { common } from '@/proto/words.gen';
import { BUCKET_MS, BUCKETS, daysBack, daysOf, projectFacts, since, weekBars, weekOf, workWords } from './projectfacts';
import { waitsTip, workingTip } from './tipwords';

const H = 3_600_000;
const NOW = 1_800_000_000_000;
const FROM = NOW - 20 * BUCKET_MS - H;
const week = Array.from({ length: BUCKETS }, (_, i) => i * 60_000);
const pulse = (o: Partial<Pulse> = {}): Pulse => ({ from_ms: FROM, busy_ms: week, last_ms: NOW - 2 * H, counting: false, ...o });
const row = (p: Pulse | null): ProjectRow => ({ project: 'acme', name: 'acme', order: 0, home: false, pulse: p }) as unknown as ProjectRow;
const news = (what: News['what'], at_ms = NOW - H): News => ({ at_ms, what });

const facts = (p: Pulse | null, working = 0, waits = 0, seen?: number) => projectFacts({ p: row(p), working, waits, seen, now: NOW });

describe('the sentence, the first that applies', () => {
  const SEEN = NOW - 3 * H;
  const table: readonly (readonly [string, Pulse, number, string, boolean])[] = [
    ['an agent failed, before all', pulse({ news: news({ kind: 'failed', agent: 'migrate' }), artifacts_at: [NOW - H] }), 2, projects.failed({ agent: 'migrate' }), true],
    ['working and new artifacts', pulse({ artifacts_at: [NOW - H, NOW - 2 * H, NOW - 4 * H], news: news({ kind: 'landed', agent: 'brush', sha: 'abc', target: 'main' }) }), 5, `${projects.working({ n: 5 })} · ${projects.new_artifacts({ n: 2 })}`, false],
    ['working alone', pulse(), 1, projects.working({ n: 1 }), false],
    ['new artifacts alone', pulse({ artifacts_at: [NOW - H] }), 0, projects.new_artifacts({ n: 1 }), false],
    ['the last news: a land', pulse({ news: news({ kind: 'landed', agent: 'brush', sha: 'abc', target: 'main' }) }), 0, projects.landed({ agent: 'brush', target: 'main' }), false],
    ['the last news: an artifact', pulse({ news: news({ kind: 'artifact', id: 'a1', title: 'evals pass' }) }), 0, projects.ready({ title: 'evals pass' }), false],
    ['unread entries for him', pulse({ said_at: [NOW - H, NOW - 2 * H, NOW - 5 * H] }), 0, projects.unread({ n: 2 }), false],
  ];
  it.each(table)('%s', (_name, p, working, text, err) => {
    const f = facts(p, working, 0, SEEN);
    expect(f.quiet).toBe(false);
    expect(f.sentence).toEqual({ text, err });
  });

  it('a scheduled run ahead is news until it runs; a past one is not', () => {
    const ahead = facts(pulse({ news: news({ kind: 'scheduled', id: 't', name: 'nightly' }, NOW + 5 * H) }), 0, 0, NOW);
    expect(ahead.sentence?.text.startsWith(projects.next_run({ when: '' }))).toBe(true);
    expect(facts(pulse({ news: news({ kind: 'scheduled', id: 't', name: 'nightly' }, NOW - H) }), 0, 0, SEEN).quiet).toBe(true);
  });

  it('only waits on him: the sentence says so, the pill counts it', () => {
    const f = facts(pulse(), 0, 2, NOW);
    expect(f.sentence).toEqual({ text: waitsTip(2), err: false });
    expect(f.pill).toBe(2);
  });
});

describe('a quiet project', () => {
  it('nothing works, waits or is new since he looked: one line, its age, no sentence, no week', () => {
    const p = pulse({ news: news({ kind: 'landed', agent: 'brush', sha: 'abc', target: 'main' }, NOW - 5 * H), artifacts_at: [NOW - 5 * H], said_at: [NOW - 6 * H] });
    const f = facts(p, 0, 0, NOW - 4 * H);
    expect(f).toEqual({ quiet: true, pill: null, age: '2 h', sentence: null, week: null, tip: `${common.all_quiet} · ${projects.last_activity({ age: '2 h' })}` });
  });

  it('never looked: everything of the week is new', () => {
    expect(facts(pulse({ artifacts_at: [NOW - 50 * H] })).quiet).toBe(false);
    expect(since([1, 2, 3], undefined)).toBe(3);
    expect(since([1, 2, 3], 2)).toBe(1);
  });
});

describe('line 1: the pill or the age', () => {
  it("the pill when something waits; else the age of its last activity, 'now' while one works", () => {
    expect(facts(pulse(), 0, 3, NOW)).toMatchObject({ pill: 3 });
    expect(facts(pulse(), 1, 0, NOW)).toMatchObject({ pill: null, age: 'now' });
    expect(facts(pulse({ last_ms: NOW - 40 * 60_000 }), 0, 0, NOW)).toMatchObject({ pill: null, age: '40 min' });
    expect(facts(pulse({ last_ms: NOW - 6 * 24 * H }), 0, 0, NOW)).toMatchObject({ age: '6 d' });
    expect(facts(pulse({ last_ms: NOW - 15 * 24 * H }), 0, 0, NOW)).toMatchObject({ age: '2 w' });
  });
});

describe('no pulse yet (a hub that does not send it)', () => {
  it("the pill from the inbox, 'N working' from the agents; no age, no news, no week", () => {
    expect(facts(null, 2, 1)).toEqual({ quiet: false, pill: 1, age: null, sentence: { text: projects.working({ n: 2 }), err: false }, week: null, tip: `${workingTip(2)} · ${waitsTip(1)}` });
    expect(facts(null, 0, 0)).toMatchObject({ quiet: true, age: null });
  });

  it('a week still counting: no sparkline yet', () => {
    expect(facts(pulse({ counting: true }), 1, 0).week).toBeNull();
  });
});

describe('the tip adds what the row does not say (designer m_44915)', () => {
  it("its whole name, every fact, then its last activity: 'acme · 5 agents working · 2 waiting for you · 3 new artifacts · 4 unread · active now'", () => {
    const p = pulse({ artifacts_at: [NOW - H, NOW - H, NOW - H], said_at: [NOW - H, NOW - H, NOW - H, NOW - H] });
    const f = projectFacts({ p: row(p), name: 'acme', working: 5, waits: 2, seen: NOW - 2 * H, now: NOW });
    expect(f.tip).toBe(['acme', workingTip(5), waitsTip(2), projects.new_artifacts({ n: 3 }), projects.unread({ n: 4 }), projects.active_now].join(' · '));
  });

  it("a news row: 'codex · report ready: evals pass · last activity 3 h ago'", () => {
    const p = pulse({ last_ms: NOW - 3 * H, news: news({ kind: 'artifact', id: 'a1', title: 'evals pass' }, NOW - 3 * H) });
    const f = projectFacts({ p: row(p), name: 'codex', working: 0, waits: 0, seen: NOW - 4 * H, now: NOW });
    expect(f.tip).toBe(['codex', projects.ready({ title: 'evals pass' }), projects.last_activity({ age: '3 h' })].join(' · '));
  });
});

describe('the week', () => {
  it("21 buckets ending with now's", () => {
    expect(weekOf(pulse(), NOW)).toEqual(week);
  });

  it('the row draws 7 days, each the sum of its 3 buckets (7 points, not a wave)', () => {
    expect(daysOf([1, 2, 3, 0, 0, 0, 5, 0, 5, 1, 1, 1, 0, 0, 9, 2, 2, 2, 4, 0, 0])).toEqual([6, 0, 10, 3, 9, 6, 4]);
    expect(facts(pulse(), 1, 0).week).toEqual(daysOf(week));
    expect(facts(pulse(), 1, 0).week).toHaveLength(7);
  });

  it("a stopped hub's buckets slide by the 8 h steps since, the new ones empty", () => {
    expect(weekOf(pulse(), NOW + 2 * BUCKET_MS)).toEqual([...week.slice(2), 0, 0]);
    expect(weekOf(pulse(), NOW + 30 * BUCKET_MS)).toEqual(new Array<number>(BUCKETS).fill(0));
  });

  it('the bars (designer m_45992): 7 of 4 wide 2 apart in 40 x 12, the busiest day full height, a day with no work a 1 px stub, today the last', () => {
    const now = new Date(2026, 9, 26, 12).getTime();
    const bars = weekBars([0, 3 * H, 6 * H, 0, 0, 40 * 60_000, 2 * H + 10 * 60_000], now);
    expect(bars.map((b) => b.x)).toEqual([0, 6, 12, 18, 24, 30, 36]);
    expect(bars.map((b) => b.h)).toEqual([1, 6, 12, 1, 1, 2, 4]);
    expect(bars.map((b) => b.today)).toEqual([false, false, false, false, false, false, true]);
    // each bar's hover column: the bar and half of each gap beside it, the 40 covered once
    expect(bars.map((b) => [b.hx, b.hw])).toEqual([[0, 5], [5, 6], [11, 6], [17, 6], [23, 6], [29, 6], [35, 5]]);
    // its tip: the day (thread's day words), then its work
    expect(bars[6]?.tip).toBe(projects.day_work({ day: 'today', work: '2 h 10 min' }));
    expect(bars[5]?.tip).toBe(projects.day_work({ day: 'yesterday', work: '40 min' }));
    expect(bars[2]?.tip).toBe(projects.day_work({ day: 'thu 22 oct', work: '6 h' }));
    expect(bars[4]?.tip).toBe(projects.day_idle({ day: 'sat 24 oct' }));
    expect(weekBars(new Array<number>(7).fill(0), now).map((b) => b.h)).toEqual([1, 1, 1, 1, 1, 1, 1]);
  });

  it("the bars name calendar days, never 24-h steps: summer time's 25-h day still has one 'yesterday' (ui-review m_46014)", () => {
    // 26 oct 2026 23:00 in Paris, the day after summer time ends
    const now = Date.UTC(2026, 9, 26, 22);
    const days = weekBars(new Array<number>(7).fill(0), now, 'Europe/Paris').map((b) => b.tip);
    expect(days).toEqual(['tue 20 oct', 'wed 21 oct', 'thu 22 oct', 'fri 23 oct', 'sat 24 oct', 'yesterday', 'today'].map((day) => projects.day_idle({ day })));
    // and the day it starts, a 23-h day, early morning
    const spring = weekBars(new Array<number>(7).fill(0), Date.UTC(2026, 2, 30, 0, 30), 'Europe/Paris').map((b) => b.tip);
    expect(new Set(spring).size).toBe(7);
    expect(spring[5]).toBe(projects.day_idle({ day: 'yesterday' }));
    expect(daysBack(now, 1, 'Europe/Paris')).toBe(Date.UTC(2026, 9, 25, 11));
  });

  it("a day's work in words: minutes, then hours and minutes, a few seconds still a minute", () => {
    expect(workWords(40 * 60_000)).toBe('40 min');
    expect(workWords(3 * H)).toBe('3 h');
    expect(workWords(2 * H + 10 * 60_000)).toBe('2 h 10 min');
    expect(workWords(5_000)).toBe('1 min');
  });
});

it('the row type is the proto row plus the pulse', () => {
  const r: ProjectRow = row(null);
  expect(r.project).toBe('acme');
});
