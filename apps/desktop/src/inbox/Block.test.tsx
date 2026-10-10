// @vitest-environment happy-dom
// The inbox block (b2): one inbox for every project, an item opened in place, what his words do told
// to the composer, approvals only by their options, ⌘I / a notification click through openInbox.
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CoreCmd, CorePort } from '@/shared/api';
import { core_ev } from '@/proto/fixtures.gen';
import { replay, Store, StoreProvider } from '@/store';
import { createRouter, RouterContext } from '@/app/router';
import { emitAction } from '@/app/menu';
import { asksNotify, InboxBlock, openInbox, type Answering, type Here } from './Block';

afterEach(cleanup);

const P = 'acme-1a2b3c4d';
const NOW = 1791100400000;

/** core_ev with card 9's question made `lines` long (a long ask folds in the block). */
const withLong = (lines: number): typeof core_ev =>
  core_ev.map((e) =>
    e.ev !== 'projects'
      ? e
      : { ...e, projects: e.projects.map((r) => ({ ...r, cards: r.cards?.map((c) => (c.id === 9 ? { ...c, question: Array.from({ length: lines }, (_, i) => `line ${String(i + 1)} of the long ask`).join(String.fromCharCode(10)) } : c)) })) },
  );

const mount = (here: Here = { project: P, agent: 'perf' }, events: typeof core_ev = core_ev) => {
  const sent: CoreCmd[] = [];
  const port: CorePort = { send: (c) => sent.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const store = new Store(port);
  replay(store, events);
  const told: (Answering | null)[] = [];
  render(
    <StoreProvider store={store}>
      <RouterContext value={createRouter({ screen: 'thread', project: P, agent: 'perf' })}>
        <InboxBlock here={here} onAnswer={(a) => told.push(a)} now={NOW} />
      </RouterContext>
    </StoreProvider>,
  );
  const hub = () => sent.filter((c) => c.cmd !== 'card_in_view');
  return { sent, hub, told };
};

describe('the inbox block (b2)', () => {
  it("folded: 'inbox · 2 waiting', a line per item in the inbox's order, ⌃1–2 open; nothing is told", () => {
    const { told } = mount();
    expect(screen.getByTestId('inbox.block').textContent).toContain('2 waiting');
    expect(screen.getByTestId('inbox.block.keys').textContent).toContain('⌃1–2');
    expect(screen.getByTestId('inbox.block.row.1').textContent).toContain('run rm -rf target?');
    expect(screen.getByTestId('inbox.block.row.2').textContent).toContain('which bench?');
    expect(told.filter((a) => a !== null)).toEqual([]);
  });

  it('a question opens in place: its options, and the composer answers it; a digit picks, the line leaves', () => {
    const { hub, told } = mount();
    fireEvent.click(screen.getByTestId('inbox.block.row.2'));
    expect(screen.getByTestId('inbox.block.open.2')).toBeTruthy();
    expect(screen.getByTestId('inbox.block.keys').textContent).toContain('esc');
    expect(told.at(-1)).toEqual({ project: P, card: 9, label: 'answering perf · which bench?', end: 'esc write to perf instead', answer: 9 });
    fireEvent.keyDown(window, { key: '2' });
    expect(hub()).toEqual([{ cmd: 'answer', project: P, card: 9, reply: '2' }]);
    expect(screen.queryByTestId('inbox.block.open.2')).toBeNull();
    expect(told.at(-1)).toBeNull();
  });

  it('an approval: only its options decide; the composer says what it waits for and sends plain words', () => {
    const { hub, told } = mount({ project: null, agent: null });
    fireEvent.click(screen.getByTestId('inbox.block.row.1'));
    expect(told.at(-1)).toEqual({ project: P, card: 10, label: 'to bise · the approval waits for 1 or 2', answer: null });
    // ←→ walk the options, ⌘⏎ picks the one the keys are on
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'Enter', metaKey: true });
    expect(hub()).toEqual([{ cmd: 'answer', project: P, card: 10, reply: '1' }]);
  });

  it("ctrl+o (the window's 'fold-all'), focus anywhere, opens the open item's long ask whole, again folds it (I8, qa-native f640424d)", () => {
    mount({ project: P, agent: 'perf' }, withLong(16));
    fireEvent.click(screen.getByTestId('inbox.block.row.2'));
    const card = () => screen.getByTestId('inbox.block.open.2').textContent;
    expect(card()).not.toContain('line 14 of the long ask');
    act(() => {
      emitAction('fold-all');
    });
    expect(card()).toContain('line 16 of the long ask');
    act(() => {
      emitAction('fold-all');
    });
    expect(card()).not.toContain('line 14 of the long ask');
  });

  it('↑↓ walk the items, esc folds the block', () => {
    const { told } = mount();
    fireEvent.click(screen.getByTestId('inbox.block.row.1'));
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(screen.getByTestId('inbox.block.open.2')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('inbox.block.open.2')).toBeNull();
    expect(told.at(-1)).toBeNull();
  });

  it('⌘I (openInbox) opens the first item; a notification click (openInbox at a card) that card', () => {
    mount();
    act(() => {
      openInbox();
    });
    expect(screen.getByTestId('inbox.block.open.1')).toBeTruthy();
    act(() => {
      openInbox({ project: P, card: 9 });
    });
    expect(screen.getByTestId('inbox.block.open.2')).toBeTruthy();
  });

  it('⌃n opens item n wherever the focus is', () => {
    mount();
    fireEvent.keyDown(window, { key: '2', code: 'Digit2', ctrlKey: true });
    expect(screen.getByTestId('inbox.block.open.2')).toBeTruthy();
  });
});

describe("the notifications' permission row (amb-mac's notify.ask)", () => {
  it("shows while macOS was never asked and an item waits; 'not now' once a launch, twice for good", () => {
    expect(asksNotify('never', 1, 0, false)).toBe(true);
    expect(asksNotify('never', 0, 0, false)).toBe(false);
    expect(asksNotify('on', 1, 0, false)).toBe(false);
    expect(asksNotify('asked', 1, 0, false)).toBe(false);
    expect(asksNotify('never', 1, 1, true)).toBe(false);
    expect(asksNotify('never', 1, 1, false)).toBe(true);
    expect(asksNotify('never', 1, 2, false)).toBe(false);
  });

  it("'turn on' asks macOS; the row goes once the answer comes", async () => {
    localStorage.clear();
    sessionStorage.clear();
    let asked = 0;
    const g = globalThis as { bise?: unknown };
    g.bise = { notify: { state: () => Promise.resolve('never'), onState: () => () => undefined, ask: () => { asked += 1; return Promise.resolve('on'); } } };
    try {
      mount();
      expect(await screen.findByTestId('inbox.block.notify')).toBeTruthy();
      await act(async () => {
        fireEvent.click(screen.getByTestId('inbox.block.notify.on'));
        await Promise.resolve();
      });
      expect(asked).toBe(1);
      expect(screen.queryByTestId('inbox.block.notify')).toBeNull();
    } finally {
      delete g.bise;
    }
  });

  it("'not now' hides it for this launch", async () => {
    localStorage.clear();
    sessionStorage.clear();
    const g = globalThis as { bise?: unknown };
    g.bise = { notify: { state: () => Promise.resolve('never'), onState: () => () => undefined, ask: () => Promise.resolve('on') } };
    try {
      mount();
      fireEvent.click(await screen.findByTestId('inbox.block.notify.later'));
      expect(screen.queryByTestId('inbox.block.notify')).toBeNull();
      expect(localStorage.getItem('bise.notify.notnow')).toBe('1');
    } finally {
      delete g.bise;
    }
  });
});
