// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { Artifact } from '@/proto';
import { ArtifactGrid } from './Grid';
import { StackSheet } from './Sheet';
import { useGridKeys, type View } from './gridKeys';
import type { Card, Place, Stack } from './gallery';
import { library } from '@/proto/words_library.gen';
import type { Item } from './model';

afterEach(cleanup);

const NOW = new Date(2026, 9, 22, 19, 0).getTime();
const at = (daysAgo: number, h: number, m: number) => new Date(2026, 9, 22 - daysAgo, h, m).getTime();
const TURN = at(0, 14, 0);
type A = Artifact;
const art = (id: string, extra: Partial<A> = {}): A => ({ id, kind: 'file', title: id, agent: 'amb-home', version: 1, at_ms: at(0, 14, 2), url: '', new: false, ...extra });
const item = (a: A): Item => ({ project: 'h-1', projectName: 'harness', a });
const shot = (n: number, words: string) =>
  item(art(`s${String(n)}`, { kind: 'shot', title: `agent view step 2 · ${words}`, turn: TURN, path: `/x/s${String(n)}.png`, at_ms: at(0, 14, 2) + 100 - n }));

const ITEMS: Item[] = [
  item(art('hero', { kind: 'page', title: 'page hero shots', new: true, at_ms: at(0, 18, 40), url: 'http://127.0.0.1:1/p/hero' })),
  shot(1, 'dark · 1400'), shot(2, 'dark · 800'), shot(3, 'light · 1400'), shot(4, 'light · 800'),
  item(art('target', { agent: 'agent-target', title: 'agent-target shots', path: '/x/t.png', at_ms: at(0, 9, 12) })),
  item(art('pr', { kind: 'pr', title: 'Pattern<…> in type errors', url: 'https://github.com/gvergnaud/ts-pattern/pull/384', at_ms: at(0, 8, 0) })),
  item(art('folds', { agent: 'amb-win', title: 'open folds, dark', path: '/x/f.png', at_ms: at(9, 11, 0) })),
];

/** The screen's part of the seam (Screen.tsx, art-folders): the keys, the picks, the open stack. */
function Gallery({ items = ITEMS, view = 'grid' as View, place = { kind: 'folder', owner: 'amb-home' } as Place }) {
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [opened, setOpened] = useState<string[]>([]);
  const [stack, setStack] = useState<Stack | null>(null);
  const open = (c: Card) => {
    if (c.kind === 'stack') setStack(c);
    else setOpened((o) => [...o, c.it.a.id]);
  };
  const { ref, onKeyDown, cards, cols, sel, setSel, cardOf } = useGridKeys<HTMLDivElement>({ items, view, onOpen: (k) => { const c = cardOf(k); if (c) open(c); } });
  return (
    <div ref={ref} tabIndex={-1} onKeyDown={onKeyDown} data-testid="screen" data-opened={opened.join(',')}>
      {stack !== null ? (
        <StackSheet stack={stack} now={NOW} onOpen={(it) => { setOpened((o) => [...o, it.a.id]); }} onBack={() => { setStack(null); }} testId="sheet" />
      ) : (
        <ArtifactGrid cards={cards} cols={cols} view={view} now={NOW} place={place} cursor={sel} picked={picked}
          onPick={(k, how) => {
            setSel(k);
            setPicked((p) => (how.meta ? new Set(p.has(k) ? [...p].filter((x) => x !== k) : [...p, k]) : new Set([k])));
          }}
          onOpen={open} scroller={() => null} testId="grid" />
      )}
    </div>
  );
}

const card = (key: string) => screen.getByTestId(`grid.card.${key}`);
const STACK = 'stack:h-1/s1';

