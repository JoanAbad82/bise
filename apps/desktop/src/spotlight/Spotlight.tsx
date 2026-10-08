// The spotlight (fn space; bar ⛔1s, his bugs 7, 6 and 2): amb-kit's Spot frame, an uncontrolled
// <input> the app never writes while he types (only a send clears it), the list under it as
// memo'd rows keyed by id (a keystroke updates the rows that changed, the input and the other rows
// stay the same nodes), the live pearl mounted once. bise's answer shows under the input at a
// readable size; the panel grows with it (onHeight tells the window), and past ANSWER_MAX_LINES it
// cuts with 'the rest in bise' (⏎ opens it in the window).
import { memo, useDeferredValue, useEffect, useMemo, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from 'react';
import { Spot, SpotGroup, SpotRow, type DotState } from '@/ds';
import { cx } from '@/ds/cx';
import { LivePearl, type Mood } from '@/pearl';
import { flat, routeList, spotList, type AgentStatus, type SpotData, type SpotItem } from './list';
import { W, newBrief } from './words';
import { LiveText } from './LiveText';
import { shownName } from '@/agents/model';
import { caretAtEnd, keep } from '@/app/keep';
import type { PreviewLine } from './preview';
import './spotlight.css';

/** His typed words' field in the keep (keep.ts). */
const KEPT = 'spot';

export interface SpotAnswer {
  readonly text: string;
  /** bise is still writing it. An empty text not done: asked, no word back yet (W.asked shows). */
  readonly done: boolean;
  /** a line about the answer, not the answer (dim): it went to another project's thread */
  readonly note?: boolean;
}

/** A routing hold on what he just sent: bise picked `to`, he can change it until `until` (epoch ms). */
export interface SpotRoute {
  readonly rid: number;
  readonly to: string;
  readonly name: string;
  readonly until: number;
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
  /** A routing hold running on his last send: shown at once, with its countdown (bar ⛔3). */
  readonly route?: SpotRoute | null;
  /** esc or a click on the hold: keep it with bise (route_cancel). */
  readonly onRouteKeep?: () => void;
  /** ⏎ on another project during the hold (route_correct). */
  readonly onRouteTo?: (project: string) => void;
  /** A sentence for bise (⏎ on 'ask bise', or ⏎ with nothing picked). */
  readonly onAsk: (text: string) => void;
  /** '/new …' or 'start an agent: …' (bar A.1): start an agent with that brief; none: it goes to bise as words. */
  readonly onNew?: (brief: string) => void;
  /** Open a card, an agent or an environment in bise's window. */
  readonly onOpen: (item: SpotItem) => void;
  /** The row the keyboard is on, each time it changes (none: no row): the capsule follows the
   *  selected agent's thread for its last actions (R07-a). */
  readonly onSelect?: (item: SpotItem | null) => void;
  /** The selected agent's last actions (its row id and lines, newest last): its right column
   *  shows them instead of its objective. None or no line yet: the objective stays. */
  readonly preview?: { readonly id: string; readonly lines: readonly PreviewLine[] } | null;
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

/** The selected agent's last actions in its right column, newest last (the newest in the text's
 *  color, the older dim), each with its time at the right; a question that waits on him in accent. */
function Actions({ lines, testId }: { lines: readonly PreviewLine[]; testId: string }): JSX.Element {
  return (
    <span className="b-spot-acts" data-testid={testId}>
      {lines.map((l, i) => (
        <span key={l.key} className={cx('a', i === lines.length - 1 && 'new', l.ask && 'ask')} data-testid={`${testId}.${String(i)}`}>
          <span className="t">{l.text}</span>
          <span className="tm">{l.time}</span>
        </span>
      ))}
    </span>
  );
}

const Row = memo(function Row({ item, on, testId, onPick, acts }: { item: SpotItem; on: boolean; testId: string; onPick: (item: SpotItem) => void; acts?: readonly PreviewLine[] | undefined }): JSX.Element {
  const click = (): void => {
    onPick(item);
  };
  const id = `${testId}.row.${item.id}`;
  switch (item.kind) {
    case 'ask':
      return <SpotRow lead="bise" name={W.askBise} what={item.text} hotkey="↵" on={on} onClick={click} testId={id} />;
    case 'new':
      return <SpotRow lead="bise" name={W.startAgent} what={item.brief} hotkey="↵" on={on} onClick={click} testId={id} />;
    case 'card':
      return <SpotRow lead="nd" name={`${item.mark} ${shownName(item.agent)}`} where={item.pname} what={item.text} hotkey={W.answerKey} on={on} onClick={click} testId={id} />;
    case 'agent':
      return <SpotRow lead={DOT[item.status]} name={item.name} where={item.pname} what={on && acts !== undefined && acts.length > 0 ? <Actions lines={acts} testId={`${id}.acts`} /> : item.title} on={on} onClick={click} testId={id} />;
    case 'env':
      return <SpotRow lead="off" name={item.name} what={item.sub} hotkey={item.n === null ? undefined : `⌘${item.n}`} on={on} onClick={click} testId={id} />;
    case 'front':
      return <SpotRow lead="off" name={`◦ ${item.name}`} what={item.sub} on={on} testId={id} />;
  }
});

/** '→ bise · telemetry · 2 s to change', counting down on its own (the list and the input don't re-render). */
export function RouteLine({ route, onKeep, testId }: { route: SpotRoute; onKeep?: (() => void) | undefined; testId: string }): JSX.Element {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => {
      window.clearInterval(t);
    };
  }, []);
  const left = Math.max(0, Math.ceil((route.until - now) / 1000));
  return (
    <div className="b-spot-route" data-testid={testId} data-left={left}>
      <span className="to">{W.routeTo(route.name, left)}</span>
      {onKeep !== undefined && (
        <button type="button" className="keep" onClick={onKeep} data-testid={`${testId}.keep`}>
          {W.keepWithBise}
        </button>
      )}
    </div>
  );
}

