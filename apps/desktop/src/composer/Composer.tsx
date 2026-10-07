// The composer (bar ⛔1, ⛔2, 2.1-2.7, 3.1-3.2): a ProseMirror editor (TipTap core, pm/PmField.tsx)
// the app never rewrites per keystroke. His typing goes keyboard -> contenteditable -> ProseMirror,
// and nothing in the app
// writes it back: no store round trip, no re-render of the field (the old app's bug 1: ui.js
// rewrote the region with innerHTML on every state change). The app writes into it only on
// what he asked for: a pick, a paste, a chip, dictation, ↑ through the drafts, a send that clears.
//
// Mounted once per screen (React never re-creates the editor: the initial config is read once,
// the callbacks go through refs). The frame around it is amb-kit's ComposerFrame.
import { memo, useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { ComposerFrame } from '@/ds';
import './composer.css';
import type { ComposerActions, FieldBar } from './actions';
import { PmField } from './pm/PmField';
import { barMode, barPairs, startTip, tickTip, tipShown, TIPS, type TipClock } from './keybar';
import type { Outgoing } from './message';
import { NO_SOURCES, type ComposerSources, type DictatePort } from './sources';
import type { Store } from './drafts';

export interface ComposerProps {
  /** Whose composer this is (`<project>/<agent>`): its draft, history and queue are kept per target. */
  readonly target: string;
  /** A turn runs: tab queues, ⏎ steers, the send button stops. */
  readonly busy?: boolean;
  readonly sources?: ComposerSources;
  /** Where drafts live (localStorage by default; tests pass their own). */
  readonly store?: Store;
  /** "you → bise · opus · high" */
  readonly to?: string;
  /** K2: ⏎ on an empty field: the screen's act (the TUI's: sign in again after expiry, ...) */
  readonly onEmptyEnter?: () => void;
  /** R18: an esc no list took, while busy or on a blank field: the screen's (stop the turn, ...). */
  readonly onEscape?: () => void;
  /** a key hint at the label line's right ('esc write a plain message' while it answers a docked card) */
  readonly toEnd?: string;
  readonly placeholder?: string;
  /** A fixed key bar (a screen of its own); unset: the bar follows the composer's mode (W9). */
  readonly keys?: string;
  /** Voice in this composer: recording, then transcribing (the key bar's voice keys). */
  readonly voice?: 'recording' | 'transcribing' | null;
  /** Text is selected in the thread: typing asks about it (the key bar says so). */
  readonly quoting?: boolean;
  readonly onSend: (out: Outgoing) => void;
  /** A command line he ran (`/model opus`): the screen runs it (a core cmd or a screen). */
  readonly onCommand?: (name: string, args: string) => void;
  /** The send button while busy: stop the turn. */
  readonly onStop?: () => void;
  /** The composer's actions for the screen (dictation's words at the caret, focus), once mounted. */
  readonly onReady?: (a: ComposerActions) => void;
  readonly testId?: string;
}

/** 'write to perf' under 'you → perf' (ambient m_10689); 'write to bise' with no target line. */
export function writeTo(to: string | undefined): string {
  const name = /→\s*([^·]+)/u.exec(to ?? '')?.[1]?.trim();
  return `write to ${name !== undefined && name !== '' ? name : 'bise'}`;
}

/** The last tip shown (keybar.rs keeps it in the `tip` preference): the next session starts after it. */
const TIP_KEY = 'bise.composer.v1.tip';

export const Composer = memo(function Composer(props: ComposerProps): JSX.Element {
  const { target, busy = false, sources = NO_SOURCES, to, toEnd, placeholder = writeTo(to), keys, voice = null, quoting = false, testId = 'composer' } = props;
  const store = useMemo<Store>(() => props.store ?? window.localStorage, [props.store]);
  // the latest callbacks, read by the editor's handlers without re-creating them
  const cb = useRef(props);
  useEffect(() => {
    cb.current = props;
  });
  const actions = useRef<ComposerActions | null>(null);
  const [canSend, setCanSend] = useState(false);
  const [strip, setStrip] = useState<JSX.Element | null>(null);
  const [field, setField] = useState<FieldBar>({ fileList: false, selected: false, images: false, typing: false, dictating: null });
  const dictating = field.dictating;
  const mode = barMode({ ...field, voice: voice ?? dictating, quoting, busy });

  // the tip: the one after the last session's, the next every 5 minutes, never while he types
  const [tip, setTip] = useState<TipClock | null>(null);
  const typing = useRef(false);
  useEffect(() => {
    typing.current = field.typing;
  });
  useEffect(() => {
    const raw = store.getItem(TIP_KEY);
    const saved = raw === null ? null : Number(raw);
    let clock = startTip(Number.isInteger(saved) ? saved : null, Date.now());
    store.setItem(TIP_KEY, String(clock.index));
    // the first tip shows on the next tick (no render cascade from inside the effect)
    const first = window.setTimeout(() => {
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
  const tipText = tip !== null && tipShown(mode, field.typing) ? TIPS[tip.index] : undefined;

  return (
    <ComposerFrame
      testId={testId}
      to={
        toEnd === undefined || to === undefined ? (
          to
        ) : (
          <>
            <span className="lbl">{to}</span>
            <span className="end">{toEnd}</span>
          </>
        )
      }
      // the whole box is the input: a press on its padding or empty area focuses the editor, caret at the end
      onBoxDown={() => {
        actions.current?.focusEnd();
      }}
      keys={
        <>
          {sources.dictate !== undefined && (
            <Mic
              state={dictating}
              level={sources.dictate.level}
              onClick={() => {
                actions.current?.dictate();
                actions.current?.focus();
              }}
              testId={testId}
            />
          )}
          <span className="pairs" data-testid={`${testId}.keys`} data-mode={keys === undefined ? mode : 'fixed'}>
            {keys ??
              barPairs(mode, field.typing).map(([k, l]) => (
                <span key={k + l} className="pair">
                  {k !== '' && <span className="kk">{k}</span>} {l}
                </span>
              ))}
          </span>
          {keys === undefined && tipText !== undefined && (
            <span className="tip" data-testid={`${testId}.tip`}>
              tip: {tipText}
            </span>
          )}
        </>
      }
      quote={strip}
      send={busy && !canSend ? 'stop' : canSend ? 'on' : 'off'}
      onSend={() => {
        if (busy && !canSend) cb.current.onStop?.();
        else actions.current?.submit();
      }}
    >
      <PmField
        target={target}
        busy={busy}
        sources={sources}
        store={store}
        testId={testId}
        placeholder={placeholder}
        send={(o) => {
          cb.current.onSend(o);
        }}
        command={(name, args) => {
          cb.current.onCommand?.(name, args);
        }}
        onCanSend={setCanSend}
        onStrip={setStrip}
        onBar={setField}
        onActions={(a) => {
          if (actions.current === null) cb.current.onReady?.(a);
          actions.current = a;
        }}
        onEmptyEnter={() => {
          cb.current.onEmptyEnter?.();
        }}
        onEscape={() => {
          cb.current.onEscape?.();
        }}
      />
    </ComposerFrame>
  );
});

/** The mic control in the key line (bar I): its key at rest; while the mic is on, a meter and
 *  'listening…'; then '…' while the last words come. Its own state only: the field never re-renders. */
function Mic({ state, level, onClick, testId }: { state: 'recording' | 'transcribing' | null; level: DictatePort['level']; onClick: () => void; testId: string }): JSX.Element {
  return (
    <button
      type="button"
      className={`mic${state === null ? '' : ` ${state}`}`}
      onMouseDown={(e) => {
        e.preventDefault(); // the field keeps the caret
      }}
      onClick={onClick}
      aria-pressed={state === 'recording'}
      aria-label={state === 'recording' ? 'stop dictating' : 'dictate'}
      data-testid={`${testId}.mic`}
      data-state={state ?? 'off'}
    >
      {state === null ? (
        <>
          <span className="kk">⌃R</span> dictate
        </>
      ) : state === 'recording' ? (
        <>
          <Meter level={level} testId={testId} /> listening…
        </>
      ) : (
        '…'
      )}
    </button>
  );
}

/** The meter's height for a level: the level itself, or under reduced motion only voice / no voice
 *  (two still heights, so the bars never move with each sample). */
export const meterLevel = (v: number, reduced: boolean): number => {
  const c = Math.max(0, Math.min(1, v));
  return reduced ? (c > 0.05 ? 0.6 : 0.15) : Math.round(c * 100) / 100;
};

/** Five bars that follow his voice level (the core's level {who: 'you'}). */
function Meter({ level, testId }: { level: DictatePort['level']; testId: string }): JSX.Element {
  const box = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = box.current;
    if (level === undefined || el === null) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // each sample writes one CSS variable and one attribute (the checks read it), no React render
    return level((v) => {
      const h = String(meterLevel(v, reduced));
      if (el.dataset.level === h) return;
      el.dataset.level = h;
      el.style.setProperty('--lvl', h);
    });
  }, [level]);
  return (
    <span ref={box} className="meter" data-testid={`${testId}.meter`} data-level="0" aria-hidden>
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