describe('the gallery, as he sees it', () => {
  it('draws a card per artifact and one per stack, by day, with the line rule 1 asks for', () => {
    render(<Gallery />);
    const grid = screen.getByTestId('grid');
    expect(grid.dataset['cols']).toBe('4'); // happy-dom's window is 1024 wide
    expect(screen.getByTestId('grid.day.2026-10-22').textContent).toBe('today');
    expect(screen.getByTestId('grid.day.2026-10-13').textContent).toBe('tue 13 oct');
    // the folder's own agent: the time alone; another agent: its name first; an older day: its date
    expect(screen.getByTestId(`grid.card.${STACK}.line`).textContent).toBe('14:02');
    expect(screen.getByTestId('grid.card.h-1/target.line').textContent).toBe('agent-target · 09:12');
    expect(screen.getByTestId('grid.card.h-1/folds.line').textContent).toBe('amb-win · oct 13');
    // the project never in words: in the line's tip
    expect(screen.getByTestId('grid.card.h-1/target.line').getAttribute('data-tip')).toBe('made by agent-target in harness');
    // the kind never in words on a card: the extension mark only (shown on hover by its css)
    expect(within(card('h-1/target')).queryByText('image')).toBeNull();
    expect(screen.getByTestId('grid.card.h-1/target.ext').textContent).toBe('png');
  });

  it('a stack: one card, its count and its tip; new: the pink chip; a PR: ↗ and its domain, no extension', () => {
    render(<Gallery />);
    expect(screen.queryByTestId('grid.card.h-1/s2')).toBeNull();
    const count = screen.getByTestId(`grid.card.${STACK}.count`);
    expect(count.textContent).toBe('4');
    expect(count.getAttribute('data-tip')).toBe('4 shots saved in one turn: opens as a sheet');
    expect(screen.getByTestId('grid.card.h-1/hero.new').textContent).toBe('new');
    expect(screen.queryByTestId(`grid.card.${STACK}.new`)).toBeNull();
    expect(screen.getByTestId('grid.card.h-1/pr.out').textContent).toBe('↗ github.com');
    expect(screen.getByTestId('grid.card.h-1/pr.out').getAttribute('data-tip')).toBe(library.tip_leaves);
    expect(screen.queryByTestId('grid.card.h-1/pr.ext')).toBeNull();
  });

  it('the cursor is a ring; ←→ move one card, ↓ one row; a click picks, ⌘-click picks several and fills the circles', () => {
    render(<Gallery />);
    const scr = screen.getByTestId('screen');
    expect(card('h-1/hero').className).toContain(' on');
    fireEvent.keyDown(scr, { key: 'ArrowRight' });
    expect(card(STACK).className).toContain(' on');
    fireEvent.keyDown(scr, { key: 'ArrowDown' });
    // today has 4 cards: no row below in today, the next row is oct 13's
    expect(card('h-1/folds').className).toContain(' on');
    fireEvent.keyDown(scr, { key: 'ArrowLeft' });
    expect(card('h-1/pr').className).toContain(' on');

    fireEvent.click(card('h-1/target'));
    expect(card('h-1/target').className).toContain('picked');
    expect(screen.getByTestId('grid.card.h-1/target.pick').className).not.toContain(' y');
    fireEvent.click(card('h-1/hero'), { metaKey: true });
    expect(card('h-1/hero').className).toContain('picked');
    expect(screen.getByTestId('grid.card.h-1/target.pick').className).toContain(' y');
    expect(screen.getByTestId('grid.card.h-1/hero.pick').textContent).toBe('✓');
  });

  it('⏎ opens an artifact; on a stack it opens its sheet: line, chips from its names, a chip filters, esc clears then goes back', () => {
    render(<Gallery />);
    const scr = screen.getByTestId('screen');
    fireEvent.keyDown(scr, { key: 'Enter' });
    expect(scr.dataset['opened']).toBe('hero');
    fireEvent.keyDown(scr, { key: 'ArrowRight' });
    fireEvent.keyDown(scr, { key: 'Enter' });
    expect(screen.getByTestId('sheet.line').textContent).toBe('4 shots amb-home saved in one turn, today 14:02');
    expect(screen.getByTestId('sheet.chip.all').textContent).toBe('all 4');
    expect(['dark', 'light', '1400', '800'].every((c) => screen.queryByTestId(`sheet.chip.${c}`) !== null)).toBe(true);
    expect(screen.getByTestId('sheet.item.s1').textContent).toContain('dark · 1400');
    fireEvent.click(screen.getByTestId('sheet.chip.light'));
    expect(screen.queryByTestId('sheet.item.s1')).toBeNull();
    expect(screen.getByTestId('sheet.item.s3')).toBeTruthy();
    const sheet = screen.getByTestId('sheet');
    fireEvent.keyDown(sheet, { key: 'Escape' });
    expect(screen.getByTestId('sheet.item.s1')).toBeTruthy();
    fireEvent.keyDown(sheet, { key: 'Enter' });
    expect(scr.dataset['opened']).toBe('hero,s1');
    fireEvent.keyDown(sheet, { key: 'Escape' });
    expect(screen.queryByTestId('sheet')).toBeNull();
    expect(card(STACK)).toBeTruthy();
  });

  it('the list behind ☰: one row a card, the stack says its count, the kind in words, ↓ moves one row', () => {
    render(<Gallery view="list" />);
    const row = (k: string) => screen.getByTestId(`grid.row.${k}`);
    expect(row(STACK).textContent).toContain('agent view step 2 · 4 shots');
    expect(row(STACK).textContent).toContain('shots');
    expect(row('h-1/target').textContent).toContain('image');
    expect(row('h-1/hero').className).toContain(' on');
    fireEvent.keyDown(screen.getByTestId('screen'), { key: 'ArrowDown' });
    expect(row(STACK).className).toContain(' on');
    fireEvent.keyDown(screen.getByTestId('screen'), { key: 'ArrowRight' });
    expect(row(STACK).className).toContain(' on');
  });

  it('follows the window: 5 across at 1400, 3 at 800', () => {
    render(<Gallery />);
    act(() => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1400 });
      window.dispatchEvent(new Event('resize'));
    });
    expect(screen.getByTestId('grid').dataset['cols']).toBe('5');
    act(() => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });
      window.dispatchEvent(new Event('resize'));
    });
    expect(screen.getByTestId('grid').dataset['cols']).toBe('3');
  });
});
