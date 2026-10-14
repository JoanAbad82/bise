// Never lose what he types (bar 3.2, the TUI's sb/drafts.rs): one draft per target (a project's
// agent) and the messages he sent or put away (↑ brings them back, newest first, 50 kept). Kept in
// the renderer's storage (amb-core m_9460: no core state), so a restart keeps them. A draft is the
// editor's own JSON (chips included); history entries are the same JSON, so ↑ brings a chip back
// as a chip. Queued messages are the hub's (issue 23): an older window's own queue key is read once
// (takeOldQueue) to go to the hub, then dropped.
//
// Pure over a Storage-like store: the composer calls save() debounced (never per keystroke),
// and at once on send, put-away and target switch.

export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** A target's saved composer: the draft (editor JSON or null) and history (editor JSON). */
export interface Saved {
  readonly draft: string | null;
  /** Newest first. */
  readonly history: readonly string[];
}

export const HISTORY_MAX = 50;
const PREFIX = 'bise.composer.v1.';
const EMPTY: Saved = { draft: null, history: [] };

const isStringArray = (x: unknown): x is string[] => Array.isArray(x) && x.every((s) => typeof s === 'string');

/** A target's saved composer; anything unreadable reads as empty (never throws). */
export function load(store: Store, target: string): Saved {
  const raw = store.getItem(PREFIX + target);
  if (raw === null) return EMPTY;
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== 'object' || v === null) return EMPTY;
    const o = v as Record<string, unknown>;
    return {
      draft: typeof o.draft === 'string' ? o.draft : null,
      history: isStringArray(o.history) ? o.history.slice(0, HISTORY_MAX) : [],
    };
  } catch {
    return EMPTY;
  }
}

export function save(store: Store, target: string, s: Saved): void {
  if (s.draft === null && s.history.length === 0) store.removeItem(PREFIX + target);
  else store.setItem(PREFIX + target, JSON.stringify({ draft: s.draft, history: s.history }));
}

/** An older window's own queue for `target` (its entries, oldest first), taken out of the file:
 *  the caller sends them to the hub's queue in order; a second call finds none. */
export function takeOldQueue(store: Store, target: string): string[] {
  const raw = store.getItem(PREFIX + target);
  if (raw === null) return [];
  let q: string[] = [];
  try {
    const v: unknown = JSON.parse(raw);
    const o = typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
    if (isStringArray(o.queue)) q = o.queue;
  } catch {
    return [];
  }
  if (q.length > 0) save(store, target, load(store, target));
  return q;
}

/** A draft the composer can't read (an unknown entry format) is never dropped: its raw JSON goes
 *  aside under its own key, the newest last (architect m_11500). */
export function keepUnread(store: Store, target: string, raw: string): void {
  const key = `${PREFIX}${target}.unread`;
  let kept: string[] = [];
  try {
    const v: unknown = JSON.parse(store.getItem(key) ?? '[]');
    if (isStringArray(v)) kept = v;
  } catch {
    kept = [];
  }
  if (!kept.includes(raw)) store.setItem(key, JSON.stringify([...kept, raw]));
}

/** `entry` on top of the history, an equal older one dropped, 50 kept. */
export function remember(s: Saved, entry: string): Saved {
  return { ...s, history: [entry, ...s.history.filter((h) => h !== entry)].slice(0, HISTORY_MAX) };
}

/** ↑/↓ through the history: the entry at `index` (0 = newest), or null past either end. */
export function historyAt(s: Saved, index: number): string | null {
  return index >= 0 && index < s.history.length ? (s.history[index] ?? null) : null;
}
