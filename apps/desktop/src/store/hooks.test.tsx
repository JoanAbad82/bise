// @vitest-environment happy-dom
import { act, render } from '@testing-library/react';
import { memo } from 'react';
import { describe, expect, it } from 'vitest';
import type { Entry } from '@/proto';
import { StoreProvider, useEntry, usePending, useThreadOrder } from './hooks';
import { Store, threadKey } from './store';

const P = 'acme-1a2b3c4d';
const K = threadKey(P, 'perf');
const entry = (pos: number, text: string): Entry => ({ pos, at_ms: pos, kind: 'agent', text });

describe('hooks', () => {
  it('a new or replaced entry re-renders only its row (and the list only on a new position)', () => {
    const store = new Store(null);
    store.apply({ ev: 'thread', project: P, agent: 'perf', entries: [entry(1, 'a'), entry(2, 'b')], before: null, more: false });
    const renders: Record<string, number> = {};
    const bump = (k: string): void => {
      renders[k] = (renders[k] ?? 0) + 1;
    };
    // rows are memo'd, as the thread's list does: then only the store decides who re-renders
    const Row = memo(function Row(props: { pos: number }) {
      const e = useEntry(K, props.pos);
      bump(`row${String(props.pos)}`);
      return <p data-testid={`thread.row.${String(props.pos)}`}>{e?.text}</p>;
    });
    function List() {
      const { order } = useThreadOrder(K);
      bump('list');
      return (
        <div>
          {order.map((pos) => (
            <Row key={pos} pos={pos} />
          ))}
        </div>
      );
    }
    function Composer() {
      usePending(K);
      bump('composer');
      return null;
    }
    const view = render(
      <StoreProvider store={store}>
        <List />
        <Composer />
      </StoreProvider>,
    );
    const before = { ...renders };
    act(() => {
      store.apply({ ev: 'entry', project: P, agent: 'perf', entry: entry(2, 'b, more') });
    });
    expect(renders['row2']).toBe((before['row2'] ?? 0) + 1);
    expect(renders['row1']).toBe(before['row1']);
    expect(renders['list']).toBe(before['list']);
    expect(renders['composer']).toBe(before['composer']);
    expect(view.getByTestId('thread.row.2').textContent).toBe('b, more');

    const mid = { ...renders };
    act(() => {
      store.apply({ ev: 'entry', project: P, agent: 'perf', entry: entry(3, 'c') });
    });
    expect(renders['list']).toBe((mid['list'] ?? 0) + 1);
    expect(renders['row1']).toBe(mid['row1']);
    expect(renders['row2']).toBe(mid['row2']);
    expect(renders['composer']).toBe(mid['composer']);
    expect(view.getByTestId('thread.row.3').textContent).toBe('c');
  });
});
