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
// same office draws at the bubble's 68 object. The office's labels and pills are the office tab's;
// grown, its camera takes his input as the open map does (r2-side, Gabriel m_44190): a pinch
// zooms, two fingers or a drag while zoomed move it, through the office's own handlers (Office
// cameraFrom: the hit span over the island); the beats are off while it is grown, and folding
// back gives the camera to the lead again. Owner: nm-side.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AppIcon, Press, tipAttrs } from '@/ds';
import { Office } from '@/bims/Office';
import { parts as bimsParts } from '@/bims/feed';
import { mapOf, mapPrefKey, type MapId } from '@/bims/maps/ids';
import { layoutOf } from '@/bims/maps';
import { objectsPrefKey, officeObjects, picksOf } from '@/bims/plugin-objects';
import { beatDelay, EASE_MS, happenedOf, HOLD_MS, leadZoom, pickBeat, seenOf, shotOf, stillRecent, TALK_HOLD_MS, tickSoon, type Happened, type LastBeat, type Seen, type Shot } from './camera';
import { useTalkingTo } from '@/composer/talking';
import { speechOf, speechWord } from './model';
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

/** the bubbles' column, from the world's right edge (44 + its objects' 12 each side): the big world never takes the pointer there */
export const BUBBLE_COL = 68;
/** where the bubbles' objects start, from the world's top (the first bubble at 152 - 12, its object 28 above it) */
export const BUBBLE_FROM = 112;

/**
 * The world's pointer box, px in the world's own corner: the island as drawn (its 384 office
 * `isleH` tall, scaled to 148 at rest); grown, it leaves out the bubbles' column under BUBBLE_FROM,
 * so a bubble under the big world still takes his click. Pure.
 */
export function hitBox(isleH: number, big: boolean): CSSProperties {
  const k = big ? 1 : SMALL / BIG;
  const w = BIG * k;
  const h = Math.round(isleH * k);
  if (!big || h <= BUBBLE_FROM) return { width: w, height: h };
  const cut = `polygon(0 0, 100% 0, 100% ${String(BUBBLE_FROM)}px, calc(100% - ${String(BUBBLE_COL)}px) ${String(BUBBLE_FROM)}px, calc(100% - ${String(BUBBLE_COL)}px) 100%, 0 100%)`;
  return { width: w, height: h, clipPath: cut };
}

interface OfficeOf {
  readonly project: string;
  /** the project's live agents */
  readonly agents: readonly Agent[];
  readonly cards: readonly Card[];
}

/** How the world's camera runs (camera.ts): hovered (the whole office), frozen (a card open), or on its own (lead, beats). */
interface CamState {
  readonly hover: boolean;
  readonly frozen: boolean;
}

/** `on`, and still true `ms` after it went off. */
function useHeld(on: boolean, ms: number): boolean {
  const [held, setHeld] = useState(on);
  if (on && !held) setHeld(true);
  useEffect(() => {
    if (on) return;
    const t = setTimeout(() => {
      setHeld(false);
    }, ms);
    return () => {
      clearTimeout(t);
    };
  }, [on, ms]);
  return on || held;
}

/**
 * The world's camera (camera.ts, designer m_42974): the lead framing at rest, a beat now and then
 * on what just happened, the whole office while hovered. A card open freezes it where it is; the
 * window away or hidden plays no beat; reduced motion: the lead only; while he talks to this
 * project's main (composer/talking.ts) and TALK_HOLD_MS after, the lead holds. The clock restarts
 * when the hover, the card or the talk ends.
 */
function useWorldCamera(agents: readonly Agent[], project: string, lead: string | null, zoom: number, { hover, frozen }: CamState): Shot {
  const reduced = noGrow();
  const talking = useHeld(useTalkingTo() === project, TALK_HOLD_MS);
  const seen = useRef<ReadonlyMap<string, Seen> | null>(null);
  const happened = useRef<Happened[]>([]);
  // the clock's 'something just happened': its next tick pulled in (camera.ts tickSoon)
  const soon = useRef<() => void>(() => undefined);
  useEffect(() => {
    const next = seenOf(agents);
    const now = Date.now();
    const fresh = seen.current === null ? [] : happenedOf(seen.current, next, now);
    happened.current = [...stillRecent(happened.current, now), ...fresh];
    seen.current = next;
    if (fresh.length > 0) soon.current();
  }, [agents]);
  const [beat, setBeat] = useState<string | null>(null);
  const last = useRef<LastBeat | null>(null);
  const stopped = hover || frozen || reduced || talking;
  useEffect(() => {
    if (stopped) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    // when the next tick comes; null while a beat plays (its end arms the clock again)
    let tickAt: number | null = null;
    const armAt = (at: number) => {
      if (t !== undefined) clearTimeout(t);
      tickAt = at;
      t = setTimeout(fire, Math.max(0, at - Date.now()));
    };
    const arm = () => {
      armAt(Date.now() + beatDelay(Math.random()));
    };
    const fire = () => {
      const now = Date.now();
      const b = document.hidden ? null : pickBeat(happened.current, now, last.current);
      if (b === null) {
        arm();
        return;
      }
      last.current = { agent: b.agent, at: now };
      tickAt = null;
      setBeat(b.agent);
      // its ease in and its hold, then back to the lead (the follow camera's own ease)
      t = setTimeout(() => {
        setBeat(null);
        arm();
      }, EASE_MS + HOLD_MS);
    };
    soon.current = () => {
      if (tickAt === null) return;
      const at = tickSoon(Date.now(), tickAt, last.current);
      if (at < tickAt) armAt(at);
    };
    // back from a hover or a card: a beat cut short goes back to the lead now, the clock starts again
    t = setTimeout(() => {
      setBeat(null);
      arm();
    }, 0);
    return () => {
      if (t !== undefined) clearTimeout(t);
    };
  }, [stopped]);
  const shot = shotOf({ lead, zoom, beat, hover, reduced, talking });
  // a card open: the camera stays where it is
  const [kept, setKept] = useState(shot);
  if (!frozen && (kept.follow !== shot.follow || kept.zoom !== shot.zoom)) setKept(shot);
  return frozen ? kept : shot;
}

