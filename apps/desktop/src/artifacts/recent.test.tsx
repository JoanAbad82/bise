// @vitest-environment happy-dom
// The Recent row on all artifacts (Recent.tsx, page art-recent; Gabriel m_46271): the 20 newest by
// creation, whatever their folder, newest first, each with its age and its folder path.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Artifact } from '@/proto';
import { library } from '@/proto/words_library.gen';
import { libraryOf, type Folder } from './folders';
import { RecentRow, recentLine, recentOf, RECENT_ROW_N } from './Recent';
import type { Item } from './model';

afterEach(cleanup);

const NOW = Date.UTC(2026, 9, 27, 12, 0);
const MIN = 60_000;
const art = (id: string, over: Partial<Artifact> = {}): Artifact =>
  ({ id, kind: 'file', title: id, agent: 'perf', url: '', at_ms: NOW, version: 1, new: false, ...over });
const item = (project: string, a: Artifact): Item => ({ project, projectName: project, a });

const docs: Folder = { id: 'f-docs', name: 'docs', by: 'main', named_by_you: false };
const perf: Folder = { id: 'f-perf', name: 'perf', parent: 'f-docs', by: 'main', named_by_you: false };
const FOLDERS = [docs, perf];

describe('the Recent row', () => {
  it('takes the 20 newest by creation, across folders and projects, newest first', () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      item(i % 2 === 0 ? 'acme' : 'web', art(`a${String(i)}`, { created_ms: NOW - i * MIN, ...(i % 3 === 0 ? { folder: 'f-perf' } : {}) })));
    const row = recentOf([...many].reverse());
    expect(row).toHaveLength(RECENT_ROW_N);
    expect(row.map((it) => it.a.id).slice(0, 3)).toEqual(['a0', 'a1', 'a2']);
    expect(new Set(row.map((it) => it.project))).toEqual(new Set(['acme', 'web']));
  });

  it('a new version never brings an old one back: created, not updated', () => {
    const old = item('acme', art('old', { created_ms: NOW - 60 * MIN, at_ms: NOW }));
    const fresh = item('acme', art('fresh', { created_ms: NOW - 5 * MIN, at_ms: NOW - 5 * MIN }));
    expect(recentOf([old, fresh]).map((it) => it.a.id)).toEqual(['fresh', 'old']);
    // no created_ms (an older hub): its first version's time
    const v1 = item('acme', art('v1', { at_ms: NOW, versions: [{ v: 1, at_ms: NOW - 90 * MIN }, { v: 2, at_ms: NOW }] }));
    expect(recentOf([v1, old]).map((it) => it.a.id)).toEqual(['old', 'v1']);
  });

  it('says its age and its folder path, or unfiled', () => {
    const lib = libraryOf(FOLDERS, []);
    expect(recentLine(lib, item('acme', art('a', { created_ms: NOW - 4 * MIN, folder: 'f-perf' })), NOW)).toEqual({ age: '4 min', folder: 'docs › perf' });
    expect(recentLine(lib, item('acme', art('b', { created_ms: NOW - 2 * 60 * MIN })), NOW)).toEqual({ age: '2 h', folder: library.unfiled });
  });

  it('draws its head, its cards, opens one and goes to Recent', () => {
    const items = [
      item('acme', art('bench', { title: 'Bench report', created_ms: NOW - 4 * MIN, folder: 'f-perf', new: true })),
      item('web', art('pr', { title: 'PR #6', created_ms: NOW - 12 * MIN })),
    ];
    const opened: string[] = [];
    let all = 0;
    render(<RecentRow items={items} lib={libraryOf(FOLDERS, items)} now={NOW} list={false}
      onOpen={(it) => { opened.push(it.a.id); }} onAll={() => { all += 1; }} testId="r" />);
    expect(screen.getByTestId('r.n').textContent).toBe('2');
    const cards = screen.getByTestId('r.strip').children;
    expect(Array.from(cards).map((c) => c.getAttribute('data-testid'))).toEqual(['r.item.acme/bench', 'r.item.web/pr']);
    expect(screen.getByTestId('r.item.acme/bench.line').textContent).toBe('4 min · docs › perf');
    expect(screen.getByTestId('r.item.web/pr.line').textContent).toBe(`12 min · ${library.unfiled}`);
    expect(screen.queryByTestId('r.item.acme/bench.new')).not.toBeNull();
    fireEvent.click(screen.getByTestId('r.item.web/pr'));
    fireEvent.click(screen.getByTestId('r.all'));
    expect(opened).toEqual(['pr']);
    expect(all).toBe(1);
  });

  it('is one-line chips in the list view, and nothing when nothing matches', () => {
    const items = [item('acme', art('bench', { title: 'Bench report', created_ms: NOW - 4 * MIN }))];
    const { container, rerender } = render(<RecentRow items={items} lib={libraryOf(FOLDERS, items)} now={NOW} list
      onOpen={() => {}} onAll={() => {}} testId="r" />);
    expect(container.querySelector('.art-recent.list .art-recent-chip')).not.toBeNull();
    rerender(<RecentRow items={[]} lib={libraryOf(FOLDERS, [])} now={NOW} list={false} onOpen={() => {}} onAll={() => {}} testId="r" />);
    expect(screen.queryByTestId('r')).toBeNull();
  });
});
