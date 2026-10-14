// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CoreCmd, CorePort } from '@/shared/api';
import { Store, StoreProvider, threadKey } from '@/store';
import { applyRoute } from './routes';
import { PendingRow, type RowCtx } from './rows';

const H = 'bise-home-00000000';
const K = threadKey(H, 'main');
const route = (rid: number, to: string, text: string, until = Date.now() + 2000) => ({ ev: 'route' as const, project: H, rid, to, name: to.split('-')[0] ?? to, text, correct_until_ms: until, why: 'Safari' });

afterEach(cleanup);

describe("bise's routing hold", () => {
  it('binds a route to the oldest pending send with its words, follows a correction, ends on route_done', () => {
    const pending = [
      { cid: 1, text: 'why does p99 rise' },
      { cid: 2, text: 'why does p99 rise' },
    ];
    let h = applyRoute([], route(3, 'acme-1', 'why does p99 rise'), pending);
    expect(h.map((x) => [x.rid, x.cid, x.state])).toEqual([[3, 1, 'held']]);
    h = applyRoute(h, route(4, 'acme-1', 'why does p99 rise'), pending);
    expect(h.map((x) => x.cid)).toEqual([1, 2]);
    h = applyRoute(h, route(3, 'shop-2', 'why does p99 rise'), pending);
    expect(h[0]?.to).toBe('shop-2');
    h = applyRoute(h, { ev: 'route_done', project: H, rid: 3, state: 'sent', to: 'shop-2', xid: 7 }, pending);
    expect(h[0]?.state).toBe('sent');
    h = applyRoute(h, { ev: 'route_done', project: H, rid: 4, state: 'cancelled', to: 'acme-1' }, pending);
    expect(h[1]?.state).toBe('cancelled');
    // a route for words he didn't send here binds nothing
    expect(applyRoute([], route(9, 'acme-1', 'other words'), pending)).toEqual([]);
  });

  it("his pending row shows '→ bise · acme · 2 s to change', keep sends route_cancel, a project sends route_correct, then 'sent to'", () => {
    const cmds: CoreCmd[] = [];
    const port: CorePort = { send: (c) => cmds.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
    const store = new Store(port);
    store.setCore('up');
    store.apply({ ev: 'projects', projects: [
      { project: H, name: 'bise', path: '/h', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: 'acme-1', name: 'acme', path: '/a', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
      { project: 'shop-2', name: 'shop', path: '/s', git: true, home: false, order: 2, agents: 1, working: 0, waits: 0, running: true },
    ] });
    const cid = store.send({ project: H, agent: 'main', text: 'why does p99 rise' });
    const ctx: RowCtx = { tkey: K, project: H, agent: 'main', bise: true, onLink: () => undefined, onArtifact: () => undefined };
    const v = render(
      <StoreProvider store={store}>
        <PendingRow ctx={ctx} cid={cid} />
      </StoreProvider>,
    );
    expect(v.getByTestId(`thread.pending.${cid}`).dataset.state).toBe('sending');
    act(() => {
      store.apply(route(3, 'acme-1', 'why does p99 rise'));
    });
    expect(v.getByTestId(`thread.pending.${cid}`).dataset.state).toBe('held');
    expect(v.getByTestId('thread.route').textContent).toMatch(/→ bise · acme · [12] s to change/);
    fireEvent.click(v.getByTestId('thread.route.to.shop-2'));
    expect(cmds.at(-1)).toEqual({ cmd: 'route_correct', project: H, rid: 3, to: 'shop-2' });
    fireEvent.click(v.getByTestId('thread.route.keep'));
    expect(cmds.at(-1)).toEqual({ cmd: 'route_cancel', project: H, rid: 3 });
    act(() => {
      store.apply({ ev: 'route_done', project: H, rid: 3, state: 'sent', to: 'acme-1', xid: 7 });
    });
    expect(v.getByTestId(`thread.pending.${cid}`).dataset.state).toBe('sent');
    expect(v.getByTestId(`thread.pending.${cid}`).textContent).toContain('sent to acme');
    expect(v.queryByTestId('thread.route')).toBeNull();
  });
});
