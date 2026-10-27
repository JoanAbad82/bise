// The sidebar's project rows all have the one layout (his m_48450, designer m_48464): a busy
// project and an empty one draw the same two lines at the same height. Line 1 its name and its
// end slot (the pill, its age, or empty), line 2 a sentence (a quiet one: its last news, else
// 'all quiet') and its week's 7 day bars (flat stubs while the week is unknown). Typed inputs in;
// each row's parts out, read through the sidebar's own facts.
import { describe, expect, it } from 'vitest';
import { projects, row } from './inputs';
import { feature } from './run';

const NOW = 1_791_100_000_000;
const H = 3_600_000;
const busyWeek = Array.from({ length: 21 }, (_, i) => (i % 4) * 20 * 60_000);
const pulse = (o: Record<string, unknown> = {}) => ({ from_ms: NOW - 20 * 8 * H, busy_ms: busyWeek, last_ms: NOW - 2 * H, counting: false, ...o });

// lots going on: three wait on him, new artifacts, a land since he looked
const busy = row({ project: 'acme-1a2b3c4d', name: 'acme', cards: null as never, waits: 3, pulse: pulse({ artifacts_at: [NOW - H, NOW - 2 * H], news: { at_ms: NOW - H, what: { kind: 'landed', agent: 'brush', sha: 'abc', target: 'main' } } }) });
// nothing at all: a hub that sends no pulse yet, nothing waits
const empty = row({ project: 'docs-9f8e7d6c', name: 'docs', order: 2, pulse: null });
// quiet: its last news is old news, nothing new since
const quiet = row({ project: 'bims-5e6f7a8b', name: 'bims', order: 3, pulse: pulse({ last_ms: NOW - 50 * H, news: { at_ms: NOW - 50 * H, what: { kind: 'artifact', id: 'a1', title: 'evals pass' } } }) });
// he looked at bims after its last news; acme and docs never
const SEEN = { 'bims-5e6f7a8b': NOW - 10 * H };

describe('every project row has the one layout, busy or empty', () => {
  it('a busy row and an empty one: the same height, the same parts', () => {
    const w = feature(NOW).given(projects(busy, empty, quiet));
    const rows = w.view.projectRows(SEEN);
    expect(rows.map((r) => r.name)).toEqual(['acme', 'docs', 'bims']);
    for (const r of rows) {
      expect(r.say).not.toBe('');
      expect(r.bars).toBe(7);
    }
  });

  it("a quiet row's line 2 is its last news, even seen; the empty one says something else (its words: projectfacts.test.ts)", () => {
    const w = feature(NOW).given(projects(busy, empty, quiet));
    const by = Object.fromEntries(w.view.projectRows(SEEN).map((r) => [r.name, r]));
    expect(by.acme?.quiet).toBe(false);
    expect(by.bims?.quiet).toBe(true);
    expect(by.bims?.say).toContain('evals pass');
    expect(by.docs?.quiet).toBe(true);
    expect(by.docs?.say).not.toContain('evals pass');
  });
});
