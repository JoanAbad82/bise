// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Card } from '@/proto';
import { hub_ev } from '@/proto/fixtures.gen';
import { Inbox, keyOf, type InboxPorts } from './Inbox';
import { InboxCard } from './InboxCard';

afterEach(cleanup);

const cards = (): Card[] => {
  const ev = hub_ev.find((e) => e.ev === 'cards');
  if (ev?.ev !== 'cards') throw new Error('no cards fixture');
  return ev.cards;
};

const ports = (): InboxPorts & { calls: string[] } => {
  const calls: string[] = [];
  return {
    calls,
    answer: (p, c, r) => calls.push(`answer ${p} ${String(c)} ${r}`),
    close: (p, c) => calls.push(`close ${p} ${String(c)}`),
    back: () => calls.push('back'),
  };
};

const ids = () => screen.getAllByTestId(/^inbox\.item\./).map((e) => e.dataset.testid);

describe('Inbox', () => {
  it("lists the fixture's items in the TUI's order and opens the top one", () => {
    render(<Inbox cards={cards()} names={{ 'acme-1a2b3c4d': 'acme' }} ports={ports()} now={1791100400000} />);
    expect(ids()).toEqual(['inbox.item.acme-1a2b3c4d-10', 'inbox.item.acme-1a2b3c4d-9', 'inbox.item.acme-1a2b3c4d-11']);
    expect(screen.getByTestId('inbox.card.acme-1a2b3c4d-10').textContent).toContain('run rm -rf target?');
    // an approval: options only, no field for words
    expect(screen.queryByTestId('inbox.answer')).toBeNull();
  });

  it('a digit answers the approval, the question comes next and takes typed words', () => {
    const p = ports();
    render(<Inbox cards={cards()} names={{}} ports={p} now={1791100400000} />);
    fireEvent.keyDown(screen.getByTestId('inbox.root'), { key: '1' });
    expect(p.calls).toEqual(['answer acme-1a2b3c4d 10 1']);
    expect(ids()).toHaveLength(2);
    const field = screen.getByTestId<HTMLTextAreaElement>('inbox.answer');
    field.value = 'cold, then warm';
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(p.calls[1]).toBe('answer acme-1a2b3c4d 9 cold, then warm');
  });

  it('a click on an option picks it; close and esc', () => {
    const p = ports();
    render(<Inbox cards={cards()} names={{}} ports={p} now={1791100400000} />);
    fireEvent.click(screen.getByTestId('inbox.card.acme-1a2b3c4d-10.opt.2'));
    fireEvent.click(screen.getByTestId('inbox.card.acme-1a2b3c4d-9.close'));
    fireEvent.keyDown(screen.getByTestId('inbox.root'), { key: 'Escape' });
    expect(p.calls).toEqual(['answer acme-1a2b3c4d 10 2', 'close acme-1a2b3c4d 9', 'back']);
  });

  it('typing in the field re-renders no row', () => {
    const p = ports();
    render(<Inbox cards={cards().filter((c) => c.id !== 10)} names={{}} ports={p} now={1791100400000} />);
    const rows = screen.getAllByTestId(/^inbox\.item\./);
    const field = screen.getByTestId<HTMLTextAreaElement>('inbox.answer');
    const spy = vi.fn();
    const obs = new MutationObserver(spy);
    obs.observe(screen.getByTestId('inbox.list'), { subtree: true, childList: true, characterData: true, attributes: true });
    for (const ch of 'warm') {
      fireEvent.keyDown(field, { key: ch });
      field.value += ch;
      fireEvent.input(field);
    }
    obs.disconnect();
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getAllByTestId(/^inbox\.item\./)).toEqual(rows);
  });

  it('nothing open: says so', () => {
    render(<Inbox cards={[]} names={{}} ports={ports()} />);
    expect(screen.getByTestId('inbox.root').textContent).toContain('nothing waits for you');
  });

  it('keys: arrows and digits belong to his text once he typed', () => {
    const k = (key: string, mods: Partial<Record<'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey', boolean>> = {}) => ({ key, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...mods });
    expect(keyOf(k('ArrowDown'), '')).toEqual({ k: 'down' });
    expect(keyOf(k('ArrowDown'), 'x')).toBeNull();
    expect(keyOf(k('3'), '')).toEqual({ k: 'digit', n: 3 });
    expect(keyOf(k('Enter', { shiftKey: true }), 'x')).toBeNull();
    expect(keyOf(k('Backspace', { metaKey: true }), '')).toEqual({ k: 'close' });
    expect(keyOf(k('Backspace', { metaKey: true }), 'x')).toBeNull();
    expect(keyOf(k('x', { ctrlKey: true }), 'x')).toEqual({ k: 'close' });
  });

  it('InboxCard alone: a card with its options and the acts it is given, no list', () => {
    const picked: number[] = [];
    const c = cards()[2];
    if (!c) throw new Error('fixture');
    render(<InboxCard card={c} project="acme" now={1791100400000} acts={{ pick: (n) => picked.push(n), open: () => picked.push(0), openPage: () => picked.push(-1) }} testId="capsule.card" />);
    fireEvent.click(screen.getByTestId('capsule.card.opt.1'));
    fireEvent.click(screen.getByTestId('capsule.card.open'));
    fireEvent.click(screen.getByTestId('capsule.card.page'));
    expect(picked).toEqual([1, 0, -1]);
    expect(screen.queryByTestId('capsule.card.close')).toBeNull();
    expect(screen.getByTestId('capsule.card').textContent).toContain('main asks');
  });
});
