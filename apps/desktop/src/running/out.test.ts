import { describe, expect, it } from 'vitest';
import { START, take, type Chunk, type OutState } from './out';

const enc = new TextEncoder();
const dec = new TextDecoder();
const chunk = (at: number, text: string, end = at + text.length): Chunk => ({ at, bytes: enc.encode(text), end });
/** Feeds chunks in order: the text written and the offsets asked. */
function run(...cs: Chunk[]): { text: string; asks: number[]; state: OutState } {
  let state = START;
  let text = '';
  const asks: number[] = [];
  for (const c of cs) {
    const s = take(state, c);
    state = s.state;
    text += s.write.map((b) => dec.decode(b)).join('');
    if (s.ask !== null) asks.push(s.ask);
  }
  return { text, asks, state };
}

describe("a process's output", () => {
  it('the first range, then the follow from its end: each byte once, in order', () => {
    expect(run(chunk(100, 'hello '), chunk(106, 'world')).text).toBe('hello world');
  });

  it('a follow chunk that overlaps what was written writes only its new part', () => {
    expect(run(chunk(0, 'abcdef'), chunk(3, 'defgh')).text).toBe('abcdefgh');
    expect(run(chunk(0, 'abcdef'), chunk(2, 'cd')).text).toBe('abcdef');
  });

  it('the answer carried less than the output holds: ask the rest from where it stopped', () => {
    const r = run(chunk(0, 'abc', 10));
    expect(r.asks).toEqual([3]);
    expect(run(chunk(0, 'abc', 10), chunk(3, 'defghij')).text).toBe('abcdefghij');
  });

  it('a follow chunk past a gap waits, the gap is asked once, then both go in order', () => {
    const r = run(chunk(0, 'abc'), chunk(6, 'ghi'));
    expect(r.text).toBe('abc');
    expect(r.asks).toEqual([3]);
    expect(run(chunk(0, 'abc'), chunk(6, 'ghi'), chunk(3, 'def')).text).toBe('abcdefghi');
  });

  it('a gap asked once that the hub no longer keeps is let go: the next chunk goes as it is', () => {
    const r = run(chunk(0, 'abc'), chunk(6, 'ghi'), chunk(9, 'jk'));
    expect(r.text).toBe('abcghijk');
    expect(r.asks).toEqual([3]);
  });
});
