// src/composer · a dictation take whose chat he left (dictation-keep, his 'si c'est en train de
// transcribe, je veux que ça transcribe jusqu'à ce que je revienne'). The field (pm/dictation.ts)
// parks its takes when its target changes or it goes: the mic goes off, each take keeps
// transcribing, and its final is written HERE into that chat's saved draft (drafts.ts + entry.ts),
// where its `take` segment holds the place: his words in its place; no words or an error, the core
// keeping its sound: the segment says failed with its short reason ('try again' when he is back);
// cancelled or nothing kept: the segment goes. When he comes back the field takes its takes back
// (`unpark`) before the final, and draws them itself.
//
// `landTake` is pure; the parked list is the window's (one per renderer, like handoff.ts).
// Owner: dictation-keep.
import { dictated } from './dictate';
import { keepUnread, load, save, type Store } from './drafts';
import { entryOf, entrySegments, type DraftSeg } from './entry';
import { shortReason } from './pm/schema';
import type { DictatePort, DictateState } from './sources';

/** What a take's final does to its place in a draft. */
export type Landed = 'words' | 'failed' | 'gone';

/** The draft's segments once this take's final is in (null: not final yet, nothing changes). Its
 *  words in its place, a space before them after a word; a draft that lost its place gets them at
 *  its end (never lost). */
export function landTake(segs: readonly DraftSeg[], id: string, s: DictateState): { segs: DraftSeg[]; landed: Landed } | null {
  if (!s.final) return null;
  const at = segs.findIndex((x) => x.kind === 'take' && x.id === id);
  const words = s.cancelled ? '' : s.text.trim();
  const before = (i: number): string =>
    segs
      .slice(0, i)
      .map((x) => (x.kind === 'text' ? x.text : '\uFFFC'))
      .join('');
  if (words === '' && s.kept === true && !s.cancelled) {
    if (at < 0) return { segs: [...segs], landed: 'gone' };
    const out = [...segs];
    out[at] = { kind: 'take', id, failed: s.error === null ? '' : shortReason(s.error) };
    return { segs: out, landed: 'failed' };
  }
  if (words === '') return { segs: segs.filter((_, i) => i !== at), landed: 'gone' };
  const i = at < 0 ? segs.length : at;
  const text = dictated(words, before(i));
  const out: DraftSeg[] = [...segs.slice(0, i), { kind: 'text', text }, ...segs.slice(at < 0 ? i : i + 1)];
  return { segs: out, landed: 'words' };
}

/** One draft's takes put back in: `landTake` on its saved entry. A draft it can't read goes aside
 *  first (keepUnread) and the words start a new one. */
export function landInDraft(store: Store, key: string, id: string, s: DictateState): Landed | null {
  const saved = load(store, key);
  let segs: DraftSeg[] = [];
  if (saved.draft !== null) {
    const read = entrySegments(saved.draft);
    if (read === null) keepUnread(store, key, saved.draft);
    else segs = read;
  }
  const r = landTake(segs, id, s);
  if (r === null) return null;
  const blank = r.segs.every((x) => x.kind === 'text' && x.text.trim() === '');
  save(store, key, { ...saved, draft: blank ? null : entryOf(r.segs) });
  return r.landed;
}

interface Parked {
  readonly key: string;
  readonly off: () => void;
}

const parked = new Map<string, Parked>();

/** The field left `key` with take `id` still transcribed (or failed): its final goes in that draft. */
export function park(port: DictatePort, store: Store, key: string, id: string, log?: (line: string) => void): void {
  parked.get(id)?.off();
  const check = (): void => {
    const s = port.read(id);
    if (s === null || !s.final) return;
    parked.get(id)?.off();
    parked.delete(id);
    const landed = landInDraft(store, key, id, s);
    log?.(`dictation: parked ${id} final: ${landed ?? 'nothing'}`);
    // its words are in his draft: the core lets the take's sound go
    if (landed === 'words' || (landed === 'gone' && s.kept === true)) port.done?.(id);
  };
  parked.set(id, { key, off: port.subscribe(id, check) });
  check();
}

/** The field is back on that draft: it draws the take itself. True: it was parked. */
export function unpark(id: string): boolean {
  const p = parked.get(id);
  if (p === undefined) return false;
  p.off();
  parked.delete(id);
  return true;
}

/** Tests: the parked list emptied. */
export function unparkAll(): void {
  for (const p of parked.values()) p.off();
  parked.clear();
}
