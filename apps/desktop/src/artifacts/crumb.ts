// The title bar's path in the library (page artifacts-gallery v7: 'la barre de titre garde le
// chemin'): 'artifacts › desktop app › agent view', each earlier part going to its place. The
// app's crumb (app/side.ts crumbOf) asks this resolver for the parts after 'artifacts'.
// Owner: art-folders.
import { useFolders } from '@/store';
import type { PlaceCrumb } from '@/app/side';
import { atOfPath, atPath, crumbOf, libraryOf } from './folders';

/** The library's crumb parts of a route's place, from the folder list now. */
export function usePlaceCrumb(): PlaceCrumb {
  const folders = useFolders();
  return (at) => crumbOf(libraryOf(folders, []), atOfPath(at)).map((c) => ({ name: c.name, at: atPath(c.at) }));
}
