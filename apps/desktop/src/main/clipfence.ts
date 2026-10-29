// The clipboard fence of test mode (qa-type m_9532/m_9536): a test run must
// never touch his clipboard (NSPasteboard general), yet ⌘C ⌘X ⌘V in a field
// must still work through the real key path. In test mode the preload
// installs this in every window: ⌘C/⌘X/⌘V (Ctrl elsewhere) are taken at
// keydown, in the capture phase, before Chromium's editing commands run (CDP's
// key events with commands, and the menu's roles, both act only on a keydown
// nobody prevented), and played on a private buffer instead:
//   copy/cut: a copy/cut ClipboardEvent with a fresh DataTransfer goes to the
//     focused element, so the editor's own handler (Lexical's) fills it with its
//     formats; nobody did: the selected text. Cut then deletes the selection
//     (the editor's cut handler does it; else execCommand('delete'), which
//     never touches the clipboard).
//   paste: a paste ClipboardEvent carrying the buffer's formats; nobody took
//     it: execCommand('insertText').
// Each op first sends a selectionchange: the editor's view of the selection
// follows those events, which a fast key sequence (⌘A ⌘C → ⌘V) can outrun.
// Lexical fills a copy in its own update, possibly after the dispatch: the
// selected text goes in at once, its formats replace it when they arrive.
// Untrusted clipboard events have no default action, so nothing reaches the
// system pasteboard. Never installed outside test mode.

export type ClipOp = 'copy' | 'cut' | 'paste';

export interface KeyLike {
  readonly key: string;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
}

/** The clipboard op a key means (⌘ on mac, Ctrl elsewhere; ⌘⇧V pastes too), else null. */
export function clipKey(e: KeyLike, mac: boolean): ClipOp | null {
  const mod = mac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
  if (!mod || e.altKey) return null;
  const k = e.key.toLowerCase();
  if (k === 'v') return 'paste';
  if (e.shiftKey) return null;
  if (k === 'c') return 'copy';
  if (k === 'x') return 'cut';
  return null;
}

/** A file in the buffer: what a Finder copy or a screenshot puts on the clipboard. */
export interface ClipFile {
  readonly name: string;
  readonly type: string;
  readonly bytes: Uint8Array;
}

export interface ClipSeed {
  readonly text?: string;
  readonly files?: readonly ClipFile[];
}

export interface ClipFence {
  /** The buffer's formats (MIME type -> data), for tests and the harness. */
  readonly formats: () => ReadonlyMap<string, string>;
  /** Plays one op on the focused element. */
  readonly run: (op: ClipOp) => void;
  /** window.bise.copy in test mode: the text goes into the buffer. */
  readonly put: (text: string) => void;
  /**
   * Test mode at launch (qa-type m_9600): the buffer as if he had copied this
   * text and/or these files (a Finder copy, a screenshot), so a check presses
   * ⌘V and nothing else.
   */
  readonly seed: (s: ClipSeed) => void;
  /** Takes the key listener off (tests). */
  readonly remove: () => void;
}

// The few DOM shapes the fence uses, written out: src/main type-checks without
// the DOM library (tsconfig.node.json); the preload hands the real window in.
interface ElLike {
  dispatchEvent(e: unknown): boolean;
}
interface DataLike {
  setData(type: string, value: string): void;
  getData(type: string): string;
  readonly types: readonly string[];
  readonly items: { add(file: unknown): unknown };
}
interface ClipEventLike {
  readonly defaultPrevented: boolean;
}
interface KeyEventLike extends KeyLike {
  preventDefault(): void;
  stopImmediatePropagation(): void;
}
interface DocLike {
  dispatchEvent?: (e: unknown) => boolean;
  readonly activeElement: ElLike | null;
  readonly body: ElLike;
  getSelection(): { toString(): string } | null;
  execCommand?: (command: string, showUi?: boolean, value?: string) => boolean;
}
type KeyListener = (e: KeyEventLike) => void;
export interface WinLike {
  readonly document: DocLike;
  readonly Event: new (type: string) => unknown;
  readonly File: new (bits: Uint8Array[], name: string, options: { type: string }) => unknown;
  readonly DataTransfer: new () => DataLike;
  readonly ClipboardEvent: new (
    type: string,
    init: { clipboardData: DataLike; bubbles: boolean; cancelable: boolean; composed: boolean },
  ) => ClipEventLike;
  addEventListener(type: 'keydown', listener: KeyListener, options: { capture: boolean }): void;
  removeEventListener(type: 'keydown', listener: KeyListener, options: { capture: boolean }): void;
}

