// Search across folders (page artifacts-gallery v7 'chercher'): / searches everywhere, whatever
// folder is open: names, folders, agents, kinds. '17 found for "dark" in all folders · ⏎ opens the
// first, esc clears', then the results grouped by folder, four a group, the rest behind 'all 6 ›'
// (the kinds are the window's bar's Filters, Screen.tsx). Nothing found: where it looked, and the
// nearest match to open. The cards are the grid's (art-grid's ArtifactGrid, through `cards`). A
// pure render. Owner: nm-pages-a (art-folders' before).
import type { ReactNode } from 'react';
import { Button, Empty, GroupLabel, Press } from '@/ds';
import { library } from '@/proto/words_library.gen';
import { GROUP_SHOWN, type Group } from './folders';
import type { Item } from './model';

export interface SearchViewProps {
  readonly q: string;
  readonly total: number;
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
            {/* its folder as a group label (app-polish #15), its count after it; 'all 6 ›' at its foot */}
            <GroupLabel count={g.items.length}>{g.title}</GroupLabel>
            {p.cards(shown, g)}
            {g.items.length > GROUP_SHOWN && !p.whole.has(k) && (
              <Press look="art-group-all" onClick={() => { p.onWhole(k); }} data-testid={`${p.testId}.all.${k}`}>
                {library.all_n({ n: g.items.length })}
              </Press>
            )}
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
      <Empty title={library.nothing_called({ q })}
        action={<span className="art-acts">
          {nearest !== null && <Button kind="pri" onClick={() => { onOpen(nearest); }} testId={`${testId}.open`}>{library.open_it({ name: nearest.a.title })}</Button>}
          <Button kind="ghost" onClick={onClear} testId={`${testId}.clear`}>{library.clear_search}</Button>
        </span>}>
        {library.looked_in}
        {nearest !== null && ` ${library.closest({ name: nearest.a.title, folder: nearestFolder, v: nearest.a.version })}`}
      </Empty>
    </div>
  );
}
