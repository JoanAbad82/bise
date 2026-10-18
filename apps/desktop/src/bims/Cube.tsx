// The bims' cube in the AGENTS head (his ask, main m_28901: « dans le header de la section des
// agents, à gauche de "all >" », with a small pink 'the bims' beside it): the toggle that shows or
// hides the office above the rows, on a project's bar and on bise's (the town). At rest, office
// closed, it lives a little to make him want to click (« cligne des yeux de temps en temps, et
// fasse un petit saut … toutes les 2-3 minutes »): one-shot moves on timers (moves.ts), a CSS
// animation that runs once and leaves; no loop, none while nobody looks (pearl/away), none under
// reduced motion, none hovered or open. Short of room in the head (measured: headroom.ts), the
// cube alone, its words in its tip and aria-label (bims-toggle). Owner: bar-main.
import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Press, tipAttrs } from '@/ds';
import { awayNow, watchAway } from '@/pearl/away';
import { bims } from '@/proto/words_bims.gen';
import { bimsView, type BimsView } from './view';
import { BLINK_MS, HOP_MS, nextIn, type Move } from './moves';
import { labelFits, type HeadRoom } from './headroom';

/**
 * les bims' icon (designer m_28575, pick D): a solid isometric box in the accent, its top .45, its
 * right face .75, its left face full, each with a 1.5 stroke; two eyes on the left face cut out
 * with a mask, so the button's hover and pressed tints show through them (a blink closes them).
 */
export function BimsGlyph() {
  const id = `bims-eyes-${useId().replace(/:/g, '')}`;
  return (
    <svg className="bims-glyph" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
          <rect width="16" height="16" fill="#fff" />
          <circle className="bims-eye" cx="4.21" cy="8.59" r="0.95" fill="#000" />
          <circle className="bims-eye" cx="6.43" cy="9.87" r="0.95" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${id})`} fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <polygon points="8,1.6 13.54,4.8 8,8 2.46,4.8" fillOpacity={0.45} />
        <polygon points="2.46,11.2 8,14.4 8,8 2.46,4.8" />
        <polygon points="13.54,11.2 8,14.4 8,8 13.54,4.8" fillOpacity={0.75} />
      </g>
    </svg>
  );
}

const reducedNow = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/** a check's own pace ({ blink, hop } ms), test mode only: 2-3 min is too long to wait for */
const pace = (): { blink?: number; hop?: number } | undefined =>
  (window as { bise?: { test?: boolean } }).bise?.test === true ? (window as { __biseCubePace?: { blink?: number; hop?: number } }).__biseCubePace : undefined;

/**
 * The cube's moves while it rests: a blink every few seconds, a hop now and then; `rests` false
 * (open, hovered) or nobody looking: no timer at all. The move on now, or null.
 */
function useMoves(rests: boolean): Move | null {
  const [move, setMove] = useState<Move | null>(null);
  const [away, setAway] = useState(awayNow);
  useEffect(() => watchAway(() => { setAway(awayNow()); }), []);
  const live = rests && !away && !reducedNow();
  const timers = useRef<number[]>([]);
  useEffect(() => {
    if (!live) return;
    const p = pace();
    const plan = (kind: Move) => {
      const t = window.setTimeout(() => {
        setMove(kind);
        // the move runs once, then the cube is still again until the next one
        const end = window.setTimeout(() => { setMove(null); }, kind === 'hop' ? HOP_MS : BLINK_MS);
        timers.current.push(end);
        plan(kind);
      }, nextIn(kind, Math.random(), p));
      timers.current.push(t);
    };
    plan('blink');
    plan('hop');
    return () => {
      for (const t of timers.current) window.clearTimeout(t);
      timers.current = [];
      setMove(null);
    };
  }, [live]);
  // stopped (open, hovered, away): still at once, whatever move was on
  return live ? move : null;
}

const px = (v: string): number => Number.parseFloat(v) || 0;
const marginsX = (e: Element): number => {
  const s = getComputedStyle(e);
  return px(s.marginLeft) + px(s.marginRight);
};
const paddingX = (e: Element): number => {
  const s = getComputedStyle(e);
  return px(s.paddingLeft) + px(s.paddingRight);
};

/**
 * The head's widths around the cube's button, as laid out now (headroom.ts decides). The title is
 * the part that shrinks (flex-shrink not 0): its natural width is its padding and its first child
 * ('AGENTS · N' and its ▾ slot) whole; a folded summary after it may end in '…'. The label is
 * measured even while it is out (office.css keeps it laid out, unseen).
 */
function roomOf(btn: HTMLElement): HeadRoom | null {
  const head = btn.parentElement;
  const label = btn.querySelector('.bims-cube-label');
  const glyph = btn.querySelector('.bims-glyph');
  if (head === null || label === null || glyph === null) return null;
  let title = 0;
  const others: number[] = [];
  for (const part of Array.from(head.children)) {
    if (part === btn) continue;
    const words = part.firstElementChild;
    if (getComputedStyle(part).flexShrink !== '0' && words !== null) title = paddingX(part) + words.scrollWidth + marginsX(words) + marginsX(part);
    else others.push(part.getBoundingClientRect().width + marginsX(part));
  }
  return {
    head: head.clientWidth - paddingX(head),
    title,
    others,
    cube: paddingX(btn) + glyph.getBoundingClientRect().width + marginsX(btn),
    label: label.getBoundingClientRect().width + px(getComputedStyle(btn).columnGap),
  };
}

/**
 * Whether 'the bims' has room beside the cube (designer m_31047: measured, every part of the head
 * whole). Measured before the first paint, then again when the head or one of its parts resizes
 * (a wider bar, a longer count, the width switch in or out), a frame later: a change made inside
 * the observer's own callback would loop it.
 */
function useLabelRoom(btn: RefObject<HTMLButtonElement | null>, on: boolean): boolean {
  const [fits, setFits] = useState(true);
  useLayoutEffect(() => {
    const b = btn.current;
    const head = b?.parentElement ?? null;
    if (b === null || head === null) return;
    const check = () => {
      const r = roomOf(b);
      if (r !== null) setFits(labelFits(r));
    };
    check();
    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(check);
    });
    ro.observe(head);
    for (const part of Array.from(head.children)) {
      ro.observe(part);
      if (part.firstElementChild !== null) ro.observe(part.firstElementChild);
    }
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
    // the width switch comes and goes with the office: its parts change then
  }, [btn, on]);
  return fits;
}

/**
 * The AGENTS head's cube and its 'the bims', pink: a click shows the office above the rows, again
 * hides it (pressed while it shows). None when the office can't draw (WebGL lost).
 */
export function BimsToggle({ view }: { view: BimsView }) {
  const on = view.view === 'bims';
  const [hover, setHover] = useState(false);
  const move = useMoves(!on && !hover);
  const ref = useRef<HTMLButtonElement>(null);
  const fits = useLabelRoom(ref, on);
  if (view.lost) return null;
  return (
    <Press
      ref={ref}
      look="bims-cube"
      data-room={fits ? undefined : 'cube'}
      aria-pressed={on}
      // its name when the label is out (no room: office.css)
      aria-label={bims.cube_label}
      {...tipAttrs(on ? bims.cube_close_tip : bims.cube_open_tip)}
      onClick={() => {
        bimsView.setView(on ? 'list' : 'bims');
      }}
      onPointerEnter={() => { setHover(true); }}
      onPointerLeave={() => { setHover(false); }}
      data-move={move ?? undefined}
      data-testid="app.right.agents.bims"
    >
      <BimsGlyph />
      <span className="bims-cube-label">{bims.cube_label}</span>
    </Press>
  );
}
