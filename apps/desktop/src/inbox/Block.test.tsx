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
import type { Card } from '@/proto';
import { answeringOf, asksNotify, headWords, InboxBlock, openInbox, projectWord, type Answering, type Here } from './Block';
import { PICKED_MS } from './InboxCard';

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
    // H10: folded, one item line; the rest is '+ N more' in the head
    expect(screen.queryByTestId('inbox.block.row.2')).toBeNull();
    expect(screen.getByTestId('inbox.block.more').textContent).toBe('+ 1 more');
    expect(told.filter((a) => a !== null)).toEqual([]);
  });

  it('a question opens in place: its options, and the composer answers it; a digit picks, the line leaves', () => {
    const { hub, told } = mount();
    fireEvent.click(screen.getByTestId('inbox.block.more'));
    expect(screen.getByTestId('inbox.block.open.2')).toBeTruthy();
    expect(screen.getByTestId('inbox.block.keys').textContent).toContain('esc');
    expect(told.at(-1)).toEqual({ project: P, card: 9, label: 'answering perf · which bench?', end: 'esc write to perf instead', answer: 9, asker: 'perf' });
    fireEvent.keyDown(window, { key: '2' });
    expect(hub()).toEqual([{ cmd: 'answer', project: P, card: 9, reply: '2' }]);
    expect(screen.queryByTestId('inbox.block.open.2')).toBeNull();
    expect(told.at(-1)).toBeNull();
  });

  it("'+ N more' walks on past the open item to the last, then wraps (never back and forth between two)", () => {
    // a third card, a copy of card 9 with its own id and words
    const three = core_ev.map((e) =>
      e.ev !== 'projects'
        ? e
        : { ...e, projects: e.projects.map((r) => ({ ...r, cards: r.cards?.flatMap((c) => (c.id === 9 ? [c, { ...c, id: 11, question: 'which port?' }] : [c])) })) },
    );
    mount({ project: P, agent: 'perf' }, three);
    expect(screen.getByTestId('inbox.block.more').textContent).toBe('+ 2 more');
    const openN = () => screen.getByTestId('inbox.block').querySelector('[data-testid^="inbox.block.open."]')?.getAttribute('data-testid');
    fireEvent.click(screen.getByTestId('inbox.block.more'));
    expect(openN()).toBe('inbox.block.open.2');
    fireEvent.click(screen.getByTestId('inbox.block.more'));
    expect(openN()).toBe('inbox.block.open.3');
    fireEvent.click(screen.getByTestId('inbox.block.more'));
    expect(openN()).toBe('inbox.block.open.2');
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
    fireEvent.click(screen.getByTestId('inbox.block.more'));
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

  it("ctrl+↑↓ walk like ↑↓ (no wrap); ctrl+n / ctrl+p walk and wrap, even with his words in the field (the TUI's cards.rs)", () => {
    mount();
    fireEvent.click(screen.getByTestId('inbox.block.row.1'));
    fireEvent.keyDown(window, { key: 'ArrowDown', ctrlKey: true });
    expect(screen.getByTestId('inbox.block.open.2')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'ArrowUp', ctrlKey: true });
    expect(screen.getByTestId('inbox.block.open.1')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'ArrowUp', ctrlKey: true });
    expect(screen.getByTestId('inbox.block.open.1')).toBeTruthy();
    const field = document.createElement('textarea');
    field.value = 'not yet';
    document.body.appendChild(field);
    fireEvent.keyDown(field, { key: 'p', ctrlKey: true });
    expect(screen.queryByTestId('inbox.block.open.1')).toBeNull();
    fireEvent.keyDown(field, { key: 'n', ctrlKey: true });
    expect(screen.getByTestId('inbox.block.open.1')).toBeTruthy();
    fireEvent.keyDown(field, { key: 'n', ctrlKey: true });
    expect(screen.getByTestId('inbox.block.open.2')).toBeTruthy();
    field.remove();
  });

  it('a key before the next render sees the last key’s move: ↓ then ctrl+p, no render between, is back on item 1 (amb-mac m_22532)', () => {
    mount();
    fireEvent.click(screen.getByTestId('inbox.block.row.1'));
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, bubbles: true }));
    });
    expect(screen.getByTestId('inbox.block.open.1')).toBeTruthy();
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

  it("a row is 'n ? agent question… <project> · <age>'; the open card's head says its project too", () => {
    mount();
    // folded (H10): one line, the first item (perf's approval)
    const row = screen.getByTestId('inbox.block.row.1');
    expect(row.querySelector('.strip-who')?.textContent).toBe('perf');
    expect(row.querySelector('.strip-what')?.textContent).toBe('run rm -rf target?');
    expect(row.querySelector('.end')?.textContent).toMatch(/^acme · /u);
    fireEvent.click(row);
    expect(screen.getByTestId(`inbox.block.card.${P}-10.project`).textContent).toBe('· acme');
  });
});

