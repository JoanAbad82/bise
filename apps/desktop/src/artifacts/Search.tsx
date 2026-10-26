// Search across folders (page artifacts-gallery v7 'chercher'): / searches everywhere, whatever
// folder is open: names, folders, agents, kinds. A filter on the same list (designer m_45293): the
// line '17 found for "dark" in all folders · ⏎ opens the first, esc clears', then every match, under
// the same day heads as All (the grid, Screen.tsx's). The kinds are the toolbar's Filters
// (Toolbar.tsx); nothing found is the screen's ds Empty. A pure render. Owner: nm-pages-a.
import type { ReactNode } from 'react';
import { library } from '@/proto/words_library.gen';

export function SearchResults({ q, total, children, testId }: { q: string; total: number; children: ReactNode; testId: string }) {
  return (
    <div className="art-results" data-testid={testId}>
      <p className="art-found" data-testid={`${testId}.head`}>
        <b>{library.found({ n: total, q })}</b> {library.found_where}
      </p>
      {children}
    </div>
  );
}