/** The project's map, his /bims pick. */
function useMap(project: string): MapId {
  const prefs = usePrefs() as Prefs | null;
  return mapOf(getPref(prefs, mapPrefKey(project)));
}

/** The lead framing's zoom from the office's size: its map and its desks (one per agent but main). */
function useLeadZoom(agents: readonly Agent[], map: MapId): number {
  const desks = agents.filter((a) => !a.main).length;
  return useMemo(() => {
    const o = layoutOf(agents, map);
    return leadZoom(o.W, o.D);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the office's size moves with its map and its desks' count, not each agent's state
  }, [map, desks]);
}

/** The project's office as the world draws it: its map, its plugins' objects, its growth; `shot`: its camera (camera.ts), none: the whole office. */
function WorldOffice({ project, agents, cards, shot, cameraFrom = null }: OfficeOf & { readonly shot?: Shot; readonly cameraFrom?: HTMLElement | null }) {
  const places = usePlaces(project);
  const growth = useGrowth(project);
  const prefs = usePrefs() as Prefs | null;
  const map = useMap(project);
  const plugins = usePlugins(project);
  const picks = getPref(prefs, objectsPrefKey(project));
  const objects = useMemo(() => officeObjects(plugins, picksOf(picks)), [plugins, picks]);
  return (
    <Office project={project} agents={agents} cards={cards} places={places} objects={objects} growth={growth} map={map}
      parts={bimsParts} transparent onOpen={() => undefined} follow={shot?.follow ?? null} followZoom={shot?.zoom} cameraFrom={cameraFrom} />
  );
}

/**
 * The beat's name label (designer m_43213): the followed agent's name and its state word, over the
 * island's middle, where the follow camera puts its bim; outside the scaled island, so it reads at
 * 148. From the beat's start to the start of its return. Pure render.
 */
function BeatLabel({ agent, cards, mid }: { readonly agent: Agent; readonly cards: readonly Card[]; readonly mid: number }) {
  // it asks him when it has open cards (the beat's own signal, camera.ts seenOf), even before its card is in `cards`
  const asks = agent.waits > 0;
  return (
    <span className="s3-beat" style={{ top: mid }} data-testid="app.world.beat">
      <b>{agent.name}</b>
      <span className="s3-beat-says" data-asks={asks || undefined}>{asks ? side.state_asks : speechWord(speechOf(agent, cards))}</span>
    </span>
  );
}

export interface WorldProps extends OfficeOf {
  /** the project's name, as the sidebar says it */
  readonly name: string;
  /** the legend's words after the name ('3 at their desks · 1 asks') */
  readonly says: string;
  /** a click: the office in a tab */
  readonly onOpen: () => void;
  /** a card is open: the camera stays where it is (camera.ts) */
  readonly frozen?: boolean;
}

/** The world, small at rest, big after a hover. */
export function World({ project, name, says, agents, cards, onOpen, frozen = false }: WorldProps) {
  const [big, setBig] = useState(false);
  // its camera: the lead framing, a beat now and then (camera.ts)
  const zoom = useLeadZoom(agents, useMap(project));
  const lead = agents.find((a) => a.main)?.name ?? null;
  const shot = useWorldCamera(agents, project, lead, zoom, { hover: big, frozen });
  const beat = shot.follow !== null && shot.follow !== lead ? agents.find((a) => a.name === shot.follow) : undefined;
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
  // the office's drawn height at 384 (its layout box: the scale leaves it as it is)
  const isle = useRef<HTMLSpanElement | null>(null);
  const [isleH, setIsleH] = useState(0);
  useEffect(() => {
    const el = isle.current;
    if (el === null || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setIsleH(el.offsetHeight);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);
  // the hit span: grown, his pinch, two fingers and drag there move the office's camera
  const [hit, setHit] = useState<HTMLSpanElement | null>(null);
  const label = side.world_open({ project: name });
  return (
    <Press look="s3-world" data-big={big || undefined} aria-label={label} {...tipAttrs(big ? undefined : label)}
      onPointerEnter={enter} onPointerLeave={leave} onFocus={enter} onBlur={leave} onClick={onOpen} data-testid="app.world">
      {/* the one place that takes the pointer: the island's box as drawn, never the bubbles' column under it */}
      <span ref={setHit} className="s3-world-hit" style={hitBox(isleH, big)} data-testid="app.world.hit" />
      <span ref={isle} className="s3-world-isle" style={{ '--s3-scale': String(big ? 1 : SMALL / BIG) } as CSSProperties}>
        <span className="s3-world-office" aria-hidden="true">
          <WorldOffice project={project} agents={agents} cards={cards} shot={shot} cameraFrom={big ? hit : null} />
        </span>
      </span>
      {beat !== undefined && !big && <BeatLabel agent={beat} cards={cards} mid={Math.round((isleH * SMALL) / BIG / 2)} />}
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
