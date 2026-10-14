// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Card } from '@/proto';
import { formatRoute, parseRoute } from '@/app/route';
import { InboxView } from './List';
import type { InboxRecord, Jump } from './past';

afterEach(cleanup);

const NOW = new Date(2026, 9, 14, 15, 0).getTime();
const at = (d: number, h: number, m: number) => new Date(2026, 9, 14 - d, h, m).getTime();
const CARDS: Card[] = [{ id: 3, project: 'shop', kind: 'question', agent: 'search', question: 'which size system should the filter use?', options: [], urgent: false, since_ms: NOW - 12 * 60_000 }];
const RECORDS: InboxRecord[] = [
  { card: 1, project: 'shop', asker: 'perf', kind: 'question', question: 'keep the webp next to the avif?', options: ['keep both', 'avif only'], state: 'answered', said: 'only for Safari 16', where: { kind: 'inbox' }, asked_ms: at(0, 13, 58), at_ms: at(0, 14, 2), thread: { agent: 'perf', pos: 40 } },
  { card: 2, project: 'bise', asker: 'designer', kind: 'question', question: 'la ligne d’attente?', options: ['A', 'B'], state: 'answered', pick_n: 1, where: { kind: 'page', page: 'wait-line', block: 'q1' }, asked_ms: at(1, 23, 0), at_ms: at(1, 23, 12) },
  { card: 5, project: 'shop', asker: 'checkout', kind: 'question', question: 'retry the failed payment test?', options: [], state: 'withdrawn', reason: 'checkout answered itself', asked_ms: at(1, 18, 0), at_ms: at(1, 18, 30) },
];
const NAMES = { shop: 'storefront', bise: 'bise' };
const PROJECTS = [{ project: 'bise', name: 'bise' }, { project: 'shop', name: 'storefront' }];

function mount() {
  const answered: string[] = [];
  const jumps: Jump[] = [];
  render(<InboxView cards={CARDS} records={RECORDS} names={NAMES} projects={PROJECTS} now={NOW}
    nextOf={(r) => (r.card === 1 ? 'kept a webp fallback for Safari 16' : undefined)}
    ports={{ answer: (p, c) => answered.push(`${p}#${String(c)}`), jump: (j) => jumps.push(j) }} />);
  return { answered, jumps, root: screen.getByTestId('inbox.screen') };
}

describe('the inbox screen', () => {
  it("is the route 'inbox/all'; the bare 'inbox' stays the block's ask", () => {
    expect(parseRoute('inbox/all')).toEqual({ screen: 'inbox' });
    expect(formatRoute({ screen: 'inbox' })).toBe('inbox/all');
    expect(parseRoute('inbox').screen).toBe('notfound');
  });

  it('shows what waits first, then the past by day, two lines each', () => {
    mount();
    expect(screen.getByTestId('inbox.counts').textContent).toBe('1 waiting · 2 answered');
    expect(screen.getByTestId('inbox.waiting.head').textContent).toBe('waiting for you · 1');
    const rows = [...screen.getByTestId('inbox.list').querySelectorAll('[role=option]')].map((r) => r.getAttribute('data-row'));
    expect(rows).toEqual(['w:shop/3', 'p:shop/1', 'p:bise/2', 'p:shop/5']);
    expect(screen.getByTestId('inbox.row.p:shop/1.said').textContent).toBe('you: only for Safari 16 · in the inbox');
    // the option's words, never its digit
    expect(screen.getByTestId('inbox.row.p:bise/2.said').textContent).toBe('you: A · on a page');
    expect(screen.getByTestId('inbox.row.p:shop/5').className).toContain('gone');
    expect(screen.getByTestId('inbox.row.p:shop/5.said').textContent).toBe('withdrawn: checkout answered itself');
  });

  it('⏎ on a waiting item opens it above the composer; on a past one goes to his answer', () => {
    const { answered, jumps, root } = mount();
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(answered).toEqual(['shop#3']);
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(jumps).toEqual([{ kind: 'thread', project: 'shop', agent: 'perf', card: 1, pos: 40 }]);
    // a page answer: the page at its block
    fireEvent.click(screen.getByTestId('inbox.row.p:bise/2'));
    expect(jumps[1]).toEqual({ kind: 'page', project: 'bise', page: 'wait-line', block: 'q1' });
  });

  it('space opens the read-only detail; ↓ the next; o goes; esc back', () => {
    const { jumps, root } = mount();
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    fireEvent.keyDown(root, { key: ' ' });
    expect(screen.getByTestId('inbox.detail.question').textContent).toBe('keep the webp next to the avif?');
    expect(screen.getByTestId('inbox.detail.said').textContent).toBe('only for Safari 16');
    expect(screen.getByTestId('inbox.detail').textContent).toContain('perf went on: kept a webp fallback for Safari 16');
    expect(screen.getByTestId('inbox.detail.go').textContent).toBe("open it in perf's thread");
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    expect(screen.getByTestId('inbox.detail.question').textContent).toBe('la ligne d’attente?');
    fireEvent.keyDown(root, { key: 'o' });
    expect(jumps).toEqual([{ kind: 'page', project: 'bise', page: 'wait-line', block: 'q1' }]);
    fireEvent.keyDown(root, { key: 'Escape' });
    expect(screen.queryByTestId('inbox.detail')).toBeNull();
    expect(screen.getByTestId('inbox.list')).toBeTruthy();
  });

  it('filters by state and searches with /', () => {
    const { root } = mount();
    fireEvent.click(screen.getByTestId('inbox.state.withdrawn'));
    expect([...screen.getByTestId('inbox.list').querySelectorAll('[role=option]')].map((r) => r.getAttribute('data-row'))).toEqual(['p:shop/5']);
    fireEvent.click(screen.getByTestId('inbox.state.all'));
    fireEvent.keyDown(root, { key: '/' });
    expect(document.activeElement).toBe(screen.getByTestId('inbox.search'));
    fireEvent.change(screen.getByTestId('inbox.search'), { target: { value: 'safari' } });
    expect([...screen.getByTestId('inbox.list').querySelectorAll('[role=option]')].map((r) => r.getAttribute('data-row'))).toEqual(['p:shop/1']);
    fireEvent.keyDown(screen.getByTestId('inbox.search'), { key: 'Escape' });
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });
});