// a plain text field (input, textarea) has its own selection; else the page's
interface FieldLike {
  readonly value: string;
  readonly selectionStart: number;
  readonly selectionEnd: number | null;
}
function isField(el: unknown): el is FieldLike {
  if (typeof el !== 'object' || el === null) return false;
  const f = el as Record<string, unknown>;
  return typeof f['value'] === 'string' && typeof f['selectionStart'] === 'number';
}
function selectedText(doc: DocLike): string {
  const el = doc.activeElement;
  if (isField(el)) return el.value.slice(el.selectionStart, el.selectionEnd ?? el.selectionStart);
  return doc.getSelection()?.toString() ?? '';
}

/** Runs `f` after the events already queued (the default: a 0 ms timer). */
export type Defer = (f: () => void) => void;

export function installClipFence(win: WinLike, mac: boolean, defer: Defer = (f) => void setTimeout(f, 0)): ClipFence {
  const doc = win.document;
  let buffer = new Map<string, string>();
  let files: readonly ClipFile[] = [];
  const exec = (command: string, value?: string): void => {
    doc.execCommand?.(command, false, value);
  };

  const fire = (op: ClipOp, data: DataLike): ClipEventLike => {
    const target = doc.activeElement ?? doc.body;
    const ev = new win.ClipboardEvent(op, { clipboardData: data, bubbles: true, cancelable: true, composed: true });
    target.dispatchEvent(ev);
    return ev;
  };
  const formatsOf = (dt: DataLike): Map<string, string> => {
    const m = new Map<string, string>();
    for (const type of dt.types) m.set(type, dt.getData(type));
    return m;
  };

  const run = (op: ClipOp): void => {
    // the editor first learns where the caret is: an arrow just pressed has
    // moved it, but the editor hears it from a selectionchange event that may
    // still wait in the queue (qa-type m_9698: ⌘A ⌘C → ⌘V pasted over the
    // old selection); an extra one is harmless
    doc.dispatchEvent?.(new win.Event('selectionchange'));
    if (op === 'paste') {
      const dt = new win.DataTransfer();
      for (const [type, value] of buffer) dt.setData(type, value);
      for (const f of files) dt.items.add(new win.File([f.bytes], f.name, { type: f.type }));
      if (!fire('paste', dt).defaultPrevented) {
        const text = buffer.get('text/plain');
        if (text !== undefined) exec('insertText', text);
      }
      return;
    }
    // the selection before anyone acts on it (a cut removes it)
    const text = selectedText(doc);
    const dt = new win.DataTransfer();
    const ev = fire(op, dt);
    if (ev.defaultPrevented) {
      const next = formatsOf(dt);
      if (next.size > 0) {
        buffer = next;
        files = [];
      }
      return;
    }
    if (text === '') return;
    buffer = new Map([['text/plain', text]]);
    files = [];
    if (op === 'cut') exec('delete');
    // Lexical fills the event in its update, after the dispatch returned:
    // its formats replace the plain text once they're there
    defer(() => {
      const next = formatsOf(dt);
      if (ev.defaultPrevented && next.size > 0) buffer = next;
    });
  };

  const onKey = (e: KeyEventLike): void => {
    const op = clipKey(e, mac);
    if (op === null) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    run(op);
  };
  win.addEventListener('keydown', onKey, { capture: true });

  return {
    formats: () => buffer,
    run,
    put: (text) => {
      buffer = new Map([['text/plain', text]]);
      files = [];
    },
    seed: (seed) => {
      buffer = new Map<string, string>(seed.text === undefined ? [] : [['text/plain', seed.text]]);
      files = seed.files ?? [];
    },
    remove: () => {
      win.removeEventListener('keydown', onKey, { capture: true });
    },
  };
}