describe("'only' (task-panel m_20455: the artifact view docks its maker's questions)", () => {
  it('filters before anything: the head counts, the rows and ⌘I see only those items', () => {
    const port: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
    const store = new Store(port);
    replay(store, core_ev);
    render(
      <StoreProvider store={store}>
        <RouterContext value={createRouter({ screen: 'thread', project: P, agent: 'perf' })}>
          <InboxBlock here={{ project: P, agent: 'perf' }} onAnswer={() => undefined} now={NOW} only={(c) => c.id === 9} />
        </RouterContext>
      </StoreProvider>,
    );
    expect(screen.getByTestId('inbox.block').textContent).toContain('1 waiting');
    expect(screen.getByTestId('inbox.block.row.1').textContent).toContain('which bench?');
    expect(screen.queryByText('run rm -rf target?')).toBeNull();
    act(() => {
      openInbox();
    });
    expect(screen.getByTestId('inbox.block.open.1').textContent).toContain('which bench?');
  });
});

describe('one inbox (designer m_19631)', () => {
  const opts = [
    { label: 'yes', n: 1 },
    { label: 'no', n: 2 },
  ];
  const card = (project: string, approval = false): Card =>
    approval
      ? { agent: 'perf', approval: true, id: 10, kind: 'confirm', options: opts, project, question: 'run rm -rf target?', rank: 0, since_ms: NOW, urgent: true }
      : { agent: 'perf', id: 9, kind: 'question', options: opts, project, question: 'which bench?', rank: 1, since_ms: NOW, urgent: false };

  it("the head says 'N waiting', and ' · K projects' once more than one project waits", () => {
    expect(headWords([{ project: 'a' }, { project: 'a' }])).toBe('2 waiting');
    expect(headWords([{ project: 'a' }, { project: 'b' }, { project: 'c' }, { project: 'a' }])).toBe('4 waiting · 3 projects');
  });

  it("bise's own cards say 'bise', the others their project's name, else its id", () => {
    expect(projectWord({ name: 'home-1', home: true }, 'home-1')).toBe('bise');
    expect(projectWord({ name: 'telemetry', home: false }, 't-1')).toBe('telemetry');
    expect(projectWord(undefined, 't-1')).toBe('t-1');
  });

  it("answering another project than the screen's names the agent and the project", () => {
    const here: Here = { project: P, agent: 'main' };
    expect(answeringOf(card('t-1'), here, 'telemetry')).toEqual({ project: 't-1', card: 9, label: 'answering perf · telemetry · which bench?', end: 'esc write to bise instead', answer: 9, asker: 'perf' });
    expect(answeringOf(card('t-1', true), here, 'telemetry')).toEqual({
      project: 't-1',
      card: 10,
      label: 'to perf · telemetry · the approval waits for 1 or 2',
      end: 'esc write to bise instead',
      answer: null,
    });
  });

  it("the screen's own project and bise's view: as before", () => {
    expect(answeringOf(card(P), { project: P, agent: 'main' }, 'acme').label).toBe('answering perf · which bench?');
    expect(answeringOf(card('t-1'), { project: null, agent: null }, 'telemetry')).toEqual({ project: 't-1', card: 9, label: 'answering perf · which bench?', end: 'esc write a plain message', answer: 9, asker: 'perf' });
    expect(answeringOf(card('t-1', true), { project: null, agent: null }, 'telemetry').label).toBe('to bise · the approval waits for 1 or 2');
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
      // H10 (designer m_19835): an ordinary item from bise, the last one, never a line of its own
      expect(await screen.findByText('+ 2 more')).toBeTruthy();
      fireEvent.keyDown(window, { key: '3', code: 'Digit3', ctrlKey: true });
      // waits: under a loaded run the open can land a tick later (it passed alone, failed once in pnpm check)
      expect((await screen.findByTestId('inbox.block.notify')).textContent).toContain('let questions reach you as macOS notifications?');
      await act(async () => {
        fireEvent.click(screen.getByTestId('inbox.block.notify.opt.1'));
        // a clicked option shows picked for PICKED_MS (InboxCard), then picks
        await new Promise((r) => setTimeout(r, PICKED_MS + 50));
      });
      expect(asked).toBe(1);
      expect(screen.queryByTestId('inbox.block.notify')).toBeNull();
      expect(screen.getByTestId('inbox.block.more').textContent).toBe('+ 1 more');
    } finally {
      delete g.bise;
    }
  });

  it("'not now' (its 2) and it is gone for good: asked once; its words never reach the hub", async () => {
    localStorage.clear();
    sessionStorage.clear();
    const g = globalThis as { bise?: unknown };
    g.bise = { notify: { state: () => Promise.resolve('never'), onState: () => () => undefined, ask: () => Promise.resolve('on') } };
    try {
      const { hub, told } = mount();
      expect(await screen.findByText('+ 2 more')).toBeTruthy();
      fireEvent.keyDown(window, { key: '3', code: 'Digit3', ctrlKey: true });
      expect(told.at(-1)).toMatchObject({ answer: null });
      fireEvent.keyDown(window, { key: '2' });
      expect(screen.queryByTestId('inbox.block.notify')).toBeNull();
      expect(hub()).toEqual([]);
      expect(localStorage.getItem('bise.notify.notnow')).toBe('2');
    } finally {
      delete g.bise;
    }
  });
});
