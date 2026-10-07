// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Card } from '@/proto';
import { InboxStrip, type StripPorts } from './Strip';

afterEach(cleanup);

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

const ports = () => {
  const did: string[] = [];
  const p: StripPorts = {
    answer: (project, c, reply) => did.push(`answer ${project}-${String(c)} ${reply}`),
    close: (project, c) => did.push(`close ${project}-${String(c)}`),
    openInbox: () => did.push('inbox'),
  };
  return { did, p };
};

const NOW = 1791100400000;

describe('InboxStrip (W7/K24)', () => {
  it('nothing waits: no box', () => {
    render(<InboxStrip project="acme" cards={[card(1, 1, 'other')]} ports={ports().p} now={NOW} />);
    expect(screen.queryByTestId('strip')).toBeNull();
  });

  it("numbers the project's items, ctrl+2 opens item 2 in place, a click on an option answers it", () => {
    const { did, p } = ports();
    render(<InboxStrip project="acme" cards={[card(1, 2), card(2, 0), card(3, 1), card(4, 3), card(9, 0, 'other')]} ports={p} now={NOW} />);
    expect(screen.getByTestId('strip.row.1').textContent).toContain('t2');
    expect(screen.getByTestId('strip.row.2').textContent).toContain('t3');
    expect(screen.getByTestId('strip.row.3').textContent).toContain('t1');
    expect(screen.getByTestId('strip.more').textContent).toContain('+ 1 more');
    fireEvent.keyDown(window, { code: 'Digit2', key: '2', ctrlKey: true });
    expect(screen.getByTestId('strip.card.acme-3')).toBeTruthy();
    expect(screen.queryByTestId('strip.row.2')).toBeNull();
    fireEvent.click(screen.getByTestId('strip.card.acme-3.opt.2'));
    expect(did).toEqual(['answer acme-3 2']);
    // it leaves at once: the next ones move up a number
    expect(screen.queryByTestId('strip.card.acme-3')).toBeNull();
    expect(screen.getByTestId('strip.row.2').textContent).toContain('t1');
  });

  it('a click opens a row; esc folds it; close drops it; the inbox link opens ⌘I', () => {
    const { did, p } = ports();
    render(<InboxStrip project="acme" cards={[card(1, 0), card(2, 1)]} ports={p} now={NOW} />);
    fireEvent.click(screen.getByTestId('strip.row.1'));
    expect(screen.getByTestId('strip.card.acme-1')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByTestId('strip.card.acme-1')).toBeNull();
    fireEvent.keyDown(window, { code: 'Digit1', key: '1', ctrlKey: true });
    fireEvent.click(screen.getByTestId('strip.inbox.acme-1'));
    fireEvent.click(screen.getByTestId('strip.card.acme-1.close'));
    expect(did).toEqual(['inbox', 'close acme-1']);
    expect(screen.getByTestId('strip.row.1').textContent).toContain('t2');
  });

  it('ctrl+N past the last row does nothing and leaves the key alone', () => {
    render(<InboxStrip project="acme" cards={[card(1, 0)]} ports={ports().p} now={NOW} />);
    const e = new KeyboardEvent('keydown', { code: 'Digit3', key: '3', ctrlKey: true, cancelable: true });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    expect(screen.queryByTestId('strip.card.acme-1')).toBeNull();
  });
});
