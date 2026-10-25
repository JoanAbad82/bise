// Search across folders (page artifacts-gallery v7 'chercher'): / searches everywhere, whatever
// folder is open: names, folders, agents, kinds. '17 found for "dark" in all folders · ⏎ opens the
// first, esc clears', the kind chips with their counts, then the results grouped by folder, four a
// group, the rest behind 'all 6 ›'. Nothing found: where it looked, and the nearest match to open.
// The cards are the grid's (art-grid's ArtifactGrid, through `cards`). A pure render. Owner: art-folders.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Button, Dropdown, Press } from '@/ds';
import { library } from '@/proto/words_library.gen';
import { chipWord, GROUP_SHOWN, type ChipKind, type Group } from './folders';
import type { Item } from './model';

export interface SearchViewProps {
  readonly q: string;
  readonly total: number;
  readonly chips: readonly { kind: ChipKind; n: number }[];
  readonly chip: ChipKind | null;
  readonly onChip: (k: ChipKind | null) => void;
  readonly groups: readonly Group[];
  /** the groups shown whole (past 'all 6 ›') */
  readonly whole: ReadonlySet<string>;
  readonly onWhole: (group: string) => void;
  /** a group's cards: the grid's */
  readonly cards: (items: readonly Item[], group: Group) => ReactNode;
  readonly testId: string;
}

/** A group's key in `whole` and the test ids. */
export const groupKey = (g: Group): string => g.id ?? 'unfiled';

/** The kind chips' row: 'all 17', 'shots 12', ...; the picked one pressed. */
// One row, never wrapped (designer m_40850): the chips that fit, the rest folded into '+2 ⌄'.
export function KindChips({ total, chips, chip, onChip, testId }: { total: number; chips: readonly { kind: ChipKind; n: number }[]; chip: ChipKind | null; onChip: (k: ChipKind | null) => void; testId: string }) {
  const row = useRef<HTMLDivElement>(null);
  const ruler = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState(chips.length);
  useLayoutEffect(() => {
    const box = row.current;
    const r = ruler.current;
    if (box === null || r === null) return undefined;
    const measure = () => { setFit(chipsThatFit(box.clientWidth, [...r.children].map((c) => (c as HTMLElement).offsetWidth), gapOf(r))); };
    measure();
    const seen = new ResizeObserver(measure);
    seen.observe(box);
    return () => { seen.disconnect(); };
  }, [chips, total]);
  const shown = chips.slice(0, fit);
  const folded = chips.slice(fit);
  return (
    <div ref={row} className="art-chips" data-testid={testId}>
      <Press look="art-chip" aria-pressed={chip === null} onClick={() => { onChip(null); }} data-testid={`${testId}.all`}>
        {library.all_kinds} <span className="n">{total}</span>
      </Press>
      {shown.map((c) => (
        <Press key={c.kind} look="art-chip" aria-pressed={chip === c.kind} onClick={() => { onChip(chip === c.kind ? null : c.kind); }} data-testid={`${testId}.${c.kind}`}>
          {chipWord(c.kind)} <span className="n">{c.n}</span>
        </Press>
      ))}
      {folded.length > 0 && (
        <Dropdown look="chip" label={`+${String(folded.length)}`} testId={`${testId}.more`}
          groups={[{ id: 'kinds', rows: folded.map((c) => ({ id: c.kind, name: chipWord(c.kind), trailing: String(c.n), current: chip === c.kind, testId: `${testId}.${c.kind}` })) }]}
          onPick={(k) => { onChip(chip === k ? null : (k as ChipKind)); }} />
      )}
      {/* the ruler: every chip's width, unseen, so the row knows how many fit */}
      <span ref={ruler} className="art-chips-ruler" aria-hidden="true">
        <span className="b-press art-chip">{library.all_kinds} <span className="n">{total}</span></span>
        {chips.map((c) => <span key={c.kind} className="b-press art-chip">{chipWord(c.kind)} <span className="n">{c.n}</span></span>)}
        <span className="b-press art-chip fold">+{chips.length}</span>
      </span>
    </div>
  );
}

const gapOf = (el: HTMLElement): number => parseFloat(getComputedStyle(el).columnGap) || 0;

/**
 * How many kind chips fit in a row `width` wide: `widths` are the 'all' chip's, each chip's, then
 * the '+n ⌄' fold's; the fold takes its room only when some don't fit. Nothing measured (no layout):
 * all. Pure.
 */
export function chipsThatFit(width: number, widths: readonly number[], gap: number): number {
  const n = widths.length - 2;
  if (n <= 0 || width <= 0 || widths.every((w) => w === 0)) return Math.max(n, 0);
  const used = (k: number) => widths.slice(0, k + 1).reduce((s, w) => s + w + gap, 0) - gap;
  if (used(n) <= width) return n;
  const fold = (widths[n + 1] ?? 0) + gap;
  let k = n;
  while (k > 0 && used(k) + fold > width) k -= 1;
  return k;
}

export function SearchResults(p: SearchViewProps) {
  return (
    <div className="art-results" data-testid={p.testId}>
      <p className="art-found" data-testid={`${p.testId}.head`}>
        <b>{library.found({ n: p.total, q: p.q })}</b> {library.found_where}
      </p>
      {p.groups.map((g) => {
        const k = groupKey(g);
        const shown = p.whole.has(k) ? g.items : g.items.slice(0, GROUP_SHOWN);
        return (
          <section key={k} className="art-group" data-testid={`${p.testId}.g.${k}`}>
            <header className="art-group-head">
              <span className="t">{g.title}</span>
              <span className="n">{g.items.length}</span>
              {g.items.length > GROUP_SHOWN && !p.whole.has(k) && (
                <Press look="art-group-all" onClick={() => { p.onWhole(k); }} data-testid={`${p.testId}.all.${k}`}>
                  {library.all_n({ n: g.items.length })}
                </Press>
              )}
            </header>
            {p.cards(shown, g)}
          </section>
        );
      })}
    </div>
  );
}

/** Nothing found: where it looked, the nearest to open, a way out. */
export function NothingFound({ q, nearest, nearestFolder, onOpen, onClear, testId }: { q: string; nearest: Item | null; nearestFolder: string; onOpen: (it: Item) => void; onClear: () => void; testId: string }) {
  return (
    <div className="art-none" data-testid={testId}>
      <p className="art-found">{library.nothing_found({ q })}</p>
      <div className="art-empty-box">
        <div className="t">{library.nothing_called({ q })}</div>
        <p className="s">
          {library.looked_in}
          {nearest !== null && ` ${library.closest({ name: nearest.a.title, folder: nearestFolder, v: nearest.a.version })}`}
        </p>
        <div className="acts">
          {nearest !== null && <Button kind="pri" onClick={() => { onOpen(nearest); }} testId={`${testId}.open`}>{library.open_it({ name: nearest.a.title })}</Button>}
          <Button kind="ghost" onClick={onClear} testId={`${testId}.clear`}>{library.clear_search}</Button>
        </div>
      </div>
    </div>
  );
}
