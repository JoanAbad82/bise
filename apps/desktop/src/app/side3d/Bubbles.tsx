// src/app/side3d · the 3D bubbles under the world (page native-mac §7, pick A): 44 round glass
// (--c-overlay + --glass, --e-2), 36 apart; each holds its object at 68, sitting 4 above its bottom
// and rising 28 out of its top with its own shadow (--sh-obj); agents = bise's head, artifacts =
// the easel, scheduled = the hourglass, processes = the rack (objects.ts), drawn by cache.ts; no
// WebGL: a plain tile with the kind's line icon. The count pill 18 at -2/-8 (11.5/600 tabular,
// a 2 ring of the ground), --c-ink, the accent when an agent asks; none at 0. Open: a 2 ring of
// --c-focus (never the accent). ⌥⌘1-⌥⌘4 open them (keys.ts, d1). Each has its tip and VoiceOver
// name ('Agents · 3 working · 1 asks'). The world folded into one (d3) is a 5th, on top, the same.
// Owner: nm-side.
import type { ReactNode } from 'react';
import { AppIcon, Press, tipAttrs, type AppIconName } from '@/ds';
import { side } from '@/proto/words_side.gen';
import { useThingPng } from './cache';
import { bubbleThing, type BubbleId, type Thing } from './objects';

/** a bubble's object, its size in css px */
export const OBJ_PX = 68;

/** the plain tile's icon of each bubble when there is no WebGL */
const TILE: Record<BubbleId, AppIconName> = { agents: 'thread', artifacts: 'artifacts', scheduled: 'scheduled', processes: 'terminal' };

/** A thing's 3D picture, or its plain tile until drawn (or with no WebGL). */
export function ThingPic({ thing, px, tile, className }: { thing: Thing; px: number; tile: AppIconName; className?: string }) {
  const url = useThingPng(thing, px);
  if (url === null) {
    return (
      <span className={`s3-tile ${className ?? ''}`} aria-hidden="true">
        <AppIcon name={tile} size={16} />
      </span>
    );
  }
  return <img className={className} src={url} alt="" draggable={false} width={px} height={px} />;
}

export interface BubbleProps {
  readonly id: BubbleId | 'world';
  /** its count (none at 0) and whether it is the accent */
  readonly count: { readonly n: number; readonly accent: boolean };
  /** its tip and VoiceOver name */
  readonly tip: string;
  readonly open: boolean;
  /** its top, px from the side's top */
  readonly top: number;
  readonly onClick: () => void;
  /** the world's thumbnail in place of an object */
  readonly pic?: ReactNode;
}

export function Bubble({ id, count, tip, open, top, onClick, pic }: BubbleProps) {
  return (
    <Press look="s3-bubble" style={{ top }} aria-label={tip} aria-expanded={id === 'world' ? undefined : open}
      aria-haspopup={id === 'world' ? undefined : 'dialog'} data-open={open || undefined} {...tipAttrs(tip)} onClick={onClick}
      data-testid={`app.bubble.${id}`}>
      <span className="s3-obj">{pic ?? (id === 'world' ? null : <ThingPic thing={bubbleThing(id)} px={OBJ_PX} tile={TILE[id]} />)}</span>
      {count.n > 0 && (
        <span className="s3-count" data-accent={count.accent || undefined} aria-hidden="true" data-testid={`app.bubble.${id}.count`}>
          {count.n}
        </span>
      )}
    </Press>
  );
}

/** The world bubble's name. */
export const WORLD_NAME = side.world;
