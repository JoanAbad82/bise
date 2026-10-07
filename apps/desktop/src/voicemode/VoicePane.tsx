// Voice mode's pane (ambient's spec m_11632): it takes the composer's place, same frame and width,
// ~2 rows taller. The label line ('you ⇄ perf · voice mode'), his row (the word 'you' and 24 bars
// from his level), the agent's row (its pearl, its name, its bars), the words line (listening,
// his heard words, sending…, thinking, the said words, muted, the fail), and the key line under
// the frame, each pair a button. Focus sits on the pane: space and m never type. Draws props
// only; ThreadVoice (screen.tsx) feeds it. Owner: amb-home.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { LivePearl } from '@/pearl';
import { keyAct, labelOf, nameOf, pairsOf, spaceHeld, spaceUp, wordsOf, yourTurn, HOLD_MS, type Act, type VoiceState } from './model';
import './voicemode.css';

/** How many bars a row has. */
export const BARS = 24;

export interface VoicePaneProps {
  state: VoiceState;
  agent: string;
  heard?: string | null | undefined;
  said?: string | null | undefined;
  fail?: string | null | undefined;
  /** his level, 0..1 (level 'you') */
  you: number;
  /** the agent's level, 0..1 (level 'agent') */
  them: number;
  /** the label line's words for a while (fn waits); none: the label */
  label?: string | null;
  onAct: (a: Act) => void;
}

/** A row of bars from a level that moves: the newest on the right, flat when `live` is off. */
function useBars(level: number, live: boolean): number[] {
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: BARS }, () => 0));
  const [last, setLast] = useState(level);
  if (level !== last) {
    setLast(level);
    if (live) setBars((b) => [...b.slice(1), Math.max(0, Math.min(1, level))]);
  }
  return live ? bars : Array.from({ length: BARS }, () => 0);
}

function Bars({ values, tone, testId }: { values: readonly number[]; tone: 'accent' | 'text' | 'flat'; testId: string }) {
  return (
    <span className={`vm-bars ${tone}`} data-testid={testId} aria-hidden="true">
      {values.map((v, i) => (
        <i key={i} style={{ height: `${String(Math.round(2 + 16 * (tone === 'flat' ? 0 : v)))}px` }} />
      ))}
    </span>
  );
}

/** The window is in front: the bars move; behind, they freeze flat (the words keep coming). */
function useFront(): boolean {
  const [front, setFront] = useState(() => (typeof document === 'undefined' ? true : document.hasFocus()));
  useEffect(() => {
    const on = () => {
      setFront(true);
    };
    const off = () => {
      setFront(false);
    };
    window.addEventListener('focus', on);
    window.addEventListener('blur', off);
    return () => {
      window.removeEventListener('focus', on);
      window.removeEventListener('blur', off);
    };
  }, []);
  return front;
}

export function VoicePane({ state, agent, heard, said, fail, you, them, label, onAct }: VoicePaneProps) {
  const root = useRef<HTMLElement>(null);
  const front = useFront();
  const mine = useBars(you, front && yourTurn(state));
  const theirs = useBars(them, front && state === 'speaking');
  const words = wordsOf(state, heard, said, fail);
  const name = nameOf(agent);

  // focus sits on the pane while it shows (space and m never type)
  useEffect(() => {
    root.current?.focus();
  }, []);

  // space: a tap sends now, a hold while it speaks cuts in (at once)
  const down = useRef<number | null>(null);
  const held = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (held.current !== null) clearTimeout(held.current);
    },
    [],
  );
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const a = keyAct(e, state);
    if (a === null) return;
    e.preventDefault();
    if (a !== 'space') {
      onAct(a);
      return;
    }
    if (e.repeat || down.current !== null) return;
    down.current = e.timeStamp;
    held.current = setTimeout(() => {
      held.current = null;
      const h = spaceHeld(state);
      if (h !== null) onAct(h);
    }, HOLD_MS);
  };
  const onKeyUp = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== ' ' || down.current === null) return;
    e.preventDefault();
    const ms = e.timeStamp - down.current;
    down.current = null;
    if (held.current !== null) {
      clearTimeout(held.current);
      held.current = null;
    }
    const a = spaceUp(ms, state);
    if (a !== null) onAct(a);
  };

  return (
    <section
      ref={root}
      className={`vm-pane ${state}`}
      tabIndex={0}
      aria-label={labelOf(agent)}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      data-testid="voice.pane"
      data-state={state}
    >
      <p className={`vm-label${label != null ? ' waits' : ''}`} data-testid="voice.label">
        {label ?? labelOf(agent)}
      </p>
      <div className="vm-frame">
        <div className="vm-row" data-testid="voice.you">
          <span className="vm-who">you</span>
          <Bars values={mine} tone={yourTurn(state) && front ? 'accent' : 'flat'} testId="voice.you.bars" />
        </div>
        <div className="vm-row" data-testid="voice.agent">
          <span className="vm-pearl">
            <LivePearl mood={state === 'speaking' ? 'speak' : 'listen'} level={state === 'speaking' && front ? them : 0} size={22} testId="voice.pearl" />
          </span>
          <b className="vm-who">{name}</b>
          <Bars values={theirs} tone={state === 'speaking' && front ? 'text' : 'flat'} testId="voice.agent.bars" />
        </div>
        <p className={`vm-words ${words.kind}`} data-testid="voice.words">
          {words.kind === 'listening' && <span className="vm-dot">●</span>}
          {words.kind === 'thinking' && <span className="vm-sign">∿</span>}
          {words.kind === 'muted' && <span>○</span>}
          {words.kind === 'listening' || words.kind === 'thinking' || words.kind === 'muted' ? ` ${words.text}` : words.text}
          {state === 'hearing' && (
            <span className="vm-more">
              {'   keep talking, or '}
              <kbd>space</kbd> send now
            </span>
          )}
        </p>
      </div>
      <div className="vm-keys" data-testid="voice.keys">
        {pairsOf(state).map((p) => (
          <button
            key={p.act}
            type="button"
            tabIndex={-1}
            onClick={() => {
              onAct(p.act);
            }}
            data-testid={`voice.key.${p.act}`}
          >
            <kbd>{p.key}</kbd> {p.words}
          </button>
        ))}
      </div>
    </section>
  );
}
