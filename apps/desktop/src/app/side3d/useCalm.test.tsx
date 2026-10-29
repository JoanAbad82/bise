// @vitest-environment happy-dom
import { fireEvent, render } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { useCalm } from './useCalm';

function List({ rows }: { rows: readonly string[] }) {
  const box = useRef<HTMLDivElement>(null);
  const calm = useCalm(rows, (r) => r, box);
  return (
    <div ref={box} {...calm.bind} data-testid="list">
      {calm.rows.map((r) => (
        <p key={r} data-calm={r}>{r}</p>
      ))}
    </div>
  );
}

/** the same list, each row a button he can Tab to */
function FocusList({ rows }: { rows: readonly string[] }) {
  const box = useRef<HTMLDivElement>(null);
  const calm = useCalm(rows, (r) => r, box);
  return (
    <div ref={box} {...calm.bind}>
      {calm.rows.map((r) => (
        <button key={r} type="button" data-calm={r}>{r}</button>
      ))}
    </div>
  );
}

const order = (c: HTMLElement): string[] => [...c.querySelectorAll('[data-calm]')].map((e) => e.textContent);

describe('an agents list under the pointer (designer m_47454)', () => {
  it('holds the order while the pointer is over it, takes the new one when it leaves', () => {
    const v = render(<List rows={['perf', 'docs', 'seo']} />);
    const list = v.getByTestId('list');
    fireEvent.pointerEnter(list);
    // seo starts working: the hub ranks it first, the list he points at holds
    v.rerender(<List rows={['seo', 'perf', 'docs']} />);
    expect(order(v.container)).toEqual(['perf', 'docs', 'seo']);
    fireEvent.pointerLeave(list);
    expect(order(v.container)).toEqual(['seo', 'perf', 'docs']);
  });

  it('holds the order while a row has keyboard focus, takes the new one on blur (designer m_47705)', () => {
    const v = render(<FocusList rows={['perf', 'docs', 'seo']} />);
    const perf = v.getByRole('button', { name: 'perf' });
    // Tab onto a row: the browser marks it :focus-visible
    perf.matches = (s: string) => s === ':focus-visible';
    fireEvent.focus(perf);
    v.rerender(<FocusList rows={['seo', 'perf', 'docs']} />);
    expect(order(v.container)).toEqual(['perf', 'docs', 'seo']);
    fireEvent.blur(perf);
    expect(order(v.container)).toEqual(['seo', 'perf', 'docs']);
  });

  it('a click focus does not hold it', () => {
    const v = render(<FocusList rows={['perf', 'docs']} />);
    const perf = v.getByRole('button', { name: 'perf' });
    perf.matches = () => false;
    fireEvent.focus(perf);
    v.rerender(<FocusList rows={['docs', 'perf']} />);
    expect(order(v.container)).toEqual(['docs', 'perf']);
  });

  it('follows the order at once when nothing holds it', () => {
    const v = render(<List rows={['perf', 'docs']} />);
    v.rerender(<List rows={['docs', 'perf']} />);
    expect(order(v.container)).toEqual(['docs', 'perf']);
  });
});
