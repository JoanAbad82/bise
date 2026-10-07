// The composer's field on ProseMirror (TipTap core): the same behavior as the Lexical Brain, over
// the same pure modules (mdlive, tokens, pick, drafts, message, dictate), through one bridge
// (pmtext.ts). The keys (⏎ send, ⇧⏎ new line, tab queue or complete, esc put away or close, ↑/↓
// drafts or the list), the pickers (@ $ / :), long pastes and images as chips, the drafts kept
// per target as editor-neutral entries (entry.ts), the queue sent at the turn's end, and the
// dictation as one live node in the field (schema.ts) that nothing reads until its last words.
//
// The editor is created once per mount on a host element React never renders into: his typing
// goes keyboard -> contenteditable -> ProseMirror, and nothing writes it back. React state here
// (the picker, the placeholder) changes on transitions only, never per keystroke.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type JSX } from 'react';
import { Editor } from '@tiptap/core';
import { UndoRedo } from '@tiptap/extensions';
import { closeHistory, undo, undoDepth } from '@tiptap/pm/history';
import { EditorState, TextSelection, type Transaction } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Slice } from '@tiptap/pm/model';
import type { ComposerActions, FieldBar } from '../Brain';
import { enterMakesNewline, indent, newline, outdentAtStart, subwordLeft, subwordRight, NO_UNDO, type Op } from '../mdlive';
import { buildMessage, chipLabel, chipStrip, isLongPaste, nextChipNumber, noVisionLine, preview, type Chip, type Outgoing, type Segment } from '../message';
import { enqueue, historyAt, keepUnread, load, popNewest, remember, save, takeOldest, type Saved, type Store } from '../drafts';
import { entryOf, entrySegments } from '../entry';
import { agentRows, argRows, artifactRows, commandLine, commandRows, completion, emojiRows, enterSends, fileRows, move, skillRows, MAX_ROWS, type Pick, type Row } from '../pick';
import { isImagePath, type ComposerSources, type PickFile } from '../sources';
import { argAt, browseText, parentQuery, triggerAt, type Trigger } from '../tokens';
import { loadRecent, picked, recentFirst } from '../recent';
import { emojiToken, typedEmoji } from '../emoji';
import { dictated, HOLD_MS } from '../dictate';
import { DOUBLE_CTRL_R_MS } from '@/voicemode/model';
import { Picker } from '../Picker';
import { FIELD_NODES } from './schema';
import { Colors } from './colors';
import {
  applyOp,
  beforeCaret,
  caretOf,
  caretOnFirstLine,
  chipsOf,
  dictationAt,
  docOf,
  insertChip,
  insertText,
  isBlank,
  nodeType,
  plainText,
  offsetOf,
  posOf,
  segmentsOf,
  selectRange,
} from './pmtext';

export interface PmFieldProps {
  readonly target: string;
  readonly busy: boolean;
  readonly sources: ComposerSources;
  readonly store: Store;
  readonly testId: string;
  readonly placeholder: string;
  readonly send: (o: Outgoing) => void;
  readonly command: (name: string, args: string) => void;
  readonly onCanSend: (on: boolean) => void;
  readonly onStrip: (strip: JSX.Element | null) => void;
  readonly onBar: (bar: FieldBar) => void;
  readonly onActions: (a: ComposerActions) => void;
}

/** The draft is written this long after the last change (never on each key of a burst). */
const DRAFT_DEBOUNCE_MS = 400;

const triggerKey = (t: Trigger | null): string => (t === null ? '' : `${t.kind}:${t.start}:${t.quoted ? 'q' : ''}:${t.query}`);

/** On a command line, the argument being typed (its popup), before any @ or $ in it. */
function slotOf(text: string, messageStart: boolean, sources: ComposerSources): Trigger | null {
  const find = (name: string) => sources.commands.find((c) => `/${c.name.replace(/^\//u, '')}` === name);
  return argAt(
    text,
    messageStart,
    (name) => find(name) !== undefined,
    (name, i) => find(name)?.argKinds?.[i] === 'text',
  );
}

/** What the clipboard reads of a selection: chips as their labels, a newline '\n', no dictation. */
export function clipboardText(slice: Slice): string {
  return slice.content.textBetween(0, slice.content.size, '\n', (n) => (n.type.name === 'hardBreak' ? '\n' : n.type.name === 'chip' ? chipLabel(n.attrs.chip as Chip) : ''));
}

/** The state's selection made the DOM's before a key reads the caret. ProseMirror reads a native
 *  caret move (←, a click) on the next selectionchange event, and a quick key can come first
 *  (qa-type's list-indent: ← then ⌫ outdented nothing, the native ⌫ ate the space). */
