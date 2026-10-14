// Giving him files to an agent as artifacts (office-artifacts plan §7, designer's pick 4, m_23868,
// m_23898): a drop on a thread's rows makes each file an artifact of that thread's agent, by you
// (and the composer's own window drop makes it a file chip, as before); a drop on the artifacts list
// or its '+ add' (the macOS picker, window.bise.pickFiles) adds to the list's project's main, or to
// bise's own home with 'all projects'. Always through the hub's do: add (store.addArtifact), never a
// write into artifacts/. The drop zones show only while he drags files. Pure parts here, laws in
// give.test.ts. Owner: art-desktop.
import { useEffect, useState } from 'react';
import type { ProjectRow } from '@/proto';

/** A drag that carries files from Finder (not a text or a link being dragged). Pure. */
export function carriesFiles(types: readonly string[] | DOMStringList | undefined): boolean {
  if (types === undefined) return false;
  return Array.from(types as ArrayLike<string>).includes('Files');
}

/**
 * The thread's drop zone words: 'drop to give q3.xlsx to perf'. While he drags, Chromium tells how
 * many files but never their names: 'drop to give this file to perf', 'drop to give 3 files to
 * perf'. Pure.
 */
export function giveWords(count: number, to: string, name?: string): string {
  const what = name !== undefined && name !== '' ? name : count > 1 ? `${String(count)} files` : 'this file';
  return `drop to give ${what} to ${to}`;
}

/** Where the list's '+ add' and drop put a file: the project's main, else bise's own home's. */
export interface AddPlace {
  readonly project: string;
  readonly agent: string;
  /** the name his words say: the project's, or 'bise' */
  readonly name: string;
}

/**
 * The list's add place (designer m_23898): one project picked: its main; 'all projects' (''):
 * bise's own home, so bise sees it. Null until the core said which project is home. Pure.
 */
export function addPlace(project: string, projects: readonly ProjectRow[]): AddPlace | null {
  const row = project === '' ? projects.find((p) => p.home) : projects.find((p) => p.project === project);
  if (row === undefined) return null;
  const name = row.home ? 'bise' : row.name !== '' ? row.name : row.project;
  return { project: row.project, agent: 'main', name };
}

/** '+ add''s tooltip: 'add a file to storefront', 'add a file to bise'. Pure. */
export const addTitle = (p: AddPlace): string => `add a file to ${p.name}`;

/** The list's drop zone words: 'drop to add it to storefront'. Pure. */
export function addDropWords(count: number, p: AddPlace): string {
  return `drop to add ${count > 1 ? `${String(count)} files` : 'it'} to ${p.name}`;
}

/** The dropped files' absolute paths (window.bise.filePath); one made in the page has none and is left out. */
export function droppedPaths(files: readonly File[], pathOf: (f: File) => string): string[] {
  return files.map(pathOf).filter((p) => p !== '');
}

/** Files dragged over the window now, and how many (0: none; the zones hide). */
export interface FileDrag {
  readonly on: boolean;
  readonly count: number;
}

/**
 * The drag's state, the window's: dragenter/dragleave counted (a drag over a child fires a leave
 * on its parent), reset by a drop, a dragend or leaving the window.
 */
export function useFileDrag(): FileDrag {
  const [drag, setDrag] = useState<FileDrag>({ on: false, count: 0 });
  useEffect(() => {
    let depth = 0;
    const enter = (e: DragEvent): void => {
      if (!carriesFiles(e.dataTransfer?.types)) return;
      depth += 1;
      const count = e.dataTransfer?.items.length ?? 1;
      setDrag((d) => (d.on && d.count === count ? d : { on: true, count }));
    };
    const leave = (e: DragEvent): void => {
      if (!carriesFiles(e.dataTransfer?.types)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0 || e.relatedTarget === null) {
        depth = 0;
        setDrag({ on: false, count: 0 });
      }
    };
    const end = (): void => {
      depth = 0;
      setDrag({ on: false, count: 0 });
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    // capture: the zone's own drop handler may stop it from reaching the window
    window.addEventListener('drop', end, true);
    window.addEventListener('dragend', end);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', end, true);
      window.removeEventListener('dragend', end);
    };
  }, []);
  return drag;
}
