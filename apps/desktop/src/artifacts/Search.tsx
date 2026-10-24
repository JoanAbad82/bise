// Search across folders (page artifacts-gallery v7 'chercher'): / searches everywhere, whatever
// folder is open: names, folders, agents, kinds. '17 found for "dark" in all folders · ⏎ opens the
// first, esc clears', the kind chips with their counts, then the results grouped by folder, four a
// group, the rest behind 'all 6 ›'. Nothing found: where it looked, and the nearest match to open.
// The cards are the grid's (art-grid's ArtifactGrid, through `cards`). A pure render. Owner: art-folders.
import type { ReactNode } from 'react';
import { Button, Press } from '@/ds';
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
export function KindChips({ total, chips, chip, onChip, testId }: { total: number; chips: readonly { kind: ChipKind; n: number }[]; chip: ChipKind | null; onChip: (k: ChipKind | null) => void; testId: string }) {
  return (
    <span className="art-chips" data-testid={testId}>
      <Press look="art-chip" aria-pressed={chip === null} onClick={() => { onChip(null); }} data-testid={`${testId}.all`}>
        {library.all_kinds} <span className="n">{total}</span>
      </Press>
      {chips.map((c) => (
        <Press key={c.kind} look="art-chip" aria-pressed={chip === c.kind} onClick={() => { onChip(chip === c.kind ? null : c.kind); }} data-testid={`${testId}.${c.kind}`}>
          {chipWord(c.kind)} <span className="n">{c.n}</span>
        </Press>
      ))}
    </span>
  );
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
