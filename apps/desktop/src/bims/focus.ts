// The link between the AGENTS rows and the office (Gabriel: hovering a row lights its bim; bims
// m_28199): which agent is lit now and from where ('row': the pointer on its row, the office rings
// its bim and shows its card after the tip's delay; 'bim': the pointer on the bim, its row gets the
// rows' hover tint). One store per window, not kept. And the follow camera (Gabriel: with an
// agent's thread open the office zooms on its bim and follows it as it walks): where to aim and how
// to get there. Pure but the store. Owner: bims-hover.
import { useSyncExternalStore } from 'react';
import { clampCam, type Cam } from './zoom';

export interface Lit {
  readonly name: string;
  readonly from: 'row' | 'bim';
}

const listeners = new Set<() => void>();
let lit: Lit | null = null;

export const bimsLit = {
  get: (): Lit | null => lit,
  /** the pointer came on `name`'s row or bim (null: it left; only the side that lit it clears it) */
  set(next: Lit | null, from?: Lit['from']): void {
    if (next === null && from !== undefined && lit?.from !== from) return;
    if (next?.name === lit?.name && next?.from === lit?.from) return;
    lit = next;
    for (const l of [...listeners]) l();
  },
};

export function useBimsLit(): Lit | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    bimsLit.get,
  );
}

/**
 * How close the follow camera looks: 4.4x the fit (Gabriel, bims-fix: at 2.2x the bim was lost in
 * the room; he wants it and its desk filling a good part of the view, about twice that).
 */
export const FOLLOW_ZOOM = 4.4;
/** the follow camera's ease: about 300 ms to settle */
const FOLLOW_TAU = 0.1;

/**
 * The agent the office follows for the route on screen: an agent's thread in this project, but
 * main's (the default screen: the whole office stays) and an archived one's (no bim). Pure.
 */
export function followOf(route: { screen: string; project?: string; agent?: string }, project: string, agents: readonly { name: string; main: boolean; archived?: boolean }[]): string | null {
  if (route.screen !== 'thread' || route.project !== project || route.agent === undefined) return null;
  const a = agents.find((x) => x.name === route.agent);
  return a === undefined || a.main || a.archived === true ? null : a.name;
}

/** The view centred on a point (u, v: fractions of the fit), `zoom` close (FOLLOW_ZOOM by default), held inside the fit. Pure. */
export function aimAt(u: number, v: number, zoom: number = FOLLOW_ZOOM): Cam {
  return clampCam({ zoom, u, v });
}

/** One step of the ease from `from` to `to` after dt seconds; at the end (or reduced motion) the target itself. Pure. */
export function easeCam(from: Cam, to: Cam, dt: number, reduced: boolean): Cam {
  if (reduced) return to;
  const k = 1 - Math.exp(-Math.max(0, dt) / FOLLOW_TAU);
  const next = { zoom: from.zoom + (to.zoom - from.zoom) * k, u: from.u + (to.u - from.u) * k, v: from.v + (to.v - from.v) * k };
  return settled(next, to) ? to : next;
}

/** Whether the view is (about) the target: the ease stops asking for frames. Pure. */
export function settled(a: Cam, b: Cam): boolean {
  return Math.abs(a.zoom - b.zoom) < 1e-3 && Math.abs(a.u - b.u) < 5e-4 && Math.abs(a.v - b.v) < 5e-4;
}

/** A tag's anchor held inside a w × h box (inset px), and the side it was pushed back from (an arrow points there); null side: inside. Pure. */
export function edgeOf(x: number, y: number, w: number, h: number, inset: number): { readonly x: number; readonly y: number; readonly side: 'left' | 'right' | 'up' | 'down' | null } {
  const cx = Math.min(w - inset, Math.max(inset, x));
  const cy = Math.min(h - inset, Math.max(inset * 6, y));
  const dx = x - cx;
  const dy = y - cy;
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return { x, y, side: null };
  const side = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
  return { x: cx, y: cy, side };
}
