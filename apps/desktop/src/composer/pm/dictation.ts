// The field's dictation (bar I / 2.6, the TUI's ctrl+r), out of PmField.tsx: a live node at the
// caret shows his words as they come; nothing reads it (not the send, not the draft); his last
// words replace it as text, one undo step. Esc cancels it: the node goes, the text around it
// stays. ctrl+r turns the mic on (held: push-to-talk), again off; twice quickly: voice mode.
// A take is never lost to a key (his 'je perds tous mes messages', ambient-lead m_22121): a press
// while a take is still transcribed starts a new take beside it (each node has its take's id, each
// final lands in its own node); the first release of the press decides toggle or push-to-talk;
// the double press is voice mode only right after a press that started a take, and it cancels
// only that fresh take. Each decision is one line of app.log (never his words).
import { useEffect, useEffectEvent, useRef, type RefObject } from "react";
import { closeHistory } from "@tiptap/pm/history";
import {
  TextSelection,
  type EditorState,
  type Transaction,
} from "@tiptap/pm/state";
import type { FieldBar } from "../actions";
import type { ComposerSources } from "../sources";
import { dictated, HOLD_MS } from "../dictate";
import { DOUBLE_CTRL_R_MS } from "@/voicemode/model";
import { dictationAt, nodeType, offsetOf, plainText, posOf } from "./pmtext";

/** A transaction kept out of the undo history (the dictation's live node). */
const offHistory = (tr: Transaction): Transaction =>
  tr.setMeta("addToHistory", false);

/** What the dictation needs of the field: read at each use (the editor and props live in refs). */
export interface DictationCtx {
  readonly sources: () => ComposerSources;
  readonly state: () => EditorState | null;
  readonly dispatch: (tr: Transaction | null) => boolean;
  readonly pushBar: (part: Partial<FieldBar>) => void;
  readonly say: (text: string) => void;
  /** one line of app.log (main's, next to core.log); never his words */
  readonly log?: (line: string) => void;
  /** now in ms (tests give their clock) */
  readonly now?: () => number;
}

/** One take: its id (the store's), the mic on, the press that started it (+∞: decided). */
export interface Take {
  id: string;
  mic: boolean;
  downAt: number;
  startedAt: number;
  stoppedAt: number | null;
  off: () => void;
}

export interface Dictation {
  /** the newest take not over, if any (`mic`: still listening); older ones may still transcribe */
  readonly dict: RefObject<Take | null>;
  /** the last ctrl+r that started a take (the double press is voice mode) */
  readonly lastR: RefObject<number>;
  readonly start: (downAt?: number) => void;
  readonly stop: () => void;
  /** esc: every take over, its words gone */
  readonly cancel: () => void;
  /** ctrl+r in the field or anywhere through grab.ts; false: not this key */
  readonly onCtrlR: (e: KeyboardEvent) => boolean;
}

