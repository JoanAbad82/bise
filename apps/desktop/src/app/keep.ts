// Nothing he typed or opened is lost across a window reload, an update swap (relaunch) or a
// core restart (his ask, ambient-lead m_11756; the TUI's keep-state does the same in
// ~/.bise/drafts). Owner: amb-win.
//
// One versioned record in the renderer's localStorage (Chromium keeps it inside userData, so a
// reload and a relaunch on the same userData find it): his text per field, kept until it is
// sent, cancelled or emptied (no age), and the view: the route, open panels and folds (no age:
// a Mac app reopens where he left it), and the short-lived bits (scroll anchors, the focused
// row, the docked card's answering mode) kept 10 minutes, for a reload or an update swap, not
// for the next day. Written 300 ms after the last change, at once when a field is dropped, and
// on pagehide / beforeunload. The store's refill after a core restart never touches it.
//
// Never a secret: a key field never calls it (settings' API keys, sign-in codes).
// Field ids, the same words as the TUI's file where they meet: 'draft:<project>/<agent>' is the
// composer's own (src/composer/drafts.ts), 'card:<project>/<id>' a card answer, 'spot' the
// spotlight, 'palette', 'find:<project>/<agent>', 'rename:<project>/<agent>', 'new:<project>'.
import { useCallback, useEffect, useState } from 'react';

export interface KeepStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const KEEP_KEY = 'bise.keep.v1';
/** How long a short-lived view bit (scroll, focus, answering mode) lives: a reload, an update swap. */
export const SHORT_MS = 10 * 60_000;
/** The write's debounce after his last change. */
export const WRITE_MS = 300;

interface Text {
  readonly text: string;
  readonly at: number;
}
interface View {
  readonly v: unknown;
  readonly at: number;
  readonly short?: true;
}
export interface KeepRec {
  readonly v: 1;
  readonly fields: Readonly<Record<string, Text>>;
  readonly view: Readonly<Record<string, View>>;
}

const EMPTY: KeepRec = { v: 1, fields: {}, view: {} };
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** The kept record from its stored words: anything unreadable reads as empty; short view bits past SHORT_MS go. Pure. */
export function parseKeep(raw: string | null, now: number): KeepRec {
  if (raw === null) return EMPTY;
  let o: unknown;
  try {
    o = JSON.parse(raw);
  } catch {
    return EMPTY;
  }
  if (!isObj(o) || o['v'] !== 1) return EMPTY;
  const fields: Record<string, Text> = {};
  if (isObj(o['fields'])) {
    for (const [id, f] of Object.entries(o['fields'])) {
      if (isObj(f) && typeof f['text'] === 'string' && f['text'] !== '') fields[id] = { text: f['text'], at: typeof f['at'] === 'number' ? f['at'] : now };
    }
  }
  const view: Record<string, View> = {};
  if (isObj(o['view'])) {
    for (const [k, w] of Object.entries(o['view'])) {
      if (!isObj(w) || !('v' in w)) continue;
      const at = typeof w['at'] === 'number' ? w['at'] : 0;
      const short = w['short'] === true;
      if (short && now - at > SHORT_MS) continue;
      view[k] = short ? { v: w['v'], at, short: true } : { v: w['v'], at };
    }
  }
  return { v: 1, fields, view };
}

export interface Keep {
  /** His kept text for a field ('' when none). */
  text(id: string): string;
  /** Keep his text ('' drops it), written after WRITE_MS. */
  setText(id: string, text: string): void;
  /** The field was sent or cancelled: drop it, written at once. */
  dropText(id: string): void;
  /** Drop the fields of `prefix` that `alive` says are gone (a card no longer open). */
  pruneTexts(prefix: string, alive: (id: string) => boolean): void;
  /** A kept view bit, if it is still there (short ones live SHORT_MS). */
  view(key: string): unknown;
  /** Keep a view bit; `short`: a scroll, a focus, a mode (SHORT_MS). undefined drops it. */
  setView(key: string, v: unknown, short?: boolean): void;
  /** Write now (pagehide, beforeunload, a test). */
  flush(): void;
  /** Tests only: forget everything (memory and store), so one test's fields never open the next one's. */
  clear(): void;
}

