// The bims' cube in the AGENTS head (his ask, main m_28901: « dans le header de la section des
// agents, à gauche de "all >" », with a small pink 'the bims' beside it): the toggle that shows or
// hides the office above the rows, on a project's bar and on bise's (the town). At rest, office
// closed, it lives a little to make him want to click (« cligne des yeux de temps en temps, et
// fasse un petit saut … toutes les 2-3 minutes »): one-shot moves on timers (moves.ts), a CSS
// animation that runs once and leaves; no loop, none while nobody looks (pearl/away), none under
// reduced motion, none hovered or open. Owner: bar-main.
import { useEffect, useId, useRef, useState } from 'react';
import { Press, tipAttrs } from '@/ds';
import { awayNow, watchAway } from '@/pearl/away';
import { bims } from '@/proto/words_bims.gen';
import { bimsView, type BimsView } from './view';
import { BLINK_MS, HOP_MS, nextIn, type Move } from './moves';

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

/**
 * The AGENTS head's cube and its 'the bims', pink: a click shows the office above the rows, again
 * hides it (pressed while it shows). None when the office can't draw (WebGL lost).
 */
export function BimsToggle({ view }: { view: BimsView }) {
  const on = view.view === 'bims';
  const [hover, setHover] = useState(false);
  const move = useMoves(!on && !hover);
  if (view.lost) return null;
  return (
    <Press
      look="bims-cube"
      aria-pressed={on}
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
