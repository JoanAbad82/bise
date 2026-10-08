// Laws of R07-a's preview (designer m_13271): the selected agent's last actions in the thread's marks.
import { describe, expect, it } from 'vitest';
import type { Entry } from '@/proto';
import { PREVIEW_LINES, actionTime, previewLines } from './preview';

const NOW = new Date(2026, 9, 8, 15, 0).getTime();
const at = (minAgo: number): number => NOW - minAgo * 60_000;
const e = (x: Partial<Entry> & Pick<Entry, 'pos' | 'kind'>): Entry => ({ at_ms: at(1), text: '', ...x });
const texts = (es: Entry[]): string[] => previewLines(es, NOW).map((l) => l.text);

describe('previewLines', () => {
  it('reads each kind in the thread marks: $ command, ± file (no tool name), › words (no said:), ✓ done, ▲ failed, ? question', () => {
    expect(
      texts([
        e({ pos: 1, kind: 'tools', tools: { count: 2, summary: '', items: [
          { pos: 2, at_ms: at(9), kind: 'run', text: 'bash: {"command":"cargo test -p core"}', state: 'ok' },
          { pos: 3, at_ms: at(8), kind: 'edit', text: 'edit: {"file_path":"panels.md"}', state: 'ok' },
        ] } }),
        e({ pos: 4, kind: 'agent', text: '**the cache** is warm now\n\nmore' }),
        e({ pos: 5, kind: 'report', text: '[report: done] flush batched\nthe rest', report: { kind: 'done' } }),
      ]),
    ).toEqual(['$ cargo test -p core', '± panels.md', '› the cache is warm now', '✓ done · flush batched']);
    expect(texts([e({ pos: 1, kind: 'report', text: '[report: failed] tests red', report: { kind: 'failed' } })])).toEqual(['▲ failed · tests red']);
  });

  it(`keeps the last ${String(PREVIEW_LINES)}, newest last`, () => {
    const es = [1, 2, 3, 4, 5, 6].map((n) => e({ pos: n, kind: 'agent', text: `line ${String(n)}` }));
    expect(texts(es)).toEqual(['› line 3', '› line 4', '› line 5', '› line 6']);
  });

  it('an open question waits on him (ask); an answered one and his own words are not actions', () => {
    const ls = previewLines([
      e({ pos: 1, kind: 'you', text: 'look at p99' }),
      e({ pos: 2, kind: 'card', text: '', card: { id: 1, question: 'ship it?', options: [], answered: true } }),
      e({ pos: 3, kind: 'card', text: '', card: { id: 2, question: 'compaction at 03:00?', options: [], answered: false } }),
    ], NOW);
    expect(ls.map((l) => [l.text, l.ask])).toEqual([['? compaction at 03:00?', true]]);
  });

  it('no actions yet: none (the objective stays)', () => {
    expect(previewLines([], NOW)).toEqual([]);
    expect(previewLines([e({ pos: 1, kind: 'thinking', text: 'hmm' })], NOW)).toEqual([]);
  });
});

describe('actionTime', () => {
  it("'now' under a minute, minutes within the hour, else the clock", () => {
    expect(actionTime(NOW - 20_000, NOW)).toBe('now');
    expect(actionTime(at(2), NOW)).toBe('2m');
    expect(actionTime(at(59), NOW)).toBe('59m');
    expect(actionTime(at(58 + 60), NOW)).toBe('13:02');
    expect(actionTime(0, NOW)).toBe('');
  });
});
