// @vitest-environment happy-dom
// How bise's answer appears in the spotlight and the capsule (ambient's text-appearing, m_12403).
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { answerRuns, fadeUnits, inlineRuns, runsText, staggerOf, tableCols, tableRows } from './live';
import { LiveText } from './LiveText';

describe('answerRuns: the shaping, never a raw mark', () => {
  it('bold and code close in place; an open mark shows plain, without the mark', () => {
    expect(inlineRuns('the **index** is `walked` twice')).toEqual([
      { style: 'text', text: 'the ' },
      { style: 'bold', text: 'index' },
      { style: 'text', text: ' is ' },
      { style: 'code', text: 'walked' },
      { style: 'text', text: ' twice' },
    ]);
    expect(inlineRuns('the **ind')).toEqual([{ style: 'text', text: 'the ind' }]);
    expect(inlineRuns('run `cargo te')).toEqual([{ style: 'text', text: 'run cargo te' }]);
    expect(inlineRuns('## Why')).toEqual([{ style: 'bold', text: 'Why' }]);
  });
  it('closing a mark keeps the plain text a prefix of the next update (nothing re-fades)', () => {
    const a = runsText(answerRuns('the **ind', true));
    const b = runsText(answerRuns('the **index** is', true));
    expect(b.startsWith(a)).toBe(true);
  });
  it('a code line waits for its newline while live, shows whole when done', () => {
    const t = 'run it:\n```sh\ncargo bench\ncargo te';
    expect(answerRuns(t, true)).toEqual([
      { style: 'text', text: 'run it:' },
      { style: 'block', text: 'cargo bench' },
    ]);
    expect(answerRuns(`${t}st\n\`\`\`\nthen read it`, false)).toEqual([
      { style: 'text', text: 'run it:' },
      { style: 'block', text: 'cargo bench\ncargo test' },
      { style: 'text', text: 'then read it' },
    ]);
  });
  it('a table shows once its separator arrived, a row once complete, columns from the header', () => {
    expect(answerRuns('| run | time |\n', true)).toEqual([]);
    expect(answerRuns('| run | time |\n|---|---|\n| cold | 4.1', true)).toEqual([{ style: 'table', text: 'run\ttime' }]);
    expect(answerRuns('| run | time |\n|---|---|\n| cold | 4.1 s |\n', true)).toEqual([{ style: 'table', text: 'run\ttime\ncold\t4.1 s' }]);
    // the cells: as many as the header's; the columns fixed from the header, 6 characters at least
    expect(tableRows('run\ttime\ncold\t4.1 s')).toEqual([['run', 'time'], ['cold', '4.1 s']]);
    expect(answerRuns('| a | b |\n|---|---|\n| 1 |\n| 2 | 3 | 4 |\n', false)).toEqual([{ style: 'table', text: 'a\tb\n1\t\n2\t3' }]);
    expect(tableCols(['run', 'duration in ms'])).toBe('8ch 16ch');
  });
  it('a list keeps its dash; prose lines keep their breaks', () => {
    expect(runsText(answerRuns('two causes:\n- the index\n- the cache', false))).toBe('two causes:\n- the index\n- the cache');
  });
});

describe('the fade units', () => {
  it('words with their spaces, whole lines in a code box; stagger min(30, 120 / n)', () => {
    expect(fadeUnits(' is walked twice.', false)).toEqual([' is ', 'walked ', 'twice.']);
    expect(fadeUnits('a\nb\n', true)).toEqual(['a\n', 'b\n']);
    expect(staggerOf(2)).toBe(30);
    expect(staggerOf(8)).toBe(15);
  });
});