export function useDictation(c: DictationCtx): Dictation {
  const lastR = useRef(Number.NEGATIVE_INFINITY);
  const dict = useRef<Take | null>(null);
  // stopped takes under the newest, still transcribed (oldest first)
  const older = useRef<Take[]>([]);
  const now = (): number => (c.now ?? Date.now)();
  const log = (line: string): void => c.log?.(`dictation: ${line}`);
  const bar = (): void => {
    const d = dict.current;
    c.pushBar({ dictating: d === null ? null : d.mic ? "recording" : "transcribing" });
  };
  /** the take is over: out of the list; the newest older one is the take the keys see */
  const end = (t: Take): void => {
    if (dict.current === t) dict.current = older.current.pop() ?? null;
    else older.current = older.current.filter((x) => x !== t);
  };
  const update = (t: Take): void => {
    const port = c.sources().dictate;
    const st = c.state();
    if (port === undefined || st === null) return;
    const s = port.read(t.id);
    if (s === null) return;
    const at = dictationAt(st.doc, t.id);
    if (!s.final) {
      if (at !== null && !s.cancelled) {
        const node = st.doc.nodeAt(posOf(at));
        if (node !== null && node.attrs.text !== s.text)
          c.dispatch(
            offHistory(
              st.tr.setNodeMarkup(posOf(at), undefined, {
                ...node.attrs,
                text: s.text,
              }),
            ),
          );
      }
      return;
    }
    t.off();
    end(t);
    bar();
    const ms = t.stoppedAt === null ? "" : ` ${String(now() - t.stoppedAt)} ms after stop`;
    log(`final ${t.id} len ${String(s.text.trim().length)}${s.cancelled ? " cancelled" : ""}${s.error === null ? "" : ` error '${s.error}'`}${ms}${at === null ? " (its node gone)" : ""}`);
    if (at !== null) {
      // the node goes (out of the history), then his words where it was (one undo step)
      const before = plainText(st.doc).slice(0, at);
      const caretAfter = st.selection.from > posOf(at);
      const rm = offHistory(st.tr.delete(posOf(at), posOf(at) + 1));
      c.dispatch(rm);
      const words = s.cancelled ? "" : dictated(s.text, before);
      const cur = c.state();
      if (cur !== null && words !== "") {
        const keep = cur.selection;
        const tr = cur.tr.replaceWith(
          posOf(at),
          posOf(at),
          cur.schema.text(words),
        );
        // the caret: after his words when it was after the node, else where it was
        tr.setSelection(
          caretAfter || keep.from === posOf(at)
            ? TextSelection.create(
                tr.doc,
                posOf(at) + words.length + (keep.from - posOf(at)),
              )
            : keep.map(tr.doc, tr.mapping),
        );
        c.dispatch(closeHistory(tr));
      }
    } else if (!s.cancelled) {
      // its node went (he cleared the field while it was transcribed): his words at the caret, never lost
      const from = st.selection.from;
      const words = dictated(s.text, plainText(st.doc).slice(0, offsetOf(from)));
      if (words !== "") c.dispatch(closeHistory(st.tr.insertText(words, from)));
    }
    if (s.error !== null) c.say(s.error);
  };
  const start = (downAt = Number.POSITIVE_INFINITY): void => {
    const port = c.sources().dictate;
    const st = c.state();
    const cur = dict.current;
    if (port === undefined || st === null || cur?.mic === true) return;
    const t: Take = { id: "", mic: true, downAt, startedAt: now(), stoppedAt: null, off: (): void => undefined };
    // a take still transcribed stays in its node, its final lands there; the new one goes after it
    if (cur !== null) older.current.push(cur);
    dict.current = t;
    t.id = port.start();
    const { from, to } = st.selection;
    const lead = dictated(
      "x",
      plainText(st.doc).slice(0, offsetOf(from)),
    ).startsWith(" ")
      ? " "
      : "";
    const tr = st.tr.replaceWith(
      from,
      to,
      nodeType(st.schema, "dictation").create({ text: "", lead, id: t.id }),
    );
    tr.setSelection(TextSelection.create(tr.doc, from + 1));
    c.dispatch(offHistory(tr));
    bar();
    log(`start ${t.id}${Number.isFinite(downAt) ? " (ctrl+r)" : ""}${cur !== null ? ` (${cur.id} still transcribed)` : ""}`);
    t.off = port.subscribe(t.id, () => {
      update(t);
    });
    update(t); // a refusal comes at once ('the mic is busy.')
  };
  const stop = (): void => {
    const t = dict.current;
    if (t === null || !t.mic) return;
    t.mic = false;
    t.stoppedAt = now();
    // its node says 'transcribing…' until the final, for as long as it takes
    const st = c.state();
    const at = st === null ? null : dictationAt(st.doc, t.id);
    const node = at === null || st === null ? null : st.doc.nodeAt(posOf(at));
    if (st !== null && at !== null && node !== null)
      c.dispatch(offHistory(st.tr.setNodeMarkup(posOf(at), undefined, { ...node.attrs, wait: true })));
    log(`stop ${t.id} after ${String(t.stoppedAt - t.startedAt)} ms`);
    c.sources().dictate?.stop(t.id);
    if (dict.current !== null) bar();
  };
  const cancelOne = (t: Take, why: string): void => {
    log(`cancel ${t.id} (${why})`);
    c.sources().dictate?.cancel(t.id);
  };
  const cancel = (): void => {
    for (const t of [...older.current, ...(dict.current === null ? [] : [dict.current])]) cancelOne(t, "esc");
  };
  /** ctrl+r: the mic on (held: push-to-talk; pressed: on until a key), again: off; twice within
   *  DOUBLE_CTRL_R_MS of a press that started a take (the TUI's): voice mode. In the field, or
   *  anywhere in the window through grab.ts (his try a43609b2). False: not this key. */
  const onCtrlR = (e: KeyboardEvent): boolean => {
    if (
      !e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.shiftKey ||
      e.key.toLowerCase() !== "r" ||
      c.sources().dictate === undefined
    )
      return false;
    e.preventDefault();
    if (e.repeat) return true;
    const live = dict.current?.mic === true ? dict.current : null;
    const voice = c.sources().voice;
    // twice: only right after the press that started this take; its fresh take goes, never an older one
    if (voice !== undefined && live !== null && e.timeStamp - lastR.current < DOUBLE_CTRL_R_MS) {
      lastR.current = Number.NEGATIVE_INFINITY;
      cancelOne(live, "ctrl+r twice: voice mode");
      voice();
      return true;
    }
    if (live !== null) {
      lastR.current = Number.NEGATIVE_INFINITY;
      stop();
    } else {
      // idle or a take still transcribed: a new take, never a swallowed press
      lastR.current = e.timeStamp;
      start(e.timeStamp);
    }
    return true;
  };
  // registered once; the events see this render's stop and cancel. The press's FIRST release
  // decides: within HOLD_MS a toggle (the mic stays on, later releases change nothing), later a
  // push-to-talk (the mic off)
  const up = useEffectEvent((e: KeyboardEvent): void => {
    const d = dict.current;
    if (d === null || !d.mic || !Number.isFinite(d.downAt) || (e.key.toLowerCase() !== "r" && e.key !== "Control")) return;
    if (e.timeStamp - d.downAt >= HOLD_MS) stop();
    else d.downAt = Number.POSITIVE_INFINITY;
  });
  const gone = useEffectEvent((): void => {
    cancel();
  });
  useEffect(() => {
    const onUp = (e: KeyboardEvent): void => {
      up(e);
    };
    window.addEventListener("keyup", onUp, true);
    return () => {
      window.removeEventListener("keyup", onUp, true);
      gone();
    };
  }, []);
  return { dict, lastR, start, stop, cancel, onCtrlR };
}
