// The spotlight (fn space; bar ⛔1s, his bugs 7, 6 and 2): amb-kit's Spot frame, an uncontrolled
// <input> the app never writes while he types (only a send clears it), the list under it as
// memo'd rows keyed by id (a keystroke updates the rows that changed, the input and the other rows
// stay the same nodes), the live pearl mounted once. bise's answer shows under the input at a
// readable size; the panel grows with it (onHeight tells the window), and past ANSWER_MAX_LINES it
// cuts with 'the rest in bise' (⏎ opens it in the window).
import { memo, useDeferredValue, useEffect, useMemo, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from 'react';
import { Spot, SpotGroup, SpotRow, type DotState } from '@/ds';
import { LivePearl, type Mood } from '@/pearl';
import { flat, spotList, type AgentStatus, type SpotData, type SpotItem } from './list';
import { W } from './words';
import './spotlight.css';

export interface SpotAnswer {
  readonly text: string;
  /** bise is still writing it. */
  readonly done: boolean;
}

export interface SpotlightProps {
  readonly data: SpotData;
  readonly answer?: SpotAnswer | null;
  readonly mood?: Mood;
  readonly level?: number;
  readonly still?: boolean;
  /** The pearl's place: the capsule passes a hole and keeps its one live pearl over it (never
   *  re-mounted when the capsule changes view); alone, the spotlight draws its own. */
  readonly pearl?: ReactNode;
  /** A sentence for bise (⏎ on 'ask bise', or ⏎ with nothing picked). */
  readonly onAsk: (text: string) => void;
  /** Open a card, an agent or an environment in bise's window. */
  readonly onOpen: (item: SpotItem) => void;
  /** Open bise's answer in the window (the rest of a long one). */
  readonly onOpenAnswer?: () => void;
  readonly onClose: () => void;
  /** The content's height in CSS px, each time it changes: the panel follows it. */
  readonly onHeight?: (px: number) => void;
  readonly testId?: string;
}

/** An answer longer than this many lines shows its start and 'the rest in bise'. */
export const ANSWER_MAX_LINES = 18;

const DOT: Record<AgentStatus, DotState> = { waiting: 'nd', blocked: 'off', working: 'wk', idle: 'off', done: 'ok', failed: 'er' };

const Row = memo(function Row({ item, on, testId, onPick }: { item: SpotItem; on: boolean; testId: string; onPick: (item: SpotItem) => void }): JSX.Element {
  const click = (): void => {
    onPick(item);
  };
  const id = `${testId}.row.${item.id}`;
  switch (item.kind) {
    case 'ask':
      return <SpotRow lead="bise" name={W.askBise} what={item.text} hotkey="↵" on={on} onClick={click} testId={id} />;
    case 'card':
      return <SpotRow lead="nd" name={`${item.mark} ${item.agent}`} where={item.pname} what={item.text} on={on} onClick={click} testId={id} />;
    case 'agent':
      return <SpotRow lead={DOT[item.status]} name={item.name} where={item.pname} what={item.title} on={on} onClick={click} testId={id} />;
    case 'env':
      return <SpotRow lead="off" name={item.name} what={item.sub} hotkey={item.n === null ? undefined : `⌘${item.n}`} on={on} onClick={click} testId={id} />;
    case 'front':
      return <SpotRow lead="off" name={`◦ ${item.name}`} what={item.sub} on={on} testId={id} />;
  }
});

export function answerLines(text: string): { readonly shown: string; readonly cut: boolean } {
  const lines = text.split('\n');
  return lines.length <= ANSWER_MAX_LINES ? { shown: text, cut: false } : { shown: lines.slice(0, ANSWER_MAX_LINES).join('\n'), cut: true };
}

export function Spotlight(p: SpotlightProps): JSX.Element {
  const testId = p.testId ?? 'spot';
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  // the list follows the words at React's pace; the input itself is never re-rendered by it
  const query = useDeferredValue(text);
  const list = useMemo(() => spotList(p.data, query), [p.data, query]);
  const items = useMemo(() => flat(list), [list]);
  const [sel, setSel] = useState({ q: '', i: 0 });
  const index = sel.q === query ? Math.min(sel.i, Math.max(0, items.length - 1)) : 0;
  const props = useRef(p);
  useEffect(() => {
    props.current = p;
  });

  useEffect(() => {
    input.current?.focus();
  }, []);

  useEffect(() => {
    const el = box.current;
    if (el === null) return;
    const ro = new ResizeObserver(() => {
      props.current.onHeight?.(Math.ceil(el.getBoundingClientRect().height));
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  const send = (q: string): void => {
    if (q.trim() === '') return;
    props.current.onAsk(q.trim());
    if (input.current !== null) input.current.value = ''; // his send: the one write to the input
    setText('');
  };

  const pick = (item: SpotItem): void => {
    if (item.kind === 'ask') send(item.text);
    else if (item.kind !== 'front') props.current.onOpen(item);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const by = e.key === 'ArrowDown' ? 1 : -1;
      setSel({ q: query, i: items.length === 0 ? 0 : (index + by + items.length) % items.length });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const a = p.answer;
      if (a && text.trim() === '' && answerLines(a.text).cut) {
        p.onOpenAnswer?.();
        return;
      }
      const item = items[index];
      if (item !== undefined && text === query) pick(item);
      else send(text);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      p.onClose();
    } else if (e.metaKey && /^[1-9]$/u.test(e.key)) {
      const env = items.find((x) => x.kind === 'env' && x.n === Number(e.key));
      if (env !== undefined) {
        e.preventDefault();
        p.onOpen(env);
      }
    }
  };

  const ans = p.answer ? answerLines(p.answer.text) : null;
  const keys = list.mode === 'ask' ? W.keysAsk : W.keysEmpty;

  return (
    <div ref={box} className="b-spotlight" data-testid={testId}>
      <Spot
        testId={`${testId}.frame`}
        to={W.to}
        pearl={p.pearl ?? <LivePearl mood={p.mood ?? 'rest'} level={p.level} still={p.still} size={40} testId={`${testId}.pearl`} />}
        input={
          <input
            ref={input}
            type="text"
            placeholder={W.ph}
            aria-label={W.ph}
            spellCheck={false}
            autoComplete="off"
            data-testid={`${testId}.input`}
            onInput={(e) => {
              setText(e.currentTarget.value);
            }}
            onKeyDown={onKeyDown}
          />
        }
        keys={ans?.cut === true ? W.answerMore : keys}
      >
        {ans !== null && (
          <div className="b-spot-answer" data-testid={`${testId}.answer`} aria-live="polite">
            {ans.shown}
            {p.answer?.done === false && <span className="cur" />}
          </div>
        )}
        {list.sections.map((s) => (
          <div key={s.label ?? 'ask'} role="group" data-testid={`${testId}.group.${s.label ?? 'ask'}`}>
            {s.label !== null && <SpotGroup>{s.label}</SpotGroup>}
            {s.items.map((item) => (
              <Row key={item.id} item={item} on={items[index]?.id === item.id} testId={testId} onPick={pick} />
            ))}
          </div>
        ))}
      </Spot>
    </div>
  );
}
