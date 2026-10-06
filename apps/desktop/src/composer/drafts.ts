// Never lose what he types (bar 3.2, the TUI's sb/drafts.rs): one draft per target (a project's
// agent), the messages he sent or put away (↑ brings them back, newest first, 50 kept), and the
// messages queued for after the turn (bar 3.1, queue.rs). Kept in the renderer's storage (amb-core
// m_9460: no core state), so a restart keeps them. A draft is the editor's own JSON (chips
// included); history and queue entries are the same JSON, so ↑ brings a chip back as a chip.
//
// Pure over a Storage-like store: the composer calls save() debounced (never per keystroke),
// and at once on send, put-away and target switch.

export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** A target's saved composer: the draft (editor JSON or null), history and queue (editor JSON). */
export interface Saved {
  readonly draft: string | null;
  /** Newest first. */
  readonly history: readonly string[];
  /** Oldest first: the oldest leaves first when the turn ends. */
  readonly queue: readonly string[];
}

export const HISTORY_MAX = 50;
const PREFIX = 'bise.composer.v1.';
const EMPTY: Saved = { draft: null, history: [], queue: [] };

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
      queue: isStringArray(o.queue) ? o.queue : [],
    };
  } catch {
    return EMPTY;
  }
}

export function save(store: Store, target: string, s: Saved): void {
  if (s.draft === null && s.history.length === 0 && s.queue.length === 0) store.removeItem(PREFIX + target);
  else store.setItem(PREFIX + target, JSON.stringify(s));
}

/** `entry` on top of the history, an equal older one dropped, 50 kept. */
export function remember(s: Saved, entry: string): Saved {
  return { ...s, history: [entry, ...s.history.filter((h) => h !== entry)].slice(0, HISTORY_MAX) };
}

/** ↑/↓ through the history: the entry at `index` (0 = newest), or null past either end. */
export function historyAt(s: Saved, index: number): string | null {
  return index >= 0 && index < s.history.length ? (s.history[index] ?? null) : null;
}

export const enqueue = (s: Saved, entry: string): Saved => ({ ...s, queue: [...s.queue, entry] });

/** ↑ in an empty composer: the newest queued message back to edit, and the queue without it. */
export function popNewest(s: Saved): { readonly entry: string; readonly rest: Saved } | null {
  const entry = s.queue.at(-1);
  return entry === undefined ? null : { entry, rest: { ...s, queue: s.queue.slice(0, -1) } };
}

/** The turn ended: the oldest queued message leaves, the rest wait for the next turn's end. */
export function takeOldest(s: Saved): { readonly entry: string; readonly rest: Saved } | null {
  const entry = s.queue[0];
  return entry === undefined ? null : { entry, rest: { ...s, queue: s.queue.slice(1) } };
}
