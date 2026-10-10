// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Card } from '@/proto';
import { hub_ev } from '@/proto/fixtures.gen';
import { Inbox, keyOf, type InboxPorts } from './Inbox';
import { makeDrafts } from './drafts';
import { glyphOf, InboxCard, kindTitle, PICKED_MS } from './InboxCard';

describe("a card's head (designer m_15412)", () => {
  it('never shows a kind id: a merge, a try, an update asks like a question, with the mark of what only its options decide', () => {
    for (const kind of ['merge', 'feature_try', 'feature_merge', 'update', 'signin', 'confirm', 'setup']) {
      expect(kindTitle(kind, 'perf'), kind).toBe('perf asks');
    }
    expect(kindTitle('feature_merge', 'main')).toBe('bise asks');
    const merge = { id: 10, project: 'acme', kind: 'feature_merge', rank: 2, agent: 'perf', question: 'merge sb/perf into main?', options: [{ n: 1, label: 'merge' }, { n: 2, label: 'not yet' }], urgent: false, since_ms: 0 } as unknown as Card;
    expect(glyphOf(merge)).toBe('!');
    expect(glyphOf({ ...merge, kind: 'question' })).toBe('?');
    expect(glyphOf({ ...merge, kind: 'question', approval: true })).toBe('!');
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** a clicked row shows picked, then picks (PICKED_MS) */
const settle = () => {
  act(() => {
    vi.advanceTimersByTime(PICKED_MS);
  });
};

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
    // the sign-in card (bar V14) is an item too, rank 1, after the questions
    expect(ids()).toEqual(['inbox.item.acme-1a2b3c4d-10', 'inbox.item.acme-1a2b3c4d-9', 'inbox.item.acme-1a2b3c4d-11', 'inbox.item.acme-1a2b3c4d-14']);
    expect(screen.getByTestId('inbox.card.acme-1a2b3c4d-10').textContent).toContain('run rm -rf target?');
    // an approval: options only, no field for words
    expect(screen.queryByTestId('inbox.answer')).toBeNull();
  });

  it('a digit answers the approval, the question comes next and takes typed words', () => {
    const p = ports();
    render(<Inbox cards={cards()} names={{}} ports={p} now={1791100400000} />);
    fireEvent.keyDown(screen.getByTestId('inbox.root'), { key: '1' });
    expect(p.calls).toEqual(['answer acme-1a2b3c4d 10 1']);
    expect(ids()).toHaveLength(3);
    const field = screen.getByTestId<HTMLTextAreaElement>('inbox.answer');
    field.value = 'cold, then warm';
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(p.calls[1]).toBe('answer acme-1a2b3c4d 9 cold, then warm');
  });

  it('a click on an option shows it picked, then picks it; close and esc', () => {
    vi.useFakeTimers();
    const p = ports();
    render(<Inbox cards={cards()} names={{}} ports={p} now={1791100400000} />);
    fireEvent.click(screen.getByTestId('inbox.card.acme-1a2b3c4d-10.opt.2'));
    expect(screen.getByTestId('inbox.card.acme-1a2b3c4d-10.opt.2').className).toContain('picked');
    expect(p.calls).toEqual([]);
    settle();
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

  it('each item keeps his half answer: another item, esc and back, a new screen; an answer drops it (I6)', () => {
    const p = ports();
    const drafts = makeDrafts();
    const two = cards().filter((c) => c.id !== 10);
    const type = (text: string) => {
      const field = screen.getByTestId<HTMLTextAreaElement>('inbox.answer');
      field.value = text;
      fireEvent.input(field);
    };
    const first = render(<Inbox cards={two} names={{}} ports={p} now={1791100400000} drafts={drafts} />);
    expect(screen.getByTestId('inbox.card.acme-1a2b3c4d-9')).toBeTruthy();
    type('cold, th');
    fireEvent.click(screen.getByTestId('inbox.item.acme-1a2b3c4d-11'));
    fireEvent.click(screen.getByTestId('inbox.item.acme-1a2b3c4d-9'));
    expect(screen.getByTestId<HTMLTextAreaElement>('inbox.answer').value).toBe('cold, th');
    // esc leaves the inbox; the screen comes back later
    fireEvent.keyDown(screen.getByTestId('inbox.root'), { key: 'Escape' });
    first.unmount();
    render(<Inbox cards={two} names={{}} ports={p} now={1791100400000} drafts={drafts} />);
    expect(screen.getByTestId<HTMLTextAreaElement>('inbox.answer').value).toBe('cold, th');
    type('cold, then warm');
    fireEvent.keyDown(screen.getByTestId('inbox.answer'), { key: 'Enter' });
    expect(p.calls).toEqual(['back', 'answer acme-1a2b3c4d 9 cold, then warm']);
    expect(drafts.get('acme-1a2b3c4d-9')).toBe('');
  });

  it('an item that is gone takes its words with it', () => {
    const drafts = makeDrafts();
    drafts.keep('acme-1a2b3c4d-9', 'half');
    drafts.keep('gone-00000000-1', 'old');
    render(<Inbox cards={cards()} names={{}} ports={ports()} now={1791100400000} drafts={drafts} />);
    expect(drafts.get('acme-1a2b3c4d-9')).toBe('half');
    expect(drafts.get('gone-00000000-1')).toBe('');
  });

  it('ctrl+o opens a long item and folds it again; a short one has nothing folded (I8)', () => {
    const c = cards()[1];
    if (!c) throw new Error('fixture');
    const long = { ...c, question: Array.from({ length: 12 }, (_, i) => `line ${String(i + 1)}`).join('\n') };
    render(<Inbox cards={[long]} names={{}} ports={ports()} now={1791100400000} />);
    const card = () => screen.getByTestId(`inbox.card.${long.project}-${String(long.id)}`).textContent;
    const more = `inbox.card.${long.project}-${String(long.id)}.more`;
    expect(card()).toContain('line 6');
    expect(card()).not.toContain('line 7');
    expect(screen.getByTestId(more).textContent).toContain('6 more lines');
    fireEvent.keyDown(screen.getByTestId('inbox.root'), { key: 'o', ctrlKey: true });
    expect(card()).toContain('line 12');
    expect(screen.queryByTestId(more)).toBeNull();
    fireEvent.keyDown(screen.getByTestId('inbox.root'), { key: 'o', ctrlKey: true });
    expect(card()).not.toContain('line 12');
    cleanup();
    render(<Inbox cards={[c]} names={{}} ports={ports()} now={1791100400000} />);
    expect(screen.queryByTestId(`inbox.card.${c.project}-${String(c.id)}.more`)).toBeNull();
  });

  it('an answer by voice shows what was heard, then answers; esc undoes it (N14)', () => {
    vi.useFakeTimers();
    try {
      const p = ports();
      const views: unknown[] = [];
      const two = cards().filter((c) => c.id !== 10);
      const heard = { project: 'acme-1a2b3c4d', card: 9, n: 1, line: 'heard "the first one" → 1 cold', ms: 1500 };
      const ui = (voice: typeof heard | null) => (
        <Inbox cards={two} names={{}} ports={{ ...p, inView: (c) => views.push(c) }} now={1791100400000} drafts={makeDrafts()} voice={voice} />
      );
      const r = render(ui(null));
      // the window had focus in the test: the current card is in view
      expect(views.at(-1)).toEqual(document.hasFocus() ? { project: 'acme-1a2b3c4d', card: 9 } : null);
      r.rerender(ui(heard));
      expect(screen.getByTestId('inbox.heard').textContent).toContain('heard "the first one" → 1 cold');
      expect(p.calls).toEqual([]);
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(p.calls).toEqual(['answer acme-1a2b3c4d 9 1']);
      expect(screen.queryByTestId('inbox.heard')).toBeNull();
      // a new heard event, undone with esc: nothing goes
      const again = { ...heard, card: 11, line: 'heard "send" → 1 send' };
      r.rerender(ui(again));
      fireEvent.click(screen.getByTestId('inbox.item.acme-1a2b3c4d-11'));
      expect(screen.getByTestId('inbox.heard')).toBeTruthy();
      fireEvent.keyDown(screen.getByTestId('inbox.root'), { key: 'Escape' });
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(p.calls).toEqual(['answer acme-1a2b3c4d 9 1']);
      expect(screen.queryByTestId('inbox.heard')).toBeNull();
      r.unmount();
      expect(views.at(-1)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
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
    expect(keyOf(k('n', { ctrlKey: true }), 'x')).toEqual({ k: 'next' });
    expect(keyOf(k('p', { ctrlKey: true }), '')).toEqual({ k: 'prev' });
    expect(keyOf(k('n', { ctrlKey: true, shiftKey: true }), '')).toBeNull();
    // R19: ctrl+arrows are the arrows (the TUI's arrow_mods)
    expect(keyOf(k('ArrowDown', { ctrlKey: true }), '')).toEqual({ k: 'down' });
    expect(keyOf(k('ArrowLeft', { ctrlKey: true }), '')).toEqual({ k: 'left' });
    expect(keyOf(k('ArrowDown', { altKey: true }), '')).toBeNull();
  });

  it('InboxCard alone: a card with its options and the acts it is given, no list', () => {
    vi.useFakeTimers();
    const picked: number[] = [];
    const c = cards()[2];
    if (!c) throw new Error('fixture');
    render(<InboxCard card={c} project="acme" now={1791100400000} acts={{ pick: (n) => picked.push(n), open: () => picked.push(0), openPage: () => picked.push(-1) }} testId="capsule.card" />);
    fireEvent.click(screen.getByTestId('capsule.card.opt.1'));
    settle();
    fireEvent.click(screen.getByTestId('capsule.card.open'));
    fireEvent.click(screen.getByTestId('capsule.card.page'));
    expect(picked).toEqual([1, 0, -1]);
    expect(screen.queryByTestId('capsule.card.close')).toBeNull();
    // main's card is bise's (ambient m_11273); outside the window: '⏎ open in bise', no close
    expect(screen.getByTestId('capsule.card').textContent).toContain('bise asks');
    expect(screen.getByTestId('capsule.card.keys').textContent).toBe('1 2pick⏎open in bise⌘Oopen its pageesclater');
  });
});
