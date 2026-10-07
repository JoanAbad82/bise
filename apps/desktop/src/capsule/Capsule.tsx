// The capsule's content for one view (machine.ts): the spotlight, the talk, bise's answer, a
// pushed card (amb-home's card, through `card`), the tray's dropdown. One live pearl at a fixed
// place for every view, so a change of view never re-mounts it (bug 2); the spotlight gets a hole
// where its own pearl would be. The content's size goes to the window (onSize): an answer that
// doesn't fit grows the panel, and past ANSWER_MAX_LINES it offers the rest in the window (bug 6).
import { useEffect, useRef, type JSX, type ReactNode } from 'react';
import { Menu, MenuItem, MenuSep } from '@/ds';
import { LivePearl, type Mood } from '@/pearl';
import { RouteLine, Spotlight, answerLines, type SpotAnswer, type SpotData, type SpotItem, type SpotRoute } from '@/spotlight';
import type { View } from './machine';
import './capsule.css';

export const W = {
  listening: 'listening…',
  thinking: 'bise is thinking…',
  restInBise: 'the rest in bise   ⏎ open',
  openBise: 'open bise',
  inbox: 'inbox',
  settings: 'settings…',
  quit: 'quit bise ambient',
  head: (work: number, waits: number): string => `${work > 0 ? `${work} at work` : 'nobody at work'}${waits > 0 ? ` · ${waits} waiting for you` : ''}`,
} as const;

export interface CapsuleProps {
  readonly view: View;
  readonly spot: SpotData;
  readonly answer: SpotAnswer | null;
  /** What bise heard so far while he talks. */
  readonly heard: string;
  readonly level: number;
  readonly still: boolean;
  /** A routing hold on what he just sent (bar ⛔3): shown at once, in the spotlight or the talk. */
  readonly route: SpotRoute | null;
  readonly onRouteKeep: () => void;
  readonly onRouteTo: (project: string) => void;
  /** amb-home's card for a pushed card, by id. */
  readonly card: (id: string) => ReactNode;
  readonly onAsk: (text: string) => void;
  /** '/new …' in the spotlight: start an agent in bise's home (bar A.1) */
  readonly onNew?: (brief: string) => void;
  readonly onOpen: (item: SpotItem) => void;
  readonly onOpenWindow: (route?: string) => void;
  readonly onClose: () => void;
  /** null: the app can't quit from a page yet (the row shows greyed). */
  readonly onQuit: (() => void) | null;
  /** The page's size and the glass inside it: the page is the glass now (macOS vibrancy fills the
   *  window, glass.ts), so the rect is {0, 0, width, height}. */
  readonly onSize: (width: number, height: number, glass: { x: number; y: number; width: number; height: number }) => void;
}

const moodOf = (v: View, answering: boolean): Mood => {
  if (v.kind === 'talk') return v.phase === 'listen' ? 'listen' : 'work';
  if (v.kind === 'answer') return answering ? 'speak' : 'rest';
  return 'rest';
};

export function Capsule(p: CapsuleProps): JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  const size = useRef(p.onSize);
  useEffect(() => {
    size.current = p.onSize;
  });
  useEffect(() => {
    const el = box.current;
    if (el === null) return;
    const measure = (): void => {
      const r = el.getBoundingClientRect();
      const g = el.querySelector('[data-glass]')?.getBoundingClientRect() ?? r;
      size.current(Math.ceil(r.width), Math.ceil(r.height), { x: Math.round(g.x - r.x), y: Math.round(g.y - r.y), width: Math.round(g.width), height: Math.round(g.height) });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const mo = new MutationObserver(measure); // a view change swaps the glass without resizing the page
    mo.observe(el, { childList: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  const v = p.view;
  const answering = p.answer?.done === false;
  const pearl = v.kind === 'spot' || v.kind === 'talk' || v.kind === 'answer';
  return (
    <div ref={box} className={`b-capsule at-${v.kind}`} data-testid="capsule" data-view={v.kind}>
      <div className={`b-cap-pearl${pearl ? '' : ' off'}`}>
        <LivePearl mood={moodOf(v, answering)} level={p.level} still={p.still} size={40} testId="capsule.pearl" />
      </div>
      {v.kind === 'spot' && <div data-glass className="b-cap-glass"><Spotlight data={p.spot} answer={p.answer} route={p.route} onRouteKeep={p.onRouteKeep} onRouteTo={p.onRouteTo} pearl={<span className="b-cap-hole" />} onAsk={p.onAsk} onNew={p.onNew} onOpen={p.onOpen} onOpenAnswer={() => { p.onOpenWindow('bise'); }} onClose={p.onClose} testId="spot" /></div>}
      {v.kind === 'talk' && (
        <div className="b-cap-talk" data-testid="capsule.talk" data-glass>
          {p.heard !== '' ? p.heard : v.phase === 'listen' ? W.listening : W.thinking}
          {p.route !== null && <RouteLine route={p.route} onKeep={p.onRouteKeep} testId="capsule.route" />}
        </div>
      )}
      {v.kind === 'answer' && <Answer answer={p.answer} onOpen={() => { p.onOpenWindow('bise'); }} />}
      {v.kind === 'card' && <div className="b-cap-card" data-testid="capsule.card" data-glass>{p.card(v.id)}</div>}
      {v.kind === 'menu' && <TrayMenu spot={p.spot} onOpenWindow={p.onOpenWindow} onQuit={p.onQuit} />}
    </div>
  );
}

function Answer({ answer, onOpen }: { answer: SpotAnswer | null; onOpen: () => void }): JSX.Element {
  const a = answer === null ? null : answerLines(answer.text);
  return (
    <div className="b-cap-answer" data-testid="capsule.answer" aria-live="polite" data-glass>
      <div className="t">
        {a?.shown ?? ''}
        {answer?.done === false && <span className="cur" />}
      </div>
      {a?.cut === true && (
        <button type="button" className="more" onClick={onOpen} data-testid="capsule.answer.more">
          {W.restInBise}
        </button>
      )}
    </div>
  );
}

function TrayMenu({ spot, onOpenWindow, onQuit }: { spot: SpotData; onOpenWindow: (route?: string) => void; onQuit: (() => void) | null }): JSX.Element {
  const work = spot.agents.filter((a) => a.status === 'working').length;
  return (
    <div className="b-cap-menu" data-glass>
      <Menu testId="capsule.menu">
        <div className="b-cap-menu-head" data-testid="capsule.menu.head">{W.head(work, spot.cards.length)}</div>
        <MenuSep />
        <MenuItem onClick={() => { onOpenWindow(); }} testId="capsule.menu.open">{W.openBise}</MenuItem>
        <MenuItem hotkey="⌘I" onClick={() => { onOpenWindow('inbox'); }} testId="capsule.menu.inbox">{W.inbox}</MenuItem>
        <MenuItem hotkey="⌘," onClick={() => { onOpenWindow('settings'); }} testId="capsule.menu.settings">{W.settings}</MenuItem>
        <MenuSep />
        <MenuItem hotkey="⌘Q" disabled={onQuit === null} onClick={() => { onQuit?.(); }} testId="capsule.menu.quit">{W.quit}</MenuItem>
      </Menu>
    </div>
  );
}
