// The composer's behavior, as one Lexical plugin: the keys (⏎ send, ⇧⏎ new line, tab queue or
// complete, esc put away or close, ↑/↓ drafts or the list), the pickers (@ $ /), long pastes and
// images as chips, the drafts kept per target, the queue sent at the turn's end. It reads the
// editor on each update and writes it only on his actions (edit.ts). Its React state (the
// picker, the strip, send on/off) changes on transitions only, never per keystroke.
import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useExtensionDependency } from '@lexical/react/useExtensionComponent';
import { HistoryExtension } from '@lexical/history';
import {
  $createParagraphNode,
  $getRoot,
  $parseSerializedNode,
  $getSelection,
  $isRangeSelection,
  CLEAR_HISTORY_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COPY_COMMAND,
  DROP_COMMAND,
  HISTORY_PUSH_TAG,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  HISTORIC_TAG,
  HISTORY_MERGE_TAG,
  PASTE_COMMAND,
  PASTE_TAG,
  UNDO_COMMAND,
  type LexicalEditor,
  type SerializedLexicalNode,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { $applyOp, $caretOffset, $insertAtCaret, $insertChip, $replaceBeforeCaret, $selectRange } from './edit';
import { $caretOnFirstLine, $isBlank, $plainText, $readSegments, $textBeforeCaret } from './read';
import { enterMakesNewline, indent, newline, outdentAtStart, subwordLeft, subwordRight, NO_UNDO, type Op } from './mdlive';
import { buildMessage, chars, chipStrip, isLongPaste, nextChipNumber, noVisionLine, preview, type Chip, type Outgoing, type Segment } from './message';
import { enqueue, historyAt, load, popNewest, remember, save, takeOldest, type Saved, type Store } from './drafts';
import { agentRows, argRows, artifactRows, commandLine, commandRows, completion, emojiRows, fileRows, move, skillRows, MAX_ROWS, type Pick, type Row } from './pick';
import { isImagePath, type ComposerSources, type PickFile } from './sources';
import { argAt, browseText, parentQuery, triggerAt, type Trigger } from './tokens';
import { loadRecent, picked, recentFirst } from './recent';
import { emojiToken, typedEmoji } from './emoji';
import { $colorsUpToDate, $recolor } from './highlight';
import { Picker } from './Picker';

/** What the screen around a composer may ask of it (dictation, the send button, focus). */
export interface ComposerActions {
  submit(): void;
  /** Words at the caret (dictation's final text, a pick from elsewhere): editable, never sent. */
  insertText(text: string): void;
  focus(): void;
}

interface BrainProps {
  readonly target: string;
  readonly busy: boolean;
  readonly sources: ComposerSources;
  readonly store: Store;
  readonly testId: string;
  readonly send: (o: Outgoing) => void;
  readonly command: (name: string, args: string) => void;
  readonly onCanSend: (on: boolean) => void;
  readonly onStrip: (strip: JSX.Element | null) => void;
  /** The field's part of the key bar's mode, on transitions only (keybar.ts). */
  readonly onBar: (bar: FieldBar) => void;
  /** Hands the screen its actions once mounted (Composer keeps them for the send button). */
  readonly onActions: (a: ComposerActions) => void;
}

/** What the field tells the key bar: a list open, text selected, images, text in it. */
export interface FieldBar {
  readonly fileList: boolean;
  readonly selected: boolean;
  readonly images: boolean;
  readonly typing: boolean;
}

/** The tag of the colors' own update (it never triggers another pass). */
const RECOLOR_TAG = 'bise-recolor';

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

/** The root's children of a saved editor state (drafts.ts entries); [] when unreadable. */
function serializedChildren(entry: string): SerializedLexicalNode[] {
  try {
    const v = JSON.parse(entry) as { root?: { children?: SerializedLexicalNode[] } };
    return Array.isArray(v.root?.children) ? v.root.children : [];
  } catch {
    return [];
  }
}

const json = (editor: LexicalEditor): string => JSON.stringify(editor.getEditorState().toJSON());

const segmentsOf = (editor: LexicalEditor, entry: string): Segment[] => editor.parseEditorState(entry).read(() => $readSegments());

export function Brain(p: BrainProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const props = useRef(p);
  useEffect(() => {
    props.current = p;
  });

  // ---- the target's saved composer (drafts.ts), loaded when the target changes ----
  const saved = useRef<Saved>(load(p.store, p.target));
  const browsing = useRef(-1);
  const timer = useRef<number | null>(null);

  const writeNow = (): void => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    const blank = editor.getEditorState().read(() => $isBlank());
    saved.current = { ...saved.current, draft: blank ? null : json(editor) };
    save(props.current.store, props.current.target, saved.current);
  };

  // the field's content replaced by a draft (or emptied), the caret at its end (input.rs): one
  // update that works inside a key command's own update too (qa-type's drafts and queue-steer: a
  // setEditorState there left the caret at the start)
  const setContent = (entry: string | null): void => {
    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const kids = entry === null ? [] : serializedChildren(entry);
        if (kids.length === 0) root.append($createParagraphNode());
        for (const k of kids) root.append($parseSerializedNode(k));
        root.selectEnd();
      },
      { discrete: true },
    );
  };

  useEffect(() => {
    saved.current = load(p.store, p.target);
    browsing.current = -1;
    setContent(saved.current.draft);
    editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined); // another target's text never comes back
    return () => {
      writeNow(); // the target changes or the screen goes: the draft is kept at once
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the editor's content follows the target only
  }, [p.target, p.store, editor]);

  // ---- the picker ----
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  // when the trigger last changed: the artifacts' `5 min ago` (read in the listener, not in render)
  const [openedAt, setOpenedAt] = useState(0);
  const [files, setFiles] = useState<{ key: string; items: readonly PickFile[] }>({ key: '', items: [] });
  // the keyboard's row, for one trigger: a new trigger starts at the first row
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
  const index = sel.key === tkey ? Math.min(sel.i, Math.max(0, rows.length - 1)) : 0;
  const live = useRef({ open, rows, index, trigger, tkey });
  const fileList = open && trigger.kind === 'at';
  useEffect(() => {
    live.current = { open, rows, index, trigger, tkey };
  });
  const setIndex = (i: number): void => {
    setSel({ key: live.current.tkey, i });
  };
  // after ← / ⌫ up a folder: the keyboard's row goes to the folder he came from once its row shows
  // (→ goes back in), as a file browser does
  const leftFolder = useRef<string | null>(null);
  useEffect(() => {
    const from = leftFolder.current;
    if (from === null || trigger?.kind !== 'at') return;
    const i = rows.findIndex((r) => r.id === `file.${from}` || r.id === `file.${from}/`);
    if (i < 0) return;
    leftFolder.current = null;
    setSel({ key: tkey, i });
  }, [rows, trigger, tkey]);

  // ---- his actions ----
  const clear = (): void => {
    setContent(null);
    browsing.current = -1;
  };
  /** What he sent is gone from the field's undo too (editor_undo_tests.rs sending_clears_both_stacks):
   *  ⌘Z then says NO_UNDO instead of bringing it back. */
  const forget = (): void => {
    editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
  };

  const submit = (): void => {
    const segs = editor.getEditorState().read(() => $readSegments());
    if (segs.length === 0 || segs.every((s) => s.kind === 'text' && s.text.trim() === '')) return;
    const entry = json(editor);
    const only = segs.length === 1 && segs[0]?.kind === 'text' ? segs[0].text : null;
    const cmd = only === null ? null : commandLine(only, props.current.sources.commands);
    const model = props.current.sources.noVision;
    if (cmd === null && model !== undefined && segs.some((s) => s.kind === 'chip' && s.chip.kind === 'image')) {
      say(noVisionLine(model)); // K4: nothing sent, the draft and its chips stay
      return;
    }
    if (cmd !== null) {
      if (!cmd.ready) return; // shown greyed as `not yet` in the list; the line stays his to change
      props.current.command(cmd.name, cmd.args);
    } else {
      props.current.send(buildMessage(segs));
    }
    saved.current = remember(saved.current, entry);
    clear();
    forget();
    writeNow();
  };

  const apply = (pick: Pick): void => {
    const t = live.current.trigger;
    if (t === null) return;
    if (pick.kind === 'run') {
      const cmd = props.current.sources.commands.find((c) => `/${c.name.replace(/^\//u, '')}` === pick.name);
      if (cmd?.ready !== true) return;
      saved.current = remember(saved.current, json(editor));
      props.current.command(pick.name, '');
      clear();
      forget();
      writeNow();
      return;
    }
    if (pick.kind === 'artifact') {
      // W11: the @word goes, the artifact's chip comes (attach.rs insert_artifact)
      editor.update(() => {
        const before = $textBeforeCaret();
        if (before === null) return;
        $replaceBeforeCaret(chars(before.text.slice(t.start)).length, '');
        $insertChip({ kind: 'artifact', n: nextChipNumber($readSegments()), id: pick.id, title: pick.title, url: pick.url });
      });
      return;
    }
    if (pick.path !== undefined && !pick.browse) picked(props.current.store, pick.path); // B8
    editor.update(() => {
      const before = $textBeforeCaret();
      if (before === null) return;
      $replaceBeforeCaret(chars(before.text.slice(t.start)).length, pick.text);
    });
  };

  /** ← or ⌫ on `@dir/`: one folder up (files.rs parent_query, input.rs at_nav); false elsewhere.
   *  Decided by a read now (inside a key command an editor.update only runs after the handler, so
   *  its result can't say whether the key was taken), then the edit. */
  const folderUp = (): boolean => {
    const plan = editor.getEditorState().read(() => {
      const before = $textBeforeCaret();
      const caret = $caretOffset();
      if (before === null || caret === null) return null;
      const t = triggerAt(before.text, before.messageStart);
      if (t?.kind !== 'at') return null;
      const up = parentQuery(t.query);
      if (up === null) return null;
      const word = before.text.slice(t.start);
      return { word, next: browseText(up), caret, from: t.query.slice(0, -1) };
    });
    if (plan === null) return false;
    leftFolder.current = plan.from; // the list one level up lands on the folder he left
    editor.update(() => {
      $replaceBeforeCaret(chars(plan.word).length, plan.next);
      const at = plan.caret - plan.word.length + plan.next.length;
      $selectRange(at, at);
    });
    return true;
  };

  const queue = (): void => {
    saved.current = enqueue(saved.current, json(editor));
    clear();
    forget();
    writeNow();
  };

  const putAway = (): void => {
    saved.current = remember(saved.current, json(editor));
    clear();
    writeNow();
  };

  const addChip = (make: (n: number) => Chip): void => {
    editor.update(() => {
      $insertChip(make(nextChipNumber($readSegments())));
    });
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
    let start: number | null = null;
    // outside the paste command's own update (a nested update merges into it, and the two steps
    // would be one undo entry: qa-type's composer/long-paste, ⌘Z emptied the field)
    window.setTimeout(() => {
      editor.update(
        () => {
          const sel = $getSelection();
          if ($isRangeSelection(sel) && !sel.isCollapsed()) sel.removeText();
          start = $caretOffset();
          $insertAtCaret(text);
        },
        { tag: HISTORY_PUSH_TAG, discrete: true },
      );
      editor.update(
        () => {
          if (start === null || !$selectRange(start, start + text.length)) return;
          $insertChip({ kind: 'paste', n: nextChipNumber($readSegments()), text });
        },
        { tag: HISTORY_PUSH_TAG, discrete: true },
      );
    }, 0);
  };

  const actions: ComposerActions = {
    submit,
    insertText: (text) => {
      // discrete: the words are in before the next call (a dictated sentence then a send)
      editor.update(
        () => {
          $insertAtCaret(text);
        },
        { discrete: true },
      );
    },
    focus: () => {
      editor.focus();
    },
  };
  useEffect(() => {
    props.current.onActions(actions);
  });

  // ---- the strip above the box: the chips and the queue, re-drawn only when they change ----
  const lastStrip = useRef('');
  // one line the composer says to him (ctrl+z with nothing to undo), until his next edit
  const note = useRef<string | null>(null);
  const pushStrip = (chips: readonly Chip[]): void => {
    const q = saved.current.queue;
    const n = note.current;
    const key = JSON.stringify([chips, q, n]);
    if (key === lastStrip.current) return;
    lastStrip.current = key;
    props.current.onStrip(
      chips.length === 0 && q.length === 0 && n === null ? null : (
        <Strip chips={chips} queued={q.map((e) => preview(buildMessage(segmentsOf(editor, e)).text, 48))} note={n} testId={props.current.testId} />
      ),
    );
  };
  const chipsNow = (): Chip[] => editor.getEditorState().read(() => $readSegments().flatMap((x) => (x.kind === 'chip' ? [x.chip] : [])));
  /** One line for him in the strip, until his next edit. */
  const say = (text: string): void => {
    note.current = text;
    pushStrip(chipsNow());
  };

  // ---- the key bar's mode: reported when it changes, never per keystroke ----
  const bar = useRef<FieldBar>({ fileList: false, selected: false, images: false, typing: false });
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

  // ---- the editor's updates: what he typed, read (never written back) ----
  useEffect(() => {
    let lastTrigger = '';
    let lastBefore: string | null = null;
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves, tags }) => {
      const r = editorState.read(() => {
        const sel = $getSelection();
        return { blank: $isBlank(), segs: $readSegments(), before: $textBeforeCaret(), selected: $isRangeSelection(sel) && !sel.isCollapsed() };
      });
      // a `:` he just typed closes a known `:name:`: the emoji takes its place (emoji.rs
      // replace_typed); never on a paste or an undo (⌘Z brings `:clap:` back and it stays)
      const typedColon = r.before !== null && lastBefore !== null && r.before.text === `${lastBefore}:` && !tags.has(HISTORIC_TAG) && !tags.has(PASTE_TAG);
      lastBefore = r.before?.text ?? null;
      const em = typedColon && r.before !== null ? typedEmoji(r.before.text) : null;
      if (em !== null && r.before !== null) {
        const n = chars(r.before.text.slice(em.start)).length;
        editor.update(() => {
          $replaceBeforeCaret(n, em.glyph);
        });
        return;
      }
      // live markdown colors (B9/W8): only when a line's colors changed, never mid-composition
      // (an accent or an IME word), merged into his edit's undo step
      if (!tags.has(RECOLOR_TAG) && !editor.isComposing() && !editorState.read(() => $colorsUpToDate())) {
        editor.update(
          () => {
            $recolor();
          },
          { tag: [RECOLOR_TAG, HISTORY_MERGE_TAG] },
        );
      }
      props.current.onCanSend(!r.blank);
      pushBar({ selected: r.selected, typing: !r.blank, images: r.segs.some((x) => x.kind === 'chip' && x.chip.kind === 'image') });
      const emojiTrigger = (before: string): Trigger | null => {
        const e = emojiToken(before);
        return e === null ? null : { kind: 'emoji', query: e.query, start: e.start, quoted: false };
      };
      const t =
        r.before === null
          ? null
          : (slotOf(r.before.text, r.before.messageStart, props.current.sources) ?? triggerAt(r.before.text, r.before.messageStart) ?? emojiTrigger(r.before.text));
      const k = triggerKey(t);
      if (k !== lastTrigger) {
        lastTrigger = k;
        setTrigger(t);
        setOpenedAt(Date.now());
      }
      const edited = dirtyElements.size > 0 || dirtyLeaves.size > 0;
      if (edited) note.current = null;
      pushStrip(r.segs.flatMap((x) => (x.kind === 'chip' ? [x.chip] : [])));
      if (edited) {
        if (timer.current !== null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(writeNow, DRAFT_DEBOUNCE_MS);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- registered once per editor; reads refs
  }, [editor]);

  // ---- the keys ----
  const history = useExtensionDependency(HistoryExtension).output;
  useEffect(() => {
    const blank = (): boolean => editor.getEditorState().read(() => $isBlank());
    /** The field's text and a collapsed caret's offset in it, or null (a selection, no caret). */
    const at = (): { text: string; caret: number } | null =>
      editor.getEditorState().read(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel) || !sel.isCollapsed()) return null;
        const caret = $caretOffset();
        return caret === null ? null : { text: $plainText(), caret };
      });
    /** Run a markdown key's edit when it has one; true when it did. */
    const run = (e: KeyboardEvent | null, make: (text: string, caret: number) => Op | null): boolean => {
      const a = at();
      const op = a === null ? null : make(a.text, a.caret);
      if (op === null) return false;
      e?.preventDefault();
      editor.update(() => {
        $applyOp(op);
      });
      return true;
    };
    return mergeRegister(
      // ctrl+⌥←/→ subword moves, ctrl+⌥⌫/⌦ subword deletes (editor.rs); ctrl+z / ⌘Z with nothing
      // left to undo says so (sb.rs NO_UNDO) instead of doing nothing
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (e) => {
          if (e.isComposing) return false;
          const k = e.key;
          if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && k.toLowerCase() === 'z') {
            if (history.canUndo.peek()) {
              if (!e.ctrlKey) return false; // ⌘Z: the history's own key
              e.preventDefault();
              editor.dispatchCommand(UNDO_COMMAND, undefined);
              return true;
            }
            e.preventDefault();
            say(NO_UNDO);
            return true;
          }
          if (!(e.ctrlKey && e.altKey) || e.metaKey) return false;
          if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'Backspace' && k !== 'Delete') return false;
          const a = at();
          if (a === null) return false;
          e.preventDefault();
          const left = k === 'ArrowLeft' || k === 'Backspace';
          const to = left ? subwordLeft(a.text, a.caret) : subwordRight(a.text, a.caret);
          editor.update(() => {
            if (k === 'ArrowLeft' || k === 'ArrowRight') $selectRange(to, to);
            else $applyOp({ from: Math.min(to, a.caret), to: Math.max(to, a.caret), insert: '', caret: Math.min(to, a.caret) });
          });
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (e) => {
          if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return false;
          if (folderUp()) {
            e.preventDefault();
            return true;
          }
          return run(e, outdentAtStart);
        },
        COMMAND_PRIORITY_HIGH,
      ),
      // the @ list's folder keys (E21): → on a folder row browses it, ← on `@dir/` goes up
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        (e) => {
          const l = live.current;
          const row = l.rows[l.index];
          if (!l.open || l.trigger?.kind !== 'at' || row?.tag !== 'dir' || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return false;
          e.preventDefault();
          apply(row.pick);
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_ARROW_LEFT_COMMAND,
        (e) => {
          if (e.shiftKey || e.altKey || e.metaKey || e.ctrlKey || !folderUp()) return false;
          e.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (e) => {
          if (e?.isComposing === true) return false; // an accent or an IME word being composed
          const l = live.current;
          if (l.open) {
            e?.preventDefault();
            const row = l.rows[l.index];
            if (row !== undefined && !row.off) apply(row.pick);
            return true;
          }
          // ⇧⏎ a new line, a list item continued; ⏎ in a ``` block a new line too (mdlive.rs)
          if (e?.shiftKey === true) return run(e, newline);
          const a = at();
          if (a !== null && enterMakesNewline(a.text, a.caret)) return run(e, newline);
          e?.preventDefault();
          submit();
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (e) => {
          const l = live.current;
          if (l.open) {
            e.preventDefault();
            const row = l.rows[l.index];
            if (row !== undefined && !row.off) apply(completion(row));
            return true;
          }
          if (!e.shiftKey && run(e, indent)) return true; // a list item one level in
          if (props.current.busy && !blank()) {
            e.preventDefault();
            queue();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        (e) => {
          const l = live.current;
          if (l.open && l.trigger !== null) {
            e.preventDefault();
            if (l.trigger.kind === 'slash') {
              // the / popup: esc clears the /query (the TUI's), the @ and $ popups keep his text
              clear();
              writeNow();
              return true;
            }
            setDismissed(`${l.trigger.kind}:${l.trigger.start}`);
            return true;
          }
          // during a turn a plain esc is the screen's stop (⛔6, amb-win): left unhandled, it
          // bubbles there and the text stays
          if (props.current.busy) return false;
          if (!blank()) {
            e.preventDefault();
            putAway();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (e) => {
          const l = live.current;
          if (l.open) {
            e.preventDefault();
            setIndex(move(l.index, -1, l.rows.length));
            return true;
          }
          if (blank()) {
            const popped = popNewest(saved.current);
            if (popped !== null) {
              e.preventDefault();
              saved.current = popped.rest;
              setContent(popped.entry);
              return true;
            }
          }
          if (blank() || (browsing.current >= 0 && editor.getEditorState().read(() => $caretOnFirstLine()))) {
            const entry = historyAt(saved.current, browsing.current + 1);
            if (entry === null) return blank();
            e.preventDefault();
            browsing.current += 1;
            setContent(entry);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (e) => {
          const l = live.current;
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
        },
        COMMAND_PRIORITY_HIGH,
      ),
      // ⌘C: the selection's text always goes on the clipboard, chips as their labels (qa-type's
      // composer/edit-keys: after ⌘A, Lexical's own copy put an empty text/plain)
      editor.registerCommand(
        COPY_COMMAND,
        (e) => {
          if (!(e instanceof ClipboardEvent) || e.clipboardData === null) return false;
          const text = editor.getEditorState().read(() => {
            const sel = $getSelection();
            return sel === null ? '' : sel.getTextContent();
          });
          const dom = window.getSelection()?.toString() ?? '';
          const out = text !== '' ? text : dom;
          if (out === '') return false;
          e.preventDefault();
          e.clipboardData.setData('text/plain', out);
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        PASTE_COMMAND,
        (e) => {
          if (!(e instanceof ClipboardEvent) || e.clipboardData === null) return false;
          const images = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'));
          if (images.length > 0) {
            e.preventDefault();
            addImages(images);
            return true;
          }
          const text = e.clipboardData.getData('text/plain');
          if (!isLongPaste(text)) return false;
          e.preventDefault();
          longPaste(text);
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (e) => {
          const images = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/') || isImagePath(f.name));
          if (images.length === 0) return false;
          e.preventDefault();
          addImages(images);
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- registered once per editor; reads refs
  }, [editor]);

  // ---- a file dropped anywhere in the window is the composer's, never a navigation (qa-type
  // m_9587: an unhandled drop opened the file as a page, a window on his screen in test mode) ----
  useEffect(() => {
    const over = (e: DragEvent): void => {
      e.preventDefault();
    };
    const drop = (e: DragEvent): void => {
      e.preventDefault();
      if (editor.getRootElement()?.contains(e.target as Node) === true) return; // DROP_COMMAND has it
      const images = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/') || isImagePath(f.name));
      if (images.length > 0) addImages(images);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- registered once per editor; reads refs
  }, [editor]);

  // ---- the turn ended: the oldest queued message leaves (queue.rs) ----
  const wasBusy = useRef(p.busy);
  useEffect(() => {
    if (wasBusy.current && !p.busy) {
      const taken = takeOldest(saved.current);
      if (taken !== null) {
        saved.current = taken.rest;
        save(p.store, p.target, saved.current);
        p.send(buildMessage(segmentsOf(editor, taken.entry)));
        pushStrip(chipsNow()); // the sent one leaves the strip (qa-type's queue-steer)
      }
    }
    wasBusy.current = p.busy;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pushStrip/chipsNow read refs and the editor
  }, [p, editor]);

  return open ? (
    <Picker
      rows={rows}
      index={index}
      testId={`${p.testId}.pick`}
      onPick={(i) => {
        const row = rows[i];
        if (row !== undefined && !row.off) apply(row.pick);
        editor.focus();
      }}
    />
  ) : null;
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
