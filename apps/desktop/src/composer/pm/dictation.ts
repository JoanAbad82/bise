// The field's dictation (bar I / 2.6, the TUI's ctrl+r), out of PmField.tsx: a live node at the
// caret shows his words as they come; nothing reads it (not the send, not the draft); his last
// words replace it as text, one undo step. Esc cancels it: the node goes, the text around it
// stays. ctrl+r turns the mic on (held: push-to-talk), again off; twice quickly: voice mode.
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
}

export interface Dictation {
  /** the dictation running, if any (`mic`: still listening) */
  readonly dict: RefObject<{
    id: string;
    mic: boolean;
    downAt: number;
    off: () => void;
  } | null>;
  /** the last ctrl+r's time (the double press is voice mode) */
  readonly lastR: RefObject<number>;
  readonly start: (downAt?: number) => void;
  readonly stop: () => void;
  readonly cancel: () => void;
  /** ctrl+r in the field or anywhere through grab.ts; false: not this key */
  readonly onCtrlR: (e: KeyboardEvent) => boolean;
}

export function useDictation(c: DictationCtx): Dictation {
  const lastR = useRef(Number.NEGATIVE_INFINITY);
  const dict = useRef<{
    id: string;
    mic: boolean;
    downAt: number;
    off: () => void;
  } | null>(null);
  const update = (): void => {
    const d = dict.current;
    const port = c.sources().dictate;
    const st = c.state();
    if (d === null || port === undefined || st === null) return;
    const s = port.read(d.id);
    if (s === null) return;
    const at = dictationAt(st.doc);
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
    d.off();
    dict.current = null;
    c.pushBar({ dictating: null });
    if (at !== null) {
      // the node goes (out of the history), then his words where it was (one undo step)
      const before = plainText(st.doc).slice(0, at);
      const caretAfter = st.selection.from > posOf(at);
      const rm = offHistory(st.tr.delete(posOf(at), posOf(at) + 1));
      c.dispatch(rm);
      const words = s.cancelled ? "" : dictated(s.text, before);
      const now = c.state();
      if (now !== null && words !== "") {
        const keep = now.selection;
        const tr = now.tr.replaceWith(
          posOf(at),
          posOf(at),
          now.schema.text(words),
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
    }
    if (s.error !== null) c.say(s.error);
  };
  const start = (downAt = Number.POSITIVE_INFINITY): void => {
    const port = c.sources().dictate;
    const st = c.state();
    if (port === undefined || dict.current !== null || st === null) return;
    const d = { id: "", mic: true, downAt, off: (): void => undefined };
    dict.current = d;
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
      nodeType(st.schema, "dictation").create({ text: "", lead }),
    );
    tr.setSelection(TextSelection.create(tr.doc, from + 1));
    c.dispatch(offHistory(tr));
    c.pushBar({ dictating: "recording" });
    d.id = port.start();
    d.off = port.subscribe(d.id, update);
    update(); // a refusal comes at once ('the mic is busy.')
  };
  const stop = (): void => {
    const d = dict.current;
    if (d === null || !d.mic) return;
    d.mic = false;
    c.sources().dictate?.stop(d.id);
    if (dict.current !== null) c.pushBar({ dictating: "transcribing" });
  };
  const cancel = (): void => {
    const d = dict.current;
    if (d !== null) c.sources().dictate?.cancel(d.id);
  };
  /** ctrl+r: the mic on (held: push-to-talk; pressed: on until a key), again: off; twice within
   *  DOUBLE_CTRL_R_MS (the TUI's): voice mode. In the field, or anywhere in the window through
   *  grab.ts (his try a43609b2): the same press count either way. False: not this key. */
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
    // the first press's dictation cancelled (amb-home's src/voicemode; one ctrl+r stays dictation)
    const voice = c.sources().voice;
    const twice =
      voice !== undefined && e.timeStamp - lastR.current < DOUBLE_CTRL_R_MS;
    lastR.current = e.timeStamp;
    if (twice) {
      lastR.current = Number.NEGATIVE_INFINITY;
      if (dict.current !== null) cancel();
      voice();
      return true;
    }
    if (dict.current === null) start(e.timeStamp);
    else if (dict.current.mic) stop();
    return true;
  };
  // registered once; the events see this render's stop and cancel
  const up = useEffectEvent((e: KeyboardEvent): void => {
    const d = dict.current;
    if (d === null || !d.mic || (e.key.toLowerCase() !== "r" && e.key !== "Control")) return;
    if (e.timeStamp - d.downAt >= HOLD_MS) stop();
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
