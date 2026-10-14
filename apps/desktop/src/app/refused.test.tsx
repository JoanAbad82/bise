// @vitest-environment happy-dom
// A refused project (lead m_11347, amb-core 44d64919): the hub's words and a retry, gone at its welcome.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CoreCmd, CorePort } from '@/shared/api';
import type { ProjectRow } from '@/proto';
import { Store, StoreProvider } from '@/store';
import { RefusedLine, refusedLead } from './Refused';
import { projectSide } from './side';

const P = 'shop-ab9f3c3b';

function setup() {
  const cmds: CoreCmd[] = [];
  const port: CorePort = {
    send: (c) => cmds.push(c),
    onEvent: () => () => undefined,
    onState: () => () => undefined,
    state: () => Promise.resolve('up'),
  };
  const store = new Store(port);
  store.setCore('up');
  return { store, cmds };
}

afterEach(() => {
  cleanup();
});

describe('a refused project', () => {
  it("shows '<name>'s hub refused bise · <its words>' with retry, sends hub_retry, and goes at its welcome", () => {
    const { store, cmds } = setup();
    const v = render(
      <StoreProvider store={store}>
        <RefusedLine project={P} name="shop" className="app-refused" testId="x.refused" />
      </StoreProvider>,
    );
    expect(v.queryByTestId('x.refused')).toBeNull();
    act(() => {
      store.apply({ ev: 'hub_refused', project: P, error: 'this hub only takes its own sb' });
    });
    expect(v.getByTestId('x.refused').textContent).toContain("shop's hub refused bise · this hub only takes its own sb");
    const retry = v.getByTestId('x.refused.retry');
    expect(retry.textContent).toBe('retry');
    fireEvent.click(retry);
    expect(cmds.at(-1)).toEqual({ cmd: 'hub_retry', project: P });
    expect(v.getByTestId('x.refused.retry').textContent).toBe('retrying…');
    // a new refusal gives him the retry back
    act(() => {
      store.apply({ ev: 'hub_refused', project: P, error: 'still no' });
    });
    expect(v.getByTestId('x.refused.retry').textContent).toBe('retry');
    act(() => {
      store.apply({ ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop', cmds: [] });
    });
    expect(v.queryByTestId('x.refused')).toBeNull();
  });

  it("another project's refusal draws nothing here", () => {
    const { store } = setup();
    const v = render(
      <StoreProvider store={store}>
        <RefusedLine project={P} name="shop" className="app-refused" testId="x.refused" />
      </StoreProvider>,
    );
    act(() => {
      store.apply({ ev: 'hub_refused', project: 'acme-1a2b3c4d', error: 'no' });
    });
    expect(v.queryByTestId('x.refused')).toBeNull();
  });

  it("its sidebar row: the end 'refused' in err (a gone folder still says so first)", () => {
    const row = { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 2, working: 1, waits: 0, running: true } as ProjectRow;
    expect(projectSide(row, true)).toEqual({ text: 'refused', err: true, count: 0 });
    expect(projectSide(row, false)).toEqual({ text: '1', err: false, count: 0 });
    expect(projectSide({ ...row, missing: true }, true).text).toBe('folder gone');
    expect(refusedLead('bise')).toBe("bise's hub refused bise");
  });
});
