// @vitest-environment happy-dom
// useEntityMenu (bise fait mac, mockup 9): the '…' and a right click on the same row give the same
// native menu, read from the store's rows when it opens; his pick runs the hub's typed command.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ListRow, MoreButton } from '@/ds';
import type { Agent } from '@/proto';
import { Store, StoreProvider } from '@/store';
import type { CoreCmd, CorePort, PopupAt, PopupItem } from '@/shared/api';
import type { Entity } from '@/shared/entity';
import { createRouter, RouterContext } from '../router';
import { useEntityMenu } from './use';

const P = 'acme-1a2b3c4d';
const ag = (name: string, over: Partial<Agent> = {}): Agent => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1, waits: 0, watching: [], path: `/w/${name}`, ...over });

function Row({ e }: { e: Entity }) {
  const m = useEntityMenu(e);
  return <ListRow title="perf" onContextMenu={m.onContextMenu} end={<MoreButton menu={m} testId="row.more" />} testId="row" />;
}

function world(pick: string | null) {
  const cmds: CoreCmd[] = [];
  const port: CorePort = { send: (c) => cmds.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const store = new Store(port);
  store.setCore('up');
  act(() => {
    store.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('perf', { status: 'working' })] });
  });
  const shown: { items: readonly PopupItem[]; at: PopupAt | undefined }[] = [];
  const popupMenu = vi.fn((items: readonly PopupItem[], at?: PopupAt) => {
    shown.push({ items, at });
    return Promise.resolve(pick);
  });
  Object.assign(window, { bise: { popupMenu } });
  const v = render(
    <StoreProvider store={store}>
      <RouterContext value={createRouter({ screen: 'bise' })}>
        <Row e={{ kind: 'agent', project: P, agent: 'perf' }} />
      </RouterContext>
    </StoreProvider>,
  );
  return { v, shown, cmds };
}

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'bise');
});

describe("an agent row's menu", () => {
  it("the '…' and a right click show the same items; the '…' opens under itself, the right click at the pointer", async () => {
    const { v, shown } = world(null);
    const more = v.getByTestId('row.more');
    more.focus();
    fireEvent.click(more);
    fireEvent.contextMenu(v.getByTestId('row'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(shown).toHaveLength(2);
    expect(shown[0]?.items).toEqual(shown[1]?.items);
    expect(shown[0]?.items.length).toBeGreaterThan(0);
    expect(shown[0]?.at).toBeDefined();
    expect(shown[1]?.at).toBeUndefined();
  });

  it('his pick runs the typed command: Stop on a working agent is the hub’s stop, Archive its archive', async () => {
    const stop = world('stop');
    fireEvent.contextMenu(stop.v.getByTestId('row'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(stop.cmds).toContainEqual({ cmd: 'stop', project: P, agent: 'perf' });
    cleanup();
    const archive = world('archive');
    fireEvent.contextMenu(archive.v.getByTestId('row'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(archive.cmds).toContainEqual({ cmd: 'archive', project: P, agent: 'perf', force: true });
  });

  it('a right click never shows the page’s own menu (its default is prevented)', () => {
    const { v } = world(null);
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    v.getByTestId('row').dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });
});
