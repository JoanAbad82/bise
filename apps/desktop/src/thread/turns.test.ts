// A turn's fold (mockup 1, QA §4): 'worked for 3m 10s ›' at the start of each turn that did work,
// from the hub's turn marks on the entries; its thinking folded under it.
import { describe, expect, it } from 'vitest';
import { turnKey, turnsOf, turnTime, withTurns, type TurnEntry } from './turns';

const key = (pos: number) => `e:${String(pos)}`;
const T0 = 1_791_100_000_000;

/** his message, then a turn: thinking, tools, the reply (its end 3m 10s after its start), then his next and a turn at work */
const rows: Record<number, TurnEntry> = {
  1: { kind: 'you', at_ms: T0 },
  2: { kind: 'thinking', at_ms: T0 + 1000, turn_start: true },
  3: { kind: 'tools', at_ms: T0 + 5000 },
  4: { kind: 'agent', at_ms: T0 + 190_000, turn_end_ms: T0 + 191_000 },
  5: { kind: 'you', at_ms: T0 + 300_000 },
  6: { kind: 'tools', at_ms: T0 + 301_000, turn_start: true },
};
const of = (pos: number) => rows[pos];

describe("a turn's fold line", () => {
  it("each turn that did work, from its first entry; its length from the hub's turn end; the last one may still run", () => {
    expect(turnsOf([1, 2, 3, 4, 5, 6], of)).toEqual([
      { start: 2, at: T0 + 1000, ms: 190_000, hides: [2] },
      { start: 6, at: T0 + 301_000, ms: null, hides: [] },
    ]);
  });

  it('a plain reply has no line; an older turn whose end the hub never said has none either (a replay)', () => {
    const plain: Record<number, TurnEntry> = { 1: { kind: 'you', at_ms: 1 }, 2: { kind: 'agent', at_ms: 2, turn_start: true, turn_end_ms: 3 } };
    expect(turnsOf([1, 2], (p) => plain[p])).toEqual([]);
    const replay: Record<number, TurnEntry> = { 1: { kind: 'tools', at_ms: 1, turn_start: true }, 2: { kind: 'tools', at_ms: 2, turn_start: true, turn_end_ms: 9 } };
    expect(turnsOf([1, 2], (p) => replay[p]).map((t) => t.start)).toEqual([2]);
  });

  it('the line goes before its first row; folded, its thinking leaves the list; open, it comes back', () => {
    const turns = turnsOf([1, 2, 3, 4, 5, 6], of);
    const keys = [1, 2, 3, 4, 5, 6].map(key);
    expect(withTurns(keys, turns, new Set(), key)).toEqual(['e:1', turnKey(2), 'e:3', 'e:4', 'e:5', turnKey(6), 'e:6']);
    expect(withTurns(keys, turns, new Set([2]), key)).toEqual(['e:1', turnKey(2), 'e:2', 'e:3', 'e:4', 'e:5', turnKey(6), 'e:6']);
  });

  it("says its length as the mockup does: '4s', '42s', '3m 10s', '1h 5m'", () => {
    expect([turnTime(4_200), turnTime(42_000), turnTime(190_000), turnTime(3_900_000)]).toEqual(['4s', '42s', '3m 10s', '1h 5m']);
  });
});
