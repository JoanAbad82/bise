// A project row's facts (Gabriel's H1, designer m_44783): the sentence's rule as a table (failed /
// working + new artifacts / news / unread / waits / quiet), the pill or the age, the quiet row, the
// week sliding for a stopped hub, the sparkline's points, and the fallback with no pulse.
import { describe, expect, it } from 'vitest';
import type { ProjectRow } from '@/proto';
import { projects } from '@/proto/words_projects.gen';
import { common } from '@/proto/words.gen';
import { BUCKET_MS, BUCKETS, projectFacts, since, sparkPoints, weekOf, type News, type Pulse, type PulseRow } from './projectfacts';
import { waitsTip, workingTip } from './tipwords';

const H = 3_600_000;
const NOW = 1_800_000_000_000;
const FROM = NOW - 20 * BUCKET_MS - H;
const week = Array.from({ length: BUCKETS }, (_, i) => i * 60_000);
const pulse = (o: Partial<Pulse> = {}): Pulse => ({ from_ms: FROM, busy_ms: week, last_ms: NOW - 2 * H, counting: false, ...o });
const row = (p: Pulse | null): PulseRow => ({ project: 'acme', name: 'acme', order: 0, home: false, pulse: p }) as unknown as PulseRow;
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
    expect(f).toEqual({ quiet: true, pill: null, age: '2 h', sentence: null, week: null, tip: common.all_quiet });
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

describe('the tip says it all', () => {
  it("'5 agents working · 2 waiting for you · 3 new artifacts · 4 unread'", () => {
    const p = pulse({ artifacts_at: [NOW - H, NOW - H, NOW - H], said_at: [NOW - H, NOW - H, NOW - H, NOW - H] });
    expect(facts(p, 5, 2, NOW - 2 * H).tip).toBe([workingTip(5), waitsTip(2), projects.new_artifacts({ n: 3 }), projects.unread({ n: 4 })].join(' · '));
  });
});

describe('the week', () => {
  it("21 buckets ending with now's", () => {
    expect(weekOf(pulse(), NOW)).toEqual(week);
  });

  it("a stopped hub's buckets slide by the 8 h steps since, the new ones empty", () => {
    expect(weekOf(pulse(), NOW + 2 * BUCKET_MS)).toEqual([...week.slice(2), 0, 0]);
    expect(weekOf(pulse(), NOW + 30 * BUCKET_MS)).toEqual(new Array<number>(BUCKETS).fill(0));
  });

  it('the sparkline: left to right over 44, the busiest bucket at the top (1 in), an idle one at the bottom', () => {
    const pts = sparkPoints([0, 5, 10]).split(' ');
    expect(pts).toEqual(['0.0,11.0', '22.0,6.0', '44.0,1.0']);
    expect(sparkPoints([0, 0])).toBe('0.0,11.0 44.0,11.0');
    expect(sparkPoints(week).split(' ')).toHaveLength(BUCKETS);
  });
});

it('the row type is the proto row plus the pulse', () => {
  const r: ProjectRow = row(null);
  expect(r.project).toBe('acme');
});
