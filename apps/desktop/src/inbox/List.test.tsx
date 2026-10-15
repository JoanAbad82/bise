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
  { card: 1, project: 'shop', asker: 'perf', kind: 'question', question: 'keep the webp next to the avif?', options: ['keep both', 'avif only'], state: 'answered', said: 'only for Safari 16', where: { kind: 'inbox' }, asked_ms: at(0, 13, 58), at_ms: at(0, 14, 2), thread: { agent: 'perf', pos: 40 }, line2: 'you: only for Safari 16 · in the inbox' },
  { card: 2, project: 'bise', asker: 'designer', kind: 'question', question: 'la ligne d’attente?', options: ['A', 'B'], state: 'answered', said: 'A', pick_n: 1, where: { kind: 'page', page: 'wait-line', block: 'q1' }, asked_ms: at(1, 23, 0), at_ms: at(1, 23, 12), line2: 'you: A · on a page' },
  { card: 5, project: 'shop', asker: 'checkout', kind: 'question', question: 'retry the failed payment test?', options: [], state: 'withdrawn', reason: 'checkout answered itself', asked_ms: at(1, 18, 0), at_ms: at(1, 18, 30), line2: 'withdrawn: checkout answered itself' },
];
const NAMES = { shop: 'storefront', bise: 'bise' };
const PROJECTS = [{ project: 'bise', name: 'bise' }, { project: 'shop', name: 'storefront' }];

function mount() {
  const answered: string[] = [];
  const jumps: Jump[] = [];
  render(<InboxView cards={CARDS} records={RECORDS} names={NAMES} projects={PROJECTS} now={NOW}
    nextOf={(r) => (r.card === 1 ? 'kept a webp fallback for Safari 16' : undefined)}
    pageOf={(_, page) => (page === 'wait-line' ? { title: 'the wait line', version: 3 } : undefined)}
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

  it('⏎ on a waiting item opens it above the composer; on a past one opens it whole in the pane; ⌘⏎ goes to his answer', () => {
    const { answered, jumps, root } = mount();
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(answered).toEqual(['shop#3']);
    expect(screen.queryByTestId('inbox.detail')).toBeNull();
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    expect(screen.getByTestId('inbox.keys.enter').textContent).toBe('⏎ open');
    fireEvent.keyDown(root, { key: 'Enter' });
    // the first action: the item whole beside the list, nothing jumped
    expect(jumps).toEqual([]);
    expect(screen.getByTestId('inbox.list')).toBeTruthy();
    expect(screen.getByTestId('inbox.detail.question').textContent).toBe('keep the webp next to the avif?');
    // the second: his answer in its thread, at that entry
    fireEvent.keyDown(root, { key: 'Enter', metaKey: true });
    expect(jumps).toEqual([{ kind: 'thread', project: 'shop', agent: 'perf', card: 1, pos: 40 }]);
    // a click on a page answer opens it in the pane; its button opens the page at its block
    fireEvent.click(screen.getByTestId('inbox.row.p:bise/2'));
    expect(jumps).toHaveLength(1);
    expect(screen.getByTestId('inbox.detail.go').textContent).toBe('open the page at your answer⌘⏎');
    fireEvent.click(screen.getByTestId('inbox.detail.go'));
    expect(jumps[1]).toEqual({ kind: 'page', project: 'bise', page: 'wait-line', block: 'q1' });
    // ⌘⏎ from the list, the pane closed
    fireEvent.keyDown(root, { key: 'Escape' });
    expect(screen.queryByTestId('inbox.detail')).toBeNull();
    fireEvent.keyDown(root, { key: 'ArrowUp' });
    fireEvent.keyDown(root, { key: 'Enter', metaKey: true });
    expect(jumps[2]).toEqual({ kind: 'thread', project: 'shop', agent: 'perf', card: 1, pos: 40 });
  });

  it('the pane: every option with his pick marked, or his words; where and when; the page; it follows ↑↓; esc closes', () => {
    const { jumps, root } = mount();
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    fireEvent.keyDown(root, { key: ' ' });
    // his own words: no option marked, his bubble
    expect(screen.getByTestId('inbox.detail.said').textContent).toBe('only for Safari 16');
    expect(screen.getByTestId('inbox.detail.options').querySelector('[aria-current]')).toBeNull();
    expect(screen.getByTestId('inbox.detail.where').textContent).toBe('you answered in the inbox · 14:02');
    expect(screen.getByTestId('inbox.detail').textContent).toContain('perf went on: kept a webp fallback for Safari 16');
    expect(screen.getByTestId('inbox.detail.go').textContent).toBe("go to your answer in perf's thread⌘⏎");
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    // a pick: its option marked ✓, no bubble; the page he answered on as a chip
    expect(screen.getByTestId('inbox.detail.question').textContent).toBe('la ligne d’attente?');
    expect(screen.getByTestId('inbox.detail.option.1').getAttribute('aria-current')).toBe('true');
    expect(screen.getByTestId('inbox.detail.option.1').textContent).toBe('✓A');
    expect(screen.getByTestId('inbox.detail.option.2').textContent).toBe('2B');
    expect(screen.queryByTestId('inbox.detail.said')).toBeNull();
    expect(screen.getByTestId('inbox.detail.page').textContent).toBe('↗ the wait line · page · v3');
    fireEvent.keyDown(root, { key: 'o' });
    expect(jumps).toEqual([{ kind: 'page', project: 'bise', page: 'wait-line', block: 'q1' }]);
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    expect(screen.getByTestId('inbox.detail').textContent).toContain('withdrawn: checkout answered itself');
    expect(screen.getByTestId('inbox.detail.go').textContent).toBe("open checkout's thread⌘⏎");
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
