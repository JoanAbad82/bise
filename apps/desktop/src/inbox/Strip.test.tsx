// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Card } from '@/proto';
import { InboxStrip, cardKeyOf, type StripPorts } from './Strip';
import { PICKED_MS } from './InboxCard';
import type { ReactNode } from 'react';
import { Store, StoreProvider } from '@/store';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const card = (id: number, rank: number, project = 'acme'): Card => ({
  id,
  project,
  kind: 'question',
  agent: `t${String(id)}`,
  question: `q${String(id)}`,
  options: [
    { n: 1, label: 'yes' },
    { n: 2, label: 'no' },
  ],
  urgent: false,
  since_ms: 1791100000000 + id,
  rank,
});

// the ports as ThreadInbox wires them: through a store of the test's own (an answered or closed item
// leaves every view by the store's acted set, never the strip's), each act also written in `did`
const ports = () => {
  const did: string[] = [];
  const store = new Store(null);
  const p: StripPorts = {
    answer: (project, c, reply) => {
      did.push(`answer ${project}-${String(c)} ${reply}`);
      store.answer(project, c, reply);
    },
    close: (project, c) => {
      did.push(`close ${project}-${String(c)}`);
      store.close(project, c);
    },
    openInbox: () => did.push('inbox'),
    openPage: (url) => did.push(`open ${url}`),
  };
  const wrapper = ({ children }: { children: ReactNode }) => <StoreProvider store={store}>{children}</StoreProvider>;
  return { did, p, wrapper, store };
};

const NOW = 1791100400000;

