// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { moved, PAGE, shownSel, stepOf, useListKeys } from './listkeys';

afterEach(cleanup);

const ROWS = Array.from({ length: 25 }, (_, i) => `r${String(i)}`);

describe('the list keys (pure)', () => {
  it("the TUI's moves: ↑/k ↓/j one, pgup/pgdn ten, home/end the ends; others are no move", () => {
    expect(['ArrowDown', 'j', 'ArrowUp', 'k', 'PageDown', 'PageUp'].map(stepOf)).toEqual([1, 1, -1, -1, PAGE, -PAGE]);
    expect(['a', ' ', 'Enter', 'Escape'].map(stepOf)).toEqual([0, 0, 0, 0]);
    expect(moved(ROWS, 'r0', stepOf('End'))).toBe('r24');
    expect(moved(ROWS, 'r24', stepOf('Home'))).toBe('r0');
  });

  it('clamps at the ends, never wraps; from no selection, the first row', () => {
    expect(moved(ROWS, 'r0', -1)).toBe('r0');
    expect(moved(ROWS, 'r24', 1)).toBe('r24');
    expect(moved(ROWS, 'r20', PAGE)).toBe('r24');
    expect(moved(ROWS, null, 1)).toBe('r0');
    expect(moved(ROWS, 'gone', -1)).toBe('r0');
    expect(moved([], null, 1)).toBeNull();
  });

  it('shows the chosen row while it is listed, else the first', () => {
    expect(shownSel(ROWS, 'r3')).toBe('r3');
    expect(shownSel(ROWS, 'gone')).toBe('r0');
    expect(shownSel([], null)).toBeNull();
  });
});

function List({ rows, opened, keyed }: { rows: readonly string[]; opened: string[]; keyed: string[] }) {
  const { sel, setSel, ref, onKeyDown } = useListKeys<HTMLDivElement>({
    order: rows,
    onOpen: (k) => opened.push(k),
    onKey: (e, k) => {
      if (e.key !== 'x') return false;
      keyed.push(`x ${k ?? ''}`);
      return true;
    },
  });
  return (
    <div ref={ref} tabIndex={-1} onKeyDown={onKeyDown} data-testid="list">
      <input data-testid="field" />
      <button data-testid="btn">b</button>
      {rows.map((r) => (
        <div key={r} data-row={r} aria-selected={sel === r} onClick={() => { setSel(r); }} data-testid={`row.${r}`}>{r}</div>
      ))}
    </div>
  );
}

describe('useListKeys', () => {
  it('↓↓⏎ opens the 3rd; ↑ at the top stays; the list has the focus when it opens', () => {
    const opened: string[] = [];
    render(<List rows={ROWS} opened={opened} keyed={[]} />);
    const list = screen.getByTestId('list');
    expect(document.activeElement).toBe(list);
    expect(screen.getByTestId('row.r0').getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(list, { key: 'ArrowUp' });
    expect(screen.getByTestId('row.r0').getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    fireEvent.keyDown(list, { key: 'j' });
    fireEvent.keyDown(list, { key: 'Enter' });
    expect(opened).toEqual(['r2']);
    fireEvent.keyDown(list, { key: 'End' });
    fireEvent.keyDown(list, { key: 'Enter' });
    expect(opened).toEqual(['r2', 'r24']);
  });

  it("a click picks; the screen's own keys get the selected row; a field and a button keep their keys", () => {
    const opened: string[] = [];
    const keyed: string[] = [];
    render(<List rows={ROWS} opened={opened} keyed={keyed} />);
    fireEvent.click(screen.getByTestId('row.r5'));
    fireEvent.keyDown(screen.getByTestId('list'), { key: 'x' });
    expect(keyed).toEqual(['x r5']);
    fireEvent.keyDown(screen.getByTestId('field'), { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByTestId('field'), { key: 'Enter' });
    fireEvent.keyDown(screen.getByTestId('btn'), { key: 'Enter' });
    expect(screen.getByTestId('row.r5').getAttribute('aria-selected')).toBe('true');
    expect(opened).toEqual([]);
  });

  it('a hover never moves the selection; ⌘↓ is not a move', () => {
    render(<List rows={ROWS} opened={[]} keyed={[]} />);
    fireEvent.mouseEnter(screen.getByTestId('row.r7'));
    fireEvent.mouseOver(screen.getByTestId('row.r7'));
    fireEvent.keyDown(screen.getByTestId('list'), { key: 'ArrowDown', metaKey: true });
    expect(screen.getByTestId('row.r0').getAttribute('aria-selected')).toBe('true');
  });
});
