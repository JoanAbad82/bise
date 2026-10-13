// V7 / L11: quote a diff's lines (diffquote.rs quotes): one quote per file the selection touches,
// hunk heads left out, the lines with their marks, where in the new and old file; and the
// composer's quote chip says where and tags it as the TUI's tag_at.
import { describe, expect, it } from 'vitest';
import type { DiffLine as DsLine } from '@/ds';
import { buildMessage, chipStrip, quoteAbout } from '@/composer/message';
import { flatRows, handQuotes, quotesOf, span, takeQuotes } from './quote';

const a: DsLine[] = [
  { text: '@@ -11,3 +12,3 @@', sign: '' },
  { old: 11, new: 12, sign: '', text: 'fn a() {' },
  { old: 12, new: null, sign: '-', text: '    x' },
  { old: null, new: 13, sign: '+', text: '    y' },
  { old: 13, new: 14, sign: '', text: '}' },
];
const b: DsLine[] = [
  { text: '@@ -1,2 +1,1 @@', sign: '' },
  { old: 1, new: null, sign: '-', text: 'gone' },
  { old: 2, new: null, sign: '-', text: 'gone too' },
];
const files = [a, b];
const rows = flatRows(files);

describe('quote diff lines', () => {
  it('span: one number, a range, none', () => {
    expect(span([12])).toBe('12');
    expect(span([14, 12, 13])).toBe('12-14');
    expect(span([])).toBe('');
  });

  it('one quote per file, hunk heads out, marks kept, either drag direction', () => {
    const qs = quotesOf(['src/a.rs', 'src/b.rs'], files, rows, { anchor: 7, head: 0 });
    expect(qs).toEqual([
      { at: { file: 'src/a.rs', new: '12-14', old: '11-13' }, text: ' fn a() {\n-    x\n+    y\n }' },
      { at: { file: 'src/b.rs', new: '', old: '1-2' }, text: '-gone\n-gone too' },
    ]);
    expect(quotesOf(['src/a.rs'], files, rows, { anchor: 0, head: 0 })).toEqual([]);
  });

  it("the chip says where, as quote.rs about(); the send carries it as a typed quote", () => {
    expect(quoteAbout('perf vs main', ' a\n-b\n+c', { file: 'src/a.rs', new: '12-14', old: '11-12' })).toBe('src/a.rs:12-14 · 3 lines');
    expect(quoteAbout('perf vs main', '-a\n-b', { file: 'src/b.rs', new: '', old: '1-2' })).toBe('src/b.rs:1-2 · 2 removed lines');
    // main is 'bise', as the thread draws its author (designer m_21425)
    expect(quoteAbout('main', 'one')).toBe('bise · 1 line');
    expect(quoteAbout('perf', 'one')).toBe('perf · 1 line');
    const chip = { kind: 'quote', n: 1, text: ' a\n-b\n+c', from: 'perf vs main', at: { file: 'src/a "b".rs', new: '12-14', old: '11' } } as const;
    expect(chipStrip(chip)).toContain('src/a "b".rs:12-14 · 3 lines');
    // typed: the hub renders quote.rs's tag from the part (delta review D2)
    expect(buildMessage([{ kind: 'chip', chip }, { kind: 'text', text: 'why?' }]).parts).toEqual([
      { kind: 'quote', from: 'perf vs main', text: ' a\n-b\n+c', file: 'src/a "b".rs', new: '12-14', old: '11' },
      { kind: 'text', text: 'why?' },
    ]);
  });

  it('the hand-off goes to the thread it names, once', () => {
    handQuotes({ project: 'p', agent: 'perf', from: 'perf vs main', quotes: [], key: 'w' });
    expect(takeQuotes('p', 'main')).toBeNull();
    expect(takeQuotes('p', 'perf')?.key).toBe('w');
    expect(takeQuotes('p', 'perf')).toBeNull();
  });
});
