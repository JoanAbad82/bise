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

  it('follows the order at once when nothing holds it', () => {
    const v = render(<List rows={['perf', 'docs']} />);
    v.rerender(<List rows={['docs', 'perf']} />);
    expect(order(v.container)).toEqual(['docs', 'perf']);
  });
});
