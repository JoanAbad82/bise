// The composer (bar ⛔1, ⛔2, 2.1-2.7, 3.1-3.2): a ProseMirror editor (TipTap core, pm/PmField.tsx)
// the app never rewrites per keystroke. His typing goes keyboard -> contenteditable -> ProseMirror,
// and nothing in the app
// writes it back: no store round trip, no re-render of the field (the old app's bug 1: ui.js
// rewrote the region with innerHTML on every state change). The app writes into it only on
// what he asked for: a pick, a paste, a chip, dictation, ↑ through the drafts, a send that clears.
//
// Mounted once per screen (React never re-creates the editor: the initial config is read once,
// the callbacks go through refs). The frame around it is amb-kit's ComposerFrame.
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import { ComposerFrame, cutWords, Press } from "@/ds";
import "./composer.css";
import { composer } from "../proto/words.gen";
import type { ComposerActions, FieldBar } from "./actions";
import { endsLine, monoRuns, type KeyLine } from "./keyline";
import { PmField } from "./pm/PmField";
import { QueueDrawer, type QueueDrawerProps } from "./QueueDrawer";

/** What the screen gives the drawer; the composer adds whether its field is empty. */
export type QueueSlot = Omit<QueueDrawerProps, "fieldEmpty" | "testId">;
import {
  barMode,
  barPairs,
  heldPairs,
  type HeldCtx,
  type HeldMod,
  startTip,
  tickTip,
  tipShown,
  TIPS,
  countDay,
  type TipClock,
} from "./keybar";
import type { Outgoing } from "./message";
import { NO_SOURCES, type ComposerSources } from "./sources";
import type { Store } from "./drafts";

export interface ComposerProps {
  /** Whose composer this is (`<project>/<agent>`): its draft, history and queue are kept per target. */
  readonly target: string;
  /**
   * Where the draft is kept, when not with the target's (an inbox card's half answer: its own key
   * while the card is open, unset when it closes). The send still goes to `target`.
   */
  readonly draftKey?: string;
  /** A turn runs: tab queues, ⏎ steers, the send button stops. */
  readonly busy?: boolean;
  readonly sources?: ComposerSources;
  /** Where drafts live (localStorage by default; tests pass their own). */
  readonly store?: Store;
  /** the tab glued to the box's top (who and where: thread/ComposerTab.tsx); none: the box alone */
  readonly tab?: ReactNode;
  /** his words answer a question: the frame's accent (tab, border, send) and the border's tip */
  readonly answering?: boolean;
  readonly answerTip?: string | undefined;
  /** with `answering`: lines only, no fill (an agent that is not main, agent-target) */
  readonly quiet?: boolean;
  /** the box's bottom row, left ('+', the mode menu), and right before send (the model menu) */
  readonly tools?: ReactNode;
  readonly toolsEnd?: ReactNode;
  /** K2: ⏎ on an empty field: the screen's act (the TUI's: sign in again after expiry, ...) */
  readonly onEmptyEnter?: () => void;
  /** R18: an esc no list took, while busy or on a blank field: the screen's (a route hold; never a stop: ctrl+c, main m_22205). */
  readonly onEscape?: () => boolean;
  /** TP-R6, ⇧⇥ (no list open): the screen's (the TUI's: switch the approvals mode yolo ↔ auto). */
  readonly onShiftTab?: () => void;
  readonly placeholder?: string;
  /** A fixed key bar (a screen of its own); unset: the bar follows the composer's mode (W9). */
  readonly keys?: string;
  /** Voice in this composer: recording, then transcribing (the key bar's voice keys). */
  readonly voice?: "recording" | "transcribing" | null;
  /** Text is selected in the thread: typing asks about it (the key bar says so). */
  readonly quoting?: boolean;
  readonly onSend: (out: Outgoing) => void;
  /** His words' start at each change (their first text, '' when a chip opens them): the screen reads a leading `@name` (thread/lead.ts). */
  readonly onLead?: (text: string) => void;
  /** The agent his words go to by their leading `@name`: the field draws that address in the accent (pm/leadmark.ts). */
  readonly leadName?: string | null;
  /** Tab during a turn: his message to the hub's queue (issue 23); unset: tab doesn't queue. */
  readonly onQueue?: (out: Outgoing) => void;
  /** ↑ in the empty field: the screen takes its newest queued message back into it; false: none. */
  readonly onEditNewest?: () => boolean;
  /** The queued messages' drawer above the tab (QueueDrawer.tsx); unset or no rows: none. */
  readonly queue?: QueueSlot;
  /** A command line he ran (`/model opus`): the screen runs it (a core cmd or a screen). */
  readonly onCommand?: (name: string, args: string) => void;
  /** The send button while busy: stop the turn. */
  readonly onStop?: () => void;
  /** The composer's actions for the screen (dictation's words at the caret, focus), once mounted. */
  readonly onReady?: (a: ComposerActions) => void;
  /** in the box at its left, before the field (voice mode's grey pearl while he types) */
  readonly lead?: ReactNode;
  /** a modifier held alone (app/held.ts) and the screen's facts: the bar lists that modifier's
   *  keys (keybar.ts heldPairs, the TUI's ctrlhint.rs); ⌘ or ⌥ held, the ⌃R mic and voice step out */
  readonly held?: { readonly mod: HeldMod; readonly ctx: HeldCtx } | null;
  /** a one-off line for him (a refused command, the hub's word on his answer): it takes the key
   *  line's place, same row, same height (nothing moves); `onLineDone` at his first key in the frame */
  readonly line?: KeyLine | null;
  readonly onLineDone?: () => void;
  readonly testId?: string;
}