function syncSelection(v: EditorView): void {
  const ds = v.dom.ownerDocument.getSelection();
  if (ds?.anchorNode == null || ds.focusNode == null || !v.dom.contains(ds.anchorNode) || !v.dom.contains(ds.focusNode)) return;
  try {
    const anchor = v.posAtDOM(ds.anchorNode, ds.anchorOffset);
    const head = v.posAtDOM(ds.focusNode, ds.focusOffset);
    const s = v.state.selection;
    if (s.anchor === anchor && s.head === head) return;
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, anchor, head)));
  } catch {
    // a DOM place ProseMirror can't map (inside a chip's view): its own selection stays
  }
}

/** A transaction kept out of the undo history (the dictation's live node). */
const offHistory = (tr: Transaction): Transaction => tr.setMeta('addToHistory', false);

export function PmField(p: PmFieldProps): JSX.Element {
  const props = useRef(p);
  useEffect(() => {
    props.current = p;
  });
  const host = useRef<HTMLDivElement>(null);
  const ed = useRef<Editor | null>(null);
  const [blank, setBlank] = useState(true);
  // the editor's handlers read the latest closures through these (set after each render)
  const changed = useRef<(tr: Transaction | null) => void>(() => undefined);
  const keys = useRef<(e: KeyboardEvent) => boolean>(() => false);
  const paste = useRef<(e: ClipboardEvent) => boolean>(() => false);
  const drop = useRef<(e: DragEvent) => boolean>(() => false);

  const view = (): EditorView | null => ed.current?.view ?? null;
  const state = (): EditorState | null => ed.current?.state ?? null;
  const dispatch = (tr: Transaction | null): boolean => {
    const v = view();
    if (tr === null || v === null) return false;
    v.dispatch(tr);
    return true;
  };

  // ---- the target's saved composer (drafts.ts), loaded when the target changes ----
  const saved = useRef<Saved>(load(p.store, p.target));
  const browsing = useRef(-1);
  const timer = useRef<number | null>(null);

  const entryNow = (): string => {
    const st = state();
    return entryOf(st === null ? [] : segmentsOf(st.doc));
  };

  const writeNow = (): void => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    const st = state();
    if (st === null) return;
    saved.current = { ...saved.current, draft: isBlank(st.doc) ? null : entryOf(segmentsOf(st.doc)) };
    save(props.current.store, props.current.target, saved.current);
  };

  /** The field's content replaced by an entry (or emptied), the caret at its end; undoable.
   *  An entry that doesn't read leaves the field as it is: false. */
  const setContent = (entry: string | null): boolean => {
    const st = state();
    if (st === null) return false;
    const segs = entry === null ? [] : entrySegments(entry);
    if (segs === null) return false;
    const doc = docOf(st.schema, segs);
    const tr = st.tr.replaceWith(0, st.doc.content.size, doc.content);
    tr.setSelection(TextSelection.atEnd(tr.doc));
    return dispatch(closeHistory(tr));
  };

  /** What he sent is gone from the field's undo too (editor_undo_tests.rs sending_clears_both_stacks):
   *  ⌘Z then says NO_UNDO instead of bringing it back. A new state with the same doc and plugins. */
  const forget = (): void => {
    const v = view();
    if (v === null) return;
    const st = v.state;
    v.updateState(EditorState.create({ doc: st.doc, selection: st.selection, plugins: st.plugins }));
  };

  // ---- the editor: created once, on a host React never renders into ----
  useLayoutEffect(() => {
    const el = host.current;
    if (el === null) return;
    const ph = props.current.placeholder;
    const editor = new Editor({
      element: el,
      extensions: [...FIELD_NODES, Colors, UndoRedo.configure({ depth: 100, newGroupDelay: 500 })],
      injectCSS: false,
      enableInputRules: false,
      enablePasteRules: false,
      editorProps: {
        attributes: {
          class: 'b-field',
          'data-testid': `${props.current.testId}.field`,
          'aria-label': ph,
          'aria-multiline': 'true',
          'aria-placeholder': ph,
          role: 'textbox',
          spellcheck: 'true',
        },
        handleKeyDown: (_v, e) => keys.current(e),
        handlePaste: (_v, e) => paste.current(e),
        handleDrop: (_v, e) => drop.current(e),
        clipboardTextSerializer: clipboardText,
      },
    });
    ed.current = editor;
    const onTr = ({ transaction }: { transaction: Transaction }): void => {
      changed.current(transaction);
    };
    editor.on('transaction', onTr);
    return () => {
      writeNow(); // the screen goes: the draft is kept before the editor does
      editor.off('transaction', onTr);
      editor.destroy();
      ed.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- created once per mount; writeNow reads refs
  }, []);

  // the field's label follows the placeholder (the target's name)
  useEffect(() => {
    const dom = view()?.dom;
    dom?.setAttribute('aria-label', p.placeholder);
    dom?.setAttribute('aria-placeholder', p.placeholder);
  }, [p.placeholder]);

  useEffect(() => {
    saved.current = load(p.store, p.target);
    browsing.current = -1;
    const draft = saved.current.draft;
    if (!setContent(draft) && draft !== null) {
      keepUnread(p.store, p.target, draft); // never dropped: its raw JSON stays aside
      setContent(null);
    }
    forget(); // another target's text never comes back
    changed.current(null);
    return () => {
      writeNow(); // the target changes or the screen goes: the draft is kept at once
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the editor's content follows the target only
  }, [p.target, p.store]);

  // ---- the picker ----
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [openedAt, setOpenedAt] = useState(0);
  const [files, setFiles] = useState<{ key: string; items: readonly PickFile[] }>({ key: '', items: [] });
  const [sel, setSel] = useState({ key: '', i: 0 });
  const [dismissed, setDismissed] = useState('');
  const tkey = triggerKey(trigger);

  useEffect(() => {
    if (trigger?.kind !== 'at') return;
    let live = true;
    const key = tkey;
    void p.sources.files(trigger.query).then((items) => {
      if (live) setFiles({ key, items });
    });
    return () => {
      live = false;
    };
  }, [trigger, tkey, p.sources]);

  const rows = useMemo<Row[]>(() => {
    if (trigger === null) return [];
    const all =
      trigger.kind === 'at'
        ? [...agentRows(trigger, p.sources.agents), ...artifactRows(trigger, p.sources.artifacts ?? [], openedAt), ...(files.key === tkey ? fileRows(recentFirst(files.items, trigger.query, loadRecent(p.store))) : [])]
        : trigger.kind === 'skill'
          ? skillRows(trigger, p.sources.skills)
          : trigger.kind === 'arg'
            ? argRows(trigger, p.sources.commands, p.sources)
            : trigger.kind === 'emoji'
              ? emojiRows(trigger)
              : commandRows(trigger, p.sources.commands);
    return all.slice(0, MAX_ROWS);
  }, [trigger, tkey, files, p.sources, p.store, openedAt]);

  const open = trigger !== null && rows.length > 0 && dismissed !== `${trigger.kind}:${trigger.start}`;
  // after ← / ⌫ up a folder the keyboard's row is the folder he came from (→ goes back in), as a
  // file browser does: derived in the same render as the rows, so a quick → never lands on row 0
  const [left, setLeft] = useState<string | null>(null);
  const leftIndex = left === null || trigger?.kind !== 'at' ? -1 : rows.findIndex((r) => r.id === `file.${left}` || r.id === `file.${left}/`);
  const index = sel.key === tkey ? Math.min(sel.i, Math.max(0, rows.length - 1)) : Math.max(0, leftIndex);
  const live = useRef({ open, rows, index, trigger, tkey });
  const fileList = open && trigger.kind === 'at';
  useEffect(() => {
    live.current = { open, rows, index, trigger, tkey };
  });
  const setIndex = (i: number): void => {
    setSel({ key: live.current.tkey, i });
  };

  // ---- his actions ----
  const clear = (): void => {
    setContent(null);
    browsing.current = -1;
  };

  const submit = (): void => {
    const st = state();
    if (st === null) return;
    const segs = segmentsOf(st.doc);
    if (segs.length === 0 || segs.every((s) => s.kind === 'text' && s.text.trim() === '')) return;
    const entry = entryOf(segs);
    const only = segs.length === 1 && segs[0]?.kind === 'text' ? segs[0].text : null;
    const cmd = only === null ? null : commandLine(only, props.current.sources.commands);
    const model = props.current.sources.noVision;
    if (cmd === null && model !== undefined && segs.some((s) => s.kind === 'chip' && s.chip.kind === 'image')) {
      say(noVisionLine(model)); // K4: nothing sent, the draft and its chips stay
      return;
    }
    if (cmd !== null) {
      if (!cmd.ready) return;
      props.current.command(cmd.name, cmd.args);
    } else {
      props.current.send(buildMessage(segs));
    }
    saved.current = remember(saved.current, entry);
    clear();
    forget();
    writeNow();
  };

  /** The `count` chars before the caret replaced by `text` (a pick); the caret after it. */
  const replaceBefore = (count: number, text: string): void => {
    const st = state();
    const at = st === null ? null : caretOf(st);
    if (st === null || at === null) return;
    dispatch(applyOp(st, { from: at - count, to: at, insert: text, caret: at - count + text.length }));
  };

  const apply = (pick: Pick): void => {
    const t = live.current.trigger;
    if (t === null) return;
    if (pick.kind === 'run') {
      const cmd = props.current.sources.commands.find((c) => `/${c.name.replace(/^\//u, '')}` === pick.name);
      if (cmd?.ready !== true) return;
      saved.current = remember(saved.current, entryNow());
      props.current.command(pick.name, '');
      clear();
      forget();
      writeNow();
      return;
    }
    const st = state();
    const before = st === null ? null : beforeCaret(st);
    if (st === null || before === null) return;
    const word = before.text.slice(t.start).length;
    if (pick.kind === 'artifact') {
      // W11: the @word goes, the artifact's chip comes (attach.rs insert_artifact)
      replaceBefore(word, '');
      const now = state();
      if (now !== null) dispatch(insertChip(now, { kind: 'artifact', n: nextChipNumber(segmentsOf(now.doc)), id: pick.id, title: pick.title, url: pick.url }));
      return;
    }
    if (pick.path !== undefined && !pick.browse) picked(props.current.store, pick.path); // B8
    replaceBefore(word, pick.text);
  };

  /** ← or ⌫ on `@dir/`: one folder up (files.rs parent_query, input.rs at_nav); false elsewhere. */
  const folderUp = (): boolean => {
    const st = state();
    const before = st === null ? null : beforeCaret(st);
    if (before === null) return false;
    const t = triggerAt(before.text, before.messageStart);
    if (t?.kind !== 'at') return false;
    const up = parentQuery(t.query);
    if (up === null) return false;
    setLeft(t.query.slice(0, -1));
    replaceBefore(before.text.slice(t.start).length, browseText(up));
    return true;
  };

  const queue = (): void => {
    saved.current = enqueue(saved.current, entryNow());
    clear();
    forget();
    writeNow();
  };

  const putAway = (): void => {
    saved.current = remember(saved.current, entryNow());
    clear();
    writeNow();
  };

  const addChip = (make: (n: number) => Chip): void => {
    const st = state();
    if (st !== null) dispatch(insertChip(st, make(nextChipNumber(segmentsOf(st.doc)))));
  };

  const addImages = (list: readonly File[]): void => {
    for (const f of list) {
      void Promise.all([props.current.sources.saveImage(f), thumbnail(f)]).then(([img, thumb]) => {
        if (img !== null) addChip((n) => ({ kind: 'image', n, path: img.path, name: img.name, ...(thumb === null ? {} : { thumb }) }));
      });
    }
  };

  /** A long paste: inline first, then its chip in a second undo step (⌘Z puts it back inline). */
  const longPaste = (raw: string): void => {
    const text = raw.replace(/\r\n?/gu, '\n');
    const st = state();
    if (st === null) return;
    const start = st.selection.from;
    dispatch(closeHistory(insertText(st, text).setMeta('paste', true)));
    const now = state();
    if (now === null) return;
    const chip: Chip = { kind: 'paste', n: nextChipNumber(segmentsOf(now.doc)), text };
    const tr = now.tr.replaceWith(start, start + text.length, nodeType(now.schema, 'chip').create({ chip }));
    tr.setSelection(TextSelection.create(tr.doc, start + 1));
    dispatch(closeHistory(tr));
  };

  // ---- the strip above the box: the chips and the queue, re-drawn only when they change ----
  const lastStrip = useRef('');
  const note = useRef<string | null>(null);
  const pushStrip = (chips: readonly Chip[]): void => {
    const q = saved.current.queue;
    const n = note.current;
    const key = JSON.stringify([chips, q, n]);
    if (key === lastStrip.current) return;
    lastStrip.current = key;
    props.current.onStrip(
      chips.length === 0 && q.length === 0 && n === null ? null : (
        <Strip chips={chips} queued={q.map((e) => preview(buildMessage(entrySegments(e) ?? []).text, 48))} note={n} testId={props.current.testId} />
      ),
    );
  };
  const chipsNow = (): Chip[] => {
    const st = state();
    return st === null ? [] : chipsOf(st.doc);
  };
  const say = (text: string): void => {
    note.current = text;
    pushStrip(chipsNow());
  };

  // ---- the key bar's mode: reported when it changes, never per keystroke ----
  const bar = useRef<FieldBar>({ fileList: false, selected: false, images: false, typing: false, dictating: null });
  const lastBar = useRef('');
  const pushBar = (part: Partial<FieldBar>): void => {
    bar.current = { ...bar.current, ...part };
    const key = JSON.stringify(bar.current);
    if (key === lastBar.current) return;
    lastBar.current = key;
    props.current.onBar(bar.current);
  };
  useEffect(() => {
    pushBar({ fileList });
  }, [fileList]);

  // ---- dictation (bar I / 2.6, the TUI's ctrl+r): a live node at the caret shows his words as
  // they come; nothing reads it (not the send, not the draft); his last words replace it as text,
  // one undo step. Esc cancels it: the node goes, the text around it stays ----
  /** the last ctrl+r's time (the double press is voice mode) */
  const lastR = useRef(Number.NEGATIVE_INFINITY);
  const dict = useRef<{ id: string; mic: boolean; downAt: number; off: () => void } | null>(null);
  const dictUpdate = (): void => {
    const d = dict.current;
    const port = props.current.sources.dictate;
    const st = state();
    if (d === null || port === undefined || st === null) return;
    const s = port.read(d.id);
    if (s === null) return;
    const at = dictationAt(st.doc);
    if (!s.final) {
      if (at !== null && !s.cancelled) {
        const node = st.doc.nodeAt(posOf(at));
        if (node !== null && node.attrs.text !== s.text) dispatch(offHistory(st.tr.setNodeMarkup(posOf(at), undefined, { ...node.attrs, text: s.text })));
      }
      return;
    }
    d.off();
    dict.current = null;
    pushBar({ dictating: null });
    if (at !== null) {
      // the node goes (out of the history), then his words where it was (one undo step)
      const before = plainText(st.doc).slice(0, at);
      const caretAfter = st.selection.from > posOf(at);
      const rm = offHistory(st.tr.delete(posOf(at), posOf(at) + 1));
      dispatch(rm);
      const words = s.cancelled ? '' : dictated(s.text, before);
      const now = state();
      if (now !== null && words !== '') {
        const keep = now.selection;
        const tr = now.tr.replaceWith(posOf(at), posOf(at), now.schema.text(words));
        // the caret: after his words when it was after the node, else where it was
        tr.setSelection(caretAfter || keep.from === posOf(at) ? TextSelection.create(tr.doc, posOf(at) + words.length + (keep.from - posOf(at))) : keep.map(tr.doc, tr.mapping));
        dispatch(closeHistory(tr));
      }
    }
    if (s.error !== null) say(s.error);
  };
  const dictStart = (downAt = Number.POSITIVE_INFINITY): void => {
    const port = props.current.sources.dictate;
    const st = state();
    if (port === undefined || dict.current !== null || st === null) return;
    const d = { id: '', mic: true, downAt, off: (): void => undefined };
    dict.current = d;
    const { from, to } = st.selection;
    const lead = dictated('x', plainText(st.doc).slice(0, offsetOf(from))).startsWith(' ') ? ' ' : '';
    const tr = st.tr.replaceWith(from, to, nodeType(st.schema, 'dictation').create({ text: '', lead }));
    tr.setSelection(TextSelection.create(tr.doc, from + 1));
    dispatch(offHistory(tr));
    pushBar({ dictating: 'recording' });
    d.id = port.start();
    d.off = port.subscribe(d.id, dictUpdate);
    dictUpdate(); // a refusal comes at once ('the mic is busy.')
  };
  const dictStop = (): void => {
    const d = dict.current;
    if (d === null || !d.mic) return;
    d.mic = false;
    props.current.sources.dictate?.stop(d.id);
    if (dict.current !== null) pushBar({ dictating: 'transcribing' });
  };
  const dictCancel = (): void => {
    const d = dict.current;
    if (d !== null) props.current.sources.dictate?.cancel(d.id);
  };
  useEffect(() => {
    const up = (e: KeyboardEvent): void => {
      const d = dict.current;
      if (d === null || !d.mic || (e.key.toLowerCase() !== 'r' && e.key !== 'Control')) return;
      if (e.timeStamp - d.downAt >= HOLD_MS) dictStop();
    };
    window.addEventListener('keyup', up, true);
    return () => {
      window.removeEventListener('keyup', up, true);
      dictCancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- registered once; reads refs
  }, []);

  const actions: ComposerActions = {
    submit,
    dictate: () => {
      if (dict.current === null) dictStart();
      else if (dict.current.mic) dictStop();
    },
    insertText: (text) => {
      const st = state();
      if (st !== null) dispatch(insertText(st, text));
    },
    fill: (text) => {
      const st = state();
      if (st === null) return;
      const tr = st.tr.replaceWith(0, st.doc.content.size, docOf(st.schema, [{ kind: 'text', text }]).content);
      tr.setSelection(TextSelection.create(tr.doc, 1, tr.doc.content.size - 1));
      dispatch(tr);
      view()?.focus();
    },
    focus: () => {
      view()?.focus();
    },
    focusEnd: () => {
      const v = view();
      if (v === null) return;
      v.dispatch(v.state.tr.setSelection(TextSelection.atEnd(v.state.doc)));
      v.focus();
    },
    quote: (text, from, at) => {
      if (text.trim() === '') return;
      const st = state();
      if (st === null) return;
      // from the thread the field had no focus: the chip goes at the draft's end, the caret after it
      const chip: Chip = { kind: 'quote', n: nextChipNumber(segmentsOf(st.doc)), text, from, ...(at === undefined ? {} : { at }) };
      const end = TextSelection.atEnd(st.doc).from;
      const tr = st.tr.insert(end, nodeType(st.schema, 'chip').create({ chip }));
      tr.setSelection(TextSelection.atEnd(tr.doc));
      dispatch(tr);
      view()?.focus();
    },
  };
  useEffect(() => {
    props.current.onActions(actions);
  });

  // ---- each transaction: what he typed, read (never written back) ----
  const lastTrigger = useRef('');
  const lastBefore = useRef<string | null>(null);
  const onChange = (tr: Transaction | null): void => {
    const st = state();
    if (st === null) return;
    const b = isBlank(st.doc);
    const before = beforeCaret(st);
    const segs = segmentsOf(st.doc);
    const typedColon =
      tr !== null && tr.docChanged && before !== null && lastBefore.current !== null && before.text === `${lastBefore.current}:` && tr.getMeta('history$') === undefined && tr.getMeta('paste') !== true && tr.getMeta('uiEvent') !== 'paste';
    lastBefore.current = before?.text ?? null;
    const em = typedColon ? typedEmoji(before.text) : null;
    if (em !== null && before !== null) {
      // a `:` he just typed closes a known `:name:`: the emoji takes its place (emoji.rs replace_typed)
      queueMicrotask(() => {
        replaceBefore(before.text.slice(em.start).length, em.glyph);
      });
      return;
    }
    setBlank(b);
    props.current.onCanSend(!b);
    pushBar({ selected: !st.selection.empty, typing: !b, images: segs.some((x) => x.kind === 'chip' && x.chip.kind === 'image') });
    const emojiTrigger = (text: string): Trigger | null => {
      const e = emojiToken(text);
      return e === null ? null : { kind: 'emoji', query: e.query, start: e.start, quoted: false };
    };
    const t = before === null ? null : (slotOf(before.text, before.messageStart, props.current.sources) ?? triggerAt(before.text, before.messageStart) ?? emojiTrigger(before.text));
    const k = triggerKey(t);
    if (k !== lastTrigger.current) {
      lastTrigger.current = k;
      setTrigger(t);
      setOpenedAt(Date.now());
    }
    const edited = tr?.docChanged === true && tr.getMeta('addToHistory') !== false;
    if (edited) note.current = null;
    pushStrip(chipsOf(st.doc));
    if (edited) {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(writeNow, DRAFT_DEBOUNCE_MS);
    }
  };

  // ---- the keys ----
  const onKey = (e: KeyboardEvent): boolean => {
    const v = view();
    if (v === null || e.isComposing || v.composing) return false;
    syncSelection(v);
    const st = v.state;
    const blankNow = (): boolean => isBlank(v.state.doc);
    const at = (): { text: string; caret: number } | null => {
      const c = caretOf(v.state);
      return c === null ? null : { text: plainText(v.state.doc), caret: c };
    };
    const run = (make: (text: string, caret: number) => Op | null): boolean => {
      const a = at();
      const op = a === null ? null : make(a.text, a.caret);
      if (op === null) return false;
      e.preventDefault();
      dispatch(applyOp(v.state, op));
      return true;
    };
    const k = e.key;
    const plain = !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey;
    // ctrl+r: the mic on (held: push-to-talk; pressed: on until a key), again: off
    if (e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && k.toLowerCase() === 'r' && props.current.sources.dictate !== undefined) {
      e.preventDefault();
      if (e.repeat) return true;
      // ctrl+r twice within DOUBLE_CTRL_R_MS (the TUI's): voice mode, the first press's
      // dictation cancelled (amb-home's src/voicemode; one ctrl+r stays dictation)
      const voice = props.current.sources.voice;
      const twice = voice !== undefined && e.timeStamp - lastR.current < DOUBLE_CTRL_R_MS;
      lastR.current = e.timeStamp;
      if (twice) {
        lastR.current = Number.NEGATIVE_INFINITY;
        if (dict.current !== null) dictCancel();
        voice();
        return true;
      }
      if (dict.current === null) dictStart(e.timeStamp);
      else if (dict.current.mic) dictStop();
      return true;
    }
    if (dict.current !== null && k === 'Enter') {
      // never send half a dictation: ⏎ turns the mic off, the words come in to read
      e.preventDefault();
      dictStop();
      return true;
    }
    if (dict.current !== null && k === 'Escape') {
      e.preventDefault();
      dictCancel();
      return true;
    }
    if (dict.current?.mic === true && !['Control', 'Shift', 'Alt', 'Meta', 'Escape', 'CapsLock'].includes(k)) dictStop();
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && k.toLowerCase() === 'z') {
      e.preventDefault();
      if (undoDepth(st) > 0) undo(st, v.dispatch);
      else say(NO_UNDO);
      return true;
    }
    if (e.ctrlKey && e.altKey && !e.metaKey && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Backspace' || k === 'Delete')) {
      const a = at();
      if (a === null) return false;
      e.preventDefault();
      const left = k === 'ArrowLeft' || k === 'Backspace';
      const to = left ? subwordLeft(a.text, a.caret) : subwordRight(a.text, a.caret);
      if (k === 'ArrowLeft' || k === 'ArrowRight') dispatch(selectRange(st, to, to));
      else dispatch(applyOp(st, { from: Math.min(to, a.caret), to: Math.max(to, a.caret), insert: '', caret: Math.min(to, a.caret) }));
      return true;
    }
    const l = live.current;
    switch (k) {
      case 'Backspace':
        if (!plain) return false;
        if (folderUp()) {
          e.preventDefault();
          return true;
        }
        return run(outdentAtStart);
      case 'ArrowRight': {
        const row = l.rows[l.index];
        if (!l.open || l.trigger?.kind !== 'at' || row?.tag !== 'dir' || !plain) return false;
        e.preventDefault();
        apply(row.pick);
        return true;
      }
      case 'ArrowLeft':
        if (!plain || !folderUp()) return false;
        e.preventDefault();
        return true;
      case 'Enter': {
        if (e.metaKey && !l.open) {
          e.preventDefault();
          submit();
          return true;
        }
        // an argument already typed whole ('/close 1' on row '1') sends; else the row is picked (amb-feed 8074b58c)
        if (l.open && !enterSends(l.trigger, l.rows[l.index])) {
          e.preventDefault();
          const row = l.rows[l.index];
          if (row !== undefined && !row.off) apply(row.pick);
          return true;
        }
        const a = at();
        if (e.shiftKey || (a !== null && enterMakesNewline(a.text, a.caret))) {
          // ⇧⏎ a new line, a list item continued; ⏎ in a ``` block a new line too (mdlive.rs)
          if (run(newline)) return true;
          e.preventDefault();
          dispatch(insertText(v.state, '\n'));
          return true;
        }
        e.preventDefault();
        submit();
        return true;
      }
      case 'Tab': {
        if (l.open) {
          e.preventDefault();
          const row = l.rows[l.index];
          if (row !== undefined && !row.off) apply(completion(row));
          return true;
        }
        if (!e.shiftKey && run(indent)) return true;
        if (props.current.busy && !blankNow()) {
          e.preventDefault();
          queue();
          return true;
        }
        return false;
      }
      case 'Escape': {
        if (l.open && l.trigger !== null) {
          e.preventDefault();
          if (l.trigger.kind === 'slash') {
            clear();
            writeNow();
            return true;
          }
          setDismissed(`${l.trigger.kind}:${l.trigger.start}`);
          return true;
        }
        if (props.current.busy) return false;
        if (!blankNow()) {
          e.preventDefault();
          putAway();
          return true;
        }
        return false;
      }
      case 'ArrowUp': {
        if (e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return false;
        if (l.open) {
          e.preventDefault();
          setIndex(move(l.index, -1, l.rows.length));
          return true;
        }
        if (blankNow()) {
          const popped = popNewest(saved.current);
          if (popped !== null) {
            e.preventDefault();
            saved.current = popped.rest;
            setContent(popped.entry);
            return true;
          }
        }
        if (blankNow() || (browsing.current >= 0 && caretOnFirstLine(v.state))) {
          const entry = historyAt(saved.current, browsing.current + 1);
          if (entry === null) {
            if (blankNow()) e.preventDefault();
            return blankNow();
          }
          e.preventDefault();
          browsing.current += 1;
          setContent(entry);
          return true;
        }
        return false;
      }
      case 'ArrowDown': {
        if (e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return false;
        if (l.open) {
          e.preventDefault();
          setIndex(move(l.index, 1, l.rows.length));
          return true;
        }
        if (browsing.current < 0) return false;
        e.preventDefault();
        browsing.current -= 1;
        setContent(browsing.current < 0 ? null : historyAt(saved.current, browsing.current));
        return true;
      }
      default:
        return false;
    }
  };

  // ---- paste and drop: images as chips, a long text as a chip, any text as plain text ----
  const onPaste = (e: ClipboardEvent): boolean => {
    const data = e.clipboardData;
    if (data === null) return false;
    const images = Array.from(data.files).filter((f) => f.type.startsWith('image/'));
    if (images.length > 0) {
      e.preventDefault();
      addImages(images);
      return true;
    }
    const text = data.getData('text/plain');
    e.preventDefault();
    if (isLongPaste(text)) {
      longPaste(text);
      return true;
    }
    const st = state();
    if (st !== null && text !== '') dispatch(insertText(st, text.replace(/\r\n?/gu, '\n')).setMeta('paste', true));
    return true;
  };
  const onDropHere = (e: DragEvent): boolean => {
    const images = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/') || isImagePath(f.name));
    if (images.length === 0) return false;
    e.preventDefault();
    addImages(images);
    return true;
  };

  useLayoutEffect(() => {
    changed.current = onChange;
    keys.current = onKey;
    paste.current = onPaste;
    drop.current = onDropHere;
  });

  // ---- a file dropped anywhere in the window is the composer's, never a navigation ----
  useEffect(() => {
    const over = (e: DragEvent): void => {
      e.preventDefault();
    };
    const onDrop = (e: DragEvent): void => {
      e.preventDefault();
      if (view()?.dom.contains(e.target as Node) === true) return; // handleDrop has it
      const images = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/') || isImagePath(f.name));
      if (images.length > 0) addImages(images);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', onDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- registered once; reads refs
  }, []);

  // ---- the turn ended: the oldest queued message leaves (queue.rs) ----
  const wasBusy = useRef(p.busy);
  useEffect(() => {
    if (wasBusy.current && !p.busy) {
      const taken = takeOldest(saved.current);
      if (taken !== null) {
        saved.current = taken.rest;
        save(p.store, p.target, saved.current);
        p.send(buildMessage(entrySegments(taken.entry) ?? []));
        pushStrip(chipsNow());
      }
    }
    wasBusy.current = p.busy;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pushStrip/chipsNow read refs and the editor
  }, [p]);

  return (
    <>
      <div ref={host} className="b-field-host" />
      {blank && <span className="ph b-field-ph">{p.placeholder}</span>}
      {open && (
        <Picker
          rows={rows}
          index={index}
          testId={`${p.testId}.pick`}
          onPick={(i) => {
            const row = rows[i];
            if (row !== undefined && !row.off) apply(row.pick);
            view()?.focus();
          }}
        />
      )}
    </>
  );
}

/** A small thumbnail of an image file as a data URL (the chip's), or null when it can't be read. */
async function thumbnail(f: File, side = 48): Promise<string | null> {
  try {
    const bmp = await createImageBitmap(f);
    const k = Math.min(1, side / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * k));
    c.height = Math.max(1, Math.round(bmp.height * k));
    c.getContext('2d')?.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    return c.toDataURL('image/png');
  } catch {
    return null;
  }
}

/** Above the box: the chips' strip (`▤ 1 “first words…”  240 lines · 9.8 kB`) and the queue. */
function Strip({ chips, queued, note, testId }: { chips: readonly Chip[]; queued: readonly string[]; note: string | null; testId: string }): JSX.Element {
  return (
    <div className="b-composer-strip" data-testid={`${testId}.strip`}>
      {note !== null && (
        <div className="n" data-testid={`${testId}.note`}>
          {note}
        </div>
      )}
      {queued.map((q, i) => (
        <div key={`q${i}`} className="q" data-testid={`${testId}.queued.${i + 1}`}>
          {q}
          <span className="k">queued · sent when this turn ends · ↑ edit</span>
        </div>
      ))}
      {chips.map((c) => (
        <div key={c.n} className="c" data-testid={`${testId}.strip.${c.n}`}>
          {chipStrip(c)}
        </div>
      ))}
    </div>
  );
}

export type { Segment };
