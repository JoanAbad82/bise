import { describe, expect, it } from 'vitest';
import { fade, staggerOf, type HNode } from './fade';

const t = (value: string): HNode => ({ type: 'text', value });
const el = (tagName: string, children: HNode[], properties: Record<string, unknown> = {}): HNode => ({ type: 'element', tagName, properties, children });
const root = (...children: HNode[]): HNode => ({ type: 'root', children });
const spans = (n: HNode): HNode[] => (n.children ?? []).flatMap((c) => (c.tagName === 'span' && (c.properties?.className as string[] | undefined)?.includes('th-w') ? [c] : spans(c)));
const words = (n: HNode): string[] => spans(n).map((s) => s.children?.[0]?.value ?? '');

describe('the new words of a streamed answer fade in (text-appearing v2)', () => {
  it('only the text past `from` fades, word by word; what was shown stays plain', () => {
    const tree = root(el('p', [t('The cold bench takes 4.1 s')]));
    let total = -1;
    fade({ from: 'The cold '.length, onTotal: (n) => (total = n) })(tree);
    expect(words(tree)).toEqual(['bench', 'takes', '4.1', 's']);
    expect(tree.children?.[0]?.children?.[0]).toEqual(t('The cold '));
    expect(total).toBe('The cold bench takes 4.1 s'.length);
  });
  it('the words of one update start evenly spread over ~300 ms: 300 ms ÷ count apart (R40, designer m_17507)', () => {
    expect(staggerOf(0)).toBe(0);
    expect(staggerOf(2)).toBe(150);
    expect(staggerOf(12)).toBe(25);
    const tree = root(el('p', [t('a b c d e f g h i j k l')]));
    fade({ from: 0 })(tree);
    const delays = spans(tree).map((s) => Number(/(\d+)ms/.exec(String(s.properties?.style))?.[1]));
    expect(delays).toEqual([0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275]);
    // a 4-word chunk: a steady flow across the gap, not a 30 ms burst
    const four = root(el('p', [t('the index is walked')]));
    fade({ from: 0 })(four);
    expect(spans(four).map((s) => Number(/(\d+)ms/.exec(String(s.properties?.style))?.[1]))).toEqual([0, 75, 150, 225]);
  });
  it('nothing fades once everything was shown (the spans are gone: plain text again)', () => {
    const tree = root(el('p', [t('all shown')]));
    fade({ from: Infinity })(tree);
    expect(spans(tree)).toEqual([]);
  });
  it('a new list item fades as one with its dash, then its words', () => {
    const tree = root(el('ul', [el('li', [t('one')]), el('li', [t('two')])]));
    fade({ from: 3 })(tree);
    const lis = tree.children?.[0]?.children ?? [];
    expect(lis[0]?.properties?.className).toBeUndefined();
    expect(lis[1]?.properties?.className).toEqual(['th-in']);
    expect(words(tree)).toEqual(['two']);
  });
  it('code: no word spans; the box fades once; <code> says where its new lines start', () => {
    const code = el('code', [t('fn a() {}\nfn b() {}\n')]);
    const tree = root(el('p', [t('see:')]), el('pre', [code]));
    fade({ from: 'see:'.length + 'fn a() {}\n'.length })(tree);
    expect(spans(tree)).toEqual([]);
    expect(code.properties?.dataFrom).toBe('10');
    // a new box: its frame fades
    const tree2 = root(el('p', [t('see:')]), el('pre', [el('code', [t('x\n')])]));
    fade({ from: 4 })(tree2);
    expect(tree2.children?.[1]?.properties?.className).toEqual(['th-in']);
  });
  it('the working sign rides after the last word', () => {
    const tree = root(el('p', [t('first')]), el('ul', [el('li', [t('one')])]));
    fade({ from: Infinity, wave: true })(tree);
    const li = tree.children?.[1]?.children?.[0];
    expect(li?.children?.at(-1)?.children?.[0]?.value).toBe('∿');
  });
  it('after a table or a code box the sign sits under it, with no line of its own (th-wave-under)', () => {
    const tree = root(el('p', [t('sizes:')]), el('table', [el('tr', [el('td', [t('1')])])]));
    fade({ from: Infinity, wave: true })(tree);
    const wave = tree.children?.at(-1);
    expect(wave?.properties?.className).toEqual(['th-wave', 'th-wave-under']);
  });
});