/** The last tip shown (keybar.rs keeps it in the `tip` preference): the next session starts after it. */
const TIP_KEY = "bise.composer.v1.tip";
/** The days he used the composer, until the tips retire (keybar.ts countDay). */
const TIP_DAYS_KEY = "bise.composer.v1.tipdays";

/** Today as a local 'YYYY-MM-DD'. */
function localDay(now: number): string {
  const d = new Date(now);
  return `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const Composer = memo(function Composer(
  props: ComposerProps,
): JSX.Element {
  const {
    target,
    busy = false,
    sources = NO_SOURCES,
    tab,
    answering,
    answerTip,
    quiet,
    tools,
    toolsEnd,
    placeholder = composer.placeholder_bise,
    keys,
    voice = null,
    quoting = false,
    lead,
    testId = "composer",
  } = props;
  const store = useMemo<Store>(
    () => props.store ?? window.localStorage,
    [props.store],
  );
  // the latest callbacks, read by the editor's handlers without re-creating them
  const cb = useRef(props);
  useEffect(() => {
    cb.current = props;
  });
  const actions = useRef<ComposerActions | null>(null);
  const [canSend, setCanSend] = useState(false);
  // each send plays the send's touch once (designer's desktop-delight touch 2)
  const [sent, setSent] = useState(0);
  const [strip, setStrip] = useState<JSX.Element | null>(null);
  const [field, setField] = useState<FieldBar>({
    fileList: false,
    selected: false,
    images: false,
    typing: false,
    dictating: null,
  });
  const dictating = field.dictating;
  const mode = barMode({ ...field, voice: voice ?? dictating, quoting, busy });
  // a held modifier lists its keys in the default, steer, selection, image and quote modes (the
  // TUI's keybar.rs keys_line); a take or the @ list keep theirs
  const held = props.held != null && mode !== "recording" && mode !== "transcribing" && mode !== "file" ? props.held : null;
  // ⌘ or ⌥ held: the line shows only that modifier's keys (designer m_25695), the ⌃R mic and voice step out
  const otherMod = held !== null && held.mod !== "Control";

  // the tip: the one after the last session's, the next every 5 minutes, never while he types
  const [tip, setTip] = useState<TipClock | null>(null);
  // after 7 days of use the tips retire (designer's desktop-delight tuck away)
  const [retired, setRetired] = useState(false);
  const typing = useRef(false);
  useEffect(() => {
    typing.current = field.typing;
  });
  useEffect(() => {
    const raw = store.getItem(TIP_KEY);
    const saved = raw === null ? null : Number(raw);
    let kept: string[] = [];
    try {
      const parsed: unknown = JSON.parse(store.getItem(TIP_DAYS_KEY) ?? "[]");
      if (Array.isArray(parsed)) kept = parsed.filter((x): x is string => typeof x === "string");
    } catch {
      kept = [];
    }
    const day = countDay(kept, localDay(Date.now()));
    store.setItem(TIP_DAYS_KEY, JSON.stringify(day.days));
    let clock = startTip(Number.isInteger(saved) ? saved : null, Date.now());
    store.setItem(TIP_KEY, String(clock.index));
    // the first tip shows on the next tick (no render cascade from inside the effect)
    const first = window.setTimeout(() => {
      setRetired(day.retired);
      setTip(clock);
    }, 0);
    const timer = window.setInterval(() => {
      const next = tickTip(clock, Date.now(), typing.current);
      if (next === clock) return;
      clock = next;
      setTip(next);
      store.setItem(TIP_KEY, String(next.index));
    }, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [store]);
  // one tip at a time, on an empty composer (focused: css/composer.css hides it otherwise), never once retired
  const tipText =
    tip !== null && !retired && tipShown(mode, field.typing) ? TIPS[tip.index] : undefined;

  return (
    <ComposerFrame
      testId={testId}
      tab={tab}
      answering={answering}
      answerTip={answerTip}
      {...(quiet === true ? { quiet } : {})}
      tools={tools}
      toolsEnd={toolsEnd}
      sent={sent}
      // the whole box is the input: a press on its padding or empty area focuses the editor, caret at the end
      onBoxDown={() => {
        actions.current?.focusEnd();
      }}
      lead={lead}
      onKeyDownCapture={
        props.line == null
          ? undefined
          : (e) => {
              if (endsLine(e.key)) cb.current.onLineDone?.();
            }
      }
      keys={
        props.line != null ? (
          // the key line's place, the same row and height: nothing moves (keyline.ts)
          <KeyLineView line={props.line} />
        ) : <>
          {sources.dictate !== undefined && !otherMod && (
            <Mic
              state={dictating}
              onClick={() => {
                actions.current?.dictate();
                actions.current?.focus();
              }}
              testId={testId}
            />
          )}
          {sources.voice !== undefined && keys === undefined && !otherMod && (
            // voice mode with the agent in view (designer's voice-window page (1)): ∿, or ctrl+r twice
            <Press
              look="mic voice"
              onMouseDown={(e) => {
                e.preventDefault(); // the field keeps the caret
              }}
              onClick={sources.voice}
              aria-label={composer.bar_voice_mode}
              title={`${composer.bar_voice_mode} · ⌃R ⌃R`}
              // while a take runs the key line is only its keys (designer m_22785)
              hidden={dictating !== null}
              data-testid={`${testId}.voice`}
            >
              <span className="kk">⌃R⌃R</span> {composer.voice_button}
            </Press>
          )}
          <span
            className="pairs"
            data-testid={`${testId}.keys`}
            data-mode={keys === undefined ? (held !== null ? `held-${held.mod}` : mode) : "fixed"}
          >
            {keys ??
              (held !== null ? heldPairs(held.mod, { ...held.ctx, busy, typing: field.typing, selected: field.selected }) : barPairs(mode, field.typing, (props.queue?.rows.length ?? 0) > 0)).map(([k, l]) => (
                <span key={k + l} className="pair">
                  {k !== "" && <span className="kk">{k}</span>} {l}
                </span>
              ))}
          </span>
          {keys === undefined && field.chips === true ? (
            // the attachment list's one key (designer's composer-attachments A)
            <span className="tip" data-testid={`${testId}.tip`}>
              {composer.box_tip}
            </span>
          ) : (
            keys === undefined &&
            tipText !== undefined && (
              <span className="tip rest-tip" data-testid={`${testId}.tip`}>
                {composer.tip_ascii({ words: tipText })}
              </span>
            )
          )}
        </>
      }
      quote={
        <>
          {strip}
          {props.queue !== undefined && <QueueDrawer {...props.queue} fieldEmpty={!canSend} testId={`${testId}.queue`} />}
        </>
      }
      send={busy && !canSend ? "stop" : canSend ? "on" : "off"}
      onSend={() => {
        if (busy && !canSend) cb.current.onStop?.();
        else actions.current?.submit();
      }}
    >
      <PmField
        target={target}
        draftKey={props.draftKey}
        busy={busy}
        sources={sources}
        store={store}
        testId={testId}
        placeholder={placeholder}
        send={(o) => {
          cb.current.onSend(o);
          setSent((n) => n + 1);
        }}
        queue={(o) => {
          cb.current.onQueue?.(o);
        }}
        editNewest={() => cb.current.onEditNewest?.() ?? false}
        command={(name, args) => {
          cb.current.onCommand?.(name, args);
        }}
        onCanSend={setCanSend}
        onLead={(t) => {
          cb.current.onLead?.(t);
        }}
        leadName={props.leadName ?? null}
        onStrip={setStrip}
        onBar={setField}
        onActions={(a) => {
          if (actions.current === null) cb.current.onReady?.(a);
          actions.current = a;
        }}
        onEmptyEnter={() => {
          cb.current.onEmptyEnter?.();
        }}
        onEscape={() => cb.current.onEscape?.()}
        onShiftTab={
          props.onShiftTab === undefined
            ? undefined
            : () => {
                cb.current.onShiftTab?.();
              }
        }
      />
    </ComposerFrame>
  );
});

/** The one-off line on the key line's place (designer m_29135): its mark, then its words in sans
 *  with the commands and paths in mono (keyline.ts monoRuns), cut after a whole word with one glued
 *  '…' to the row's room, the whole words in its tip. Its words are drawn here, not by React (each
 *  try of the cut measures them). */
function KeyLineView({ line }: { line: KeyLine }): JSX.Element {
  const words = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = words.current;
    if (el === null) return;
    const draw = (t: string) => {
      el.replaceChildren(
        ...monoRuns(t).map((r) => {
          if (!r.mono) return document.createTextNode(r.text);
          const c = document.createElement("span");
          c.className = "code";
          c.textContent = r.text;
          return c;
        }),
      );
    };
    const fit = () => {
      draw(cutWords(line.text, (t) => {
        draw(t);
        return el.scrollWidth <= el.clientWidth;
      }));
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement ?? el);
    return () => {
      ro.disconnect();
    };
  }, [line.text]);
  return (
    <span
      className={`line ${line.level}`}
      role={line.level === "err" ? "alert" : "status"}
      title={line.text}
      data-testid={line.testId}
      data-level={line.level}
    >
      <span className="mark" aria-hidden="true">
        {line.level === "err" ? "✗" : "·"}
      </span>
      <span className="words" ref={words} />
    </span>
  );
}

/** The mic control in the key line (bar I): its key at rest. While a take runs it hides: the take's
 *  chip in the field shows the voice, the key line says 'any key stop · esc cancel' (designer
 *  m_22700: never twice). Its own state only: the field never re-renders. */
function Mic({
  state,
  onClick,
  testId,
}: {
  state: "recording" | "transcribing" | null;
  onClick: () => void;
  testId: string;
}): JSX.Element {
  return (
    <Press
      look="mic"
      onMouseDown={(e) => {
        e.preventDefault(); // the field keeps the caret
      }}
      onClick={onClick}
      aria-label="dictate"
      hidden={state !== null}
      data-testid={`${testId}.mic`}
      data-state={state ?? "off"}
    >
      <span className="kk">⌃R</span> dictate
    </Press>
  );
}
