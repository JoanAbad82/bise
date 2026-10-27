// src/app/side3d · the bims' world over the outer card (page outer-world v2, his pick #799): the
// tile, 280 wide and as high as he left it (140 by default), r 12, the card's ring and e-1, its top
// on the left side's top (52); the project's office at its fit, live: a click on a bim opens its
// thread, a pinch zooms inside, the office's own 'Loft ⌄' chip bottom left and '⤢ fit' bottom right
// while zoomed. On hover two 24 px buttons top right: '⤢' the world in the panel's Office tab, '×'
// hides the tile (tilestate.ts keeps it per window). Under it, the 8 px gap to the card is the
// handle: row-resize, a 2 px text-3 line after 120 ms of hover (the panel's signed handle), a drag
// from 96 to half the window's height, a double-click back to 140. Owner: nm-side.
import { useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react';
import type { Agent, Card } from '@/proto';
import type { MapId } from '@/bims/maps/ids';
import { Press, tipAttrs } from '@/ds';
import { side } from '@/proto/words_side.gen';
import { WorldOffice } from './World';
import { clampTile, TILE_GAP, TILE_H, TILE_MIN, tileMax } from './tilestate';

export interface OuterTileProps {
  readonly project: string;
  /** the project's name, as the sidebar says it */
  readonly name: string;
  /** the project's live agents */
  readonly agents: readonly Agent[];
  readonly cards: readonly Card[];
  /** its height now, css px */
  readonly h: number;
  /** a click on a bim: its thread */
  readonly onOpen: (agent: string) => void;
  /** his pick in the map chip */
  readonly onPickMap: (map: MapId) => void;
  /** '⤢': the world in the panel */
  readonly onPanel: () => void;
  /** '×': the tile goes */
  readonly onHide: () => void;
}

/** The tile: the office, '⤢' and '×' on hover. */
export function OuterTile({ project, name, agents, cards, h, onOpen, onPickMap, onPanel, onHide }: OuterTileProps) {
  return (
    <section className="s3-otile" style={{ height: h }} aria-label={side.tile_name({ project: name })} data-testid="app.outer.world">
      <span className="s3-otile-office">
        <WorldOffice project={project} agents={agents} cards={cards} fill onOpen={onOpen} onPickMap={onPickMap} />
      </span>
      <span className="s3-otile-acts">
        <Press look="s3-otile-btn" aria-label={side.tile_panel} {...tipAttrs(side.tile_panel)} onClick={onPanel} data-testid="app.outer.world.panel">⤢</Press>
        <Press look="s3-otile-btn" aria-label={side.tile_hide} {...tipAttrs(side.tile_hide)} onClick={onHide} data-testid="app.outer.world.hide">×</Press>
      </span>
    </section>
  );
}

/** the hover before the handle's line shows, ms (the panel's signed handle) */
export const HANDLE_HOT_MS = 120;

/** The gap between the tile and the card: a drag sets the tile's height (96 .. half the window), a double-click 140; ↑ ↓ by 8. */
export function TileHandle({ h, winH, onHeight }: { h: number; winH: number; onHeight: (h: number) => void }) {
  const at = useRef<{ readonly y: number; readonly h: number } | null>(null);
  const [hot, setHot] = useState(false);
  const [drag, setDrag] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cool = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };
  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    at.current = { y: e.clientY, h };
    setDrag(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // a pointer the page no longer knows (a synthetic one): the drag still follows the moves over the handle
    }
    document.documentElement.classList.add('s3-resizing');
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const a = at.current;
    if (a === null) return;
    onHeight(clampTile(a.h + e.clientY - a.y, winH));
  };
  const up = () => {
    at.current = null;
    setDrag(false);
    document.documentElement.classList.remove('s3-resizing');
  };
  return (
    <div
      className="s3-ohandle"
      // its place: the 8 under the tile (side3d.css top: the bar + this - 8), following the height
      style={{ '--s3-tile': `${String(h + TILE_GAP)}px` } as CSSProperties}
      role="separator"
      aria-orientation="horizontal"
      aria-label={side.tile_height}
      aria-valuemin={TILE_MIN}
      aria-valuemax={tileMax(winH)}
      aria-valuenow={h}
      tabIndex={0}
      data-hot={hot || undefined}
      data-drag={drag || undefined}
      {...tipAttrs(side.tile_height)}
      onPointerEnter={() => {
        cool();
        timer.current = setTimeout(() => {
          setHot(true);
        }, HANDLE_HOT_MS);
      }}
      onPointerLeave={() => {
        cool();
        setHot(false);
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onDoubleClick={() => {
        onHeight(TILE_H);
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown') onHeight(clampTile(h + 8, winH));
        else if (e.key === 'ArrowUp') onHeight(clampTile(h - 8, winH));
      }}
      data-testid="app.outer.world.handle"
    />
  );
}