/** A keep over a store; `now` and `later` are the clock and the timer (tests pass their own). */
export function createKeep(store: KeepStore | null, now: () => number = Date.now, later: (f: () => void, ms: number) => () => void = defaultLater): Keep {
  let rec: KeepRec = parseKeep(safeGet(store), now());
  let cancel: (() => void) | null = null;
  const flush = (): void => {
    cancel?.();
    cancel = null;
    if (store === null) return;
    try {
      store.setItem(KEEP_KEY, JSON.stringify(rec));
    } catch {
      // a full or gone store: his text stays in memory for this run
    }
  };
  const soon = (): void => {
    cancel?.();
    cancel = later(flush, WRITE_MS);
  };
  const putFields = (fields: Record<string, Text>): void => {
    rec = { ...rec, fields };
  };
  return {
    text: (id) => rec.fields[id]?.text ?? '',
    setText(id, text) {
      if ((rec.fields[id]?.text ?? '') === text) return;
      const rest = without(rec.fields, id);
      putFields(text === '' ? rest : { ...rest, [id]: { text, at: now() } });
      soon();
    },
    dropText(id) {
      if (!(id in rec.fields)) return;
      putFields(without(rec.fields, id));
      flush();
    },
    pruneTexts(prefix, alive) {
      const dead = Object.keys(rec.fields).filter((id) => id.startsWith(prefix) && !alive(id));
      if (dead.length === 0) return;
      putFields(Object.fromEntries(Object.entries(rec.fields).filter(([id]) => !dead.includes(id))));
      soon();
    },
    view(key) {
      const w = rec.view[key];
      if (w === undefined) return undefined;
      if (w.short === true && now() - w.at > SHORT_MS) return undefined;
      return w.v;
    },
    setView(key, v, short = false) {
      const { [key]: old, ...rest } = rec.view;
      if (v === undefined) {
        if (old === undefined) return;
        rec = { ...rec, view: rest };
      } else {
        if (old !== undefined && JSON.stringify(old.v) === JSON.stringify(v) && (old.short === true) === short && !short) return;
        rec = { ...rec, view: { ...rest, [key]: short ? { v, at: now(), short: true } : { v, at: now() } } };
      }
      soon();
    },
    flush,
    clear() {
      cancel?.();
      cancel = null;
      rec = EMPTY;
      flush();
    },
  };
}

/** A record without one key. Pure. */
function without<T>(o: Readonly<Record<string, T>>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(o).filter(([k]) => k !== key));
}

function safeGet(store: KeepStore | null): string | null {
  try {
    return store?.getItem(KEEP_KEY) ?? null;
  } catch {
    return null;
  }
}

function defaultLater(f: () => void, ms: number): () => void {
  const t = globalThis.setTimeout(f, ms);
  return () => {
    globalThis.clearTimeout(t);
  };
}

/**
 * Where the window's keep lives: its surface's file through main (window.bise.keep: written at
 * once, never lost by a quit, src/main/keep.ts), else localStorage (a page outside Electron).
 */
function windowStore(): KeepStore | null {
  const disk = (globalThis as { bise?: { keep?: { read: () => string | null; write: (t: string) => void } } }).bise?.keep;
  if (disk !== undefined) {
    return {
      getItem: () => disk.read(),
      setItem: (_key, value) => {
        disk.write(value);
      },
    };
  }
  try {
    return (globalThis as { localStorage?: KeepStore }).localStorage ?? null;
  } catch {
    return null;
  }
}

/** The window's keep: one per renderer, written on pagehide / beforeunload too. */
export const keep: Keep = createKeep(windowStore());

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const flushNow = (): void => {
    keep.flush();
  };
  window.addEventListener('pagehide', flushNow);
  window.addEventListener('beforeunload', flushNow);
}

