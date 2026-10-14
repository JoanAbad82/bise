// The drop zones and '+ add' (the rules in give.ts) (designer's pick 4, m_23868, m_23898): ThreadDrop over a
// thread's rows ('drop to give this file to perf'), AddDrop over an artifacts list ('drop to add it
// to storefront'), AddButton in the list's head (the macOS picker through window.bise.pickFiles).
// Each file goes through the hub's do: add (store.addArtifact), by you. The zones draw only while
// files are dragged over the window (useFileDrag). Owner: art-desktop.
import { useCallback, type DragEvent, type ReactNode } from 'react';
import { Button } from '@/ds';
import { useProjects, useStore } from '@/store';
import { addDropWords, addPlace, addTitle, carriesFiles, droppedPaths, giveWords, useFileDrag, type AddPlace } from './give';

/** What the window's bridge offers for adding (absent in a plain browser or a test: nothing adds). */
interface GiveBridge {
  filePath?: (f: File) => string;
  pickFiles?: () => Promise<readonly string[]>;
}
const bridge = (): GiveBridge | undefined => (globalThis as { bise?: GiveBridge }).bise;

/** The dropped files' paths through the bridge (none without it). */
function pathsOf(e: DragEvent): string[] {
  const pathOf = bridge()?.filePath;
  if (pathOf === undefined) return [];
  return droppedPaths(Array.from(e.dataTransfer.files), pathOf);
}

/** dragover must be taken, or the drop never comes (and the window would navigate to the file). */
function over(e: DragEvent): void {
  if (!carriesFiles(e.dataTransfer.types)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}

/**
 * Over a thread's rows while he drags files: the dashed zone. A drop gives each file to `agent` as
 * an artifact by you; the drop goes on to the window, where the composer makes it a file chip (its
 * own window drop, composer/pm/paste.ts), so the agent gets the file in his next message too.
 */
export function ThreadDrop({ project, agent, to }: { project: string; agent: string; to: string }) {
  const store = useStore();
  const drag = useFileDrag();
  if (!drag.on) return null;
  const onDrop = (e: DragEvent) => {
    for (const p of pathsOf(e)) store.addArtifact(project, agent, p);
    // no stopPropagation: the composer's window drop attaches the same files
  };
  return (
    <div className="art-give" data-testid="thread.give" onDragOver={over} onDrop={onDrop}>
      <span className="art-give-words">{giveWords(drag.count, to)}</span>
    </div>
  );
}

/** The add place of a list: the project's main, or bise's home with 'all projects' (''). */
export function useAddPlace(project: string): AddPlace | null {
  return addPlace(project, useProjects());
}

/** '+ add' in a list's head: the picker, then each picked file to the place. Hidden without the bridge's picker. */
export function AddButton({ place, testId, className = 'art-add' }: { place: AddPlace | null; testId: string; className?: string }) {
  const store = useStore();
  const pick = bridge()?.pickFiles;
  const onClick = useCallback(() => {
    if (place === null || pick === undefined) return;
    void pick().then((paths) => {
      for (const p of paths) store.addArtifact(place.project, place.agent, p);
    });
  }, [place, pick, store]);
  if (pick === undefined) return null;
  return (
    <span className={className}>
      <Button kind="ghost" size="sm" {...(place === null ? {} : { title: addTitle(place) })} disabled={place === null} onClick={onClick} testId={testId}>
        + add
      </Button>
    </span>
  );
}

/** An artifacts list that takes a drop: its children, and the dashed zone over them while he drags files. */
export function AddDrop({ place, testId, children }: { place: AddPlace | null; testId: string; children: ReactNode }) {
  const store = useStore();
  const drag = useFileDrag();
  const onDrop = (e: DragEvent) => {
    if (place === null || !carriesFiles(e.dataTransfer.types)) return;
    e.preventDefault();
    // the list's, not the composer's: no chip in whatever composer is open
    e.stopPropagation();
    for (const p of pathsOf(e)) store.addArtifact(place.project, place.agent, p);
  };
  return (
    <div className="art-add-drop" data-testid={testId} onDragOver={place === null ? undefined : over} onDrop={onDrop}>
      {children}
      {drag.on && place !== null && (
        <div className="art-give" data-testid={`${testId}.zone`}>
          <span className="art-give-words">{addDropWords(drag.count, place)}</span>
        </div>
      )}
    </div>
  );
}
