// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CoreCmd } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { ConfirmBar, confirmWords, HubNoteRow } from './confirm';

afterEach(cleanup);

const P = 'acme-1a2b3c4d';

function setup() {
  const sent: CoreCmd[] = [];
  const store = new Store({ send: (c) => sent.push(c) }, { now: () => 1000 });
  store.setCore('up');
  render(
    <StoreProvider store={store}>
      <ConfirmBar project={P} />
      <HubNoteRow project={P} />
    </StoreProvider>,
  );
  const ask = (id: number) => {
    act(() => {
      store.apply({ ev: 'confirm', project: P, id, text: '@perf is working: archive it anyway? (y/n)' });
    });
  };
  return { sent, store, ask };
}

describe('ConfirmBar', () => {
  it('nothing asked: nothing shows', () => {
    setup();
    expect(screen.queryByTestId('confirm.bar')).toBeNull();
  });

  it('y answers yes, n answers no and shows the hub line, esc puts it off with nothing sent', () => {
    const { sent, store, ask } = setup();
    ask(3);
    const bar = screen.getByTestId('confirm.bar');
    expect(bar.textContent).toContain('archive it anyway?');
    expect(document.activeElement).toBe(bar);
    fireEvent.keyDown(bar, { key: 'y' });
    expect(sent.at(-1)).toEqual({ cmd: 'confirm', project: P, id: 3, yes: true });
    expect(screen.queryByTestId('confirm.bar')).toBeNull();

    ask(4);
    fireEvent.keyDown(screen.getByTestId('confirm.bar'), { key: 'n' });
    expect(sent.at(-1)).toEqual({ cmd: 'confirm', project: P, id: 4, yes: false });
    act(() => {
      store.apply({ ev: 'notice', project: P, cmd: 'confirm', text: 'drop of @perf cancelled' });
    });
    // the hub's plain line is the thread's quiet row (HubNoteRow), not a box under the composer
    expect(screen.getByTestId('confirm.notice').textContent).toBe('· drop of @perf cancelled');
    expect(screen.getByTestId('confirm.notice').classList.contains('confirm-bar')).toBe(false);

    ask(5);
    const n = sent.length;
    fireEvent.keyDown(screen.getByTestId('confirm.bar'), { key: 'Escape' });
    expect(sent.length).toBe(n);
    expect(screen.queryByTestId('confirm.bar')).toBeNull();
  });

  it("no is the default (the TUI's [y/N], designer m_18733): the filled button, and ⏎; the keycaps say y/n, the words don't", () => {
    const { sent, ask } = setup();
    ask(7);
    expect(screen.getByTestId('confirm.bar').textContent).not.toContain('(y/n)');
    expect(screen.getByTestId('confirm.no').className).toContain('pri');
    expect(screen.getByTestId('confirm.yes').className).not.toContain('pri');
    fireEvent.keyDown(screen.getByTestId('confirm.bar'), { key: 'Enter' });
    expect(sent.at(-1)).toEqual({ cmd: 'confirm', project: P, id: 7, yes: false });
    expect(confirmWords('archive it anyway? (y/n)')).toBe('archive it anyway?');
    expect(confirmWords('drop it? [y/N]')).toBe('drop it?');
    expect(confirmWords("archive @perf? it's mid-turn.")).toBe("archive @perf? it's mid-turn.");
  });

  describe('his /restart row (ambient-lead m_22833, his m_22835)', () => {
    const HUB = 'restarting the hub on 041168b2 · the agents keep running';
    const withApp = (state: 'current' | 'staged' | 'none', live: string | null) => {
      const swap = vi.fn((): Promise<{ ok: true } | { ok: false; why: string }> => Promise.resolve(state === 'staged' ? { ok: true } : { ok: false, why: 'nothing is staged' }));
      const update = () => Promise.resolve({ state, live, staged: state === 'staged' ? '5a5a5a5a' : null, why: null });
      (window as unknown as { bise?: unknown }).bise = { app: { update, swap } };
      return swap;
    };
    afterEach(() => {
      delete (window as unknown as { bise?: unknown }).bise;
    });
    const restart = async (store: Store, sent: CoreCmd[], hub = '041168b2') => {
      store.command({ cmd: 'slash', project: P, agent: 'main', line: '/restart current' });
      const cmd = sent.at(-1);
      const cid = cmd?.cmd === 'slash' ? cmd.cid : undefined;
      expect(cid, 'his /restart goes with a cid').toBeTypeOf('number');
      await act(async () => {
        store.apply({ ev: 'versions', project: P, current: hub, items: [] });
        store.apply({ ev: 'notice', project: P, cmd: 'slash', text: HUB, ...(cid === undefined ? {} : { cid }) });
        await Promise.resolve();
      });
    };
    const hello = (store: Store) => {
      act(() => {
        store.apply({ ev: 'welcome', project: P, proto: 1, workspace: '/w', name: 'acme' });
      });
    };

    it('staged: the newer app is ready, ⏎ restart to update swaps; it stays once the hub is back', async () => {
      const swap = withApp('staged', 'e91f98d7836a1b2c');
      const { sent, store } = setup();
      await restart(store, sent);
      const row = await screen.findByTestId('confirm.notice.app');
      expect(screen.getByTestId('confirm.notice').textContent).toBe(`· ${HUB} · this app is e91f98d7, a newer one is ready ⏎ restart to update`);
      expect(row.textContent).toBe(' · this app is e91f98d7, a newer one is ready');
      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm.notice.swap'));
        await Promise.resolve();
      });
      expect(swap).toHaveBeenCalledTimes(1);
      hello(store);
      expect(screen.getByTestId('confirm.notice').textContent).toBe('· this app is e91f98d7, a newer one is ready ⏎ restart to update');
    });

    it('nothing staged, another version: it updates at the next try; the row goes once the hub is back', async () => {
      withApp('current', 'e91f98d7836a1b2c');
      const { sent, store } = setup();
      await restart(store, sent);
      await screen.findByTestId('confirm.notice.app');
      expect(screen.getByTestId('confirm.notice').textContent).toBe(`· ${HUB} · this app is e91f98d7 · it updates at the next try`);
      expect(screen.queryByTestId('confirm.notice.swap')).toBeNull();
      hello(store);
      expect(screen.queryByTestId('confirm.notice')).toBeNull();
    });

    it("the same version: the hub's line alone, gone once the hub is back", async () => {
      withApp('current', '041168b2aaaa');
      const { sent, store } = setup();
      await restart(store, sent);
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.getByTestId('confirm.notice').textContent).toBe(`· ${HUB}`);
      hello(store);
      expect(screen.queryByTestId('confirm.notice')).toBeNull();
    });
  });

  it('the buttons do the same as the keys', () => {
    const { sent, ask } = setup();
    ask(6);
    fireEvent.click(screen.getByTestId('confirm.no'));
    expect(sent.at(-1)).toEqual({ cmd: 'confirm', project: P, id: 6, yes: false });
  });
});
