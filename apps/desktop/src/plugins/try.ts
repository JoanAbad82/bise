// A plugin's 'try it' line (page plugins §2): a click puts its words at the end of main's composer
// draft, never sends them; he sends or changes them there. Through the composer's own drafts
// (drafts.ts + entry.ts, as artifacts/put.ts), so a draft he had keeps every word and chip.
// Pure over a Storage-like store. Owner: plug-desktop.
import { keepUnread, load, save, type Store } from '@/composer/drafts';
import { entryOf, entrySegments } from '@/composer/entry';
import type { Segment } from '@/composer/message';

/** `words` at the end of `target`'s draft (a project's agent: 'p/main'). */
export function putWords(store: Store, target: string, words: string): void {
  const saved = load(store, target);
  let segs: Segment[] = [];
  if (saved.draft !== null) {
    const read = entrySegments(saved.draft);
    // a draft the composer can't read is never dropped: it goes aside first
    if (read === null) keepUnread(store, target, saved.draft);
    else segs = read;
  }
  const last = segs.at(-1);
  const gap: Segment[] = last !== undefined && !(last.kind === 'text' && /\s$/u.test(last.text)) ? [{ kind: 'text', text: ' ' }] : [];
  save(store, target, { ...saved, draft: entryOf([...segs, ...gap, { kind: 'text', text: words }]) });
}