export function answerLines(text: string): { readonly shown: string; readonly cut: boolean } {
  const lines = text.split('\n');
  return lines.length <= ANSWER_MAX_LINES ? { shown: text, cut: false } : { shown: lines.slice(0, ANSWER_MAX_LINES).join('\n'), cut: true };
}

export function Spotlight(p: SpotlightProps): JSX.Element {
  const testId = p.testId ?? 'spot';
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  // his words survive a reload or an update swap until sent or put away with esc (keep.ts, amb-win)
  const [text, setText] = useState(() => keep.text(KEPT));
  // the list follows the words at React's pace; the input itself is never re-rendered by it
  const query = useDeferredValue(text);
  const route = p.route ?? null;
  const list = useMemo(() => (route === null ? spotList(p.data, query) : routeList(p.data, route.to)), [p.data, query, route]);
  const items = useMemo(() => flat(list), [list]);
  const [sel, setSel] = useState({ q: '', i: 0 });
  const index = sel.q === query ? Math.min(sel.i, Math.max(0, items.length - 1)) : 0;
  const props = useRef(p);
  useEffect(() => {
    props.current = p;
  });
  // the row the keyboard is on, told when it changes (R07-a: the capsule follows that agent)
  const selected = items[index] ?? null;
  useEffect(() => {
    props.current.onSelect?.(selected);
  }, [selected]);

  useEffect(() => {
    input.current?.focus();
    caretAtEnd(input.current);
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
    const brief = newBrief(q);
    const onNew = props.current.onNew;
    if (brief !== undefined && onNew !== undefined) onNew(brief);
    else props.current.onAsk(q.trim());
    if (input.current !== null) input.current.value = ''; // his send: the one write to the input
    setText('');
    keep.dropText(KEPT);
  };

  const pick = (item: SpotItem): void => {
    if (props.current.route != null) {
      if (item.kind === 'env') props.current.onRouteTo?.(item.project);
      return;
    }
    if (item.kind === 'ask') send(item.text);
    else if (item.kind === 'new') send(input.current?.value ?? `/new ${item.brief}`);
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
      if (route !== null) {
        if (item !== undefined) pick(item);
        return;
      }
      if (item !== undefined && text === query) pick(item);
      else send(text);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (route !== null) p.onRouteKeep?.();
      else {
        keep.dropText(KEPT);
        p.onClose();
      }
    } else if (e.metaKey && /^[1-9]$/u.test(e.key)) {
      const env = items.find((x) => x.kind === 'env' && x.n === Number(e.key));
      if (env !== undefined) {
        e.preventDefault();
        p.onOpen(env);
      }
    }
  };

  const ans = p.answer ? answerLines(p.answer.text) : null;
  const keys = route !== null ? W.keysRoute : list.mode === 'new' ? W.keysNew : list.mode === 'ask' ? W.keysAsk : W.keysEmpty;

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
            defaultValue={text}
            onInput={(e) => {
              setText(e.currentTarget.value);
              keep.setText(KEPT, e.currentTarget.value);
            }}
            onKeyDown={onKeyDown}
          />
        }
        keys={ans?.cut === true ? W.answerMore : keys}
      >
        {route !== null && <RouteLine route={route} onKeep={p.onRouteKeep} testId={`${testId}.route`} />}
        {ans !== null && (
          // his ask shows it went (R18 on 723648da: the spot fell back to its list with no sign of
          // the ask until a word came back): 'asked bise' with the ∿ until the first words, which
          // take its place; an ask bise sent to another project says where its answer is
          <div className={cx('b-spot-answer', (p.answer?.note === true || ans.shown === '') && 'note')} data-testid={`${testId}.answer`} data-state={p.answer?.note === true ? 'went' : ans.shown === '' ? 'asked' : p.answer?.done === false ? 'live' : 'done'} aria-live="polite">
            <LiveText text={ans.shown === '' ? W.asked : ans.shown} live={p.answer?.done === false} testId={`${testId}.answer.text`} />
          </div>
        )}
        {/* one flat keyed list, the group heads as items: a row that stays listed keeps its element
            when it changes group or place (qa-type's spotlight/typing: rows keyed inside their group
            were rebuilt when typing moved them, bug 7's blink) */}
        {list.sections.flatMap((s) => [
          s.label === null ? null : (
            <div key={`group.${s.label}`} data-testid={`${testId}.group.${s.label}`}>
              <SpotGroup>{s.label}</SpotGroup>
            </div>
          ),
          ...s.items.map((item) => <Row key={item.id} item={item} on={items[index]?.id === item.id} testId={testId} onPick={pick} acts={p.preview?.id === item.id ? p.preview.lines : undefined} />),
        ])}
      </Spot>
    </div>
  );
}