describe('InboxStrip (W7/K24)', () => {
  it('nothing waits: no box', () => {
    render(<InboxStrip project="acme" cards={[card(1, 1, 'other')]} ports={ports().p} now={NOW} />);
    expect(screen.queryByTestId('strip')).toBeNull();
  });

  it("numbers the project's items, ctrl+2 docks item 2, a click on an option answers it", () => {
    vi.useFakeTimers();
    const { did, p, wrapper } = ports();
    render(<InboxStrip project="acme" cards={[card(1, 2), card(2, 0), card(3, 1), card(4, 3), card(9, 0, 'other')]} ports={p} now={NOW} />, { wrapper });
    expect(screen.getByTestId('strip.row.1').textContent).toContain('t2');
    expect(screen.getByTestId('strip.row.2').textContent).toContain('t3');
    expect(screen.getByTestId('strip.row.3').textContent).toContain('t1');
    expect(screen.getByTestId('strip.more').textContent).toContain('+ 1 more');
    fireEvent.keyDown(window, { code: 'Digit2', key: '2', ctrlKey: true });
    expect(screen.getByTestId('strip.card.acme-3')).toBeTruthy();
    expect(screen.queryByTestId('strip.row.2')).toBeNull();
    fireEvent.click(screen.getByTestId('strip.card.acme-3.opt.2'));
    act(() => {
      vi.advanceTimersByTime(PICKED_MS);
    });
    expect(did).toEqual(['answer acme-3 2']);
    // it leaves at once: the next ones move up a number
    expect(screen.queryByTestId('strip.card.acme-3')).toBeNull();
    expect(screen.getByTestId('strip.row.2').textContent).toContain('t1');
  });

  it("a click docks a row; esc and 'esc later' put it off; '⌘⌫ close' and ⌘⌫ close it; a digit picks it", () => {
    const { did, p, wrapper } = ports();
    render(<InboxStrip project="acme" cards={[card(1, 0), card(2, 1), card(3, 2)]} ports={p} now={NOW} />, { wrapper });
    fireEvent.click(screen.getByTestId('strip.row.1'));
    expect(screen.getByTestId('strip.dock')).toBeTruthy();
    expect(screen.queryByTestId('strip')).toBeNull();
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByTestId('strip.card.acme-1')).toBeNull();
    fireEvent.keyDown(window, { code: 'Digit1', key: '1', ctrlKey: true });
    fireEvent.click(screen.getByTestId('strip.card.acme-1.later'));
    expect(screen.queryByTestId('strip.card.acme-1')).toBeNull();
    fireEvent.keyDown(window, { code: 'Digit1', key: '1', ctrlKey: true });
    fireEvent.click(screen.getByTestId('strip.card.acme-1.close'));
    expect(did).toEqual(['close acme-1']);
    fireEvent.keyDown(window, { code: 'Digit1', key: '1', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'Backspace', code: 'Backspace', metaKey: true });
    // the card has the keys while no words are typed: a digit picks at once
    fireEvent.keyDown(window, { code: 'Digit1', key: '1', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'ArrowRight', code: 'ArrowRight' });
    expect(screen.getByTestId('strip.card.acme-3.opt.1').className).toContain('on');
    fireEvent.keyDown(window, { key: '2', code: 'Digit2' });
    expect(did).toEqual(['close acme-1', 'close acme-2', 'answer acme-3 2']);
  });

  it("a digit typed in the composer with his words in it is his, not an option (amb-win, item 7)", () => {
    const { did, p, wrapper } = ports();
    render(<InboxStrip project="acme" cards={[card(1, 0)]} ports={p} now={NOW} />, { wrapper });
    fireEvent.click(screen.getByTestId('strip.row.1'));
    const field = document.createElement('div');
    field.contentEditable = 'true';
    field.textContent = 'cold, on the m';
    document.body.appendChild(field);
    fireEvent.keyDown(field, { key: '2', code: 'Digit2' });
    expect(did).toEqual([]);
    field.textContent = '';
    fireEvent.keyDown(field, { key: '2', code: 'Digit2' });
    expect(did).toEqual(['answer acme-1 2']);
    field.remove();
  });

  it("the docked card: 'bise asks' for main, no project for bise's home, the question's footer", () => {
    const c = { ...card(1, 0), agent: 'main' };
    render(<InboxStrip project="acme" name="acme-storefront" home cards={[c]} ports={ports().p} now={NOW} />);
    fireEvent.keyDown(window, { code: 'Digit1', key: '1', ctrlKey: true });
    expect(screen.getByTestId('strip.card.acme-1').textContent).toContain('bise asks');
    expect(screen.queryByTestId('strip.card.acme-1.project')).toBeNull();
    expect(screen.getByTestId('strip.card.acme-1.keys').textContent).toBe('1 2pickor type your answer below⌘⌫closeesclater');
  });

  it("an approval asks too ('bise asks'); while the keys drive, a resting mouse paints no hover", () => {
    const a = { ...card(1, 0), agent: 'main', kind: 'merge', approval: true };
    render(<InboxStrip project="acme" cards={[a]} ports={ports().p} now={NOW} />);
    fireEvent.keyDown(window, { code: 'Digit1', key: '1', ctrlKey: true });
    const c = screen.getByTestId('strip.card.acme-1');
    expect(c.textContent).toContain('bise asks');
    expect(c.className).not.toContain('driving');
    fireEvent.keyDown(window, { key: 'ArrowRight', code: 'ArrowRight' });
    expect(c.className).toContain('driving');
    fireEvent.mouseMove(c);
    expect(c.className).not.toContain('driving');
  });

  it('cardKeyOf: digits that are options pick, ←→ walk, ⌘⌫ closes, esc puts off', () => {
    const k = (key: string, mods: Partial<Record<'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey', boolean>> = {}) => ({ key, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...mods });
    const c = card(1, 0);
    expect(cardKeyOf(k('2'), c, null)).toEqual({ t: 'pick', n: 2 });
    expect(cardKeyOf(k('3'), c, null)).toBeNull();
    expect(cardKeyOf(k('ArrowRight'), c, null)).toEqual({ t: 'on', n: 1 });
    expect(cardKeyOf(k('ArrowRight'), c, 2)).toEqual({ t: 'on', n: 2 });
    expect(cardKeyOf(k('ArrowLeft'), c, null)).toEqual({ t: 'on', n: 2 });
    expect(cardKeyOf(k('Backspace', { metaKey: true }), c, null)).toEqual({ t: 'close' });
    expect(cardKeyOf(k('Escape'), c, null)).toEqual({ t: 'later' });
    expect(cardKeyOf(k('2', { ctrlKey: true }), c, null)).toBeNull();
  });

  it("the demo tour's tip goes above the box (L25), and not without an item", () => {
    const { rerender } = render(<InboxStrip project="acme" cards={[card(1, 0)]} ports={ports().p} now={NOW} tip={<span data-testid="tip" />} />);
    expect(screen.getByTestId('tip').compareDocumentPosition(screen.getByTestId('strip')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    rerender(<InboxStrip project="acme" cards={[]} ports={ports().p} now={NOW} tip={<span data-testid="tip" />} />);
    expect(screen.queryByTestId('tip')).toBeNull();
  });

  it('ctrl+N past the last row does nothing and leaves the key alone', () => {
    render(<InboxStrip project="acme" cards={[card(1, 0)]} ports={ports().p} now={NOW} />);
    const e = new KeyboardEvent('keydown', { code: 'Digit3', key: '3', ctrlKey: true, cancelable: true });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    expect(screen.queryByTestId('strip.card.acme-1')).toBeNull();
  });
});