describe('LiveText', () => {
  const A = 'The cold bench takes 4.1 s because';
  const B = 'The cold bench takes 4.1 s because the index is walked twice.';
  let reduced = false;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'matchMedia').mockImplementation((q: string) => ({ matches: reduced && q.includes('reduce'), media: q, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }));
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  });
  afterEach(() => {
    cleanup();
    reduced = false;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('only the new words fade, staggered; then they merge back into plain text', () => {
    const ui = render(<LiveText text={A} live testId="t" />);
    const root = ui.getByTestId('t');
    expect(root.querySelectorAll('.fade')).toHaveLength(0); // what was there at mount just shows
    ui.rerender(<LiveText text={B} live testId="t" />);
    const fades = [...root.querySelectorAll<HTMLElement>('.fade')];
    expect(fades.map((f) => f.textContent).join('')).toBe(' the index is walked twice.');
    expect(fades.map((f) => f.style.getPropertyValue('--d'))).toEqual(['0ms', '24ms', '48ms', '72ms', '96ms']);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(root.querySelectorAll('.fade')).toHaveLength(0);
    expect(root.textContent).toBe(`${B} ∿`);
  });

  it("no caret: the '∿' rides after the last word while live, and leaves when done", () => {
    const ui = render(<LiveText text={A} live testId="t" />);
    expect(ui.getByTestId('t.sign').textContent).toBe(' ∿');
    ui.rerender(<LiveText text={A} live={false} testId="t" />);
    expect(ui.queryByTestId('t.sign')).toBeNull();
    expect(ui.getByTestId('t').textContent).toBe(A);
  });

  it("after a code box or a table the '∿' sits out of the layout under it; after text, inline", () => {
    const ui = render(<LiveText text={'Look:\n```\nlet a = 1;\n```\n'} live testId="t" />);
    expect(ui.getByTestId('t.sign').className).toContain('after');
    expect(ui.getByTestId('t.sign').textContent).toBe('∿');
    ui.rerender(<LiveText text={'Look:\n| run | time |\n|---|---|\n| cold | 2.0 s |\n'} live testId="t" />);
    expect(ui.getByTestId('t.sign').className).toContain('after');
    ui.rerender(<LiveText text={'Look:\n| run | time |\n|---|---|\n| cold | 2.0 s |\nSo the'} live testId="t" />);
    expect(ui.getByTestId('t.sign').className).not.toContain('after');
    expect(ui.getByTestId('t.sign').textContent).toBe(' ∿');
  });

  it('a table draws as rows of cells, its header first, the columns from the header; a new row fades whole', () => {
    const ui = render(<LiveText text={'| run | time |\n|---|---|\n| cold | 4.1 s |\n'} live testId="t" />);
    const rows = (): HTMLElement[] => Array.from(ui.getByTestId('t').querySelectorAll<HTMLElement>('.table .tr'));
    expect(rows().map((r) => Array.from(r.children).map((c) => c.textContent))).toEqual([['run', 'time'], ['cold', '4.1 s']]);
    expect(rows()[0]?.className).toContain('th');
    expect(rows().map((r) => r.style.gridTemplateColumns)).toEqual(['8ch 8ch', '8ch 8ch']);
    ui.rerender(<LiveText text={'| run | time |\n|---|---|\n| cold | 4.1 s |\n| warm | 0.3 s |\n'} live testId="t" />);
    expect(rows().map((r) => r.className.includes('fade'))).toEqual([false, false, true]);
    expect(rows()[2]?.textContent).toBe('warm0.3 s');
  });

  it('reduced motion: the text comes, no fade, a still sign', () => {
    reduced = true;
    const ui = render(<LiveText text={A} live testId="t" />);
    ui.rerender(<LiveText text={B} live testId="t" />);
    expect(ui.getByTestId('t').querySelectorAll('.fade')).toHaveLength(0);
    expect(ui.getByTestId('t.sign').className).toContain('still');
  });

  it('a text that is not a continuation swaps in place with one crossfade', () => {
    const ui = render(<LiveText text={B} live testId="t" />);
    ui.rerender(<LiveText text="Another answer." live={false} testId="t" />);
    const root = ui.getByTestId('t');
    expect(root.className).toContain('swap1');
    expect(root.querySelectorAll('.fade')).toHaveLength(0);
  });
});
