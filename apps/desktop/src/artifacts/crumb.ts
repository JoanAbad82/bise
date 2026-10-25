// The title bar's path in the library (page artifacts-gallery v7: 'la barre de titre garde le
// chemin'): 'artifacts › desktop app › agent view', each earlier part going to its place. The
// app's crumb (app/side.ts crumbOf) asks this resolver for the parts after 'artifacts'.
// Owner: art-folders.
// While he searches, the path is 'artifacts › search · dark' (designer m_40850): the screen says
// its words here, the title bar reads them.
import { useSyncExternalStore } from 'react';
import { useFolders } from '@/store';
import type { PlaceCrumb } from '@/app/side';
import { library } from '@/proto/words_library.gen';
import { atOfPath, atPath, crumbOf, libraryOf } from './folders';

let searched = '';
const seen = new Set<() => void>();
const watch = (cb: () => void) => {
  seen.add(cb);
  return () => { seen.delete(cb); };
};

/** The library screen's search words ('' when it isn't searching, or is gone). */
export function sayCrumbSearch(words: string): void {
  if (words === searched) return;
  searched = words;
  for (const cb of [...seen]) cb();
}

/** The library's crumb parts of a route's place, from the folder list now; while searching, the search. */
export function usePlaceCrumb(): PlaceCrumb {
  const folders = useFolders();
  const words = useSyncExternalStore(watch, () => searched);
  return (at) => (words !== ''
    ? [{ name: library.crumb_search({ q: words }), at }]
    : crumbOf(libraryOf(folders, []), atOfPath(at)).map((c) => ({ name: c.name, at: atPath(c.at) })));
}
