// Voice mode's bar (designer's voice-window page (1)): it takes the composer's box and place. The
// label line ('voice · with perf', the voice model at its right), the box (the live pearl 40 px at
// its left, the words in the middle: his live words in ink while he talks, else a dim state line,
// a failure in --c-err; mute and leave on its right), and the key line under it (only the keys
// that do something now, each a button). Focus sits on the bar: space and m never type. Draws
// props only; ThreadVoice (screen.tsx) feeds it. Owner: amb-home (the page's v2: amb-web).
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { LivePearl } from '@/pearl';
import { buttonsOf, failedPairs, failOf, keyAct, labelOf, pairsOf, poseOf, spaceHeld, spaceUp, trimPairs, wordsOf, HOLD_MS, KEY_TRIMS, type Act, type VoiceState } from './model';
import './voicemode.css';
import { Press } from '@/ds';

export interface VoicePaneProps {
  state: VoiceState;
  agent: string;
  heard?: string | null | undefined;
  fail?: string | null | undefined;
  /** the label line's right: the voice model ('Voxtral · Mistral'), '' when unknown */
  model?: string;
  /** muted while the agent spoke: its voice goes on ('speaking · ○ muted', its pearl speaks) */
  speaking?: boolean;
  /** his level, 0..1 (level 'you'): the pearl follows his voice while he talks */
  you: number;
  /** the agent's level, 0..1 (level 'agent'): the pearl follows its voice while it speaks */
  them: number;
  /** the label line's words for a while (fn waits); none: the label */
  label?: string | null;
  onAct: (a: Act) => void;
}

export function VoicePane({ state, agent, heard, fail, model = '', speaking = false, you, them, label, onAct }: VoicePaneProps) {
  const root = useRef<HTMLElement>(null);
  const words = wordsOf(state, agent, heard, { speaking });
  const failed = state === 'failed' ? failOf(fail) : null;
  // muted: only his side greys; the agent's voice and pearl go on
  const pose = state === 'muted' && speaking ? 'speak' : poseOf(state);
  const level = pose === 'speak' ? them : pose === 'listen' ? you : 0;
  const grey = state === 'failed' || (state === 'muted' && !speaking);
  const on = state !== 'muted' && state !== 'failed';

  // focus sits on the bar while it shows (space and m never type)
  useEffect(() => {
    root.current?.focus();
  }, []);

  // the key line stays one line: when it overflows, drop 'tab type', then 'm mute' (designer
  // m_16975). A new state or a new width starts from the whole line again.
  const all = failed !== null ? failedPairs(failed) : pairsOf(state);
  const keysRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  // the trim belongs to one line at one width: anything else reads as 0 (no reset effect)
  // (its words too: listening's 'send' and hearing's 'send now' are the same acts, not the same width)
  const fit = `${all.map((p) => `${p.key} ${p.words}`).join(' · ')}|${String(width)}`;
  const [trimAt, setTrimAt] = useState({ fit: '', n: 0 });
  const trim = trimAt.fit === fit ? trimAt.n : 0;
  useLayoutEffect(() => {
    const el = keysRef.current;
    if (el !== null && trim < KEY_TRIMS && el.scrollWidth > el.clientWidth + 1) setTrimAt({ fit, n: trim + 1 });
  }, [fit, trim]);
  useEffect(() => {
    const el = keysRef.current;
    if (el === null || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setWidth(Math.round(el.clientWidth));
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);
  const keys = trimPairs(all, trim);

  // space: a tap sends now (his turn) or cuts in (it works); a hold keeps the floor or cuts in (at once)
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
      <div className={`vm-label${label != null ? ' waits' : ''}`}>
        <span data-testid="voice.label">{label ?? labelOf(agent)}</span>
        {model !== '' && (
          <span className="end" data-testid="voice.model">
            {model}
          </span>
        )}
      </div>
      <div className={`vm-bar${on ? ' on' : ''}`} data-testid="voice.bar">
        <span className={`vm-pearl${grey ? ' grey' : ''}`} data-pose={pose}>
          <LivePearl mood={pose} level={level} size={40} testId="voice.pearl" />
        </span>
        <p className={`vm-words ${words.kind}`} data-testid="voice.words">
          {failed !== null ? (
            <span className="err">{failed.words}</span>
          ) : words.kind === 'heard' ? (
            <>
              {words.text}
              {state === 'hearing' && <span className="dim"> …</span>}
            </>
          ) : words.text.startsWith('● ') ? (
            <>
              <span className="vm-dot">●</span>
              {words.text.slice(1)}
            </>
          ) : (
            words.text
          )}
        </p>
        <span className="vm-btns">
          {buttonsOf(state, failed).map((p) => (
            <Press
              look="vm-btn"
              key={p.act}
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault(); // the bar keeps focus (space and m)
              }}
              onClick={() => {
                onAct(p.act);
              }}
              data-testid={`voice.btn.${p.act}`}
            >
              {p.words}
              {p.key !== '' && <kbd>{p.key}</kbd>}
            </Press>
          ))}
        </span>
      </div>
      <div ref={keysRef} className="vm-keys" data-testid="voice.keys" data-trim={trim}>
        {keys.map((p) => (
          <Press
            look="vm-key"
            key={p.act}
            tabIndex={-1}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={() => {
              onAct(p.act);
            }}
            data-testid={`voice.key.${p.act}`}
          >
            <kbd>{p.key}</kbd> {p.words}
          </Press>
        ))}
      </div>
    </section>
  );
}