/**
 * A text field kept across reloads: [his text, set it, drop it (sent / cancelled)].
 * `id` null: not kept (a secret, or no field). A new id reads that field's kept text.
 */
export function useKeptText(id: string | null): readonly [string, (text: string) => void, () => void] {
  const [s, setS] = useState(() => ({ id, text: id === null ? '' : keep.text(id) }));
  const text = s.id === id ? s.text : id === null ? '' : keep.text(id);
  const set = useCallback(
    (t: string) => {
      setS({ id, text: t });
      if (id !== null) keep.setText(id, t);
    },
    [id],
  );
  const drop = useCallback(() => {
    setS({ id, text: '' });
    if (id !== null) keep.dropText(id);
  }, [id]);
  return [text, set, drop] as const;
}

/**
 * A Storage-like view of the keep for code that takes one (the composer's drafts, history and
 * queue: drafts.ts), so they live in the same file and survive a relaunch too. Its keys become
 * fields 'ls:<key>'; '' or a removal drops them.
 */
export const keptStorage = {
  getItem: (key: string): string | null => {
    const t = keep.text(`ls:${key}`);
    if (t !== '') return t;
    // what an older build kept in localStorage still reads (until it is written here)
    try {
      return (globalThis as { localStorage?: { getItem(k: string): string | null } }).localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    keep.setText(`ls:${key}`, value);
  },
  removeItem: (key: string): void => {
    keep.dropText(`ls:${key}`);
    try {
      (globalThis as { localStorage?: { removeItem(k: string): void } }).localStorage?.removeItem(key);
    } catch {
      // no storage
    }
  },
};

/**
 * A list's scroll kept across reloads and back on its place (10 minutes, like the thread's
 * anchor; designer's desktop-history: ‹ brings a place back with its scroll): read back when the
 * list mounts, once its rows are tall enough (a store refill can take a few frames), and written
 * as he scrolls; at the top nothing is kept. `el` finds the scrolling element; a list drawn only
 * once its rows come (empty first) is looked for over the same frames.
 */
export function useKeptScroll(key: string, el: () => HTMLElement | null): void {
  useEffect(() => {
    const k = `scroll:${key}`;
    const want = keep.view(k);
    let box: HTMLElement | null = null;
    let frame = 0;
    let tries = 0;
    let moved = false;
    // the scrollTop the restore set: its own scroll event is not his move
    let ours = -1;
    const onScroll = () => {
      if (box === null || (!moved && box.scrollTop === ours)) return;
      moved = true;
      keep.setView(k, box.scrollTop > 0 ? box.scrollTop : undefined, true);
    };
    // back where he was, as soon as the rows reach that far (at most ~1 s of frames)
    const restore = () => {
      if (box === null || typeof want !== 'number' || moved) return;
      if (box.scrollHeight - box.clientHeight >= want || tries > 60) {
        box.scrollTop = want;
        ours = box.scrollTop;
        return;
      }
      tries += 1;
      frame = requestAnimationFrame(restore);
    };
    const find = () => {
      box = el();
      if (box === null) {
        tries += 1;
        if (tries <= 60) frame = requestAnimationFrame(find);
        return;
      }
      // listening at once: a scroll in the list's first frame is his too
      box.addEventListener('scroll', onScroll, { passive: true });
      restore();
    };
    find();
    return () => {
      cancelAnimationFrame(frame);
      box?.removeEventListener('scroll', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per list and key
  }, [key]);
}

/** A field's caret at the end of its text, once, when it mounts (a ref callback). */
export function caretAtEnd(el: HTMLInputElement | HTMLTextAreaElement | null): void {
  if (el === null) return;
  const n = el.value.length;
  try {
    el.setSelectionRange(n, n);
  } catch {
    // a type without a caret (number, checkbox)
  }
}
