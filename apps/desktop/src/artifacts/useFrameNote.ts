// The side panel's frame and the maker's composer (plan §9b, designer's pick 2, art-notes
// 8b85fec14): the viewer draws its own pill 'type to ask about it · ⌘C copy' over his selection and,
// on his click or his first typed key, posts the selection to the window (frameNote.ts reads it).
// The window then makes it a numbered attachment in the maker's composer and gives that composer the
// focus, so his next keys go there. The composer listens to ANCHOR_EVENT (thread/ThreadComposer.tsx),
// the one with `about` this artifact. Owner: art-desktop.
import { useEffect, type RefObject } from 'react';
import { originOf, readFrameNote, type FrameNote } from './frameNote';

/** The window event between the open artifact and its maker's composer. */
export const ANCHOR_EVENT = 'bise:artifact-anchor';

/** The selection to attach in the composer about artifact `id`, with the file's name for its row. */
export interface AnchorAct {
  readonly project: string;
  readonly id: string;
  readonly note: FrameNote;
  readonly file: string;
}

export function sendAnchorAct(a: AnchorAct): void {
  window.dispatchEvent(new CustomEvent<AnchorAct>(ANCHOR_EVENT, { detail: a }));
}

/**
 * Listens to the frame `frame` (its src's origin, its contentWindow) for his selections; `file` is
 * the artifact's title for the attachment's row ('q3-forecast.xlsx · v4').
 */
export function useFrameNote(frame: RefObject<HTMLIFrameElement | null>, src: string | null, project: string, id: string, file: string): void {
  useEffect(() => {
    const origin = originOf(src);
    const onMessage = (e: MessageEvent) => {
      const note = readFrameNote(e.data, { origin: e.origin, source: e.source }, { origin, window: frame.current?.contentWindow ?? null });
      if (note !== null) sendAnchorAct({ project, id, note, file });
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
    };
  }, [frame, src, project, id, file]);
}
