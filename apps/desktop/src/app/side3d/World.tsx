// src/app/side3d · the bims' world floating at the window's top right (page native-mac §7,
// mockups 11 and 14): the project's office (bims/Office, `transparent`: the island alone, no frame,
// no ground) with a 3-layer drop shadow on its alpha (--sh-world on the wrapper: the filter follows
// the scaled canvas). Drawn once at 384 and shown at 148 by a scale from its top-right corner, so the
// hover's growth is one transform: after HOVER_MS of hover it grows to 384 in --d-base, a glass
// legend pill 8 under it (the project, '3 at their desks · 1 asking', ↗), floating over the
// bubbles, which never move (designer m_42536: a target never moves away from the pointer); it
// folds back GRACE_MS after the pointer leaves; never under reduced motion. A click opens the office in a tab. The office lives
// (its bims move) on its own loop, which already rests while the window is away (bims/room.ts);
// SideHost unmounts the world while the right side is hidden. As a 5th bubble (no room, d3) the
// same office draws at the bubble's 68 object. The office takes no pointer here: its labels, pills
// and camera are the office tab's. Owner: nm-side.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AppIcon, Press, tipAttrs } from '@/ds';
import { Office } from '@/bims/Office';
import { parts as bimsParts } from '@/bims/feed';
import { mapOf, mapPrefKey } from '@/bims/maps/ids';
import { objectsPrefKey, officeObjects, picksOf } from '@/bims/plugin-objects';
import type { Agent, Card } from '@/proto';
import { getPref, type Prefs } from '@/settings/prefs';
import { useGrowth, usePlaces, usePlugins, usePrefs } from '@/store';
import { side } from '@/proto/words_side.gen';

/** the hover that grows the world, ms (native-mac §7) */
export const HOVER_MS = 300;
/** the pointer gone, the big world waits this long before it folds (designer m_42536) */
export const GRACE_MS = 150;
/** the office's drawn width: the big world's; the small one is it scaled */
export const BIG = 384;
export const SMALL = 148;

/** No growth on hover: macOS's reduce motion, by its media query or main's flag on <html>. */
export function noGrow(): boolean {
  if (typeof document !== 'undefined' && document.documentElement.hasAttribute('data-reduce-motion')) return true;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface OfficeOf {
  readonly project: string;
  /** the project's live agents */
  readonly agents: readonly Agent[];
  readonly cards: readonly Card[];
}

/** The project's office as the world draws it: its map, its plugins' objects, its growth. */
function WorldOffice({ project, agents, cards }: OfficeOf) {
  const places = usePlaces(project);
  const growth = useGrowth(project);
  const prefs = usePrefs() as Prefs | null;
  const map = mapOf(getPref(prefs, mapPrefKey(project)));
  const plugins = usePlugins(project);
  const picks = getPref(prefs, objectsPrefKey(project));
  const objects = useMemo(() => officeObjects(plugins, picksOf(picks)), [plugins, picks]);
  return (
    <Office project={project} agents={agents} cards={cards} places={places} objects={objects} growth={growth} map={map}
      parts={bimsParts} transparent onOpen={() => undefined} />
  );
}

export interface WorldProps extends OfficeOf {
  /** the project's name, as the sidebar says it */
  readonly name: string;
  /** the legend's words after the name ('3 at their desks · 1 asks') */
  readonly says: string;
  /** a click: the office in a tab */
  readonly onOpen: () => void;
}

/** The world, small at rest, big after a hover. */
export function World({ project, name, says, agents, cards, onOpen }: WorldProps) {
  const [big, setBig] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);
  const after = (ms: number, next: boolean) => {
    stop();
    timer.current = setTimeout(() => {
      timer.current = null;
      setBig(next);
    }, ms);
  };
  const enter = () => {
    if (noGrow()) return;
    after(big ? 0 : HOVER_MS, true);
  };
  const leave = () => {
    after(GRACE_MS, false);
  };
  const label = side.world_open({ project: name });
  return (
    <Press look="s3-world" data-big={big || undefined} aria-label={label} {...tipAttrs(big ? undefined : label)}
      onPointerEnter={enter} onPointerLeave={leave} onFocus={enter} onBlur={leave} onClick={onOpen} data-testid="app.world">
      <span className="s3-world-isle" style={{ '--s3-scale': String(big ? 1 : SMALL / BIG) } as CSSProperties}>
        <span className="s3-world-office" aria-hidden="true">
          <WorldOffice project={project} agents={agents} cards={cards} />
        </span>
      </span>
      {big && (
        <span className="s3-legend" data-testid="app.world.legend">
          <b>{name}</b>
          {says !== '' && <span className="s3-legend-says">{says}</span>}
          <span className="s3-legend-open" {...tipAttrs(side.world_open_tip)}>
            <AppIcon name="open" size={14} />
          </span>
        </span>
      )}
    </Press>
  );
}

/** The world folded into a 5th bubble: the same office at the bubble's object size. */
export function WorldThumb(props: OfficeOf) {
  return (
    <span className="s3-thumb" aria-hidden="true">
      <WorldOffice {...props} />
    </span>
  );
}
